import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Shield, ShieldCheck, KeyRound, Database, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth, type Role } from "@/lib/auth";

export const Route = createFileRoute("/_public/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Admin Login — IPMS" }] }),
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const choose = (r: Role) => {
    login(r);
    navigate({ to: "/admin" });
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Shield className="h-6 w-6" />
        </div>
        <h1 className="mt-3 text-3xl font-bold">IPMS Administration</h1>
        <p className="mt-1 text-muted-foreground">Authorized personnel only. Choose a demo role to enter the dashboard.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Sign in</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Government email</Label>
              <Input id="email" defaultValue="admin@bdpost.gov.bd" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="pwd">Password</Label>
              <Input id="pwd" type="password" defaultValue="••••••••••" className="mt-1.5" />
            </div>
            <Alert className="bg-warning/20 border-warning/40">
              <ShieldCheck className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Strong password and MFA via TOTP are enforced for production accounts.
              </AlertDescription>
            </Alert>
            <Button className="w-full" onClick={() => choose("super_admin")}>Sign in</Button>
            <p className="text-center text-xs text-muted-foreground">Or pick a demo role on the right →</p>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <RoleCard icon={KeyRound} role="super_admin" title="Super Admin" desc="Full access: users, API keys, audit logs, all data." onClick={choose} />
          <RoleCard icon={Database} role="data_manager" title="Data Manager / GIS Specialist" desc="Manage postcode records, boundaries, and bulk uploads." onClick={choose} />
          <RoleCard icon={Users} role="ops_staff" title="Operational Staff" desc="View records, generate reports, report discrepancies." onClick={choose} />
        </div>
      </div>
    </div>
  );
}

function RoleCard({ icon: Icon, role, title, desc, onClick }: { icon: typeof Shield; role: Role; title: string; desc: string; onClick: (r: Role) => void }) {
  return (
    <button onClick={() => onClick(role)} className="block w-full text-left">
      <Card className="transition-all hover:border-primary hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-semibold">{title}</div>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
          <span className="text-xs text-primary">Enter →</span>
        </CardContent>
      </Card>
    </button>
  );
}
