import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Database, Upload, Map as MapIcon, Code2, ShieldCheck, BarChart3, Building2, Users, LogOut,
} from "lucide-react";
import { useAuth, type Role } from "@/lib/auth";
import { cn } from "@/lib/utils";

type Item = { to: string; label: string; icon: typeof Database; roles?: Role[] };

const items: Item[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/records", label: "Postcode Records", icon: Database },
  { to: "/admin/upload", label: "Bulk Upload", icon: Upload, roles: ["super_admin", "data_manager"] },
  { to: "/admin/boundaries", label: "Geo-Boundaries", icon: MapIcon, roles: ["super_admin", "data_manager"] },
  { to: "/admin/api", label: "API Management", icon: Code2, roles: ["super_admin"] },
  { to: "/admin/audit", label: "Audit Trail", icon: ShieldCheck, roles: ["super_admin", "data_manager"] },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/pilot", label: "Pilot Districts", icon: Building2 },
  { to: "/admin/users", label: "Users & Roles", icon: Users, roles: ["super_admin"] },
];

export function AdminSidebar() {
  const { role, logout, name } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const visible = items.filter((i) => !i.roles || (role && i.roles.includes(role)));

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-bold">ডা</div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">IPMS Admin</div>
          <div className="text-[10px] text-sidebar-foreground/60">Bangladesh Post Office</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        {visible.map((it) => {
          const active = path === it.to;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <it.icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 rounded-md bg-sidebar-accent px-3 py-2 text-xs">
          <div className="text-sidebar-foreground/60">Signed in as</div>
          <div className="font-medium">{name || "—"}</div>
        </div>
        <Link to="/" onClick={logout} className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground">
          <LogOut className="h-4 w-4" /> Sign out
        </Link>
      </div>
    </aside>
  );
}
