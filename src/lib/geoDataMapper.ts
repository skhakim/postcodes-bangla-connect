/**
 * Unified GeoJSON data mapper for Bangladesh administrative boundaries
 * Provides consistent access to properties across all admin levels (0-3)
 */

import type { Feature, Geometry } from "geojson";

export type AdminLevel = 0 | 1 | 2 | 3;

export interface AdminProperties {
  name: string;
  pcode: string;
  parentName?: string;
  parentPcode?: string;
  level: AdminLevel;
  area?: number; // sq km
  centerLat?: number;
  centerLon?: number;
}

export interface NormalizedFeature {
  feature: Feature<Geometry, any>;
  properties: AdminProperties;
}

/** Normalize strings for consistent comparison */
export function normalizeString(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w]/g, "") // Remove special chars
    .replace(/\s+/g, ""); // Remove spaces
}

/** Common name aliases across datasets */
const NAME_ALIASES: Record<string, string> = {
  chittagong: "chattogram",
  barisal: "barishal",
  jessore: "jashore",
  bogra: "bogura",
  comilla: "cumilla",
  dinajpur: "dinajpur",
};

export function resolveAlias(name: string): string {
  const normalized = normalizeString(name);
  return NAME_ALIASES[normalized] || normalized;
}

export function namesMatch(a: string, b: string): boolean {
  return resolveAlias(a) === resolveAlias(b);
}

/**
 * Extract admin properties from a feature, normalizing across different data sources
 * Handles properties from bgd_admin0, bgd_admin1, bgd_admin2, bgd_admin3
 */
export function extractAdminProperties(
  feature: Feature<Geometry, any>,
  level: AdminLevel
): AdminProperties {
  const props = feature.properties || {};
  const tags = props.tags || props;

  // Extract name - try multiple variants
  const name = 
    props.adm0_name ||
    props.adm1_name ||
    props.adm2_name ||
    props.adm3_name ||
    tags["name:en"] ||
    tags.name ||
    props.name ||
    "";

  // Extract pcode - standardized identifier
  const pcode =
    props.adm0_pcode ||
    props.adm1_pcode ||
    props.adm2_pcode ||
    props.adm3_pcode ||
    "";

  // Parent reference (for hierarchy)
  const parentPcode = level === 1 ? props.adm0_pcode : 
                      level === 2 ? props.adm1_pcode :
                      level === 3 ? props.adm2_pcode : undefined;

  const parentName = level === 1 ? props.adm0_name :
                     level === 2 ? props.adm1_name :
                     level === 3 ? props.adm2_name : undefined;

  // Area and center coordinates
  const area = props.area_sqkm || undefined;
  const centerLat = props.center_lat || undefined;
  const centerLon = props.center_lon || undefined;

  return {
    name,
    pcode,
    parentName,
    parentPcode,
    level,
    area,
    centerLat,
    centerLon,
  };
}

/**
 * Normalize a feature by extracting and standardizing properties
 */
export function normalizeFeature(
  feature: Feature<Geometry, any>,
  level: AdminLevel
): NormalizedFeature {
  return {
    feature,
    properties: extractAdminProperties(feature, level),
  };
}

/**
 * Find features matching a name at a given level
 */
export function findByName(
  features: NormalizedFeature[],
  name: string,
  level?: AdminLevel
): NormalizedFeature[] {
  return features.filter((nf) => {
    if (level !== undefined && nf.properties.level !== level) return false;
    return namesMatch(nf.properties.name, name);
  });
}

/**
 * Find feature by pcode
 */
export function findByPcode(
  features: NormalizedFeature[],
  pcode: string,
  level?: AdminLevel
): NormalizedFeature | undefined {
  return features.find((nf) => {
    if (level !== undefined && nf.properties.level !== level) return false;
    return nf.properties.pcode === pcode;
  });
}

/**
 * Get all children of a parent (by pcode)
 */
export function getChildren(
  features: NormalizedFeature[],
  parentPcode: string,
  childLevel: AdminLevel
): NormalizedFeature[] {
  return features.filter(
    (nf) => nf.properties.level === childLevel && nf.properties.parentPcode === parentPcode
  );
}

/**
 * Build hierarchy: find all features from a division down to upazila level
 */
export function getHierarchy(
  allFeatures: NormalizedFeature[],
  divisionName: string,
  districtName?: string,
  upazilaName?: string
): {
  division?: NormalizedFeature;
  district?: NormalizedFeature;
  upazila?: NormalizedFeature;
} {
  const divisions = findByName(allFeatures, divisionName, 1);
  if (!divisions.length) return {};

  const division = divisions[0];
  const result: any = { division };

  if (districtName) {
    const districts = getChildren(allFeatures, division.properties.pcode, 2).filter((d) =>
      namesMatch(d.properties.name, districtName)
    );
    if (districts.length) {
      const district = districts[0];
      result.district = district;

      if (upazilaName) {
        const upazilas = getChildren(allFeatures, district.properties.pcode, 3).filter((u) =>
          namesMatch(u.properties.name, upazilaName)
        );
        if (upazilas.length) {
          result.upazila = upazilas[0];
        }
      }
    }
  }

  return result;
}
