import { lazy, Suspense, useEffect, useState } from "react";

const Inner = lazy(() => import("./BangladeshMapInner"));

export type BangladeshMapProps = {
  onSelect?: (division: string, district?: string) => void;
  highlight?: string;
  highlightDistrict?: string;
  highlightUpazila?: string;
  marker?: { lat: number; lng: number; label?: string } | null;
  layer?: "standard" | "satellite" | "boundary";
  className?: string;
};

function Placeholder({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="flex h-full w-full items-center justify-center bg-muted/40 text-sm text-muted-foreground">
        Loading map…
      </div>
    </div>
  );
}

// Client-only wrapper so Leaflet (which touches `window` at module load) never runs during SSR.
export function BangladeshMap(props: BangladeshMapProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <Placeholder className={props.className} />;
  return (
    <Suspense fallback={<Placeholder className={props.className} />}>
      <Inner {...props} />
    </Suspense>
  );
}
