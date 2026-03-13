import TopBar from "@/components/TopBar";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const ageData = [
  { group: "18-24", count: 2800 }, { group: "25-34", count: 5200 },
  { group: "35-44", count: 4100 }, { group: "45-54", count: 3600 },
  { group: "55-64", count: 2400 }, { group: "65+", count: 1900 },
];

const subStatusData = [
  { name: "Active", value: 8400 }, { name: "Lapsed", value: 2100 },
  { name: "New", value: 1400 }, { name: "Trial", value: 940 },
];

const frequencyData = [
  { freq: "Daily", readers: 6200 }, { freq: "3-4x/wk", readers: 3800 },
  { freq: "Weekly", readers: 2400 }, { freq: "Occasional", readers: 1600 },
];

const COLORS = ["hsl(224,76%,33%)", "hsl(210,40%,50%)", "hsl(180,30%,45%)", "hsl(215,16%,47%)"];

const segments = [
  { label: "Urban Professionals", count: "4,200", pct: "33%", trend: "+5%" },
  { label: "Youth Digital Readers", count: "2,800", pct: "22%", trend: "+18%" },
  { label: "Rural Subscribers", count: "3,100", pct: "24%", trend: "+2%" },
  { label: "Weekend Readers", count: "2,700", pct: "21%", trend: "-3%" },
];

const Audience = () => (
  <div>
    <TopBar title="Audience Segmentation" />
    <div className="p-6 space-y-6">
      {/* Segment Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {segments.map((s) => (
          <div key={s.label} className="rounded border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-heading text-xl font-bold tabular-nums text-card-foreground">{s.count}</p>
            <p className="text-xs text-muted-foreground">{s.pct} of total · <span className={s.trend.startsWith("+") ? "text-emerald-600" : "text-accent"}>{s.trend}</span></p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-border bg-card p-5">
          <h3 className="font-heading text-sm font-bold text-card-foreground mb-4">Age Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={ageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
              <XAxis dataKey="group" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(224,76%,33%)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded border border-border bg-card p-5">
          <h3 className="font-heading text-sm font-bold text-card-foreground mb-4">Subscription Status</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={subStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" paddingAngle={2}>
                {subStatusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap gap-3 justify-center">
            {subStatusData.map((s, i) => (
              <span key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full inline-block" style={{ background: COLORS[i] }} />{s.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded border border-border bg-card p-5">
        <h3 className="font-heading text-sm font-bold text-card-foreground mb-4">Purchase Frequency</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={frequencyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
            <XAxis dataKey="freq" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="readers" fill="hsl(210,40%,50%)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

export default Audience;
