import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parse } from "https://deno.land/std@0.208.0/csv/mod.ts";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { dataset_id, action } = await req.json();

    if (!dataset_id) {
      return new Response(JSON.stringify({ error: "dataset_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get dataset record
    const { data: dataset, error: dsErr } = await supabase
      .from("datasets")
      .select("*")
      .eq("id", dataset_id)
      .single();

    if (dsErr || !dataset) {
      return new Response(JSON.stringify({ error: "Dataset not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download file from storage
    const { data: fileData, error: dlErr } = await supabase.storage
      .from("datasets")
      .download(dataset.file_path);

    if (dlErr || !fileData) {
      await supabase.from("datasets").update({ status: "error", error_message: "Failed to download file" }).eq("id", dataset_id);
      return new Response(JSON.stringify({ error: "Failed to download file" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("datasets").update({ status: "parsing" }).eq("id", dataset_id);

    let rows: Record<string, unknown>[] = [];
    let columns: string[] = [];

    const fileName = dataset.name.toLowerCase();

    if (fileName.endsWith(".csv")) {
      const text = await fileData.text();
      const parsed = parse(text, { skipFirstRow: true, columns: undefined });
      if (parsed.length > 0) {
        columns = Object.keys(parsed[0]);
        rows = parsed as Record<string, unknown>[];
      }
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      const buffer = await fileData.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
      const firstSheet = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheet];
      rows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];
      if (rows.length > 0) {
        columns = Object.keys(rows[0]);
      }
    } else {
      await supabase.from("datasets").update({ status: "error", error_message: "Unsupported file type" }).eq("id", dataset_id);
      return new Response(JSON.stringify({ error: "Unsupported file type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate preview (first 20 rows)
    const previewData = rows.slice(0, 20);

    if (action === "parse") {
      // Just parse and preview - don't import yet
      await supabase.from("datasets").update({
        status: "validated",
        row_count: rows.length,
        columns: columns,
        preview_data: previewData,
      }).eq("id", dataset_id);

      return new Response(JSON.stringify({
        success: true,
        row_count: rows.length,
        columns,
        preview: previewData,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "import") {
      // Import rows into the appropriate table based on column detection
      const colSet = new Set(columns.map(c => c.toLowerCase()));
      // Also create a case-insensitive column lookup
      const colLookup: Record<string, string> = {};
      for (const col of columns) {
        colLookup[col.toLowerCase()] = col;
      }
      const getVal = (row: Record<string, unknown>, ...keys: string[]) => {
        for (const k of keys) {
          const actual = colLookup[k.toLowerCase()];
          if (actual && row[actual] !== undefined && row[actual] !== null && row[actual] !== "") return row[actual];
        }
        return null;
      };

      let importedTo = "raw";
      let importCount = 0;

      // Detect if circulation data (has delivered + returned + sold + client)
      const isCirculation = (colSet.has("delivered") || colSet.has("deliver")) &&
        (colSet.has("returned") || colSet.has("return") || colSet.has("returns")) &&
        (colSet.has("sold") || colSet.has("copies_sold")) &&
        (colSet.has("client") || colSet.has("client_name") || colSet.has("outlet"));

      if (isCirculation) {
        const circRows = rows.map(r => {
          const delivered = Number(getVal(r, "delivered", "deliver") || 0);
          const sold = Number(getVal(r, "sold", "copies_sold") || 0);
          const returnedRaw = getVal(r, "returned", "return", "returns");
          let returned = 0;
          let returnedPct = 0;

          // Handle returned — could be quantity or percentage string
          if (returnedRaw !== null) {
            const strVal = String(returnedRaw).trim();
            if (strVal.includes("%")) {
              returnedPct = parseFloat(strVal.replace("%", "")) || 0;
              returned = delivered > 0 ? Math.round(delivered * returnedPct / 100) : 0;
            } else {
              returned = Number(strVal) || 0;
              returnedPct = delivered > 0 ? (returned / delivered) * 100 : 0;
            }
          }

          // Also check for explicit return_percentage column
          const explicitPct = getVal(r, "returned_percentage", "return_percentage", "return_%", "return_pct");
          if (explicitPct !== null) {
            returnedPct = parseFloat(String(explicitPct).replace("%", "")) || returnedPct;
          }

          const sellThrough = delivered > 0 ? (sold / delivered) * 100 : 0;

          return {
            dataset_id,
            period_start: getVal(r, "start_date", "start date", "period_start", "date", "month") || null,
            period_end: getVal(r, "end_date", "end date", "period_end") || null,
            client: getVal(r, "client", "client_name", "outlet", "name") || "Unknown",
            delivered,
            returned,
            returned_percentage: Math.round(returnedPct * 100) / 100,
            sold,
            sell_through_rate: Math.round(sellThrough * 100) / 100,
            raw_data: r,
          };
        });

        for (let i = 0; i < circRows.length; i += 500) {
          const chunk = circRows.slice(i, i + 500);
          const { error } = await supabase.from("circulation_records").insert(chunk);
          if (error) console.error("Circulation insert error:", error);
          else importCount += chunk.length;
        }
        importedTo = "circulation_records";
      }
      // Detect if sales data
      else if (colSet.has("copies_sold") || colSet.has("revenue") || (colSet.has("region") && colSet.has("date"))) {
        const salesRows = rows.map(r => ({
          dataset_id,
          record_date: r["date"] || r["Date"] || r["record_date"] || null,
          region: r["region"] || r["Region"] || null,
          copies_sold: Number(r["copies_sold"] || r["Copies_Sold"] || r["copies"] || 0),
          revenue: Number(r["revenue"] || r["Revenue"] || 0),
          category: r["category"] || r["Category"] || null,
          raw_data: r,
        }));

        for (let i = 0; i < salesRows.length; i += 500) {
          const chunk = salesRows.slice(i, i + 500);
          const { error } = await supabase.from("sales_records").insert(chunk);
          if (error) console.error("Sales insert error:", error);
          else importCount += chunk.length;
        }
        importedTo = "sales_records";
      }
      // Detect if subscriber data
      else if (colSet.has("subscriber_id") || colSet.has("plan") || colSet.has("subscription")) {
        const subRows = rows.map(r => ({
          dataset_id,
          subscriber_id: r["subscriber_id"] || r["Subscriber_ID"] || r["id"] || null,
          name: r["name"] || r["Name"] || null,
          region: r["region"] || r["Region"] || null,
          plan: r["plan"] || r["Plan"] || r["subscription"] || null,
          start_date: r["start_date"] || r["Start_Date"] || null,
          age_group: r["age_group"] || r["Age_Group"] || null,
          preferred_category: r["preferred_category"] || r["Preferred_Category"] || null,
          raw_data: r,
        }));

        for (let i = 0; i < subRows.length; i += 500) {
          const chunk = subRows.slice(i, i + 500);
          const { error } = await supabase.from("subscribers").insert(chunk);
          if (error) console.error("Subscriber insert error:", error);
          else importCount += chunk.length;
        }
        importedTo = "subscribers";
      }
      // Detect if ad sales data
      else if (colSet.has("client_name") || colSet.has("ad_date") || colSet.has("placement")) {
        const adRows = rows.map(r => ({
          dataset_id,
          ad_date: r["ad_date"] || r["Ad_Date"] || r["date"] || null,
          client_name: r["client_name"] || r["Client_Name"] || r["client"] || null,
          category: r["category"] || r["Category"] || null,
          revenue: Number(r["revenue"] || r["Revenue"] || 0),
          placement: r["placement"] || r["Placement"] || null,
          raw_data: r,
        }));

        for (let i = 0; i < adRows.length; i += 500) {
          const chunk = adRows.slice(i, i + 500);
          const { error } = await supabase.from("ad_sales").insert(chunk);
          if (error) console.error("Ad sales insert error:", error);
          else importCount += chunk.length;
        }
        importedTo = "ad_sales";
      }

      await supabase.from("datasets").update({
        status: "imported",
        row_count: rows.length,
        columns,
      }).eq("id", dataset_id);

      return new Response(JSON.stringify({
        success: true,
        imported_to: importedTo,
        import_count: importCount,
        row_count: rows.length,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use 'parse' or 'import'" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Parse error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
