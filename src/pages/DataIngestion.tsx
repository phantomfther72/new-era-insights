import TopBar from "@/components/TopBar";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Eye, ArrowRight, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type DatasetStatus = "pending" | "parsing" | "validated" | "imported" | "error";

interface Dataset {
  id: string;
  name: string;
  file_size: number;
  status: DatasetStatus;
  row_count: number | null;
  columns: string[] | null;
  preview_data: Record<string, unknown>[] | null;
  created_at: string;
  error_message: string | null;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const STEPS = ["Upload", "Parse & Validate", "Preview", "Import"];

const DataIngestion = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeDataset, setActiveDataset] = useState<Dataset | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load datasets on mount
  const loadDatasets = useCallback(async () => {
    const { data, error } = await supabase
      .from("datasets")
      .select("*")
      .order("created_at", { ascending: false });
    if (data && !error) {
      setDatasets(data as unknown as Dataset[]);
    }
  }, []);

  useState(() => {
    loadDatasets();
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const uploadFile = async (file: File) => {
    const allowed = ["text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"];
    const ext = file.name.toLowerCase();
    if (!ext.endsWith(".csv") && !ext.endsWith(".xlsx") && !ext.endsWith(".xls")) {
      toast({ title: "Invalid file type", description: "Please upload CSV or Excel files only.", variant: "destructive" });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 50MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    setCurrentStep(0);

    const filePath = `${Date.now()}_${file.name}`;

    // 1. Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("datasets")
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    // 2. Create dataset record
    const { data: ds, error: dsError } = await supabase
      .from("datasets")
      .insert({
        name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type || "text/csv",
        status: "pending" as const,
      })
      .select()
      .single();

    if (dsError || !ds) {
      toast({ title: "Record creation failed", description: dsError?.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    setCurrentStep(1);
    const dataset = ds as unknown as Dataset;

    // 3. Parse the file
    const { data: parseResult, error: parseError } = await supabase.functions.invoke("parse-dataset", {
      body: { dataset_id: dataset.id, action: "parse" },
    });

    if (parseError || !parseResult?.success) {
      toast({ title: "Parsing failed", description: parseError?.message || parseResult?.error, variant: "destructive" });
      setUploading(false);
      loadDatasets();
      return;
    }

    setCurrentStep(2);
    const updatedDataset: Dataset = {
      ...dataset,
      status: "validated",
      row_count: parseResult.row_count,
      columns: parseResult.columns,
      preview_data: parseResult.preview,
    };
    setActiveDataset(updatedDataset);
    setUploading(false);
    loadDatasets();

    toast({ title: "File parsed successfully", description: `${parseResult.row_count.toLocaleString()} rows detected with ${parseResult.columns.length} columns.` });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const handleImport = async (datasetId: string) => {
    setLoading(true);
    setCurrentStep(3);

    const { data: result, error } = await supabase.functions.invoke("parse-dataset", {
      body: { dataset_id: datasetId, action: "import" },
    });

    if (error || !result?.success) {
      toast({ title: "Import failed", description: error?.message || result?.error, variant: "destructive" });
    } else {
      toast({ title: "Import complete", description: `${result.import_count.toLocaleString()} rows imported to ${result.imported_to}.` });
      setActiveDataset(null);
    }

    setLoading(false);
    setCurrentStep(0);
    loadDatasets();
  };

  const openPreview = (dataset: Dataset) => {
    setActiveDataset(dataset);
    setPreviewOpen(true);
  };

  return (
    <div>
      <TopBar title="Data Ingestion" />
      <div className="p-6 space-y-6">
        {/* Upload Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center rounded border-2 border-dashed p-12 transition-colors cursor-pointer ${
            dragActive ? "border-primary bg-primary/5" : "border-border bg-card"
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="mb-4 h-10 w-10 text-primary animate-spin" />
          ) : (
            <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
          )}
          <p className="font-heading text-base font-bold text-foreground">
            {uploading ? "Processing file..." : "Drop your dataset here"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            CSV or Excel files up to 50MB
          </p>
          {!uploading && (
            <Button className="mt-4" size="sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
              Browse Files
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Wizard Steps */}
        <div className="flex items-center gap-0">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center gap-2 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                i <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground/20 text-[10px] font-bold">
                  {i < currentStep ? "✓" : i + 1}
                </span>
                {step}
              </div>
              {i < 3 && <div className={`h-px w-8 ${i < currentStep ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        {/* Active Dataset Preview & Import */}
        {activeDataset && activeDataset.status === "validated" && (
          <div className="rounded border border-primary/30 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-heading text-sm font-bold text-foreground">{activeDataset.name}</p>
                <p className="text-xs text-muted-foreground">
                  {activeDataset.row_count?.toLocaleString()} rows · {activeDataset.columns?.length} columns: {activeDataset.columns?.join(", ")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openPreview(activeDataset)}>
                  <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                </Button>
                <Button size="sm" onClick={() => handleImport(activeDataset.id)} disabled={loading}>
                  {loading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Database className="h-3.5 w-3.5 mr-1" />}
                  Import to Database
                </Button>
              </div>
            </div>
            {activeDataset.preview_data && activeDataset.preview_data.length > 0 && (
              <div className="max-h-48 overflow-auto rounded border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {activeDataset.columns?.map((col) => (
                        <TableHead key={col} className="text-xs whitespace-nowrap">{col}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeDataset.preview_data.slice(0, 5).map((row, i) => (
                      <TableRow key={i}>
                        {activeDataset.columns?.map((col) => (
                          <TableCell key={col} className="text-xs whitespace-nowrap">
                            {String(row[col] ?? "")}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* Uploaded Datasets */}
        <div>
          <h3 className="font-heading text-sm font-bold text-foreground mb-3">
            Recent Uploads
          </h3>
          {datasets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No datasets uploaded yet. Drop a CSV or Excel file above to get started.</p>
          ) : (
            <div className="space-y-2">
              {datasets.map((ds) => (
                <div
                  key={ds.id}
                  className="flex items-center justify-between rounded border border-border bg-card px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{ds.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatSize(ds.file_size)}
                        {ds.row_count ? ` · ${ds.row_count.toLocaleString()} rows` : ""}
                        {ds.columns ? ` · ${ds.columns.length} columns` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {ds.status === "validated" && (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Validated
                      </span>
                    )}
                    {ds.status === "imported" && (
                      <span className="flex items-center gap-1 text-xs font-medium text-primary">
                        <Database className="h-3.5 w-3.5" /> Imported
                      </span>
                    )}
                    {ds.status === "error" && (
                      <span className="flex items-center gap-1 text-xs font-medium text-destructive">
                        <AlertCircle className="h-3.5 w-3.5" /> {ds.error_message || "Error"}
                      </span>
                    )}
                    {ds.status === "parsing" && (
                      <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Parsing
                      </span>
                    )}
                    {ds.status === "pending" && (
                      <span className="text-xs text-muted-foreground">Pending</span>
                    )}
                    {ds.preview_data && (
                      <Button variant="outline" size="sm" className="text-xs" onClick={() => openPreview(ds)}>
                        Preview
                      </Button>
                    )}
                    {ds.status === "validated" && (
                      <Button size="sm" className="text-xs" onClick={() => handleImport(ds.id)}>
                        Import
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">{activeDataset?.name} — Preview</DialogTitle>
          </DialogHeader>
          {activeDataset?.preview_data && activeDataset.columns && (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {activeDataset.columns.map((col) => (
                      <TableHead key={col} className="text-xs whitespace-nowrap">{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeDataset.preview_data.map((row, i) => (
                    <TableRow key={i}>
                      {activeDataset.columns!.map((col) => (
                        <TableCell key={col} className="text-xs whitespace-nowrap">
                          {String(row[col] ?? "")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataIngestion;
