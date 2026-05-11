import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Save } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/boundaries")({ component: BoundariesPage });

const zones = [
  { id: "1205", name: "Dhanmondi", division: "Dhaka", points: 14, overlap: false },
  { id: "1207", name: "Mohammadpur", division: "Dhaka", points: 11, overlap: true },
  { id: "1213", name: "Banani", division: "Dhaka", points: 9, overlap: false },
  { id: "4100", name: "Agrabad", division: "Chattogram", points: 18, overlap: false },
  { id: "3100", name: "Sylhet Sadar", division: "Sylhet", points: 22, overlap: false },
];

function BoundariesPage() {
  const [selected, setSelected] = useState(zones[0]);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([
    { x: 120, y: 80 }, { x: 220, y: 90 }, { x: 280, y: 160 }, { x: 240, y: 240 }, { x: 140, y: 220 }, { x: 90, y: 150 },
  ]);
  const [drag, setDrag] = useState<number | null>(null);

  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (drag === null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 360;
    const y = ((e.clientY - rect.top) / rect.height) * 320;
    setPoints((p) => p.map((pt, i) => (i === drag ? { x, y } : pt)));
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Geo-Boundary Management</h1>
        <p className="text-sm text-muted-foreground">Edit postcode zone boundaries. Overlapping zones are flagged automatically.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Zones</CardTitle></CardHeader>
          <CardContent className="space-y-1.5 max-h-[480px] overflow-y-auto">
            {zones.map((z) => (
              <button key={z.id} onClick={() => setSelected(z)} className={cn("w-full rounded-md border p-3 text-left text-sm hover:bg-muted/50 transition-colors", selected.id === z.id && "border-primary bg-primary/5")}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{z.id} · {z.name}</div>
                    <div className="text-xs text-muted-foreground">{z.division} · {z.points} points</div>
                  </div>
                  {z.overlap && <AlertTriangle className="h-4 w-4 text-destructive" />}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Editing zone {selected.id} — {selected.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {selected.overlap && (
              <Alert variant="destructive" className="mb-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Boundary overlap detected</AlertTitle>
                <AlertDescription>This zone overlaps with Zone-1209 by 0.3 km². Adjust before saving.</AlertDescription>
              </Alert>
            )}
            <div className="rounded-lg border bg-muted/20 p-2">
              <svg
                viewBox="0 0 360 320"
                className="w-full"
                onMouseMove={onMouseMove}
                onMouseUp={() => setDrag(null)}
                onMouseLeave={() => setDrag(null)}
              >
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--border)" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="360" height="320" fill="url(#grid)" />
                <polygon
                  points={points.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="oklch(0.45 0.12 150 / 0.3)"
                  stroke="var(--primary)"
                  strokeWidth="2"
                />
                {points.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={6}
                    fill="white"
                    stroke="var(--primary)"
                    strokeWidth="2"
                    onMouseDown={() => setDrag(i)}
                    className="cursor-move"
                  />
                ))}
              </svg>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="outline" onClick={() => toast.info("Reverted")}>Revert</Button>
              <Button className="gap-2" onClick={() => toast.success("Boundary saved")}><Save className="h-4 w-4" /> Save Boundary</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
