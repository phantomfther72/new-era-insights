import { describe, expect, it } from "vitest";
import { buildCommercialPerformanceModel, type DailySalesRecord, type SalesEvent } from "@/lib/commercialPerformance";

function generateRecords(
  location: string,
  distributionPoint: string,
  startDate: string,
  days: number,
  baseSold: number,
  trendPerDay: number,
): DailySalesRecord[] {
  const output: DailySalesRecord[] = [];
  const start = new Date(`${startDate}T00:00:00Z`);

  for (let i = 0; i < days; i += 1) {
    const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const sold = Math.max(0, Math.round(baseSold + trendPerDay * i));
    const supplied = Math.round(sold * 1.15);
    const returned = Math.max(0, supplied - sold);

    output.push({
      date,
      location,
      distributionPoint,
      supplied,
      sold,
      returned,
    });
  }

  return output;
}

describe("buildCommercialPerformanceModel", () => {
  it("detects growing and declining outlets and creates supply recommendations", () => {
    const records = [
      ...generateRecords("Windhoek", "CBD-01", "2025-01-01", 120, 180, 0.4),
      ...generateRecords("Swakopmund", "Coastal-03", "2025-01-01", 120, 140, -0.3),
    ];

    const events: SalesEvent[] = [
      { date: "2025-05-01", name: "Election Special", impact: "positive", intensity: 0.8 },
      { date: "2025-05-02", name: "Transport Strike", impact: "negative", intensity: 0.5 },
    ];

    const model = buildCommercialPerformanceModel(records, events);

    expect(model.recommendations).toHaveLength(2);
    expect(model.summary.totalRecommendedSupply).toBeGreaterThan(model.summary.totalForecastDemand);
    expect(model.summary.growingOutlets).toBeGreaterThanOrEqual(1);
    expect(model.summary.decliningOutlets).toBeGreaterThanOrEqual(1);

    const windhoek = model.recommendations.find(item => item.distributionPoint === "CBD-01");
    const swakopmund = model.recommendations.find(item => item.distributionPoint === "Coastal-03");

    expect(windhoek?.demandTrend).toBe("growing");
    expect(swakopmund?.demandTrend).toBe("declining");
    expect(windhoek?.recommendedSupply ?? 0).toBeGreaterThan(windhoek?.forecastDemand ?? 0);
  });

  it("handles empty datasets gracefully", () => {
    const model = buildCommercialPerformanceModel([], []);
    expect(model.recommendations).toEqual([]);
    expect(model.summary.totalForecastDemand).toBe(0);
    expect(model.summary.totalRecommendedSupply).toBe(0);
    expect(model.summary.projectedUnsoldCopies).toBe(0);
  });
});
