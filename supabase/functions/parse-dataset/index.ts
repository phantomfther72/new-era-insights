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
      let importedTo = "raw";
      let importCount = 0;

      // Detect if sales data
      if (colSet.has("copies_sold") || colSet.has("revenue") || (colSet.has("region") && colSet.has("date"))) {
        const salesRows = rows.map(r => ({
          dataset_id,
          record_date: r["date"] || r["Date"] || r["record_date"] || null,
          region: r["region"] || r["Region"] || null,
          copies_sold: Number(r["copies_sold"] || r["Copies_Sold"] || r["copies"] || 0),
          revenue: Number(r["revenue"] || r["Revenue"] || 0),
          category: r["category"] || r["Category"] || null,
          raw_data: r,
        }));

        // Batch insert in chunks of 500
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
