import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip, Pane, useMap } from "react-leaflet";
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

// Map legacy names to new standard names if necessary
const NAME_MAPPING: Record<string, string> = {
  "Chittagong": "Chattogram",
  "Barisal": "Barishal",
};

function resolveColor(v: string) {
  if (typeof window === "undefined") return v;
  if (!v.startsWith("var(")) return v;
  const name = v.slice(4, -1).trim();
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#3b82f6";
}

function norm(s: string) {
  if (!s) return "";
  const clean = s.toLowerCase()
    .replace(/\bupazila\b/g, "")
    .replace(/\bthana\b/g, "")
    .replace(/[^a-z0-9]/g, "");
  
  if (NAME_MAPPING[s]) {
    return NAME_MAPPING[s].toLowerCase().replace(/[^a-z0-9]/g, "");
  }
  return clean;
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
};

function FitToLayer({ trigger }: { trigger: L.LatLngBounds | null }) {
  const map = useMap();
  useEffect(() => {
    if (trigger && trigger.isValid()) {
      map.flyToBounds(trigger, { padding: [20, 20], duration: 0.6, maxZoom: 13 });
    }
  }, [trigger, map]);
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
  const [districtGeoJSON, setDistrictGeoJSON] = useState<FeatureCollection | null>(null);
  const [selectedUpazilaGeoJSON, setSelectedUpazilaGeoJSON] = useState<FeatureCollection | null>(null);
  const upazilaGeoRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    setDistrictGeoJSON(districtsData as FeatureCollection);
  }, []);

  useEffect(() => {
    if (!highlightUpazila) {
      setSelectedUpazilaGeoJSON(null);
      return;
    }

    const matches = (upazilasData as FeatureCollection).features.filter((f) => {
      const name = f.properties?.ADM3_EN || "";
      const dist = f.properties?.ADM2_EN || "";
      
      // Match upazila name, and if highlightDistrict is provided, ensure it matches too to avoid duplicates (e.g. Mirpur)
      const nameMatch = norm(name) === norm(highlightUpazila);
      if (highlightDistrict) {
        return nameMatch && norm(dist) === norm(highlightDistrict);
      }
      return nameMatch;
    });

    if (matches.length > 0) {
      setSelectedUpazilaGeoJSON({ type: "FeatureCollection", features: matches });
    } else {
      setSelectedUpazilaGeoJSON(null);
    }
  }, [highlightUpazila, highlightDistrict]);

  useEffect(() => {
    if (upazilaGeoRef.current) {
      upazilaGeoRef.current.bringToFront();
    }
  }, [selectedUpazilaGeoJSON]);

  const focusBounds = useMemo<L.LatLngBounds | null>(() => {
    if (highlightUpazila && selectedUpazilaGeoJSON) {
      const layer = L.geoJSON(selectedUpazilaGeoJSON);
      return layer.getBounds();
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
    const layer = L.geoJSON({ type: "FeatureCollection", features: matches } as FeatureCollection);
    return layer.getBounds();
  }, [districtGeoJSON, highlight, highlightDistrict, highlightUpazila, selectedUpazilaGeoJSON, marker]);

  const styleDistrict = (feature?: Feature<Geometry, any>) => {
    const division = feature?.properties?.ADM1_EN ?? "";
    const district = feature?.properties?.ADM2_EN ?? "";
    const color = resolveColor(DIVISION_COLORS[division] || DIVISION_COLORS[NAME_MAPPING[division]] || "#3b82f6");

    const isDistMatch = highlightDistrict && norm(district) === norm(highlightDistrict);
    const isDivMatch = highlight && norm(division) === norm(highlight);

    if (highlightUpazila) {
      return {
        color: "#64748b",
        weight: 0.4,
        opacity: 0.25,
        fillColor: "#e2e8f0",
        fillOpacity: layer === "satellite" ? 0.05 : 0.1,
      };
    }

    let dim = (highlightDistrict && !isDistMatch) || (highlight && !highlightDistrict && !isDivMatch);

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
      fillOpacity: layer === "boundary" ? 0.15 : isDistMatch ? 0.7 : isFocus ? 0.5 : 0.35,
    };
  };

  const styleUpazila = (feature?: Feature<Geometry, any>) => {
    const division = feature?.properties?.ADM1_EN || "";
    const color = resolveColor(DIVISION_COLORS[division] || "#3b82f6");

    return {
      color: layer === "satellite" ? "#ffffff" : "#dc2626",
      weight: 3,
      opacity: 1,
      fillColor: layer === "satellite" ? color : "#facc15",
      fillOpacity: 0.6,
      dashArray: "5 5",
      pane: "upazila-pane",
    };
  };

  const tile = TILE_CONFIG[layer];

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
        <FitToLayer trigger={focusBounds} />
        
        <Pane name="district-pane" style={{ zIndex: 400 }}>
          {districtGeoJSON && (
            <GeoJSON
              key={`${layer}-${highlight}-${highlightDistrict}-${highlightUpazila}`}
              data={districtGeoJSON}
              style={styleDistrict as any}
              onEachFeature={(feature, lyr) => {
                const div = feature.properties?.ADM1_EN || "";
                const dist = feature.properties?.ADM2_EN || "";
                lyr.bindTooltip(`<strong>${dist}</strong><br/>${div} Division`, { sticky: true });
                lyr.on({
                  click: () => onSelect?.(div, dist),
                  mouseover: (e) => {
                    const t = e.target as L.Path;
                    t.setStyle({ weight: 2, fillOpacity: 0.7 });
                    t.bringToFront();
                  },
                  mouseout: (e) => {
                    const t = e.target as L.Path;
                    t.setStyle(styleDistrict(feature) as any);
                  }
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
              key={`upazila-${highlightUpazila}-${highlightDistrict}`}
              data={selectedUpazilaGeoJSON}
              style={styleUpazila as any}
              onEachFeature={(feature, lyr) => {
                const upa = feature.properties?.ADM3_EN || "";
                const dist = feature.properties?.ADM2_EN || "";
                lyr.bindTooltip(`<strong>${upa}</strong><br/>${dist} District`, { sticky: true });
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
                pathOptions={{ color: resolveColor("var(--primary)"), weight: 2, fillOpacity: 0.1 }}
                pane="marker-pane"
              />
              <CircleMarker
                center={[marker.lat, marker.lng]}
                radius={6}
                pathOptions={{ color: "#fff", weight: 2, fillColor: resolveColor("var(--primary)"), fillOpacity: 1 }}
                pane="marker-pane"
              >
                {marker.label && <Tooltip permanent direction="top" offset={[0, -8]}>{marker.label}</Tooltip>}
              </CircleMarker>
            </>
          )}
        </Pane>

        <FitToLayer trigger={focusBounds} />
      </MapContainer>
    </div>
  );
}
