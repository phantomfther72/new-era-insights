import { type LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: LucideIcon;
}

const KpiCard = ({ title, value, change, changeType, icon: Icon }: KpiCardProps) => {
  return (
    <div className="rounded border border-border bg-card p-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {title}
          </p>
          <p className="mt-2 font-heading text-2xl font-bold tabular-nums text-card-foreground">
            {value}
          </p>
          <p
            className={`mt-1 text-xs font-medium tabular-nums ${
              changeType === "positive"
                ? "text-emerald-600"
                : changeType === "negative"
                ? "text-accent"
                : "text-muted-foreground"
            }`}
          >
            {change}
          </p>
        </div>
        <div className="rounded bg-primary/10 p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
    </div>
  );
};

export default KpiCard;
