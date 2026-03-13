import TopBar from "@/components/TopBar";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useCallback } from "react";

interface UploadedFile {
  name: string;
  size: string;
  status: "pending" | "validated" | "error";
  rows?: number;
  columns?: string[];
}

const DataIngestion = () => {
  const [files, setFiles] = useState<UploadedFile[]>([
    { name: "sales_q4_2025.csv", size: "2.4 MB", status: "validated", rows: 14200, columns: ["date", "region", "copies_sold", "revenue", "category"] },
    { name: "subscribers_dec2025.xlsx", size: "1.1 MB", status: "validated", rows: 8400, columns: ["subscriber_id", "name", "region", "plan", "start_date"] },
  ]);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    // File handling will connect to Supabase
  }, []);

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
          className={`flex flex-col items-center justify-center rounded border-2 border-dashed p-12 transition-colors ${
            dragActive ? "border-primary bg-primary/5" : "border-border bg-card"
          }`}
        >
          <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="font-heading text-base font-bold text-foreground">
            Drop your dataset here
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            CSV or Excel files up to 50MB
          </p>
          <Button className="mt-4" size="sm">
            Browse Files
          </Button>
        </div>

        {/* Wizard Steps */}
        <div className="flex items-center gap-0">
          {["Upload", "Map Columns", "Validate", "Import"].map((step, i) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center gap-2 rounded px-3 py-1.5 text-xs font-medium ${
                i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground/20 text-[10px] font-bold">
                  {i + 1}
                </span>
                {step}
              </div>
              {i < 3 && <div className="h-px w-8 bg-border" />}
            </div>
          ))}
        </div>

        {/* Uploaded Datasets */}
        <div>
          <h3 className="font-heading text-sm font-bold text-foreground mb-3">
            Recent Uploads
          </h3>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between rounded border border-border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.size} · {file.rows?.toLocaleString()} rows · {file.columns?.length} columns
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {file.status === "validated" ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Validated
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-accent">
                      <AlertCircle className="h-3.5 w-3.5" /> Error
                    </span>
                  )}
                  <Button variant="outline" size="sm" className="text-xs">
                    Preview
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataIngestion;
