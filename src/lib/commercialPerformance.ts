export interface DailySalesRecord {
  date: string; // YYYY-MM-DD
  location: string;
  distributionPoint: string;
  supplied: number;
  sold: number;
  returned: number;
}

export interface SalesEvent {
  date: string; // YYYY-MM-DD
  name: string;
  impact: "positive" | "negative";
  intensity: number; // 0..1
}

export interface LocationDemandRecommendation {
  location: string;
  distributionPoint: string;
  baselineDemand: number;
  forecastDemand: number;
  recommendedSupply: number;
  demandTrend: "growing" | "declining" | "stable";
  demandGrowthRatePct: number;
  averageSellThroughPct: number;
  averageReturnRatePct: number;
  expectedUnsoldCopies: number;
  confidence: "high" | "medium" | "low";
}

export interface CommercialPerformanceModelResult {
  generatedAt: string;
  historicalWindowDays: number;
  eventDatesUsed: string[];
  recommendations: LocationDemandRecommendation[];
  summary: {
    totalForecastDemand: number;
    totalRecommendedSupply: number;
    projectedUnsoldCopies: number;
    growingOutlets: number;
    decliningOutlets: number;
  };
}

interface AggregatedPoint {
  location: string;
  distributionPoint: string;
  records: DailySalesRecord[];
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((acc, value) => acc + (value - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function sortByDate(records: DailySalesRecord[]): DailySalesRecord[] {
  return [...records].sort((a, b) => a.date.localeCompare(b.date));
}

function parseDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

function dayOfWeekIndex(date: string): number {
  return parseDate(date).getUTCDay();
}

function weightedAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const weights = values.map((_, index) => index + 1);
  const totalWeight = weights.reduce((acc, value) => acc + value, 0);
  const weightedSum = values.reduce((acc, value, index) => acc + value * weights[index], 0);
  return weightedSum / totalWeight;
}

function growthRatePct(values: number[]): number {
  if (values.length < 2) return 0;
  const first = Math.max(values[0], 1);
  const last = values[values.length - 1];
  return ((last - first) / first) * 100;
}

function demandTrend(growthPct: number): "growing" | "declining" | "stable" {
  if (growthPct > 5) return "growing";
  if (growthPct < -5) return "declining";
  return "stable";
}

function confidenceLevel(observations: number, volatility: number): "high" | "medium" | "low" {
  if (observations >= 90 && volatility < 0.2) return "high";
  if (observations >= 45 && volatility < 0.45) return "medium";
  return "low";
}

function aggregateByDistributionPoint(records: DailySalesRecord[]): AggregatedPoint[] {
  const grouped = new Map<string, AggregatedPoint>();

  for (const record of records) {
    const key = `${record.location}::${record.distributionPoint}`;
    const normalized: DailySalesRecord = {
      ...record,
      supplied: Math.max(record.supplied, 0),
      sold: Math.max(record.sold, 0),
      returned: Math.max(record.returned, 0),
    };

    if (!grouped.has(key)) {
      grouped.set(key, {
        location: record.location,
        distributionPoint: record.distributionPoint,
        records: [],
      });
    }

    const bucket = grouped.get(key)!;
    bucket.records.push(normalized);
  }

  return [...grouped.values()].map(bucket => ({
    ...bucket,
    records: sortByDate(bucket.records),
  }));
}

export function buildCommercialPerformanceModel(
  salesRecords: DailySalesRecord[],
  events: SalesEvent[],
): CommercialPerformanceModelResult {
  const aggregated = aggregateByDistributionPoint(salesRecords);
  const eventImpactByDate = new Map<string, number>();

  for (const event of events) {
    const signedIntensity = event.impact === "positive" ? event.intensity : -event.intensity;
    const existing = eventImpactByDate.get(event.date) ?? 0;
    eventImpactByDate.set(event.date, clamp(existing + signedIntensity, -1, 1));
  }

  const recommendations = aggregated.map(point => {
    const records = point.records;
    const soldSeries = records.map(item => item.sold);
    const baselineWindow = soldSeries.slice(-28);
    const baselineDemand = weightedAverage(baselineWindow);

    const weekdayFactorByDay = new Map<number, number>();
    for (let d = 0; d < 7; d += 1) {
      const weekdaySold = records
        .filter(item => dayOfWeekIndex(item.date) === d)
        .map(item => item.sold);
      const weekdayAverage = mean(weekdaySold);
      const divisor = baselineDemand <= 0 ? 1 : baselineDemand;
      weekdayFactorByDay.set(d, clamp(weekdayAverage / divisor, 0.7, 1.3));
    }

    const lastDate = records[records.length - 1]?.date;
    const nextDate = lastDate
      ? new Date(parseDate(lastDate).getTime() + MS_PER_DAY).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    const dayFactor = weekdayFactorByDay.get(dayOfWeekIndex(nextDate)) ?? 1;
    const eventBoost = 1 + (eventImpactByDate.get(nextDate) ?? 0) * 0.35;

    const midpoint = Math.max(1, Math.floor(soldSeries.length / 2));
    const earlyDemand = mean(soldSeries.slice(0, midpoint));
    const recentDemand = mean(soldSeries.slice(midpoint));
    const longTermGrowth = growthRatePct([earlyDemand, recentDemand]);

    const growthFactor = 1 + clamp(longTermGrowth / 100, -0.2, 0.2);
    const forecastDemand = Math.max(0, Math.round(baselineDemand * dayFactor * eventBoost * growthFactor));

    const averageSellThrough = mean(
      records.map(item => (item.supplied > 0 ? item.sold / item.supplied : 0)),
    );
    const averageReturnRate = mean(
      records.map(item => (item.supplied > 0 ? item.returned / item.supplied : 0)),
    );

    const safetyStockPct = longTermGrowth > 5 ? 0.08 : longTermGrowth < -5 ? 0.02 : 0.05;
    const recommendedSupply = Math.max(
      forecastDemand,
      Math.round(forecastDemand * (1 + safetyStockPct) / Math.max(averageSellThrough, 0.72)),
    );

    const expectedUnsoldCopies = Math.max(0, Math.round(recommendedSupply - forecastDemand));
    const volatility = mean(soldSeries) > 0 ? stddev(soldSeries) / mean(soldSeries) : 1;

    return {
      location: point.location,
      distributionPoint: point.distributionPoint,
      baselineDemand: Math.round(baselineDemand),
      forecastDemand,
      recommendedSupply,
      demandTrend: demandTrend(longTermGrowth),
      demandGrowthRatePct: Math.round(longTermGrowth * 10) / 10,
      averageSellThroughPct: Math.round(averageSellThrough * 1000) / 10,
      averageReturnRatePct: Math.round(averageReturnRate * 1000) / 10,
      expectedUnsoldCopies,
      confidence: confidenceLevel(records.length, volatility),
    };
  });

  recommendations.sort((a, b) => b.forecastDemand - a.forecastDemand);

  const totalForecastDemand = recommendations.reduce((acc, item) => acc + item.forecastDemand, 0);
  const totalRecommendedSupply = recommendations.reduce((acc, item) => acc + item.recommendedSupply, 0);
  const projectedUnsoldCopies = recommendations.reduce((acc, item) => acc + item.expectedUnsoldCopies, 0);

  return {
    generatedAt: new Date().toISOString(),
    historicalWindowDays: 365,
    eventDatesUsed: [...eventImpactByDate.keys()].sort(),
    recommendations,
    summary: {
      totalForecastDemand,
      totalRecommendedSupply,
      projectedUnsoldCopies,
      growingOutlets: recommendations.filter(item => item.demandTrend === "growing").length,
      decliningOutlets: recommendations.filter(item => item.demandTrend === "declining").length,
    },
  };
}
