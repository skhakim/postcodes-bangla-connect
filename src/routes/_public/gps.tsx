import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Navigation, MapPin, AlertTriangle, ShieldX, SignalLow, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { postcodes, type Postcode } from "@/data/postcodes";
import { PostcodeResultCard } from "@/components/ipms/PostcodeResultCard";
import { useOnline } from "@/lib/online";

export const Route = createFileRoute("/_public/gps")({
  component: GpsPage,
  head: () => ({ meta: [{ title: "GPS Postcode Lookup - IPMS" }] }),
});

type State = "idle" | "loading" | "success" | "denied" | "weak" | "outside";
type Coordinate = { lat: number; lng: number; acc: number };
type LocationMatch = { postcode: Postcode; distance: number };

const MAX_REASONABLE_ACCURACY_METERS = 5000;

function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const earthRadiusMeters = 6371000;
  const toRad = (degrees: number) => degrees * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const haversine =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function findNearestPostcode(coord: Coordinate): LocationMatch | null {
  return postcodes
    .filter((p) => p.lat !== 0 && p.lng !== 0)
    .map((postcode) => ({
      postcode,
      distance: distanceMeters(coord, { lat: postcode.lat, lng: postcode.lng }),
    }))
    .sort((a, b) => a.distance - b.distance)[0] ?? null;
}

function GpsPage() {
  const [state, setState] = useState<State>("idle");
  const [coord, setCoord] = useState<Coordinate | null>(null);
  const [match, setMatch] = useState<LocationMatch | null>(null);
  const { online } = useOnline();

  const reset = () => {
    setCoord(null);
    setMatch(null);
    setState("idle");
  };

  const detect = () => {
    if (!navigator.geolocation) {
      setState("outside");
      return;
    }

    setState("loading");
    setCoord(null);
    setMatch(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextCoord = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          acc: position.coords.accuracy,
        };

        setCoord(nextCoord);

        if (nextCoord.acc > MAX_REASONABLE_ACCURACY_METERS) {
          setState("weak");
          return;
        }

        const nearest = findNearestPostcode(nextCoord);
        if (!nearest) {
          setState("outside");
          return;
        }

        setMatch(nearest);
        setState("success");
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setState("denied");
          return;
        }

        setState("weak");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

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
                We'll request location access and match it to the nearest postcode record with coordinates. Your location is not stored.
              </p>
              <Button size="lg" className="mt-6 gap-2" onClick={detect} disabled={!online}>
                <Navigation className="h-5 w-5" /> Detect My Location
              </Button>
              {!online && (
                <p className="mt-3 text-xs text-destructive">GPS lookup is unavailable while offline.</p>
              )}
            </div>
          )}

          {state === "loading" && (
            <div className="flex flex-col items-center py-10 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">Acquiring GPS signal...</p>
            </div>
          )}

          {state === "success" && coord && match && (
            <div className="space-y-5">
              <Alert className="border-success/50 bg-success/10">
                <MapPin className="h-4 w-4" />
                <AlertTitle>Location detected</AlertTitle>
                <AlertDescription>
                  Coordinates: {coord.lat.toFixed(4)}, {coord.lng.toFixed(4)}. Accuracy +/-{Math.round(coord.acc)}m.
                </AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground">
                Nearest post office is approximately {Math.round(match.distance).toLocaleString()}m from your detected location.
              </p>
              <PostcodeResultCard p={match.postcode} />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Field k="Division" v={match.postcode.division} />
                <Field k="District" v={match.postcode.district} />
                <Field k="Upazila" v={match.postcode.upazila} />
                <Field k="Area" v={match.postcode.area} />
                <Field k="Post Office" v={match.postcode.postOffice} />
                <Field k="Postcode" v={match.postcode.postcode} />
              </div>
              <div className="flex gap-2">
                <Button onClick={reset}>Try again</Button>
                <Link to="/map" search={{ postcodeId: match.postcode.id }}>
                  <Button variant="outline">View on Map</Button>
                </Link>
              </div>
            </div>
          )}

          {state === "denied" && (
            <ErrorState
              icon={ShieldX}
              title="Location access denied"
              desc="You blocked location permission. You can still find your postcode using manual search."
              onRetry={reset}
            />
          )}

          {state === "weak" && (
            <ErrorState
              icon={SignalLow}
              title="Weak GPS signal"
              desc="We couldn't get a precise location fix. Try moving outdoors, or switch to manual search."
              onRetry={reset}
            />
          )}

          {state === "outside" && (
            <ErrorState
              icon={AlertTriangle}
              title="GPS lookup unavailable"
              desc="This browser or location could not be matched to a postcode record. Manual search is available nationwide."
              onRetry={reset}
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

function ErrorState({
  icon: Icon,
  title,
  desc,
  onRetry,
}: {
  icon: typeof Navigation;
  title: string;
  desc: string;
  onRetry: () => void;
}) {
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
