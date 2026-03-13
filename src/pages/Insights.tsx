import TopBar from "@/components/TopBar";
import InsightCard from "@/components/InsightCard";
import { Lightbulb } from "lucide-react";

const insights = [
  { title: "Windhoek demand surge expected", description: "Based on 6-month trend analysis, Windhoek region is projected to increase daily sales by 12%. Recommend increasing distribution allocation by 2,000 copies starting next month.", type: "recommendation" as const },
  { title: "Youth segment (18-25) growing rapidly", description: "This demographic grew 18% quarter-over-quarter. Current print exposure is low—consider digital subscription packages and social media-driven content to capture this audience.", type: "trend" as const },
  { title: "Business section ad pricing opportunity", description: "Business section ad slots are at 94% capacity. Market conditions support a 5-8% price increase for Q2 without impacting fill rates.", type: "recommendation" as const },
  { title: "Keetmanshoop oversupply alert", description: "Keetmanshoop region shows a consistent 29% unsold rate over the past 3 months. Reducing allocation by 2,000 copies would save ~N$45,000/month in print costs.", type: "alert" as const },
  { title: "Weekend edition outperforms weekday", description: "Saturday editions sell 35% more copies on average. Consider weekend-exclusive content partnerships and premium ad placements to maximize revenue.", type: "trend" as const },
  { title: "Subscription churn risk in rural areas", description: "Rural subscriber retention dropped to 72% from 81% last quarter. Delivery reliability and content relevance are the top cited reasons. Recommend targeted retention campaign.", type: "alert" as const },
  { title: "Sport content drives cross-selling", description: "Readers who engage with sport content are 2.3x more likely to purchase weekday editions. Consider expanding sport coverage and creating sport-specific subscription tiers.", type: "recommendation" as const },
  { title: "December ad surge preparation", description: "Historical data shows 40% increase in ad bookings during December. Begin sales outreach 6 weeks earlier to maximize inventory utilization.", type: "recommendation" as const },
];

const Insights = () => (
  <div>
    <TopBar title="AI Insights" />
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 rounded border-2 border-accent/20 bg-accent/5 p-4">
        <Lightbulb className="h-5 w-5 text-accent" />
        <div>
          <p className="text-sm font-semibold text-foreground">AI-Generated Business Intelligence</p>
          <p className="text-xs text-muted-foreground">These recommendations are generated from your uploaded datasets. Connect predictive models for enhanced forecasting.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {insights.map((insight, i) => (
          <InsightCard key={i} {...insight} />
        ))}
      </div>
    </div>
  </div>
);

export default Insights;
