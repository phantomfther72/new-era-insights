import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Download, Trash2, RefreshCw } from "lucide-react";

const datasets = [
  { name: "sales_q4_2025.csv", uploaded: "2025-12-15", rows: 14200, status: "Active" },
  { name: "subscribers_dec2025.xlsx", uploaded: "2025-12-20", rows: 8400, status: "Active" },
  { name: "ad_revenue_2025.csv", uploaded: "2025-12-22", rows: 3200, status: "Active" },
  { name: "regions_master.csv", uploaded: "2025-11-01", rows: 14, status: "Active" },
  { name: "sales_q3_2025.csv", uploaded: "2025-09-30", rows: 13800, status: "Archived" },
];

const logs = [
  { time: "2025-12-22 14:32", action: "Import completed", detail: "ad_revenue_2025.csv — 3,200 rows" },
  { time: "2025-12-20 09:15", action: "Import completed", detail: "subscribers_dec2025.xlsx — 8,400 rows" },
  { time: "2025-12-15 11:45", action: "Import completed", detail: "sales_q4_2025.csv — 14,200 rows" },
  { time: "2025-12-15 11:44", action: "Validation passed", detail: "sales_q4_2025.csv — all columns mapped" },
  { time: "2025-12-15 11:43", action: "Upload started", detail: "sales_q4_2025.csv — 2.4 MB" },
];

const Admin = () => (
  <div>
    <TopBar title="Admin Panel" />
    <div className="p-6 space-y-6">
      <div className="flex gap-3">
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <Download className="h-3.5 w-3.5" /> Export All Reports
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs text-accent border-accent/30 hover:bg-accent/5">
          <RefreshCw className="h-3.5 w-3.5" /> Reset Analytics
        </Button>
      </div>

      {/* Datasets Table */}
      <div className="rounded border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h3 className="font-heading text-sm font-bold text-card-foreground">Managed Datasets</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="px-4 py-2.5 text-left font-medium">File</th>
              <th className="px-4 py-2.5 text-left font-medium">Uploaded</th>
              <th className="px-4 py-2.5 text-right font-medium">Rows</th>
              <th className="px-4 py-2.5 text-left font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {datasets.map((d) => (
              <tr key={d.name} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5 flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  {d.name}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{d.uploaded}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{d.rows.toLocaleString()}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-medium ${d.status === "Active" ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Import Logs */}
      <div className="rounded border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h3 className="font-heading text-sm font-bold text-card-foreground">Import Logs</h3>
        </div>
        <div className="divide-y divide-border">
          {logs.map((log, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <div className="flex items-center gap-3">
                <span className="text-xs tabular-nums text-muted-foreground w-36">{log.time}</span>
                <span className="font-medium text-card-foreground">{log.action}</span>
              </div>
              <span className="text-xs text-muted-foreground">{log.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default Admin;
