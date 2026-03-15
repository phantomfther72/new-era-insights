import Papa from "papaparse";
import type { Database } from "@/integrations/supabase/types";
import type { EventDay, OutletSnapshot } from "@/lib/commercialForecasting";

type OutletInsert = Database["public"]["Tables"]["outlets"]["Insert"];
type SalesInsert = Database["public"]["Tables"]["sales_records"]["Insert"];
type ReturnInsert = Database["public"]["Tables"]["returns_records"]["Insert"];
type EventInsert = Database["public"]["Tables"]["event_calendar"]["Insert"];

const parseNumber = (value: string | undefined) => {
  const parsed = Number((value ?? "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
};

export const parseCsv = (text: string) => {
  const { data } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  return data.map((row) =>
    Object.entries(row).reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = (value ?? "").toString().trim();
      return acc;
    }, {})
  );
};

export const toOutletRows = (rows: Record<string, string>[]): OutletInsert[] => {
  const outletSet = new Map<string, OutletInsert>();
  rows.forEach((row) => {
    const outletName = row.outlet_name || row.outlet || row.name;
    if (!outletName) return;
    outletSet.set(outletName, {
      outlet_name: outletName,
      distribution_point: row.distribution_point || row.point || null,
    });
  });
  return [...outletSet.values()];
};

export const toSalesRows = (rows: Record<string, string>[], outletIndex: Map<string, string>): SalesInsert[] => rows
  .map((row) => {
    const outletName = row.outlet_name || row.outlet;
    const outletId = outletIndex.get(outletName);
    if (!outletId) return null;
    return {
      outlet_id: outletId,
      record_date: row.date,
      copies_sold: parseNumber(row.copies_sold || row.sales),
      revenue: parseNumber(row.revenue),
      region: row.distribution_point || null,
      source: "csv",
      raw_data: row,
    } satisfies SalesInsert;
  })
  .filter((row): row is SalesInsert => Boolean(row));

export const toReturnRows = (rows: Record<string, string>[], outletIndex: Map<string, string>): ReturnInsert[] => rows
  .map((row) => {
    const outletName = row.outlet_name || row.outlet;
    const outletId = outletIndex.get(outletName);
    if (!outletId) return null;
    return {
      outlet_id: outletId,
      return_date: row.date,
      returned_copies: parseNumber(row.returned_copies || row.returns),
    } satisfies ReturnInsert;
  })
  .filter((row): row is ReturnInsert => Boolean(row));

export const toEventRows = (rows: Record<string, string>[]): EventInsert[] => rows
  .filter((row) => row.date && row.event_name)
  .map((row) => ({
    event_date: row.date,
    event_name: row.event_name,
    event_type: row.event_type || "campaign",
    expected_impact: row.expected_impact || null,
  }));

export const generateMockData = () => {
  const outlets = ["City Center", "North Hub", "Airport Kiosk", "University Gate", "Harbor Stand"];
  const start = new Date();
  start.setDate(start.getDate() - 29);

  const salesCsv: string[] = ["date,outlet_name,distribution_point,copies_sold,revenue"];
  const returnsCsv: string[] = ["date,outlet_name,returned_copies"];
  const eventsCsv: string[] = ["date,event_name,event_type,expected_impact"];

  const eventDays = new Set<number>([5, 12, 20, 26]);

  for (let d = 0; d < 30; d += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + d);
    const dateString = date.toISOString().slice(0, 10);

    outlets.forEach((outlet, idx) => {
      const base = 320 + idx * 45;
      const trend = d * (idx % 2 === 0 ? 2.4 : 1.2);
      const eventLift = eventDays.has(d) ? 70 : 0;
      const sold = Math.round(base + trend + eventLift + Math.random() * 30);
      const returned = Math.max(10, Math.round(sold * (0.08 + Math.random() * 0.18)));
      salesCsv.push(`${dateString},${outlet},Zone-${idx + 1},${sold},${(sold * 2.4).toFixed(2)}`);
      returnsCsv.push(`${dateString},${outlet},${returned}`);
    });

    if (eventDays.has(d)) {
      eventsCsv.push(`${dateString},Campaign Burst ${d},campaign,High footfall expected`);
    }
  }

  return {
    sales: salesCsv.join("\n"),
    returns: returnsCsv.join("\n"),
    events: eventsCsv.join("\n"),
  };
};

export const buildMockForecastSeed = (): { outlets: OutletSnapshot[]; events: EventDay[] } => {
  const mock = generateMockData();
  const salesRows = parseCsv(mock.sales);
  const returnRows = parseCsv(mock.returns);
  const eventRows = parseCsv(mock.events);

  const outletNames = [...new Set(salesRows.map((row) => row.outlet_name).filter(Boolean))];

  const outlets: OutletSnapshot[] = outletNames.map((outletName, index) => ({
    outletId: `mock-${index + 1}`,
    outletName,
    distributionPoint: salesRows.find((row) => row.outlet_name === outletName)?.distribution_point ?? null,
    dailySales: salesRows
      .filter((row) => row.outlet_name === outletName)
      .map((row) => ({
        date: row.date,
        copiesSold: parseNumber(row.copies_sold),
        revenue: parseNumber(row.revenue),
      })),
    dailyReturns: returnRows
      .filter((row) => row.outlet_name === outletName)
      .map((row) => ({
        date: row.date,
        returnedCopies: parseNumber(row.returned_copies),
      })),
  }));

  const events: EventDay[] = eventRows.map((row) => ({
    date: row.date,
    eventName: row.event_name,
    eventType: row.event_type || "campaign",
  }));

  return { outlets, events };
};
