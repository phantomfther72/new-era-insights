import { useEffect, useMemo, useState, type ReactNode } from "react";
import TopBar from "@/components/TopBar";
import KpiCard from "@/components/KpiCard";
import { ArrowDown, ArrowUp, Newspaper, RotateCcw, TrendingUp } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { generateCommercialForecast, type EventDay, type OutletSnapshot } from "@/lib/commercialForecasting";
import { buildMockForecastSeed } from "@/lib/commercialData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const [outlets, setOutlets] = useState<OutletSnapshot[]>([]);
  const [events, setEvents] = useState<EventDay[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!isSupabaseConfigured) {
        const mock = buildMockForecastSeed();
        setOutlets(mock.outlets);
        setEvents(mock.events);
        return;
      }

      try {
        const [{ data: outletRows }, { data: salesRows }, { data: returnsRows }, { data: eventRows }] = await Promise.all([
          supabase.from("outlets").select("id,outlet_name,distribution_point"),
          supabase.from("sales_records").select("outlet_id,record_date,copies_sold,revenue"),
          supabase.from("returns_records").select("outlet_id,return_date,returned_copies"),
          supabase.from("event_calendar").select("event_date,event_name,event_type"),
        ]);

        const outletSnapshots = (outletRows ?? []).map((outlet) => ({
          outletId: outlet.id,
          outletName: outlet.outlet_name,
          distributionPoint: outlet.distribution_point,
          dailySales: (salesRows ?? [])
            .filter((row) => row.outlet_id === outlet.id && row.record_date)
            .map((row) => ({
              date: row.record_date as string,
              copiesSold: row.copies_sold ?? 0,
              revenue: row.revenue ?? 0,
            })),
          dailyReturns: (returnsRows ?? [])
            .filter((row) => row.outlet_id === outlet.id)
            .map((row) => ({
              date: row.return_date,
              returnedCopies: row.returned_copies,
            })),
        }));

        if (!outletSnapshots.length) {
          const mock = buildMockForecastSeed();
          setOutlets(mock.outlets);
          setEvents(mock.events);
          return;
        }

        setOutlets(outletSnapshots);
        setEvents((eventRows ?? []).map((event) => ({ date: event.event_date, eventName: event.event_name, eventType: event.event_type })));
      } catch {
        const mock = buildMockForecastSeed();
        setOutlets(mock.outlets);
        setEvents(mock.events);
      }
    };

    load();
  }, []);

  const forecast = useMemo(() => generateCommercialForecast(outlets, events), [outlets, events]);

  const trafficBadge = (status: "green" | "amber" | "red") => {
    if (status === "green") return <Badge className="bg-emerald-600">Green</Badge>;
    if (status === "amber") return <Badge className="bg-amber-500">Amber</Badge>;
    return <Badge variant="destructive">Red</Badge>;
  };

  return (
    <div>
      <TopBar title="New Era Commercial Performance Intelligence Platform" />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard title="Total Sales" value={forecast.metrics.totalSales.toLocaleString()} icon={Newspaper} change="Daily outlet sales" changeType="neutral" />
          <KpiCard title="Total Returns" value={forecast.metrics.totalReturns.toLocaleString()} icon={RotateCcw} change="Unsold copies" changeType="neutral" />
          <KpiCard title="Revenue Trend" value={`${forecast.metrics.revenueTrendPct}%`} icon={forecast.metrics.revenueTrendPct >= 0 ? ArrowUp : ArrowDown} change="Half-period comparison" changeType={forecast.metrics.revenueTrendPct >= 0 ? "positive" : "negative"} />
          <KpiCard title="Demand Growth %" value={`${forecast.metrics.demandGrowthPct}%`} icon={TrendingUp} change="Rolling trend signal" changeType={forecast.metrics.demandGrowthPct >= 0 ? "positive" : "negative"} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Daily Sales Trend">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={forecast.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" hide />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="#1d4ed8" name="Sales" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Returns Trend">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={forecast.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" hide />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="returns" stroke="#dc2626" name="Returns" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Demand Forecast Line">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={forecast.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" hide />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="forecast" stroke="#16a34a" name="Forecast" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Outlet Comparison">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={forecast.outletComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="outlet" hide />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="averageSales" fill="#1d4ed8" name="Avg Sales" />
                <Bar dataKey="predictedDemand" fill="#16a34a" name="Predicted" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="rounded border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Outlet Analytics & Recommendation Engine</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Outlet</TableHead>
                <TableHead className="text-right">Average sales</TableHead>
                <TableHead className="text-right">Average returns</TableHead>
                <TableHead className="text-right">Predicted next-day demand</TableHead>
                <TableHead className="text-right">Recommended supply adjustment</TableHead>
                <TableHead>Traffic light</TableHead>
                <TableHead className="text-right">Event impact %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forecast.outletAnalytics.map((row) => (
                <TableRow key={row.outletId}>
                  <TableCell>{row.outletName}</TableCell>
                  <TableCell className="text-right">{row.averageSales.toFixed(1)}</TableCell>
                  <TableCell className="text-right">{row.averageReturns.toFixed(1)}</TableCell>
                  <TableCell className="text-right">{row.predictedNextDayDemand}</TableCell>
                  <TableCell className="text-right">{row.recommendedSupplyAdjustment.toFixed(1)}%</TableCell>
                  <TableCell>{trafficBadge(row.trafficLight)}</TableCell>
                  <TableCell className="text-right">{row.eventLiftPct.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

const ChartCard = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="rounded border bg-card p-4">
    <h3 className="mb-2 text-sm font-semibold">{title}</h3>
    {children}
  </div>
);

export default Dashboard;
