import { createFileRoute } from "@tanstack/react-router";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { searchTrend, topDistricts } from "@/data/mock";

export const Route = createFileRoute("/admin/reports")({ component: ReportsPage });

const reports = [
  { id: "monthly", title: "Monthly Usage Summary", desc: "Total searches, GPS lookups, and feedback received per month.", chart: "line" as const },
  { id: "failure", title: "Search Failure Report", desc: "Queries that returned zero results — by district and keyword.", chart: "bar" as const },
  { id: "pilot", title: "Pilot District Performance", desc: "Accuracy, uptime, and feedback metrics across pilot districts.", chart: "bar" as const },
  { id: "api", title: "API Traffic Summary", desc: "Per-partner request volume, rate limiting, and error rates.", chart: "line" as const },
];

function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground">Generate and download standard reports.</p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div>
            <label className="text-xs text-muted-foreground">From</label>
            <Input type="date" defaultValue="2025-04-01" className="mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">To</label>
            <Input type="date" defaultValue="2025-05-01" className="mt-1" />
          </div>
          <Button>Apply</Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {reports.map((r) => (
          <Card key={r.id}>
            <CardHeader>
              <CardTitle className="text-base">{r.title}</CardTitle>
              <p className="text-xs text-muted-foreground">{r.desc}</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                {r.chart === "line" ? (
                  <LineChart data={searchTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} />
                    <Line type="monotone" dataKey="gps" stroke="var(--chart-1)" strokeWidth={2} />
                    <Line type="monotone" dataKey="manual" stroke="var(--chart-2)" strokeWidth={2} />
                  </LineChart>
                ) : (
                  <BarChart data={topDistricts}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="district" stroke="var(--muted-foreground)" fontSize={11} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} />
                    <Bar dataKey="searches" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
              <div className="mt-3 flex justify-end gap-2">
                <Button size="sm" variant="outline" className="gap-1" onClick={() => toast.info("PDF export queued")}>
                  <FileText className="h-3.5 w-3.5" /> PDF
                </Button>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => toast.info("Excel export queued")}>
                  <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
                </Button>
                <Button size="sm" className="gap-1" onClick={() => toast.success("CSV downloaded")}>
                  <Download className="h-3.5 w-3.5" /> CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
