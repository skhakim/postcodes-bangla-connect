import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layers, MapPin } from "lucide-react";
import { BangladeshMap } from "@/components/ipms/BangladeshMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { postcodes } from "@/data/postcodes";

export const Route = createFileRoute("/_public/map")({
  component: MapPage,
  head: () => ({ meta: [{ title: "Interactive Postcode Map — IPMS" }] }),
});

function MapPage() {
  const [selected, setSelected] = useState<string>("Dhaka");
  const [layer, setLayer] = useState<"standard" | "satellite" | "boundary">("standard");
  const inDivision = postcodes.filter((p) => p.division === selected);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Interactive Map</h1>
          <p className="mt-1 text-muted-foreground">Click a division to see postcodes and adjacent zones.</p>
        </div>
        <Tabs value={layer} onValueChange={(v) => setLayer(v as typeof layer)}>
          <TabsList>
            <TabsTrigger value="standard"><Layers className="mr-1 h-3.5 w-3.5" /> Standard</TabsTrigger>
            <TabsTrigger value="satellite">Satellite</TabsTrigger>
            <TabsTrigger value="boundary">Boundaries</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-2 sm:p-4">
            <div className="rounded-lg border bg-muted/30 overflow-hidden">
              <BangladeshMap layer={layer} highlight={selected} onSelect={setSelected} className="aspect-[4/4] w-full" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Legend color="var(--chart-1)" label="Dhaka" />
              <Legend color="var(--chart-2)" label="Chattogram" />
              <Legend color="var(--chart-3)" label="Sylhet/Khulna" />
              <Legend color="var(--chart-4)" label="Rajshahi/Barishal" />
              <Legend color="var(--chart-5)" label="Rangpur/Mymensingh" />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Selected: {selected}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {inDivision.length === 0 && <p className="text-sm text-muted-foreground">No records.</p>}
              {inDivision.slice(0, 6).map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                  <div>
                    <div className="font-semibold text-primary">{p.postcode}</div>
                    <div className="text-xs text-muted-foreground">{p.area} · {p.district}</div>
                  </div>
                  <Button size="sm" variant="ghost" className="gap-1"><MapPin className="h-3 w-3" /> Pin</Button>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nearby Post Offices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {postcodes.slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <span>{p.postOffice}</span>
                  <span className="text-xs text-muted-foreground">{p.postcode}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2 py-1">
      <span className="h-2.5 w-2.5 rounded" style={{ background: color }} />
      {label}
    </span>
  );
}
