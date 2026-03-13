import TopBar from "@/components/TopBar";
import KpiCard from "@/components/KpiCard";
import InsightCard from "@/components/InsightCard";
import { Newspaper, Users, MapPin, DollarSign, Tag } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";

const salesTrend = [
  { month: "Jan", sales: 42000 }, { month: "Feb", sales: 45000 },
  { month: "Mar", sales: 48000 }, { month: "Apr", sales: 44000 },
  { month: "May", sales: 51000 }, { month: "Jun", sales: 53000 },
  { month: "Jul", sales: 49000 }, { month: "Aug", sales: 56000 },
  { month: "Sep", sales: 58000 }, { month: "Oct", sales: 61000 },
  { month: "Nov", sales: 59000 }, { month: "Dec", sales: 64000 },
];

const regionData = [
  { region: "Windhoek", copies: 28000 },
  { region: "Oshakati", copies: 18000 },
  { region: "Walvis Bay", copies: 12000 },
  { region: "Rundu", copies: 9000 },
  { region: "Katima", copies: 6500 },
  { region: "Keetmanshoop", copies: 5000 },
];

const categoryData = [
  { name: "News", value: 35 }, { name: "Sport", value: 25 },
  { name: "Business", value: 20 }, { name: "Opinion", value: 12 },
  { name: "Lifestyle", value: 8 },
];

const CHART_COLORS = [
  "hsl(224, 76%, 33%)", "hsl(210, 40%, 50%)", "hsl(180, 30%, 45%)",
  "hsl(0, 84%, 50%)", "hsl(215, 16%, 47%)",
];

const Dashboard = () => {
  return (
    <div>
      <TopBar title="Executive Dashboard" />
      <div className="p-6 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <KpiCard title="Total Sales" value="64,200" change="+8.5% vs last month" changeType="positive" icon={Newspaper} />
          <KpiCard title="Subscribers" value="12,840" change="+3.2% vs last month" changeType="positive" icon={Users} />
          <KpiCard title="Regions Active" value="14" change="No change" changeType="neutral" icon={MapPin} />
          <KpiCard title="Ad Revenue" value="N$2.4M" change="+12.1% vs last month" changeType="positive" icon={DollarSign} />
          <KpiCard title="Top Category" value="News" change="35% of readership" changeType="neutral" icon={Tag} />
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded border border-border bg-card p-5">
            <h3 className="font-heading text-sm font-bold text-card-foreground mb-4">Sales Trend (Monthly)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="sales" stroke="hsl(224, 76%, 33%)" fill="hsl(224, 76%, 33%)" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded border border-border bg-card p-5">
            <h3 className="font-heading text-sm font-bold text-card-foreground mb-4">Regional Distribution</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={regionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="region" type="category" tick={{ fontSize: 11 }} width={90} />
                <Tooltip />
                <Bar dataKey="copies" fill="hsl(224, 76%, 33%)" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded border border-border bg-card p-5">
            <h3 className="font-heading text-sm font-bold text-card-foreground mb-4">Content Categories</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap gap-3 justify-center">
              {categoryData.map((c, i) => (
                <div key={c.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: CHART_COLORS[i] }} />
                  {c.name}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-heading text-sm font-bold text-foreground">AI Insights</h3>
            <InsightCard title="Windhoek demand surge" description="Windhoek region shows a 12% increase in daily sales. Consider increasing distribution by 2,000 copies for the next quarter." />
            <InsightCard title="Youth segment growing" description="Readers aged 18-25 increased by 18% this quarter. Digital subscription offerings could capture this demographic." type="trend" />
            <InsightCard title="Ad revenue opportunity" description="Business section ad slots are 94% sold. Recommend increasing ad pricing by 5-8% for Q2." type="recommendation" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
