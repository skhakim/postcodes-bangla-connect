import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  CircleMarker,
  Tooltip,
  Pane,
  useMap,
} from "react-leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import districtsData from "../../data/districts.geojson.json";
import upazilasData from "../../data/upazilas.geojson.json";

const DIVISION_COLORS: Record<string, string> = {
  Dhaka: "var(--chart-1)",
  Chattogram: "var(--chart-2)",
  Sylhet: "var(--chart-3)",
  Khulna: "var(--chart-3)",
  Rajshahi: "var(--chart-4)",
  Barishal: "var(--chart-4)",
  Rangpur: "var(--chart-5)",
  Mymensingh: "var(--chart-5)",
};

function norm(s: string) {
  if (!s) return "";
  return s
    .toLowerCase()
    .replace(/\bupazila\b/g, "")
    .replace(/\bthana\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function resolveColor(v: string) {
  if (typeof window === "undefined") return v;
  if (!v.startsWith("var(")) return v;

  const name = v.slice(4, -1).trim();
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    "#3b82f6"
  );
}

function getDivisionColor(division: string) {
  return DIVISION_COLORS[division] || "#3b82f6";
}

type Props = {
  onSelect?: (division: string, district?: string) => void;
  highlight?: string;
  highlightDistrict?: string;
  highlightUpazila?: string;
  marker?: { lat: number; lng: number; label?: string } | null;
  layer?: "standard" | "satellite" | "boundary";
  className?: string;
};

const TILE_CONFIG = {
  standard: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; OpenStreetMap contributors',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
  boundary: {
    url: "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
    attribution: '&copy; CARTO &copy; OpenStreetMap',
  },
} as const;

function FitToLayer({
  trigger,
  onReady,
}: {
  trigger: L.LatLngBounds | null;
  onReady?: () => void;
}) {
  const map = useMap();
  const readyReportedRef = useRef(false);

  useEffect(() => {
    if (!trigger || !trigger.isValid()) return;

    map.stop();
    map.flyToBounds(trigger, {
      padding: [20, 20],
      duration: 0.6,
      maxZoom: 13,
    });
  }, [trigger, map]);

  useEffect(() => {
    if (!onReady) return;

    const reportReady = () => {
      if (readyReportedRef.current) return;
      readyReportedRef.current = true;
      onReady();
    };

    map.on("load", reportReady);

    if (map.getBounds().isValid()) {
      reportReady();
    }

    return () => {
      map.off("load", reportReady);
    };
  }, [map, onReady]);

  return null;
}

export default function BangladeshMapInner({
  onSelect,
  highlight,
  highlightDistrict,
  highlightUpazila,
  marker,
  layer = "standard",
  className,
}: Props) {
  const [districtGeoJSON, setDistrictGeoJSON] =
    useState<FeatureCollection | null>(null);
  const upazilaGeoRef = useRef<L.GeoJSON | null>(null);
  const [status, setStatus] = useState<"loading" | "loaded">("loading");

  useEffect(() => {
    setDistrictGeoJSON(districtsData as FeatureCollection);
  }, []);

  const handleMapReady = useCallback(() => {
    setStatus("loaded");
  }, []);

  const selectedUpazilaGeoJSON = useMemo<FeatureCollection | null>(() => {
    if (!highlightUpazila) return null;

    const matches = (upazilasData as FeatureCollection).features.filter((f) => {
      const name = f.properties?.ADM3_EN || "";
      const dist = f.properties?.ADM2_EN || "";
      const div = f.properties?.ADM1_EN || "";

      const nameMatch = norm(name) === norm(highlightUpazila);
      const distMatch =
        !highlightDistrict || norm(dist) === norm(highlightDistrict);
      const divMatch = !highlight || norm(div) === norm(highlight);

      return nameMatch && distMatch && divMatch;
    });

    return matches.length > 0
      ? { type: "FeatureCollection", features: matches }
      : null;
  }, [highlightUpazila, highlightDistrict, highlight]);

  const focusBounds = useMemo<L.LatLngBounds | null>(() => {
    if (highlightUpazila && selectedUpazilaGeoJSON) {
      const geoJsonLayer = L.geoJSON(selectedUpazilaGeoJSON);
      return geoJsonLayer.getBounds();
    }

    if (marker) {
      return L.latLngBounds([
        [marker.lat - 0.1, marker.lng - 0.1],
        [marker.lat + 0.1, marker.lng + 0.1],
      ]);
    }

    if (!districtGeoJSON || (!highlight && !highlightDistrict)) return null;

    const matches = districtGeoJSON.features.filter((f) => {
      const div = f.properties?.ADM1_EN || "";
      const dist = f.properties?.ADM2_EN || "";

      if (highlightDistrict) return norm(dist) === norm(highlightDistrict);
      return norm(div) === norm(highlight || "");
    });

    if (!matches.length) return null;

    const geoJsonLayer = L.geoJSON({
      type: "FeatureCollection",
      features: matches,
    } as FeatureCollection);

    return geoJsonLayer.getBounds();
  }, [
    districtGeoJSON,
    highlight,
    highlightDistrict,
    highlightUpazila,
    selectedUpazilaGeoJSON,
    marker,
  ]);

  const styleDistrict = useCallback(
    (feature?: Feature<Geometry, any>) => {
      const division = feature?.properties?.ADM1_EN ?? "";
      const district = feature?.properties?.ADM2_EN ?? "";
      const color = resolveColor(getDivisionColor(division));

      const isDistMatch =
        !!highlightDistrict && norm(district) === norm(highlightDistrict);
      const isDivMatch = !!highlight && norm(division) === norm(highlight);

      if (highlightUpazila) {
        return {
          color: "#64748b",
          weight: 0.4,
          opacity: 0.25,
          fillColor: "#e2e8f0",
          fillOpacity: layer === "satellite" ? 0.05 : 0.1,
        };
      }

      const dim =
        (!!highlightDistrict && !isDistMatch) ||
        (!!highlight && !highlightDistrict && !isDivMatch);

      if (dim) {
        return {
          color: "#9ca3af",
          weight: 0.3,
          opacity: 0.4,
          fillColor: "#cbd5e1",
          fillOpacity: 0.08,
        };
      }

      const isFocus = isDistMatch || (!highlightDistrict && isDivMatch);

      return {
        color: layer === "satellite" ? "#ffffff" : "#1f2937",
        weight: isDistMatch ? 2.5 : isFocus ? 1.5 : 0.6,
        opacity: 0.9,
        fillColor: color,
        fillOpacity:
          layer === "boundary"
            ? 0.15
            : isDistMatch
              ? 0.7
              : isFocus
                ? 0.5
                : 0.35,
      };
    },
    [highlight, highlightDistrict, highlightUpazila, layer],
  );

  const styleUpazila = useCallback(
    (feature?: Feature<Geometry, any>) => {
      const division = feature?.properties?.ADM1_EN || "";
      const color = resolveColor(getDivisionColor(division));

      return {
        color: layer === "satellite" ? "#ffffff" : "#dc2626",
        weight: 4,
        opacity: 1,
        fillColor: layer === "satellite" ? color : "#facc15",
        fillOpacity: 0.6,
        dashArray: "8, 8",
      };
    },
    [layer],
  );

  const tile = TILE_CONFIG[layer];

  return (
    <div className={`relative ${className ?? ""}`}>
      <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm transition-all animate-in fade-in slide-in-from-top-2">
        <div
          className={`h-2 w-2 rounded-full ${
            status === "loading"
              ? "bg-amber-500 animate-pulse"
              : "bg-emerald-500"
          }`}
        />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          {status === "loading" ? "Loading Data..." : "Map Live"}
        </span>
      </div>

      <MapContainer
        center={[23.685, 90.3563]}
        zoom={7}
        minZoom={6}
        maxZoom={13}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", background: "transparent" }}
      >
        <TileLayer url={tile.url} attribution={tile.attribution} />

        <FitToLayer trigger={focusBounds} onReady={handleMapReady} />

        <Pane name="district-pane" style={{ zIndex: 400 }}>
          {districtGeoJSON && (
            <GeoJSON
              key={`district-${layer}-${highlight ?? ""}-${
                highlightDistrict ?? ""
              }-${highlightUpazila ?? ""}`}
              data={districtGeoJSON}
              style={styleDistrict as any}
              onEachFeature={(feature, lyr) => {
                const div = feature.properties?.ADM1_EN || "";
                const dist = feature.properties?.ADM2_EN || "";

                lyr.bindTooltip(`<strong>${dist}</strong><br/>${div} Division`, {
                  sticky: true,
                });

                lyr.on({
                  click: () => {
                    onSelect?.(div, dist);
                  },
                  mouseover: (e) => {
                    const target = e.target as L.Path;
                    target.setStyle({ weight: 2, fillOpacity: 0.7 });
                    target.bringToFront();
                  },
                  mouseout: (e) => {
                    const target = e.target as L.Path;
                    target.setStyle(styleDistrict(feature) as any);
                  },
                });
              }}
              pane="district-pane"
            />
          )}
        </Pane>

        <Pane name="upazila-pane" style={{ zIndex: 600 }}>
          {selectedUpazilaGeoJSON && (
            <GeoJSON
              ref={upazilaGeoRef as any}
              key={`upazila-${highlight ?? ""}-${highlightDistrict ?? ""}-${
                highlightUpazila ?? ""
              }-${layer}`}
              data={selectedUpazilaGeoJSON}
              style={styleUpazila as any}
              onEachFeature={(feature, lyr) => {
                const upa = feature.properties?.ADM3_EN || "";
                const dist = feature.properties?.ADM2_EN || "";

                lyr.bindTooltip(`<strong>${upa}</strong><br/>${dist} District`, {
                  sticky: true,
                });
              }}
              pane="upazila-pane"
            />
          )}
        </Pane>

        <Pane name="marker-pane" style={{ zIndex: 700 }}>
          {marker && (
            <>
              <CircleMarker
                center={[marker.lat, marker.lng]}
                radius={15}
                pathOptions={{
                  color: resolveColor("var(--primary)"),
                  weight: 2,
                  fillOpacity: 0.1,
                }}
                pane="marker-pane"
              />

              <CircleMarker
                center={[marker.lat, marker.lng]}
                radius={6}
                pathOptions={{
                  color: "#fff",
                  weight: 2,
                  fillColor: resolveColor("var(--primary)"),
                  fillOpacity: 1,
                }}
                pane="marker-pane"
              >
                {marker.label && (
                  <Tooltip permanent direction="top" offset={[0, -8]}>
                    {marker.label}
                  </Tooltip>
                )}
              </CircleMarker>
            </>
          )}
        </Pane>
      </MapContainer>
    </div>
  );
}