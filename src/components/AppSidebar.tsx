import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Upload,
  Users,
  MapPin,
  TrendingUp,
  Lightbulb,
  Settings,
  Newspaper,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/data-ingestion", icon: Upload, label: "Data Ingestion" },
  { to: "/audience", icon: Users, label: "Audience" },
  { to: "/distribution", icon: MapPin, label: "Distribution" },
  { to: "/forecasting", icon: TrendingUp, label: "Forecasting" },
  { to: "/insights", icon: Lightbulb, label: "AI Insights" },
  { to: "/admin", icon: Settings, label: "Admin" },
];

const AppSidebar = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 border-b border-sidebar-border px-5 py-5">
        <Newspaper className="h-6 w-6 text-accent" />
        <div>
          <h1 className="font-heading text-sm font-bold leading-tight text-sidebar-primary">
            New Era
          </h1>
          <span className="text-[10px] font-medium uppercase tracking-widest text-sidebar-accent-foreground/60">
            Intelligence Platform
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-5 py-4">
        <p className="text-[10px] text-sidebar-foreground/40">
          © 2026 New Era Intelligence
        </p>
      </div>
    </aside>
  );
};

export default AppSidebar;
