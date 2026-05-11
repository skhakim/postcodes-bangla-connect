import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, KeyRound, Plus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiKeys as initial } from "@/data/mock";

export const Route = createFileRoute("/admin/api")({ component: ApiPage });

const endpoints = [
  { method: "GET", path: "/api/v1/lookup?q=Dhanmondi", desc: "Search postcodes by keyword (English or Bangla)." },
  { method: "GET", path: "/api/v1/reverse?lat=23.746&lng=90.376", desc: "Reverse geocode coordinates to a postcode." },
  { method: "POST", path: "/api/v1/validate", desc: "Validate that a (postcode, area) pair is correct." },
  { method: "POST", path: "/api/v1/batch", desc: "Validate up to 1,000 postcodes in a single request." },
];

const sample = `{
  "postcode": "1205",
  "area": "Dhanmondi",
  "area_bn": "ধানমন্ডি",
  "post_office": "Dhanmondi PO",
  "upazila": "Dhanmondi",
  "district": "Dhaka",
  "division": "Dhaka",
  "lat": 23.7461,
  "lng": 90.3742
}`;

function ApiPage() {
  const [keys, setKeys] = useState(initial);
  const copy = (s: string) => { navigator.clipboard?.writeText(s); toast.success("Copied"); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">API Management</h1>
        <p className="text-sm text-muted-foreground">Public IPMS API — standard tier limited to 1,000 requests/hour.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {endpoints.map((e) => (
          <Card key={e.path}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Badge variant={e.method === "GET" ? "secondary" : "default"}>{e.method}</Badge>
                <code className="text-xs font-mono">{e.path}</code>
                <Button size="icon" variant="ghost" className="ml-auto h-7 w-7" onClick={() => copy(e.path)}><Copy className="h-3.5 w-3.5" /></Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{e.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Sample response</CardTitle></CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-md bg-sidebar p-4 text-xs text-sidebar-foreground"><code>{sample}</code></pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><KeyRound className="h-4 w-4" /> API keys</CardTitle>
          <Button size="sm" className="gap-2" onClick={() => {
            const k = { id: String(Date.now()), partner: "New Partner", key: `ipms_live_••••••••${Math.random().toString(36).slice(2, 6)}`, limit: 1000, status: "active", lastUsed: "—" };
            setKeys((ks) => [k, ...ks]);
            toast.success("API key generated");
          }}><Plus className="h-3.5 w-3.5" /> Generate New</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner</TableHead>
                <TableHead>API key</TableHead>
                <TableHead>Limit / hr</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((k) => (
                <TableRow key={k.id}>
                  <TableCell className="font-medium">{k.partner}</TableCell>
                  <TableCell><code className="text-xs">{k.key}</code></TableCell>
                  <TableCell>{k.limit.toLocaleString()}</TableCell>
                  <TableCell><Badge variant={k.status === "active" ? "default" : "destructive"}>{k.status}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{k.lastUsed}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
