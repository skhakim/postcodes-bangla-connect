/**
 * Unified map styling and utilities
 * Consolidates styling logic for both district and admin3 (upazila) levels
 */

import L from "leaflet";
import type { Feature, Geometry } from "geojson";

export const DIVISION_COLORS: Record<string, string> = {
  Dhaka: "var(--chart-1)",
  Chattogram: "var(--chart-2)",
  Sylhet: "var(--chart-3)",
  Khulna: "var(--chart-3)",
  Rajshahi: "var(--chart-4)",
  Barishal: "var(--chart-4)",
  Rangpur: "var(--chart-5)",
  Mymensingh: "var(--chart-5)",
};

export function resolveColor(colorVar: string): string {
  if (typeof window === "undefined") return colorVar;
  if (!colorVar.startsWith("var(")) return colorVar;

  const name = colorVar.slice(4, -1).trim();
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#3b82f6"
  );
}

export type LayerType = "standard" | "satellite" | "boundary";

export const TILE_CONFIG = {
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

export interface StyleOptions {
  layer: LayerType;
  isHighlighted: boolean;
  isDimmed: boolean;
  isDashedBorder?: boolean;
}

export interface StyleResult extends L.PathOptions {
  pane?: string;
}

/**
 * Unified styling function for all feature types
 * Handles normal, highlighted, and dimmed states consistently
 */
export function getFeatureStyle(options: StyleOptions): StyleResult {
  const {
    layer,
    isHighlighted,
    isDimmed,
    isDashedBorder = false,
  } = options;

  // Highlighted state: high visibility with strong border
  if (isHighlighted) {
    return {
      color: layer === "satellite" ? "#ffffff" : "#dc2626",
      weight: 4,
      opacity: 1,
      fillColor: layer === "satellite" ? "#facc15" : "#facc15",
      fillOpacity: layer === "boundary" ? 0.55 : 0.62,
      dashArray: isDashedBorder ? "6 3" : undefined,
    };
  }

  // Dimmed state: very light, almost hidden
  if (isDimmed) {
    return {
      color: "#9ca3af",
      weight: 0.3,
      opacity: 0.4,
      fillColor: "#cbd5e1",
      fillOpacity: 0.08,
    };
  }

  // Normal state: moderate visibility
  return {
    color: layer === "satellite" ? "#ffffff" : "#1f2937",
    weight: 1.5,
    opacity: 0.95,
    fillColor: "#3b82f6",
    fillOpacity: layer === "boundary" ? 0.2 : 0.55,
  };
}

/**
 * Get style with color injection for division-based coloring
 */
export function getFeatureStyleWithColor(
  options: StyleOptions,
  divisionColor?: string
): StyleResult {
  const baseStyle = getFeatureStyle(options);

  // Apply division color if provided and not dimmed
  if (divisionColor && !options.isDimmed && !options.isHighlighted) {
    const color = resolveColor(divisionColor);
    return {
      ...baseStyle,
      fillColor: color,
    };
  }

  return baseStyle;
}

/**
 * Get hover-over style (temporary enhancement for user interaction)
 */
export function getHoverStyle(baseStyle: L.PathOptions, layer: LayerType): L.PathOptions {
  return {
    weight: 2,
    fillOpacity: 0.75,
    color: layer === "satellite" ? "#ffffff" : "#b91c1c",
  };
}

/**
 * Create a tooltip label from feature properties
 */
export function createTooltipLabel(
  name: string,
  parent?: string,
  grandparent?: string
): string {
  const parts = [
    `<strong>${name}</strong>`,
    parent && parent,
    grandparent && `${grandparent} Division`,
  ].filter(Boolean);

  return parts.join("<br/>");
}

/**
 * Unified event handler for feature layers
 */
export interface FeatureEventHandlers {
  onMouseOver?: (layer: L.Path) => void;
  onMouseOut?: (layer: L.Path, baseStyle: L.PathOptions) => void;
  onClick?: (name: string, parentName?: string) => void;
}

export function attachFeatureEvents(
  layer: L.Layer,
  baseStyle: L.PathOptions,
  handlers: FeatureEventHandlers
): void {
  const path = layer as L.Path;

  path.on({
    mouseover: () => {
      path.setStyle({ weight: 2, fillOpacity: 0.75 });
      path.bringToFront();
      handlers.onMouseOver?.(path);
    },
    mouseout: () => {
      path.setStyle(baseStyle);
      handlers.onMouseOut?.(path, baseStyle);
    },
    click: () => {
      // Subclasses will override with actual click logic
    },
  });
}
