/**
 * New Era Prediction Engine
 * Pure statistical forecasting from circulation_records data.
 * Modular design — swap in ML models later.
 */

export interface CirculationRecord {
  id: string;
  dataset_id: string;
  period_start: string | null;
  period_end: string | null;
  client: string | null;
  delivered: number | null;
  returned: number | null;
  returned_percentage: number | null;
  sold: number | null;
  sell_through_rate: number | null;
  created_at: string;
}

export interface ClientMonthly {
  client: string;
  month: string; // YYYY-MM
  delivered: number;
  returned: number;
  sold: number;
  returnedPct: number;
  sellThrough: number;
}

export interface ClientForecast {
  client: string;
  predictedDelivered: number;
  predictedSold: number;
  predictedReturned: number;
  predictedReturnPct: number;
  predictedSellThrough: number;
  adjustmentPct: number;
  trafficLight: "green" | "amber" | "red";
  confidence: "high" | "medium" | "low";
  confidenceScore: number;
  trend: "up" | "down" | "stable";
  volatility: number;
  consistency: number;
  growthRate: number;
  monthlyHistory: ClientMonthly[];
}

export interface TotalForecast {
  totalDelivered: number;
  totalSold: number;
  totalReturned: number;
  avgReturnPct: number;
  avgSellThrough: number;
  strongestClient: string;
  weakestClient: string;
  wasteReduction: number;
  extraSalesPotential: number;
  efficiencyGain: number;
}

export interface ForecastResult {
  clients: ClientForecast[];
  totals: TotalForecast;
  actualVsPredicted: { month: string; actualSold: number; predictedSold: number; actualReturned: number; predictedReturned: number }[];
  monthlyTrend: { month: string; delivered: number; sold: number; returned: number }[];
}

// ─── Helpers ───

function mean(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stddev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1));
}

/** Weighted moving average — recent months weigh more */
function weightedAvg(arr: number[], windowSize = 3): number {
  const slice = arr.slice(-windowSize);
  if (!slice.length) return 0;
  const weights = slice.map((_, i) => i + 1);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  return slice.reduce((sum, v, i) => sum + v * weights[i], 0) / totalWeight;
}

/** Simple linear regression slope */
function trendSlope(arr: number[]): number {
  if (arr.length < 2) return 0;
  const n = arr.length;
  const xMean = (n - 1) / 2;
  const yMean = mean(arr);
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (arr[i] - yMean);
    den += (i - xMean) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

// ─── Core Engine ───

export function groupByClientMonth(records: CirculationRecord[]): Map<string, ClientMonthly[]> {
  const map = new Map<string, Map<string, { delivered: number; returned: number; sold: number }>>();

  for (const r of records) {
    const client = r.client || "Unknown";
    const date = r.period_start || r.period_end || r.created_at;
    const month = date.slice(0, 7); // YYYY-MM

    if (!map.has(client)) map.set(client, new Map());
    const clientMap = map.get(client)!;
    if (!clientMap.has(month)) clientMap.set(month, { delivered: 0, returned: 0, sold: 0 });
    const entry = clientMap.get(month)!;
    entry.delivered += r.delivered || 0;
    entry.returned += r.returned || 0;
    entry.sold += r.sold || 0;
  }

  const result = new Map<string, ClientMonthly[]>();
  for (const [client, months] of map) {
    const sorted = [...months.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, d]) => ({
        client,
        month,
        delivered: d.delivered,
        returned: d.returned,
        sold: d.sold,
        returnedPct: d.delivered > 0 ? (d.returned / d.delivered) * 100 : 0,
        sellThrough: d.delivered > 0 ? (d.sold / d.delivered) * 100 : 0,
      }));
    result.set(client, sorted);
  }
  return result;
}

export function forecastClient(client: string, history: ClientMonthly[]): ClientForecast {
  if (history.length === 0) {
    return {
      client, predictedDelivered: 0, predictedSold: 0, predictedReturned: 0,
      predictedReturnPct: 0, predictedSellThrough: 0, adjustmentPct: 0,
      trafficLight: "red", confidence: "low", confidenceScore: 0,
      trend: "stable", volatility: 1, consistency: 0, growthRate: 0,
      monthlyHistory: [],
    };
  }

  const deliveredArr = history.map(h => h.delivered);
  const soldArr = history.map(h => h.sold);
  const returnedArr = history.map(h => h.returned);
  const sellThroughArr = history.map(h => h.sellThrough);

  // Rolling weighted average + trend adjustment
  const soldWMA = weightedAvg(soldArr);
  const deliveredWMA = weightedAvg(deliveredArr);
  const returnedWMA = weightedAvg(returnedArr);

  const soldSlope = trendSlope(soldArr);
  const deliveredSlope = trendSlope(deliveredArr);
  const returnedSlope = trendSlope(returnedArr);

  // Predicted = WMA + slope (next period = n)
  const n = history.length;
  const predictedSold = Math.max(0, Math.round(soldWMA + soldSlope));
  const predictedDelivered = Math.max(0, Math.round(deliveredWMA + deliveredSlope));
  const predictedReturned = Math.max(0, Math.round(returnedWMA + returnedSlope));
  const predictedReturnPct = predictedDelivered > 0 ? (predictedReturned / predictedDelivered) * 100 : 0;
  const predictedSellThrough = predictedDelivered > 0 ? (predictedSold / predictedDelivered) * 100 : 0;

  // Metrics
  const volatility = mean(soldArr) > 0 ? stddev(soldArr) / mean(soldArr) : 1; // CV
  const consistency = 1 - Math.min(volatility, 1);
  const growthRate = soldArr.length >= 2
    ? ((soldArr[soldArr.length - 1] - soldArr[0]) / Math.max(soldArr[0], 1)) * 100
    : 0;

  // Trend detection
  const trend: "up" | "down" | "stable" =
    soldSlope > 0.5 ? "up" : soldSlope < -0.5 ? "down" : "stable";

  // Traffic light
  const avgSellThrough = mean(sellThroughArr);
  const trafficLight: "green" | "amber" | "red" =
    avgSellThrough >= 75 && volatility < 0.3 ? "green" :
    avgSellThrough >= 50 ? "amber" : "red";

  // Confidence
  const dataPoints = history.length;
  const confidenceScore = Math.min(100, Math.round(
    (dataPoints >= 6 ? 40 : dataPoints * 7) +
    (consistency * 40) +
    (volatility < 0.2 ? 20 : volatility < 0.4 ? 10 : 0)
  ));
  const confidence: "high" | "medium" | "low" =
    confidenceScore >= 70 ? "high" : confidenceScore >= 40 ? "medium" : "low";

  // Delivery adjustment recommendation
  const currentSellThrough = sellThroughArr[sellThroughArr.length - 1] || 0;
  let adjustmentPct = 0;
  if (currentSellThrough > 85) adjustmentPct = Math.round((currentSellThrough - 80) * 0.5);
  else if (currentSellThrough < 50) adjustmentPct = -Math.round((50 - currentSellThrough) * 0.5);

  return {
    client, predictedDelivered, predictedSold, predictedReturned,
    predictedReturnPct: Math.round(predictedReturnPct * 10) / 10,
    predictedSellThrough: Math.round(predictedSellThrough * 10) / 10,
    adjustmentPct, trafficLight, confidence, confidenceScore,
    trend, volatility: Math.round(volatility * 100) / 100,
    consistency: Math.round(consistency * 100) / 100,
    growthRate: Math.round(growthRate * 10) / 10,
    monthlyHistory: history,
  };
}

export function generateForecasts(records: CirculationRecord[]): ForecastResult {
  const grouped = groupByClientMonth(records);
  const clients: ClientForecast[] = [];

  for (const [client, history] of grouped) {
    clients.push(forecastClient(client, history));
  }

  // Sort by predicted sold desc
  clients.sort((a, b) => b.predictedSold - a.predictedSold);

  // Totals
  const totalDelivered = clients.reduce((s, c) => s + c.predictedDelivered, 0);
  const totalSold = clients.reduce((s, c) => s + c.predictedSold, 0);
  const totalReturned = clients.reduce((s, c) => s + c.predictedReturned, 0);
  const avgReturnPct = totalDelivered > 0 ? (totalReturned / totalDelivered) * 100 : 0;
  const avgSellThrough = totalDelivered > 0 ? (totalSold / totalDelivered) * 100 : 0;

  const strongest = clients[0]?.client || "N/A";
  const weakest = clients.length > 0 ? clients[clients.length - 1].client : "N/A";

  // Commercial decision support estimates
  const currentReturnedTotal = clients.reduce((s, c) => {
    const lastHist = c.monthlyHistory[c.monthlyHistory.length - 1];
    return s + (lastHist?.returned || 0);
  }, 0);
  const wasteReduction = Math.max(0, currentReturnedTotal - totalReturned);
  const extraSalesPotential = clients
    .filter(c => c.adjustmentPct > 0)
    .reduce((s, c) => s + Math.round(c.predictedSold * (c.adjustmentPct / 100)), 0);
  const efficiencyGain = totalDelivered > 0 ? ((totalSold / totalDelivered) * 100) - avgReturnPct : 0;

  // Actual vs predicted (use last 3 months as "actual", next month as "predicted")
  const allMonths = new Set<string>();
  for (const [, history] of grouped) {
    for (const h of history) allMonths.add(h.month);
  }
  const sortedMonths = [...allMonths].sort();

  const monthlyTrend = sortedMonths.map(month => {
    let delivered = 0, sold = 0, returned = 0;
    for (const [, history] of grouped) {
      const h = history.find(h => h.month === month);
      if (h) { delivered += h.delivered; sold += h.sold; returned += h.returned; }
    }
    return { month, delivered, sold, returned };
  });

  // Build actual vs predicted: for each month, "actual" is real data, "predicted" is WMA up to that point
  const actualVsPredicted = sortedMonths.map((month, idx) => {
    const actual = monthlyTrend[idx];
    // Simple backtest: predict based on data up to previous month
    let predictedSold = 0, predictedReturned = 0;
    if (idx >= 2) {
      const prevSold = monthlyTrend.slice(Math.max(0, idx - 3), idx).map(m => m.sold);
      const prevReturned = monthlyTrend.slice(Math.max(0, idx - 3), idx).map(m => m.returned);
      predictedSold = Math.round(weightedAvg(prevSold));
      predictedReturned = Math.round(weightedAvg(prevReturned));
    }
    return {
      month,
      actualSold: actual.sold,
      predictedSold,
      actualReturned: actual.returned,
      predictedReturned,
    };
  });

  // Add next month projection
  if (sortedMonths.length > 0) {
    const lastMonth = sortedMonths[sortedMonths.length - 1];
    const [y, m] = lastMonth.split("-").map(Number);
    const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
    actualVsPredicted.push({
      month: nextMonth,
      actualSold: 0,
      predictedSold: totalSold,
      actualReturned: 0,
      predictedReturned: totalReturned,
    });
    monthlyTrend.push({
      month: nextMonth,
      delivered: totalDelivered,
      sold: totalSold,
      returned: totalReturned,
    });
  }

  return {
    clients,
    totals: {
      totalDelivered, totalSold, totalReturned,
      avgReturnPct: Math.round(avgReturnPct * 10) / 10,
      avgSellThrough: Math.round(avgSellThrough * 10) / 10,
      strongestClient: strongest,
      weakestClient: weakest,
      wasteReduction,
      extraSalesPotential,
      efficiencyGain: Math.round(efficiencyGain * 10) / 10,
    },
    actualVsPredicted,
    monthlyTrend,
  };
}
