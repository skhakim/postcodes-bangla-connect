import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Navigation, MapPin, AlertTriangle, ShieldX, SignalLow, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { postcodes } from "@/data/postcodes";
import { PostcodeResultCard } from "@/components/ipms/PostcodeResultCard";
import { useOnline } from "@/lib/online";

export const Route = createFileRoute("/_public/gps")({
  component: GpsPage,
  head: () => ({ meta: [{ title: "GPS Postcode Lookup — IPMS" }] }),
});

type State = "idle" | "loading" | "success" | "denied" | "weak" | "outside";

function GpsPage() {
  const [state, setState] = useState<State>("idle");
  const [coord, setCoord] = useState<{ lat: number; lng: number; acc: number } | null>(null);
  const { online } = useOnline();

  const detect = (mode?: State) => {
    setState("loading");
    setTimeout(() => {
      if (mode) {
        setState(mode);
        return;
      }
      setCoord({ lat: 23.7461, lng: 90.3742, acc: 18 });
      setState("success");
    }, 1200);
  };

  const result = postcodes[0];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">GPS Postcode Lookup</h1>
        <p className="mt-2 text-muted-foreground">Detect your postcode using your device's location.</p>
      </div>

      <Card>
        <CardContent className="p-8">
          {state === "idle" && (
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Navigation className="h-9 w-9" />
              </div>
              <p className="mt-4 max-w-md text-sm text-muted-foreground">
                We'll request location access and match it to the closest pilot postcode area. Your location is not stored.
              </p>
              <Button size="lg" className="mt-6 gap-2" onClick={() => detect()} disabled={!online}>
                <Navigation className="h-5 w-5" /> Detect My Location
              </Button>
              {!online && (
                <p className="mt-3 text-xs text-destructive">GPS lookup is unavailable while offline.</p>
              )}
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => detect("denied")}>Simulate denied</Button>
                <Button variant="ghost" size="sm" onClick={() => detect("weak")}>Simulate weak signal</Button>
                <Button variant="ghost" size="sm" onClick={() => detect("outside")}>Simulate outside pilot</Button>
              </div>
            </div>
          )}

          {state === "loading" && (
            <div className="flex flex-col items-center py-10 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">Acquiring GPS signal…</p>
            </div>
          )}

          {state === "success" && coord && (
            <div className="space-y-5">
              <Alert className="border-success/50 bg-success/10">
                <MapPin className="h-4 w-4" />
                <AlertTitle>Location detected</AlertTitle>
                <AlertDescription>
                  Coordinates: {coord.lat.toFixed(4)}, {coord.lng.toFixed(4)} · Accuracy ±{coord.acc}m
                </AlertDescription>
              </Alert>
              <PostcodeResultCard p={result} />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Field k="Division" v={result.division} />
                <Field k="District" v={result.district} />
                <Field k="Upazila" v={result.upazila} />
                <Field k="Area" v={result.area} />
                <Field k="Post Office" v={result.postOffice} />
                <Field k="Postcode" v={result.postcode} />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setState("idle")}>Try again</Button>
                <Link to="/map"><Button variant="outline">View on Map</Button></Link>
              </div>
            </div>
          )}

          {state === "denied" && (
            <ErrorState
              icon={ShieldX}
              title="Location access denied"
              desc="You blocked location permission. You can still find your postcode using manual search."
              onRetry={() => setState("idle")}
            />
          )}

          {state === "weak" && (
            <ErrorState
              icon={SignalLow}
              title="Weak GPS signal"
              desc="We couldn't get a precise fix. Try moving outdoors, or switch to manual search."
              onRetry={() => setState("idle")}
            />
          )}

          {state === "outside" && (
            <ErrorState
              icon={AlertTriangle}
              title="Outside pilot district"
              desc="Your location is outside the current IPMS pilot coverage. Manual search is available nationwide."
              onRetry={() => setState("idle")}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md border bg-secondary/30 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{k}</div>
      <div className="text-sm font-medium">{v}</div>
    </div>
  );
}

function ErrorState({ icon: Icon, title, desc, onRetry }: { icon: typeof Navigation; title: string; desc: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{desc}</p>
      <div className="mt-5 flex gap-2">
        <Button variant="outline" onClick={onRetry}>Try again</Button>
        <Link to="/search"><Button>Use Manual Search Instead</Button></Link>
      </div>
    </div>
  );
}
