import { useEffect, useMemo, useRef, useState } from "react";
import osmtogeojson from "osmtogeojson";
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip, Pane, useMap } from "react-leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import districtsData from "../../data/districts.geojson.json";

// Overpass API endpoint for fetching upazila boundaries from OpenStreetMap
const OVERPASS_API = "https://overpass-api.de/api/interpreter";

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

function escapeOverpassString(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function cleanUpazilaName(name: string) {
  return name
    .replace(/\bUpazila\b/gi, "")
    .replace(/\bThana\b/gi, "")
    .replace(/\s+of\s+.+$/i, "")
    .replace(/,\s*.+$/i, "")
    .trim();
}

function normalizeUpazilaName(name: string) {
  return cleanUpazilaName(name).toLowerCase().replace(/[^a-z]/g, "");
}

function getFeatureTags(feature?: Feature<Geometry, any>) {
  const props = feature?.properties ?? {};
  return props.tags ?? props;
}

function getUpazilaName(feature?: Feature<Geometry, any>) {
  const tags = getFeatureTags(feature);
  return tags["name:en"] || tags.name || feature?.properties?.name || feature?.properties?.ADM3_EN || "";
}

function getDistrictName(feature?: Feature<Geometry, any>) {
  const tags = getFeatureTags(feature);
  return tags["addr:district"] || tags.district || feature?.properties?.ADM2_EN || "";
}

function getDivisionName(feature?: Feature<Geometry, any>) {
  const tags = getFeatureTags(feature);
  return tags["addr:state"] || tags.division || feature?.properties?.ADM1_EN || "";
}

const UPAZILA_NAME_ALIASES: Record<string, string[]> = {
  // The official/OSM spelling is usually "Alfadanga", while users often type "Alphadanga".
  alphadanga: ["Alfadanga"],
};

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean).map((v) => v.trim()).filter(Boolean)));
}

function getUpazilaSearchVariants(upazilaName: string) {
  const cleaned = cleanUpazilaName(upazilaName);
  const aliasNames = UPAZILA_NAME_ALIASES[normalizeUpazilaName(cleaned)] ?? [];
  const baseNames = unique([cleaned, ...aliasNames]);

  return unique(
    baseNames.flatMap((name) => [
      name,
      `${name} Upazila`,
      `${name} Thana`,
    ])
  );
}

function upazilaNamesMatch(candidate: string, target: string) {
  const acceptedNames = getUpazilaSearchVariants(target).map(normalizeUpazilaName);
  return acceptedNames.includes(normalizeUpazilaName(candidate));
}

function buildNameClauses(upazilaName: string) {
  const variants = getUpazilaSearchVariants(upazilaName);

  return variants
    .flatMap((name) => {
      const safe = escapeOverpassString(name);
      return [
        `relation(area.bd)["boundary"="administrative"]["admin_level"="6"]["name"="${safe}"];`,
        `relation(area.bd)["boundary"="administrative"]["admin_level"="6"]["name:en"="${safe}"];`,
      ];
    })
    .join("\n  ");
}

// Helper function to build Overpass query for fetching upazila boundaries
function buildUpazilaQuery(upazilaName: string): string {
  // Deliberately avoid regex here. Exact-name clauses are less fragile and avoid
  // Overpass HTTP 400 parser errors caused by regex syntax/escaping.
  return `[out:json][timeout:25];
area["ISO3166-1"="BD"]["admin_level"="2"]->.bd;
(
  ${buildNameClauses(upazilaName)}
);
out body geom;`;
}

function buildUpazilaQueryWithoutArea(upazilaName: string): string {
  const variants = getUpazilaSearchVariants(upazilaName);
  const clauses = variants
    .flatMap((name) => {
      const safe = escapeOverpassString(name);
      return [
        `relation["boundary"="administrative"]["admin_level"="6"]["name"="${safe}"];`,
        `relation["boundary"="administrative"]["admin_level"="6"]["name:en"="${safe}"];`,
      ];
    })
    .join("\n  ");

  return `[out:json][timeout:25];
(
  ${clauses}
);
out body geom;`;
}

async function runOverpassQuery(query: string, signal: AbortSignal) {
  const response = await fetch(OVERPASS_API, {
    method: "POST",
    body: "data=" + encodeURIComponent(query),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    signal,
  });

  if (!response.ok) {
    const rawDetails = await response.text().catch(() => "");
    const details = rawDetails.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    throw new Error(
      `HTTP ${response.status} from Overpass API${details ? `: ${details.slice(0, 500)}` : ""}`
    );
  }

  return response.json();
}

// Convert Overpass API response to GeoJSON format
async function fetchUpazilaGeoJSON(upazilaName: string): Promise<FeatureCollection | null> {
  const query = buildUpazilaQuery(upazilaName);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    console.log(`Overpass query for "${upazilaName}":`, query);

    let data;

    try {
      data = await runOverpassQuery(query, controller.signal);
    } catch (firstError) {
      const firstMessage = firstError instanceof Error ? firstError.message : String(firstError);

      // Fallback: if the Bangladesh area selector is rejected by a specific Overpass
      // endpoint, retry with a minimal country-wide relation query.
      if (!firstMessage.includes("HTTP 400")) {
        throw firstError;
      }

      const fallbackQuery = buildUpazilaQueryWithoutArea(upazilaName);
      console.warn("Primary Overpass query failed. Retrying with fallback query:", fallbackQuery);
      data = await runOverpassQuery(fallbackQuery, controller.signal);
    }

    clearTimeout(timeoutId);

    console.log(`Overpass response for "${upazilaName}":`, data);

    if (!data.elements || data.elements.length === 0) {
      return null;
    }

    const converted = osmtogeojson(data) as FeatureCollection;
    const polygonFeatures = converted.features.filter((feature) => {
      const geometryType = feature.geometry?.type;
      return geometryType === "Polygon" || geometryType === "MultiPolygon";
    });

    const exactMatches = polygonFeatures.filter((feature) =>
      upazilaNamesMatch(getUpazilaName(feature), upazilaName)
    );

    const features = exactMatches.length > 0 ? exactMatches : polygonFeatures;

    if (features.length === 0) {
      console.warn(`No valid geometry found for upazila: "${upazilaName}"`);
      return null;
    }

    return {
      type: "FeatureCollection",
      features,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timeout - Overpass API took too long");
    }

    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Error fetching upazila from Overpass API:", errMsg);
    throw error;
  }
}

type Props = {
  onSelect?: (division: string, district?: string) => void;
  highlight?: string; // division name
  highlightDistrict?: string;
  highlightUpazila?: string; // upazila/thana name
  marker?: { lat: number; lng: number; label?: string } | null;
  layer?: "standard" | "satellite" | "boundary";
  className?: string;
  onUpazilaMapError?: (message: string) => void; // callback for upazila fetch errors
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
  highlightUpazila,
  marker,
  layer = "standard",
  className,
  onUpazilaMapError,
}: Props) {
  const [data, setData] = useState<FeatureCollection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upazilaData, setUpazilaData] = useState<FeatureCollection | null>(null);
  const [upazilaError, setUpazilaError] = useState<string | null>(null);
  const geoRef = useRef<L.GeoJSON | null>(null);
  const upazilaGeoRef = useRef<L.GeoJSON | null>(null);

  // Keep the selected upazila visually above district/division overlays.
  useEffect(() => {
    if (upazilaGeoRef.current) {
      upazilaGeoRef.current.bringToFront();
    }
  }, [upazilaData, highlightUpazila]);

  useEffect(() => {
    let aborted = false;
    try {
      if (!aborted) setData(districtsData as FeatureCollection);
    } catch (e) {
      if (!aborted) setError(String(e));
    }
    return () => {
      aborted = true;
    };
  }, []);

  // Fetch upazila boundaries when an upazila is highlighted
  useEffect(() => {
    if (!highlightUpazila) {
      setUpazilaData(null);
      setUpazilaError(null);
      return;
    }

    let aborted = false;

    (async () => {
      try {
        const geoJSON = await fetchUpazilaGeoJSON(highlightUpazila);

        if (aborted) return;

        if (!geoJSON || geoJSON.features.length === 0) {
          setUpazilaError(`Upazila not found in OpenStreetMap: "${highlightUpazila}"`);
          setUpazilaData(null);
          onUpazilaMapError?.(
            `Map boundaries not found for upazila: ${highlightUpazila}. Please check if the upazila name is correct or if it exists in OpenStreetMap data.`
          );
        } else {
          setUpazilaData(geoJSON);
          setUpazilaError(null);
        }
      } catch (error) {
        if (!aborted) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          setUpazilaError(errorMsg);
          onUpazilaMapError?.(
            `Failed to fetch upazila boundaries: ${errorMsg}`
          );
        }
      }
    })();

    return () => {
      aborted = true;
    };
  }, [highlightUpazila, onUpazilaMapError]);

  const tile = TILE_CONFIG[layer];

  const focusBounds = useMemo<L.LatLngBounds | null>(() => {
    // Priority: upazila > marker > district > division
    if (highlightUpazila && upazilaData) {
      const layer = L.geoJSON(upazilaData as FeatureCollection);
      const bounds = layer.getBounds();
      return bounds.isValid() ? bounds : null;
    }
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
  }, [data, highlight, highlightDistrict, highlightUpazila, upazilaData, marker]);

  const styleFeature = (feature?: Feature<Geometry, { ADM1_EN?: string; ADM2_EN?: string }>) => {
    const division = feature?.properties?.ADM1_EN ?? "";
    const district = feature?.properties?.ADM2_EN ?? "";
    const color = resolveColor(DIVISION_COLORS[division] ?? "#3b82f6");

    const districtMatch = highlightDistrict && nd(district) === nd(highlightDistrict);
    const divisionMatch = highlight && nd(division) === nd(highlight);

    // When an upazila is selected, the base district/division overlay should
    // become very light. Otherwise it hides the selected upazila polygon.
    if (highlightUpazila) {
      return {
        color: "#64748b",
        weight: 0.4,
        opacity: 0.25,
        fillColor: "#e2e8f0",
        fillOpacity: layer === "satellite" ? 0.04 : 0.06,
      };
    }

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

  const styleUpazila = (feature?: Feature<Geometry, any>) => {
    const upazila = getUpazilaName(feature);
    const division = getDivisionName(feature);
    const color = resolveColor(DIVISION_COLORS[division] ?? "#3b82f6");
    const upazilaMatch = highlightUpazila && upazilaNamesMatch(upazila, highlightUpazila);

    if (!upazilaMatch) {
      return {
        color: "#9ca3af",
        weight: 0.3,
        opacity: 0.4,
        fillColor: "#cbd5e1",
        fillOpacity: 0.08,
        pane: "selected-upazila-pane",
      };
    }

    return {
      // Use a strong contrasting outline and fill so the selected upazila is
      // visible even on top of division/district color overlays.
      color: layer === "satellite" ? "#ffffff" : "#dc2626",
      weight: 4,
      opacity: 1,
      fillColor: layer === "satellite" ? color : "#facc15",
      fillOpacity: layer === "boundary" ? 0.55 : 0.62,
      dashArray: "6 3",
      pane: "selected-upazila-pane",
    };
  };

  const onEachUpazila = (feature: Feature<Geometry, any>, lyr: L.Layer) => {
    const upazila = getUpazilaName(feature);
    const district = getDistrictName(feature);
    const division = getDivisionName(feature);
    (lyr as L.Path).bindTooltip(
      `<strong>${upazila}</strong><br/>${district}${division ? `, ${division} Division` : ""}`,
      {
        sticky: true,
        direction: "top",
      }
    );
    lyr.on({
      mouseover: (e) => {
        const t = e.target as L.Path;
        t.setStyle({ weight: 5, fillOpacity: 0.72, color: layer === "satellite" ? "#ffffff" : "#b91c1c" });
        t.bringToFront();
      },
      mouseout: (e) => {
        const t = e.target as L.Path;
        t.setStyle(styleUpazila(feature) as L.PathOptions);
      },
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
        <Pane name="district-pane" style={{ zIndex: 400 }}>
          {data && (
            <GeoJSON
              ref={geoRef as any}
              key={`${layer}-${highlight}-${highlightDistrict}-${highlightUpazila ?? ""}`}
              data={data}
              style={styleFeature as L.StyleFunction}
              onEachFeature={onEach}
              pane="district-pane"
            />
          )}
        </Pane>
        <Pane name="selected-upazila-pane" style={{ zIndex: 650 }}>
          {upazilaData && (
            <GeoJSON
              ref={upazilaGeoRef as any}
              key={`upazila-${highlightUpazila}-${layer}`}
              data={upazilaData}
              style={styleUpazila as L.StyleFunction}
              onEachFeature={onEachUpazila}
              pane="selected-upazila-pane"
            />
          )}
        </Pane>
        {upazilaError && !upazilaData && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 text-sm text-destructive pointer-events-none">
            ⚠️ {upazilaError}
          </div>
        )}
        <Pane name="marker-pane" style={{ zIndex: 700 }}>
          {marker && (
            <>
              <CircleMarker
                center={[marker.lat, marker.lng]}
                radius={18}
                pathOptions={{ color: resolveColor("var(--primary)"), weight: 2, fillOpacity: 0.15 }}
                pane="marker-pane"
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
        <FitToLayer trigger={focusBounds} />
      </MapContainer>
    </div>
  );
}
