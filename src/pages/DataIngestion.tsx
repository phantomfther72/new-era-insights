import { useRef, useState, type RefObject } from "react";
import TopBar from "@/components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Database, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { generateMockData, parseCsv, toEventRows, toOutletRows, toReturnRows, toSalesRows } from "@/lib/commercialData";

const DataIngestion = () => {
  const salesRef = useRef<HTMLInputElement>(null);
  const returnsRef = useRef<HTMLInputElement>(null);
  const eventsRef = useRef<HTMLInputElement>(null);

  const [salesRows, setSalesRows] = useState<Record<string, string>[]>([]);
  const [returnRows, setReturnRows] = useState<Record<string, string>[]>([]);
  const [eventRows, setEventRows] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState(false);

  const readCsvFile = async (file: File) => {
    const text = await file.text();
    return parseCsv(text);
  };

  const handleCsvUpload = async (
    file: File | undefined,
    setRows: (rows: Record<string, string>[]) => void,
    label: string,
  ) => {
    if (!file) return;
    const rows = await readCsvFile(file);
    setRows(rows);
    toast({ title: `${label} loaded`, description: `${rows.length} rows ready for import.` });
  };

  const importToSupabase = async () => {
    if (!isSupabaseConfigured) {
      toast({ title: "Supabase not configured", description: "Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to enable imports.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const outletRows = toOutletRows([...salesRows, ...returnRows]);
      const { data: upsertedOutlets, error: outletError } = await supabase
        .from("outlets")
        .upsert(outletRows, { onConflict: "outlet_name" })
        .select("id,outlet_name");
      if (outletError) throw outletError;

      const outletIndex = new Map((upsertedOutlets ?? []).map((outlet) => [outlet.outlet_name, outlet.id]));

      const salesPayload = toSalesRows(salesRows, outletIndex);
      const returnsPayload = toReturnRows(returnRows, outletIndex);
      const eventsPayload = toEventRows(eventRows);

      if (salesPayload.length) {
        const { error } = await supabase
          .from("sales_records")
          .upsert(salesPayload, { onConflict: "outlet_id,record_date" });
        if (error) throw error;
      }

      if (returnsPayload.length) {
        const { error } = await supabase
          .from("returns_records")
          .upsert(returnsPayload, { onConflict: "outlet_id,return_date" });
        if (error) throw error;
      }

      if (eventsPayload.length) {
        const { error } = await supabase
          .from("event_calendar")
          .upsert(eventsPayload, { onConflict: "event_date,event_name" });
        if (error) throw error;
      }

      toast({ title: "Import complete", description: "Data stored in outlets, sales_records, returns_records and event_calendar." });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unexpected import error";
      toast({ title: "Import failed", description: message, variant: "destructive" });
    }
    setLoading(false);
  };

  const loadMock = () => {
    const mock = generateMockData();
    setSalesRows(parseCsv(mock.sales));
    setReturnRows(parseCsv(mock.returns));
    setEventRows(parseCsv(mock.events));
    toast({ title: "Mock data generated", description: "30 days of synthetic commercial data is ready." });
  };

  return (
    <div>
      <TopBar title="Commercial Data Ingestion" />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <UploadCard title="Daily Sales CSV" buttonText="Upload sales" inputRef={salesRef} onFile={(file) => handleCsvUpload(file, setSalesRows, "Sales data")} rows={salesRows.length} />
          <UploadCard title="Returns CSV" buttonText="Upload returns" inputRef={returnsRef} onFile={(file) => handleCsvUpload(file, setReturnRows, "Returns data")} rows={returnRows.length} />
          <UploadCard title="Event Calendar CSV" buttonText="Upload events" inputRef={eventsRef} onFile={(file) => handleCsvUpload(file, setEventRows, "Event calendar")} rows={eventRows.length} />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={importToSupabase} disabled={loading || !salesRows.length}>
            <Database className="mr-2 h-4 w-4" />
            {loading ? "Importing..." : "Import to Supabase"}
          </Button>
          <Button variant="outline" onClick={loadMock}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate mock data
          </Button>
        </div>
      </div>
    </div>
  );
};

const UploadCard = ({
  title,
  buttonText,
  inputRef,
  onFile,
  rows,
}: {
  title: string;
  buttonText: string;
  inputRef: RefObject<HTMLInputElement>;
  onFile: (file: File | undefined) => Promise<void>;
  rows: number;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <p className="text-sm text-muted-foreground">Rows loaded: {rows}</p>
      <Button variant="secondary" onClick={() => inputRef.current?.click()}>
        <Upload className="mr-2 h-4 w-4" />
        {buttonText}
      </Button>
      <input
        type="file"
        ref={inputRef}
        className="hidden"
        accept=".csv"
        onChange={(event) => onFile(event.target.files?.[0])}
      />
    </CardContent>
  </Card>
);

export default DataIngestion;
