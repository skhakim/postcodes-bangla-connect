import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auditLogs } from "@/data/mock";

export const Route = createFileRoute("/admin/audit")({ component: AuditPage });

function AuditPage() {
  const [user, setUser] = useState("all");
  const [action, setAction] = useState("all");
  const [q, setQ] = useState("");

  const users = ["all", ...Array.from(new Set(auditLogs.map((l) => l.user)))];
  const actions = ["all", ...Array.from(new Set(auditLogs.map((l) => l.action)))];

  const filtered = useMemo(() => {
    return auditLogs.filter((l) => {
      if (user !== "all" && l.user !== user) return false;
      if (action !== "all" && l.action !== action) return false;
      if (q && !l.action.toLowerCase().includes(q.toLowerCase()) && !l.user.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [user, action, q]);

  const exportCsv = () => {
    const rows = [["Timestamp", "User", "Role", "IP", "Action", "Previous", "New"], ...filtered.map((l) => [l.ts, l.user, l.role, l.ip, l.action, l.prev, l.next])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "audit-log.csv"; a.click(); URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Audit Trail</h1>
        <p className="text-sm text-muted-foreground">All administrative actions are logged with full before/after snapshots.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{filtered.length} log entries</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => toast.info("PDF export queued — you'll receive an email when ready.")} className="gap-2"><FileText className="h-3.5 w-3.5" /> PDF</Button>
            <Button size="sm" onClick={exportCsv} className="gap-2"><Download className="h-3.5 w-3.5" /> CSV</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-2 sm:grid-cols-4">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" />
            <Select value={user} onValueChange={setUser}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{users.map((u) => <SelectItem key={u} value={u}>{u === "all" ? "All users" : u}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{actions.map((a) => <SelectItem key={a} value={a}>{a === "all" ? "All actions" : a}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="date" defaultValue="2025-05-01" />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Previous</TableHead>
                  <TableHead>New</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs whitespace-nowrap">{l.ts}</TableCell>
                    <TableCell className="text-xs">{l.user}</TableCell>
                    <TableCell className="text-xs">{l.role}</TableCell>
                    <TableCell className="text-xs font-mono">{l.ip}</TableCell>
                    <TableCell><code className="text-xs">{l.action}</code></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{l.prev}</TableCell>
                    <TableCell className="text-xs">{l.next}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
