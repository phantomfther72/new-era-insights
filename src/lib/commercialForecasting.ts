export type TrafficLight = "green" | "amber" | "red";

export interface OutletSnapshot {
  outletId: string;
  outletName: string;
  distributionPoint: string | null;
  dailySales: Array<{ date: string; copiesSold: number; revenue: number }>;
  dailyReturns: Array<{ date: string; returnedCopies: number }>;
}

export interface EventDay {
  date: string;
  eventName: string;
  eventType: string;
}

export interface OutletForecast {
  outletId: string;
  outletName: string;
  averageSales: number;
  averageReturns: number;
  predictedNextDayDemand: number;
  recommendedSupplyAdjustment: number;
  trafficLight: TrafficLight;
  trend: "growth" | "decline" | "stable";
  returnsRate: number;
  eventLiftPct: number;
}

export interface DashboardMetrics {
  totalSales: number;
  totalReturns: number;
  revenueTrendPct: number;
  demandGrowthPct: number;
}

export interface ForecastBundle {
  metrics: DashboardMetrics;
  outletAnalytics: OutletForecast[];
  dailyTrend: Array<{ date: string; sales: number; returns: number; forecast: number }>;
  outletComparison: Array<{ outlet: string; averageSales: number; predictedDemand: number }>;
}

const rollingAverage = (values: number[], window = 7) => {
  if (!values.length) return 0;
  const slice = values.slice(-window);
  return slice.reduce((sum, v) => sum + v, 0) / slice.length;
};

const pctChange = (from: number, to: number) => {
  if (!from) return 0;
  return ((to - from) / from) * 100;
};

const stdDeviation = (values: number[]) => {
  if (values.length <= 1) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
};

const indexEvents = (events: EventDay[]) => new Map(events.map((event) => [event.date, event]));

export const generateCommercialForecast = (outlets: OutletSnapshot[], events: EventDay[]): ForecastBundle => {
  const eventMap = indexEvents(events);

  const outletAnalytics = outlets.map<OutletForecast>((outlet) => {
    const sales = outlet.dailySales.map((r) => r.copiesSold);
    const returns = outlet.dailyReturns.map((r) => r.returnedCopies);

    const averageSales = rollingAverage(sales, sales.length || 1);
    const averageReturns = rollingAverage(returns, returns.length || 1);
    const last7Sales = rollingAverage(sales, 7);
    const prev7Sales = rollingAverage(sales.slice(0, Math.max(0, sales.length - 7)), 7);
    const growthPct = pctChange(prev7Sales || averageSales, last7Sales || averageSales);

    const eventSales = outlet.dailySales
      .filter((record) => eventMap.has(record.date))
      .map((record) => record.copiesSold);
    const normalSales = outlet.dailySales
      .filter((record) => !eventMap.has(record.date))
      .map((record) => record.copiesSold);

    const eventAvg = rollingAverage(eventSales, eventSales.length || 1);
    const normalAvg = rollingAverage(normalSales, normalSales.length || 1);
    const eventLiftPct = normalAvg ? Number((((eventAvg - normalAvg) / normalAvg) * 100).toFixed(2)) : 0;

    const trendFactor = growthPct > 2 ? 1.06 : growthPct < -2 ? 0.94 : 1;
    const eventFactor = eventLiftPct > 0 ? 1 + Math.min(eventLiftPct, 20) / 100 : 1;
    const predictedNextDayDemand = Math.round(last7Sales * trendFactor * eventFactor);
    const recommendedSupplyAdjustment = Number((((predictedNextDayDemand - averageSales) / (averageSales || 1)) * 100).toFixed(2));

    const returnsRate = averageSales ? (averageReturns / averageSales) * 100 : 0;
    const variance = stdDeviation(sales);
    const stableVariance = averageSales ? variance / averageSales < 0.1 : true;

    let trafficLight: TrafficLight = "amber";
    if (recommendedSupplyAdjustment > 15) {
      trafficLight = "red";
    } else if (returnsRate > 20) {
      trafficLight = "red";
    } else if (stableVariance) {
      trafficLight = "green";
    }

    const trend: OutletForecast["trend"] = growthPct > 2 ? "growth" : growthPct < -2 ? "decline" : "stable";

    return {
      outletId: outlet.outletId,
      outletName: outlet.outletName,
      averageSales: Number(averageSales.toFixed(2)),
      averageReturns: Number(averageReturns.toFixed(2)),
      predictedNextDayDemand,
      recommendedSupplyAdjustment,
      trafficLight,
      trend,
      returnsRate: Number(returnsRate.toFixed(2)),
      eventLiftPct,
    };
  });

  const dailyMap = new Map<string, { sales: number; returns: number }>();
  outlets.forEach((outlet) => {
    outlet.dailySales.forEach((row) => {
      const slot = dailyMap.get(row.date) ?? { sales: 0, returns: 0 };
      slot.sales += row.copiesSold;
      dailyMap.set(row.date, slot);
    });
    outlet.dailyReturns.forEach((row) => {
      const slot = dailyMap.get(row.date) ?? { sales: 0, returns: 0 };
      slot.returns += row.returnedCopies;
      dailyMap.set(row.date, slot);
    });
  });

  const dailyTrend = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values], index, arr) => {
      const salesWindow = arr.slice(Math.max(0, index - 6), index + 1).map(([, v]) => v.sales);
      return {
        date,
        sales: values.sales,
        returns: values.returns,
        forecast: Math.round(rollingAverage(salesWindow, 7)),
      };
    });

  const totalSales = dailyTrend.reduce((sum, day) => sum + day.sales, 0);
  const totalReturns = dailyTrend.reduce((sum, day) => sum + day.returns, 0);

  const revenueDays = outlets.flatMap((outlet) => outlet.dailySales.map((row) => row.revenue));
  const half = Math.floor(revenueDays.length / 2);
  const firstHalf = revenueDays.slice(0, half).reduce((sum, v) => sum + v, 0);
  const secondHalf = revenueDays.slice(half).reduce((sum, v) => sum + v, 0);

  const demandHalf = Math.floor(dailyTrend.length / 2);
  const demandFirst = dailyTrend.slice(0, demandHalf).reduce((sum, day) => sum + day.sales, 0);
  const demandSecond = dailyTrend.slice(demandHalf).reduce((sum, day) => sum + day.sales, 0);

  return {
    metrics: {
      totalSales,
      totalReturns,
      revenueTrendPct: Number(pctChange(firstHalf, secondHalf).toFixed(2)),
      demandGrowthPct: Number(pctChange(demandFirst, demandSecond).toFixed(2)),
    },
    outletAnalytics: outletAnalytics.sort((a, b) => b.predictedNextDayDemand - a.predictedNextDayDemand),
    dailyTrend,
    outletComparison: outletAnalytics.map((item) => ({
      outlet: item.outletName,
      averageSales: item.averageSales,
      predictedDemand: item.predictedNextDayDemand,
    })),
  };
};
