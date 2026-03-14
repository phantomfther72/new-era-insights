import TopBar from "@/components/TopBar";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generateForecasts, type CirculationRecord, type ForecastResult, type ClientForecast } from "@/lib/forecasting";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, BarChart, Bar, Cell, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Package, BarChart3, AlertTriangle, Lightbulb, Loader2, RefreshCw, Shield, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface AIInsight {
  title: string;
  description: string;
  type: "recommendation" | "alert" | "trend";
  priority: "high" | "medium" | "low";
}

const TRAFFIC_COLORS = { green: "text-emerald-600", amber: "text-amber-500", red: "text-accent" };
const TRAFFIC_BG = { green: "bg-emerald-100", amber: "bg-amber-100", red: "bg-accent/10" };
const TREND_ICONS = { up: TrendingUp, down: TrendingDown, stable: Minus };
const CONFIDENCE_COLORS = { high: "bg-emerald-500", medium: "bg-amber-500", low: "bg-accent" };

const Forecasting = () => {
  const [records, setRecords] = useState<CirculationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("circulation_records")
      .select("*")
      .order("period_start", { ascending: true });

    if (data && !error) {
      setRecords(data as unknown as CirculationRecord[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();

    // Real-time subscription for auto-refresh on new data
    const channel = supabase
      .channel("circulation-changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "circulation_records" }, () => {
        loadData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const forecast = useMemo<ForecastResult | null>(() => {
    if (records.length === 0) return null;
    return generateForecasts(records);
  }, [records]);

  const loadInsights = async () => {
    if (!forecast) return;
    setInsightsLoading(true);
    try {
      const summary = {
        totalClients: forecast.clients.length,
        totals: forecast.totals,
        topClients: forecast.clients.slice(0, 5).map(c => ({
          client: c.client,
          predictedSold: c.predictedSold,
          predictedReturned: c.predictedReturned,
          sellThrough: c.predictedSellThrough,
          trend: c.trend,
          trafficLight: c.trafficLight,
          adjustmentPct: c.adjustmentPct,
          confidence: c.confidence,
        })),
        bottomClients: forecast.clients.slice(-3).map(c => ({
          client: c.client,
          predictedSold: c.predictedSold,
          sellThrough: c.predictedSellThrough,
          trend: c.trend,
          trafficLight: c.trafficLight,
        })),
      };

      const { data, error } = await supabase.functions.invoke("generate-forecast-insights", {
        body: { forecastData: summary },
      });

      if (error) throw error;
      if (data?.insights) setInsights(data.insights);
    } catch (e: any) {
      toast({ title: "Insight generation failed", description: e.message, variant: "destructive" });
    }
    setInsightsLoading(false);
  };

  if (loading) {
    return (
      <div>
        <TopBar title="Predictive Analytics Engine" />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!forecast || records.length === 0) {
    return (
      <div>
        <TopBar title="Predictive Analytics Engine" />
        <div className="p-6">
          <div className="flex flex-col items-center justify-center rounded border border-dashed border-border bg-card p-16 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-heading text-lg font-bold text-card-foreground">No Circulation Data Available</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              Upload circulation datasets via the Data Ingestion module. The prediction engine requires historical monthly records with Client, Delivered, Returned, and Sold columns.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { clients, totals, actualVsPredicted, monthlyTrend } = forecast;

  return (
    <div>
      <TopBar title="Predictive Analytics Engine" />
      <div className="p-6 space-y-6">
        {/* Executive KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard label="Projected Delivered" value={totals.totalDelivered.toLocaleString()} icon={Package} />
          <KpiCard label="Projected Sold" value={totals.totalSold.toLocaleString()} icon={TrendingUp} accent />
          <KpiCard label="Projected Returns" value={totals.totalReturned.toLocaleString()} icon={TrendingDown} />
          <KpiCard label="Avg Return %" value={`${totals.avgReturnPct}%`} icon={AlertTriangle} />
          <KpiCard label="Strongest Client" value={totals.strongestClient} icon={ArrowUpRight} accent />
          <KpiCard label="Weakest Client" value={totals.weakestClient} icon={ArrowDownRight} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="charts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="charts">Forecast Charts</TabsTrigger>
            <TabsTrigger value="clients">Client Forecasts</TabsTrigger>
            <TabsTrigger value="commercial">Commercial Support</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>

          {/* ─── Charts Tab ─── */}
          <TabsContent value="charts" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Actual vs Predicted Sold */}
              <div className="rounded border border-border bg-card p-5">
                <h3 className="font-heading text-sm font-bold text-card-foreground mb-4">Actual vs Predicted — Sold Copies</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={actualVsPredicted}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="actualSold" name="Actual Sold" stroke="hsl(224,76%,33%)" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="predictedSold" name="Predicted Sold" stroke="hsl(0,84%,50%)" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3 }} />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Actual vs Predicted Returns */}
              <div className="rounded border border-border bg-card p-5">
                <h3 className="font-heading text-sm font-bold text-card-foreground mb-4">Actual vs Predicted — Returns</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={actualVsPredicted}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="actualReturned" name="Actual Returns" stroke="hsl(224,76%,33%)" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="predictedReturned" name="Predicted Returns" stroke="hsl(0,84%,50%)" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3 }} />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Trend Projection */}
            <div className="rounded border border-border bg-card p-5">
              <h3 className="font-heading text-sm font-bold text-card-foreground mb-4">Monthly Trend Projection</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="delivered" name="Delivered" stroke="hsl(215,16%,47%)" fill="hsl(215,16%,47%)" fillOpacity={0.1} strokeWidth={1.5} />
                  <Area type="monotone" dataKey="sold" name="Sold" stroke="hsl(224,76%,33%)" fill="hsl(224,76%,33%)" fillOpacity={0.15} strokeWidth={2} />
                  <Area type="monotone" dataKey="returned" name="Returned" stroke="hsl(0,84%,50%)" fill="hsl(0,84%,50%)" fillOpacity={0.1} strokeWidth={1.5} />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Client Demand Ranking */}
            <div className="rounded border border-border bg-card p-5">
              <h3 className="font-heading text-sm font-bold text-card-foreground mb-4">Client Demand Forecast Ranking</h3>
              <ResponsiveContainer width="100%" height={Math.max(200, clients.length * 32)}>
                <BarChart data={clients.slice(0, 15)} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="client" tick={{ fontSize: 10 }} width={75} />
                  <Tooltip />
                  <Bar dataKey="predictedSold" name="Predicted Sold" radius={[0, 4, 4, 0]}>
                    {clients.slice(0, 15).map((c, i) => (
                      <Cell key={i} fill={c.trafficLight === "green" ? "hsl(152,69%,31%)" : c.trafficLight === "amber" ? "hsl(38,92%,50%)" : "hsl(0,84%,50%)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* ─── Client Forecasts Tab ─── */}
          <TabsContent value="clients" className="space-y-4">
            <div className="rounded border border-border bg-card overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Client</TableHead>
                    <TableHead className="text-xs text-right">Pred. Delivered</TableHead>
                    <TableHead className="text-xs text-right">Pred. Sold</TableHead>
                    <TableHead className="text-xs text-right">Pred. Returned</TableHead>
                    <TableHead className="text-xs text-right">Return %</TableHead>
                    <TableHead className="text-xs text-right">Sell-Through</TableHead>
                    <TableHead className="text-xs text-center">Status</TableHead>
                    <TableHead className="text-xs text-center">Trend</TableHead>
                    <TableHead className="text-xs text-center">Confidence</TableHead>
                    <TableHead className="text-xs text-right">Adjustment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((c) => {
                    const TrendIcon = TREND_ICONS[c.trend];
                    return (
                      <TableRow key={c.client}>
                        <TableCell className="text-xs font-medium">{c.client}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums">{c.predictedDelivered.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums font-semibold">{c.predictedSold.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums">{c.predictedReturned.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right tabular-nums">{c.predictedReturnPct}%</TableCell>
                        <TableCell className="text-xs text-right tabular-nums">{c.predictedSellThrough}%</TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${TRAFFIC_BG[c.trafficLight]} ${TRAFFIC_COLORS[c.trafficLight]}`}>
                            ● {c.trafficLight.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <TrendIcon className={`h-3.5 w-3.5 mx-auto ${c.trend === "up" ? "text-emerald-600" : c.trend === "down" ? "text-accent" : "text-muted-foreground"}`} />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center gap-1.5 justify-center">
                            <div className={`h-2 w-2 rounded-full ${CONFIDENCE_COLORS[c.confidence]}`} />
                            <span className="text-[10px] text-muted-foreground">{c.confidenceScore}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {c.adjustmentPct > 0 ? (
                            <span className="text-emerald-600 font-medium">+{c.adjustmentPct}%</span>
                          ) : c.adjustmentPct < 0 ? (
                            <span className="text-accent font-medium">{c.adjustmentPct}%</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ─── Commercial Decision Support ─── */}
          <TabsContent value="commercial" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded border border-border bg-card p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Waste Reduction Potential</p>
                <p className="mt-2 font-heading text-2xl font-bold tabular-nums text-card-foreground">{totals.wasteReduction.toLocaleString()}</p>
                <p className="text-xs text-emerald-600">copies saved if recommendations applied</p>
              </div>
              <div className="rounded border border-border bg-card p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Extra Sales Potential</p>
                <p className="mt-2 font-heading text-2xl font-bold tabular-nums text-card-foreground">{totals.extraSalesPotential.toLocaleString()}</p>
                <p className="text-xs text-emerald-600">additional copies from redistribution</p>
              </div>
              <div className="rounded border border-border bg-card p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Projected Sell-Through</p>
                <p className="mt-2 font-heading text-2xl font-bold tabular-nums text-card-foreground">{totals.avgSellThrough}%</p>
                <p className="text-xs text-muted-foreground">overall efficiency rate</p>
              </div>
            </div>

            <div className="rounded border border-border bg-card p-5">
              <h3 className="font-heading text-sm font-bold text-card-foreground mb-4">Delivery Adjustment Recommendations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {clients.filter(c => c.adjustmentPct !== 0).slice(0, 10).map(c => (
                  <div key={c.client} className="flex items-center justify-between rounded border border-border px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{c.client}</p>
                      <p className="text-xs text-muted-foreground">
                        Pred. sold: {c.predictedSold.toLocaleString()} · Return: {c.predictedReturnPct}%
                      </p>
                    </div>
                    <Badge variant={c.adjustmentPct > 0 ? "default" : "destructive"} className="text-xs">
                      {c.adjustmentPct > 0 ? `+${c.adjustmentPct}%` : `${c.adjustmentPct}%`} delivery
                    </Badge>
                  </div>
                ))}
                {clients.filter(c => c.adjustmentPct !== 0).length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-2">All clients are within optimal delivery ranges.</p>
                )}
              </div>
            </div>

            {/* Model Transparency */}
            <div className="rounded border border-border bg-card p-5">
              <h3 className="font-heading text-sm font-bold text-card-foreground mb-3">Model Methodology</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div>
                  <p className="font-medium text-card-foreground mb-1">Prediction Method</p>
                  <p>Weighted Moving Average (WMA) with linear trend adjustment. Recent months are weighted more heavily (3-month window).</p>
                </div>
                <div>
                  <p className="font-medium text-card-foreground mb-1">Confidence Scoring</p>
                  <p>Based on data availability (40%), consistency score (40%), and volatility measure (20%). Coefficient of variation determines stability.</p>
                </div>
                <div>
                  <p className="font-medium text-card-foreground mb-1">Traffic Light Logic</p>
                  <p>Green: sell-through ≥75% + low volatility. Amber: sell-through ≥50%. Red: below 50% or high instability.</p>
                </div>
                <div>
                  <p className="font-medium text-card-foreground mb-1">Adjustment Formula</p>
                  <p>Increase delivery when sell-through &gt; 85%. Decrease when &lt; 50%. Proportional to deviation from target range.</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ─── AI Insights Tab ─── */}
          <TabsContent value="insights" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">AI-generated predictive summaries powered by circulation forecast data.</p>
              <Button size="sm" onClick={loadInsights} disabled={insightsLoading}>
                {insightsLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
                Generate Insights
              </Button>
            </div>

            {insights.length === 0 && !insightsLoading && (
              <div className="flex flex-col items-center justify-center rounded border border-dashed border-border bg-card p-12 text-center">
                <Lightbulb className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Click "Generate Insights" to create AI-powered predictions and recommendations.</p>
              </div>
            )}

            {insightsLoading && (
              <div className="flex flex-col items-center justify-center rounded border border-border bg-card p-12">
                <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
                <p className="text-sm text-muted-foreground">Analyzing forecast data with AI…</p>
              </div>
            )}

            {insights.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {insights.map((insight, i) => (
                  <div key={i} className={`rounded border bg-card p-4 border-t-2 ${
                    insight.type === "alert" ? "border-t-accent" : insight.type === "trend" ? "border-t-primary" : "border-t-emerald-500"
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 rounded p-1.5 ${
                        insight.type === "alert" ? "bg-accent/10" : insight.type === "trend" ? "bg-primary/10" : "bg-emerald-100"
                      }`}>
                        {insight.type === "alert" ? (
                          <AlertTriangle className="h-3.5 w-3.5 text-accent" />
                        ) : insight.type === "trend" ? (
                          <TrendingUp className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Lightbulb className="h-3.5 w-3.5 text-emerald-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-card-foreground">{insight.title}</p>
                          <Badge variant={insight.priority === "high" ? "destructive" : "secondary"} className="text-[10px] ml-2">
                            {insight.priority}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// ─── Sub-components ───

function KpiCard({ label, value, icon: Icon, accent }: { label: string; value: string; icon: any; accent?: boolean }) {
  return (
    <div className="rounded border border-border bg-card p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className={`h-3.5 w-3.5 ${accent ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <p className={`font-heading text-lg font-bold tabular-nums ${accent ? "text-primary" : "text-card-foreground"}`}>{value}</p>
    </div>
  );
}

export default Forecasting;
