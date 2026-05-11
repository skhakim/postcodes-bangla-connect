import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip, useMap } from "react-leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

// Normalize district names so e.g. "Chattogram" matches "Chittagong" between datasets
function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z]/g, "");
}
const DISTRICT_ALIASES: Record<string, string> = {
  chittagong: "chattogram",
  barisal: "barishal",
  jessore: "jashore",
  bogra: "bogura",
  comilla: "cumilla",
};
function nd(s: string) {
  const n = norm(s);
  return DISTRICT_ALIASES[n] ?? n;
}

type Props = {
  onSelect?: (division: string, district?: string) => void;
  highlight?: string; // division name
  highlightDistrict?: string;
  marker?: { lat: number; lng: number; label?: string } | null;
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

function FitToLayer({ trigger }: { trigger: L.LatLngBounds | null }) {
  const map = useMap();
  useEffect(() => {
    if (trigger && trigger.isValid()) {
      map.flyToBounds(trigger, { padding: [20, 20], duration: 0.6, maxZoom: 11 });
    }
  }, [trigger, map]);
  return null;
}

export default function BangladeshMapInner({
  onSelect,
  highlight,
  highlightDistrict,
  marker,
  layer = "standard",
  className,
}: Props) {
  const [data, setData] = useState<FeatureCollection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const geoRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
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

  const tile = TILE_CONFIG[layer];

  const focusBounds = useMemo<L.LatLngBounds | null>(() => {
    if (!data) return null;
    if (marker) {
      return L.latLngBounds([
        [marker.lat - 0.15, marker.lng - 0.15],
        [marker.lat + 0.15, marker.lng + 0.15],
      ]);
    }
    if (!highlight && !highlightDistrict) return null;
    const matches = data.features.filter((f) => {
      const div = (f.properties as any)?.ADM1_EN ?? "";
      const dist = (f.properties as any)?.ADM2_EN ?? "";
      if (highlightDistrict) return nd(dist) === nd(highlightDistrict);
      return nd(div) === nd(highlight ?? "");
    });
    if (!matches.length) return null;
    const layer = L.geoJSON({ type: "FeatureCollection", features: matches } as FeatureCollection);
    return layer.getBounds();
  }, [data, highlight, highlightDistrict, marker]);

  const styleFeature = (feature?: Feature<Geometry, { ADM1_EN?: string; ADM2_EN?: string }>) => {
    const division = feature?.properties?.ADM1_EN ?? "";
    const district = feature?.properties?.ADM2_EN ?? "";
    const color = resolveColor(DIVISION_COLORS[division] ?? "#3b82f6");

    const districtMatch = highlightDistrict && nd(district) === nd(highlightDistrict);
    const divisionMatch = highlight && nd(division) === nd(highlight);

    // Dimming logic
    let dim = false;
    if (highlightDistrict) {
      dim = !districtMatch;
    } else if (highlight) {
      dim = !divisionMatch;
    }

    if (dim) {
      return {
        color: "#9ca3af",
        weight: 0.3,
        opacity: 0.4,
        fillColor: "#cbd5e1",
        fillOpacity: 0.08,
      };
    }

    const isFocus = districtMatch || (!highlightDistrict && divisionMatch);
    return {
      color: layer === "satellite" ? "#ffffff" : "#1f2937",
      weight: districtMatch ? 2.5 : isFocus ? 1.5 : 0.6,
      opacity: 0.95,
      fillColor: color,
      fillOpacity: layer === "boundary" ? 0.2 : districtMatch ? 0.75 : isFocus ? 0.55 : 0.4,
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
        maxZoom={13}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", background: "transparent" }}
      >
        <TileLayer url={tile.url} attribution={tile.attribution} />
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 text-sm text-destructive">
            Failed to load boundaries: {error}
          </div>
        )}
        {data && (
          <GeoJSON
            ref={geoRef as any}
            key={`${layer}-${highlight}-${highlightDistrict}`}
            data={data}
            style={styleFeature as L.StyleFunction}
            onEachFeature={onEach}
          />
        )}
        {marker && (
          <>
            <CircleMarker
              center={[marker.lat, marker.lng]}
              radius={18}
              pathOptions={{ color: resolveColor("var(--primary)"), weight: 2, fillOpacity: 0.15 }}
            />
            <CircleMarker
              center={[marker.lat, marker.lng]}
              radius={6}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                fillColor: resolveColor("var(--primary)"),
                fillOpacity: 1,
              }}
            >
              {marker.label && (
                <Tooltip permanent direction="top" offset={[0, -8]}>
                  {marker.label}
                </Tooltip>
              )}
            </CircleMarker>
          </>
        )}
        <FitToLayer trigger={focusBounds} />
      </MapContainer>
    </div>
  );
}
