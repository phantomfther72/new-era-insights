import TopBar from "@/components/TopBar";
import InsightCard from "@/components/InsightCard";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const distData = [
  { region: "Windhoek", delivered: 30000, sold: 28000 },
  { region: "Oshakati", delivered: 18000, sold: 18000 },
  { region: "Walvis Bay", delivered: 14000, sold: 12000 },
  { region: "Rundu", delivered: 10000, sold: 9000 },
  { region: "Katima", delivered: 8000, sold: 6500 },
  { region: "Keetmanshoop", delivered: 7000, sold: 5000 },
  { region: "Swakopmund", delivered: 6000, sold: 5500 },
  { region: "Otjiwarongo", delivered: 4500, sold: 4200 },
];

const Distribution = () => {
  const overSupplied = distData.filter(d => (d.delivered - d.sold) / d.delivered > 0.15);
  const underSupplied = distData.filter(d => d.sold / d.delivered > 0.95);

  return (
    <div>
      <TopBar title="Distribution Intelligence" />
      <div className="p-6 space-y-6">
        {/* Status Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Delivered</p>
            <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-card-foreground">97,500</p>
          </div>
          <div className="rounded border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Sold</p>
            <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-card-foreground">88,200</p>
          </div>
          <div className="rounded border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sell-Through Rate</p>
            <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-card-foreground">90.5%</p>
          </div>
        </div>

        {/* Chart */}
        <div className="rounded border border-border bg-card p-5">
          <h3 className="font-heading text-sm font-bold text-card-foreground mb-4">Delivered vs Sold by Region</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={distData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
              <XAxis dataKey="region" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="delivered" fill="hsl(210,40%,50%)" radius={[2, 2, 0, 0]} name="Delivered" />
              <Bar dataKey="sold" fill="hsl(224,76%,33%)" radius={[2, 2, 0, 0]} name="Sold" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recommendations */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="font-heading text-sm font-bold text-foreground mb-3">Reduce Copies</h3>
            <div className="space-y-2">
              {overSupplied.map(d => (
                <InsightCard
                  key={d.region}
                  title={d.region}
                  description={`${((d.delivered - d.sold) / d.delivered * 100).toFixed(0)}% unsold. Reduce allocation by ~${(d.delivered - d.sold).toLocaleString()} copies.`}
                  type="alert"
                />
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-heading text-sm font-bold text-foreground mb-3">Increase Copies</h3>
            <div className="space-y-2">
              {underSupplied.map(d => (
                <InsightCard
                  key={d.region}
                  title={d.region}
                  description={`${(d.sold / d.delivered * 100).toFixed(0)}% sell-through. Demand likely exceeds supply—consider increasing by 10-15%.`}
                  type="recommendation"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Distribution;
