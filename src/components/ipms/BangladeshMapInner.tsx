import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, LayersControl } from "react-leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Real Bangladesh district polygons from OpenStreetMap-derived dataset
// (nuhil/bangladesh-geocode, ADM1/ADM2 boundaries). Loaded at runtime.
const DISTRICTS_URL =
  "https://raw.githubusercontent.com/nuhil/bangladesh-geocode/master/geojson/districts.geojson";

const DIVISION_COLORS: Record<string, string> = {
  Dhaka: "var(--chart-1)",
  Chattogram: "var(--chart-2)",
  Chittagong: "var(--chart-2)",
  Sylhet: "var(--chart-3)",
  Khulna: "var(--chart-3)",
  Rajshahi: "var(--chart-4)",
  Barishal: "var(--chart-4)",
  Barisal: "var(--chart-4)",
  Rangpur: "var(--chart-5)",
  Mymensingh: "var(--chart-5)",
};

function resolveColor(v: string) {
  if (typeof window === "undefined") return v;
  if (!v.startsWith("var(")) return v;
  const name = v.slice(4, -1).trim();
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#3b82f6";
}

type Props = {
  onSelect?: (division: string, district?: string) => void;
  highlight?: string; // division name
  layer?: "standard" | "satellite" | "boundary";
  className?: string;
};

const TILE_CONFIG = {
  standard: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics",
  },
  boundary: {
    url: "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
  },
};

export function BangladeshMap({ onSelect, highlight, layer = "standard", className }: Props) {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<FeatureCollection | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    let aborted = false;
    fetch(DISTRICTS_URL)
      .then((r) => r.json())
      .then((j) => {
        if (!aborted) setData(j as FeatureCollection);
      })
      .catch((e) => !aborted && setError(String(e)));
    return () => {
      aborted = true;
    };
  }, []);

  if (!mounted) {
    return (
      <div className={className}>
        <div className="flex h-full w-full items-center justify-center bg-muted/40 text-sm text-muted-foreground">
          Loading map…
        </div>
      </div>
    );
  }

  const tile = TILE_CONFIG[layer];

  const styleFeature = (feature?: Feature<Geometry, { ADM1_EN?: string; ADM2_EN?: string }>) => {
    const division = feature?.properties?.ADM1_EN ?? "";
    const color = resolveColor(DIVISION_COLORS[division] ?? "#3b82f6");
    const isHighlight = highlight && division === highlight;
    return {
      color: layer === "satellite" ? "#ffffff" : "#1f2937",
      weight: isHighlight ? 2 : 0.6,
      opacity: 0.9,
      fillColor: color,
      fillOpacity: layer === "boundary" ? 0.15 : isHighlight ? 0.7 : 0.45,
    };
  };

  const onEach = (feature: Feature<Geometry, any>, lyr: L.Layer) => {
    const division = feature.properties?.ADM1_EN ?? "";
    const district = feature.properties?.ADM2_EN ?? "";
    (lyr as L.Path).bindTooltip(`<strong>${district}</strong><br/>${division} Division`, {
      sticky: true,
      direction: "top",
    });
    lyr.on({
      mouseover: (e) => {
        const t = e.target as L.Path;
        t.setStyle({ weight: 2, fillOpacity: 0.75 });
        t.bringToFront();
      },
      mouseout: (e) => {
        const t = e.target as L.Path;
        t.setStyle(styleFeature(feature) as L.PathOptions);
      },
      click: () => onSelect?.(division, district),
    });
  };

  return (
    <div className={className}>
      <MapContainer
        center={[23.685, 90.3563]}
        zoom={7}
        minZoom={6}
        maxZoom={12}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", background: "transparent" }}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name={layer === "standard" ? "Standard" : layer === "satellite" ? "Satellite" : "Boundary"}>
            <TileLayer url={tile.url} attribution={tile.attribution} />
          </LayersControl.BaseLayer>
        </LayersControl>
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 text-sm text-destructive">
            Failed to load boundaries: {error}
          </div>
        )}
        {data && (
          <GeoJSON
            key={`${layer}-${highlight}`}
            data={data}
            style={styleFeature as L.StyleFunction}
            onEachFeature={onEach}
          />
        )}
      </MapContainer>
    </div>
  );
}
