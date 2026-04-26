import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Map,
  Flag,
  BarChart3,
  LogOut,
  Compass,
  SlidersHorizontal,
  Boxes,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/users", icon: Users, label: "Users" },
  { to: "/tours", icon: Map, label: "Tours" },
  { to: "/reports", icon: Flag, label: "Reports" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/ar-models", icon: Boxes, label: "AR Models" },
  {
    to: "/picture-compare-tuning",
    icon: SlidersHorizontal,
    label: "Picture Tuning",
  },
];

export function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 border-b border-sidebar-accent px-6 py-5">
        <Compass className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-lg font-bold">Odyssey</h1>
          <p className="text-xs text-sidebar-foreground/60">Admin Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white",
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-accent px-3 py-4">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          Log out
        </button>
      </div>
    </aside>
  );
}
