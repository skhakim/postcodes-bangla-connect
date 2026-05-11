import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { AdminSidebar } from "@/components/ipms/AdminSidebar";
import { useAuth, ROLE_LABELS } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("ipms-role");
      if (!role) throw redirect({ to: "/login" });
    }
  },
});

function AdminLayout() {
  const { role, name } = useAuth();
  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b bg-card px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="lg:hidden text-sm font-semibold">IPMS Admin</Link>
            <span className="hidden lg:inline text-sm text-muted-foreground">Welcome, <span className="font-medium text-foreground">{name}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline rounded-full border bg-background px-2.5 py-0.5 text-xs font-medium">{role && ROLE_LABELS[role]}</span>
            <Button size="sm" variant="ghost" className="gap-1"><Bell className="h-4 w-4" /></Button>
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">View public site</Link>
          </div>
        </header>
        {/* mobile nav */}
        <div className="flex gap-1 overflow-x-auto border-b bg-card px-4 py-2 text-xs lg:hidden">
          {[
            ["/admin", "Dashboard"],
            ["/admin/records", "Records"],
            ["/admin/upload", "Upload"],
            ["/admin/boundaries", "Boundaries"],
            ["/admin/api", "API"],
            ["/admin/audit", "Audit"],
            ["/admin/reports", "Reports"],
            ["/admin/pilot", "Pilot"],
            ["/admin/users", "Users"],
          ].map(([to, label]) => (
            <Link key={to} to={to} className="whitespace-nowrap rounded-full border bg-background px-2.5 py-1">{label}</Link>
          ))}
        </div>
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
