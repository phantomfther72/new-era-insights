import { Lightbulb } from "lucide-react";

interface InsightCardProps {
  title: string;
  description: string;
  type?: "recommendation" | "alert" | "trend";
}

const InsightCard = ({ title, description, type = "recommendation" }: InsightCardProps) => {
  return (
    <div className="rounded border border-border bg-card p-4 animate-fade-in border-t-2 border-t-accent">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded bg-accent/10 p-1.5">
          <Lightbulb className="h-3.5 w-3.5 text-accent" />
        </div>
        <div>
          <p className="text-sm font-semibold text-card-foreground">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default InsightCard;
