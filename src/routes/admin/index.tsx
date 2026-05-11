import { createFileRoute } from "@tanstack/react-router";
import { Database, MapPin, Search, AlertTriangle, Activity, Inbox } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { lookupSplit, platformSplit, searchTrend, topDistricts } from "@/data/mock";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

const stats = [
  { icon: Database, label: "Total postcodes", value: "12,408", trend: "+24 this week", color: "text-primary" },
  { icon: MapPin, label: "Pilot districts", value: "8", trend: "active", color: "text-success" },
  { icon: Activity, label: "GPS lookups today", value: "1,742", trend: "+12% vs yesterday", color: "text-chart-3" },
  { icon: Search, label: "Manual searches today", value: "1,418", trend: "+5% vs yesterday", color: "text-chart-4" },
  { icon: AlertTriangle, label: "Zero-result searches", value: "37", trend: "-8% vs week", color: "text-destructive" },
  { icon: Inbox, label: "Pending corrections", value: "23", trend: "5 high priority", color: "text-warning" },
];

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Operations Dashboard</h1>
        <p className="text-sm text-muted-foreground">Real-time overview of postcode usage across pilot districts.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-muted ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="mt-1 text-2xl font-bold">{s.value}</div>
              <div className="text-[11px] text-muted-foreground">{s.trend}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Search volume — last 7 days</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={searchTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} />
                <Legend />
                <Line type="monotone" dataKey="gps" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="manual" stroke="var(--chart-2)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">GPS vs Manual</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={lookupSplit} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {lookupSplit.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Web vs Mobile</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={platformSplit} dataKey="value" nameKey="name" outerRadius={80}>
                  {platformSplit.map((_, i) => <Cell key={i} fill={COLORS[i + 2]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Top searched districts</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topDistricts}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="district" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} />
                <Bar dataKey="searches" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Activity heatmap (mock)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-24 gap-1" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
            {Array.from({ length: 24 * 7 }).map((_, i) => {
              const v = Math.random();
              const op = 0.15 + v * 0.85;
              return <div key={i} className="aspect-square rounded-sm" style={{ background: `oklch(0.45 0.12 150 / ${op})` }} title={`Activity ${(v * 100).toFixed(0)}%`} />;
            })}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-1">
              {[0.15, 0.35, 0.55, 0.75, 0.95].map((o, i) => (
                <span key={i} className="h-3 w-3 rounded-sm" style={{ background: `oklch(0.45 0.12 150 / ${o})` }} />
              ))}
            </div>
            <span>More</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
