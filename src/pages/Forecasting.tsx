import TopBar from "@/components/TopBar";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";

const revenueForcast = [
  { month: "Jan", actual: 2.1, forecast: null, low: null, high: null },
  { month: "Feb", actual: 2.0, forecast: null, low: null, high: null },
  { month: "Mar", actual: 2.3, forecast: null, low: null, high: null },
  { month: "Apr", actual: 2.2, forecast: null, low: null, high: null },
  { month: "May", actual: 2.4, forecast: null, low: null, high: null },
  { month: "Jun", actual: 2.5, forecast: null, low: null, high: null },
  { month: "Jul", actual: null, forecast: 2.6, low: 2.3, high: 2.9 },
  { month: "Aug", actual: null, forecast: 2.7, low: 2.3, high: 3.1 },
  { month: "Sep", actual: null, forecast: 2.9, low: 2.4, high: 3.4 },
  { month: "Oct", actual: null, forecast: 3.0, low: 2.5, high: 3.5 },
  { month: "Nov", actual: null, forecast: 2.8, low: 2.3, high: 3.3 },
  { month: "Dec", actual: null, forecast: 3.2, low: 2.6, high: 3.8 },
];

const subForecast = [
  { month: "Jan", actual: 11800, forecast: null },
  { month: "Feb", actual: 12000, forecast: null },
  { month: "Mar", actual: 12200, forecast: null },
  { month: "Apr", actual: 12400, forecast: null },
  { month: "May", actual: 12600, forecast: null },
  { month: "Jun", actual: 12840, forecast: null },
  { month: "Jul", actual: null, forecast: 13100 },
  { month: "Aug", actual: null, forecast: 13400 },
  { month: "Sep", actual: null, forecast: 13700 },
  { month: "Oct", actual: null, forecast: 14000 },
  { month: "Nov", actual: null, forecast: 14200 },
  { month: "Dec", actual: null, forecast: 14500 },
];

const Forecasting = () => (
  <div>
    <TopBar title="Commercial Sales Forecasting" />
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Projected H2 Ad Revenue</p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-card-foreground">N$17.2M</p>
          <p className="text-xs text-emerald-600">+14% vs H1</p>
        </div>
        <div className="rounded border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Projected Year-End Subs</p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-card-foreground">14,500</p>
          <p className="text-xs text-emerald-600">+13% YoY</p>
        </div>
        <div className="rounded border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Forecast Confidence</p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-card-foreground">87%</p>
          <p className="text-xs text-muted-foreground">Based on 24mo data</p>
        </div>
      </div>

      <div className="rounded border border-border bg-card p-5">
        <h3 className="font-heading text-sm font-bold text-card-foreground mb-4">Ad Revenue Forecast (N$ millions)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={revenueForcast}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area type="monotone" dataKey="high" stroke="none" fill="hsl(224,76%,33%)" fillOpacity={0.08} />
            <Area type="monotone" dataKey="low" stroke="none" fill="hsl(0,0%,100%)" fillOpacity={1} />
            <Line type="monotone" dataKey="actual" stroke="hsl(224,76%,33%)" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="forecast" stroke="hsl(0,84%,50%)" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="mt-2 flex gap-6 justify-center text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 inline-block bg-primary" /> Actual</span>
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 inline-block bg-accent border-dashed" /> Forecast</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-4 inline-block bg-primary/10 rounded-sm" /> Confidence Range</span>
        </div>
      </div>

      <div className="rounded border border-border bg-card p-5">
        <h3 className="font-heading text-sm font-bold text-card-foreground mb-4">Subscription Growth Forecast</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={subForecast}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="actual" stroke="hsl(224,76%,33%)" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="forecast" stroke="hsl(180,30%,45%)" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

export default Forecasting;
