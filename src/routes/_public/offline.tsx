import { createFileRoute } from "@tanstack/react-router";
import { Wifi, WifiOff, History } from "lucide-react";
import { useOnline } from "@/lib/online";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { postcodes } from "@/data/postcodes";

export const Route = createFileRoute("/_public/offline")({
  component: OfflinePage,
  head: () => ({ meta: [{ title: "Offline Mode — IPMS" }] }),
});

function OfflinePage() {
  const { online, setOnline } = useOnline();
  const cached = postcodes.slice(0, 6);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Offline Mode</h1>
        <p className="mt-1 text-muted-foreground">Demonstrate how IPMS behaves with no internet connectivity.</p>
      </div>

      <Card className="mb-6">
        <CardContent className="flex items-center justify-between p-5">
          <div className="flex items-center gap-3">
            {online ? <Wifi className="h-5 w-5 text-success" /> : <WifiOff className="h-5 w-5 text-destructive" />}
            <div>
              <div className="font-semibold">{online ? "You are online" : "You are offline"}</div>
              <div className="text-xs text-muted-foreground">Toggle to simulate connectivity changes.</div>
            </div>
          </div>
          <Switch checked={online} onCheckedChange={setOnline} />
        </CardContent>
      </Card>

      {!online && (
        <Alert variant="destructive" className="mb-6">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>You are offline</AlertTitle>
          <AlertDescription>Showing cached results only. GPS and Live Map are unavailable.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><History className="h-4 w-4" /> Recent cached searches</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {cached.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <div>
                <div className="font-semibold text-primary">{p.postcode}</div>
                <div className="text-xs text-muted-foreground">{p.area} · {p.district}</div>
              </div>
              <span className="text-xs text-muted-foreground">cached</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
