import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Layers, MapPin } from "lucide-react";
import { BangladeshMap } from "@/components/ipms/BangladeshMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { postcodes, getDivisions, getDistricts, getUpazilas, getPostcodes } from "@/data/postcodes";

export const Route = createFileRoute("/_public/map")({
  component: MapPage,
  head: () => ({ meta: [{ title: "Interactive Postcode Map — IPMS" }] }),
});



function MapPage() {
  const [selected, setSelected] = useState<string>("Dhaka");
  const [district, setDistrict] = useState<string>("");
  const [upazila, setUpazila] = useState<string>("");
  const [postcodeId, setPostcodeId] = useState<string>("");
  const [layer, setLayer] = useState<"standard" | "satellite" | "boundary">("standard");
  const inDivision = postcodes.filter((p) => p.division === selected);
  const districts = useMemo(
    () => getDistricts(selected),
    [selected]
  );
  const upazilas = useMemo(
    () => (district ? getUpazilas(selected, district) : []),
    [selected, district]
  );
  const inDistrict = useMemo(
    () => {
      let data = district ? inDivision.filter((p) => p.district === district) : inDivision;
      if (upazila) data = data.filter((p) => p.upazila === upazila);
      return data;
    },
    [inDivision, district, upazila]
  );
  const activePostcode = useMemo(
    () => postcodes.find((p) => p.id === postcodeId) ?? null,
    [postcodeId]
  );
  const marker = activePostcode
    ? { lat: activePostcode.lat, lng: activePostcode.lng, label: `${activePostcode.postcode} · ${activePostcode.area}` }
    : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Interactive Map</h1>
          <p className="mt-1 text-muted-foreground">
            Live OpenStreetMap tiles with real district boundaries. Click any district to view postcodes.
          </p>
        </div>
        <Tabs value={layer} onValueChange={(v) => setLayer(v as typeof layer)}>
          <TabsList>
            <TabsTrigger value="standard"><Layers className="mr-1 h-3.5 w-3.5" /> Standard</TabsTrigger>
            <TabsTrigger value="satellite">Satellite</TabsTrigger>
            <TabsTrigger value="boundary">Boundaries</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="relative z-[10] mb-4 flex flex-wrap gap-3">
        <div className="min-w-[180px]">
          <Select value={selected} onValueChange={(v) => { setSelected(v); setDistrict(""); setUpazila(""); setPostcodeId(""); }}>
            <SelectTrigger><SelectValue placeholder="Division" /></SelectTrigger>
            <SelectContent>
              {getDivisions().map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[180px]">
          <Select value={district || "__all"} onValueChange={(v) => { setDistrict(v === "__all" ? "" : v); setUpazila(""); setPostcodeId(""); }}>
            <SelectTrigger><SelectValue placeholder="District" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All districts</SelectItem>
              {districts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[200px]">
          <Select value={upazila || "__all"} onValueChange={(v) => { setUpazila(v === "__all" ? "" : v); setPostcodeId(""); }} disabled={!district}>
            <SelectTrigger><SelectValue placeholder="Upazila / Thana" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All upazilas</SelectItem>
              {upazilas.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[200px]">
          <Select value={postcodeId || "__none"} onValueChange={(v) => setPostcodeId(v === "__none" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="Postcode" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">No postcode</SelectItem>
              {getPostcodes(selected, district).filter((p) => !upazila || p.upazila === upazila).map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.postcode} — {p.area}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="isolate lg:col-span-2">
          <CardContent className="p-2 sm:p-4">
            <div className="rounded-lg border bg-muted/30 overflow-hidden">
              <BangladeshMap
                layer={layer}
                highlight={selected}
                highlightDistrict={district}
                marker={marker}
                onSelect={(div, dist) => { setSelected(div); setDistrict(dist ?? ""); setPostcodeId(""); }}
                className="aspect-square w-full"
              />
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
              {inDistrict.slice(0, 8).map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between rounded-md border p-2 text-sm transition ${postcodeId === p.id ? "border-primary bg-primary/5" : ""}`}
                >
                  <div>
                    <div className="font-semibold text-primary">{p.postcode}</div>
                    <div className="text-xs text-muted-foreground">{p.area} · {p.district}</div>
                  </div>
                  <Button
                    size="sm"
                    variant={postcodeId === p.id ? "default" : "ghost"}
                    className="gap-1"
                    onClick={() => setPostcodeId(p.id)}
                  >
                    <MapPin className="h-3 w-3" /> Pin
                  </Button>
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
