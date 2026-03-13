import { CalendarDays, Download, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const TopBar = ({ title }: { title: string }) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <h2 className="font-heading text-lg font-bold text-foreground">{title}</h2>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <CalendarDays className="h-3.5 w-3.5" />
          Last 30 days
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
        <Button variant="ghost" size="sm" onClick={toggleTheme}>
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
};

export default TopBar;
