import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { pilotDistricts as initial } from "@/data/mock";

export const Route = createFileRoute("/admin/pilot")({ component: PilotPage });

function PilotPage() {
  const [data, setData] = useState(initial);
  const toggle = (id: string) => {
    setData((d) => d.map((x) => (x.id === id ? { ...x, active: !x.active } : x)));
    const item = data.find((x) => x.id === id);
    toast.success(`${item?.district} ${!item?.active ? "activated" : "deactivated"}`);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Pilot Deployment</h1>
        <p className="text-sm text-muted-foreground">Manage pilot district rollout and monitor adoption metrics.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {data.map((d) => (
          <Card key={d.id} className={d.active ? "" : "opacity-70"}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-base">{d.district}</CardTitle>
                <p className="text-xs text-muted-foreground">{d.division}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={d.active ? "default" : "outline"}>{d.active ? "Active" : "Inactive"}</Badge>
                <Switch checked={d.active} onCheckedChange={() => toggle(d.id)} />
              </div>
            </CardHeader>
            <CardContent>
              {d.active ? (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Metric label="GPS accuracy" value={`${d.gpsAccuracy}%`} />
                  <Metric label="Uptime" value={`${d.uptime}%`} />
                  <Metric label="Feedback" value={d.feedback} />
                  <Metric label="Failure ↓" value={`${d.failureReduction}%`} />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No data — pilot not yet active.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}
