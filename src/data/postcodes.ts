import rawHierarchy from "./bangladesh_post_codes_hierarchical.json";

// ── Types for the hierarchical JSON ──────────────────────────────────────────
type RawPostOffice = { office_name: string; post_code: string };
type RawPoliceStation = { police_station: string; post_offices: RawPostOffice[] };
type RawDistrict = { district: string; police_stations: RawPoliceStation[] };
type RawDivision = { division: string; districts: RawDistrict[] };

// ── Postcode record type ──────────────────────────────────────────────────────
export type Postcode = {
  id: string;
  postcode: string;
  area: string;
  areaBn: string;
  postOffice: string;
  upazila: string;
  district: string;
  division: string;
  lat: number;
  lng: number;
  status: "active" | "inactive" | "pending";
  updatedAt: string;
};

// ── Derive everything from the JSON ──────────────────────────────────────────
// Single source of truth: bangladesh_post_codes_hierarchical.json
// Update the JSON file and both `postcodes` and `divisions` update automatically.

const _raw = rawHierarchy as unknown as RawDivision[];

/**
 * Flat list of all 9,800+ post office records derived from the hierarchical JSON.
 * Fields without a JSON equivalent (areaBn, lat, lng, status, updatedAt) are
 * given sensible defaults — they can be enriched later without changing this logic.
 */
export const postcodes: Postcode[] = _raw.flatMap((divObj, di) => {
  const division = divObj.division === "Chittagong" ? "Chattogram" : divObj.division;

  return divObj.districts.flatMap((distObj, disti) =>
    distObj.police_stations.flatMap((ps, psi) =>
      ps.post_offices.map((po, poi) => ({
        id: `${di}-${disti}-${psi}-${poi}`,
        postcode: po.post_code,
        area: po.office_name,
        areaBn: "",                  // not present in source data
        postOffice: po.office_name,
        upazila: ps.police_station,
        district: distObj.district,
        division,
        lat: 0,                      // not present in source data
        lng: 0,                      // not present in source data
        status: "active" as const,
        updatedAt: "",
      }))
    )
  );
});

/**
 * Hierarchical lookup: divisions[division][district] → string[] of upazilas/thanas.
 * Derived live from the same JSON — never hardcoded.
 * Pre-sorted for performance.
 */
export const divisions: Record<string, Record<string, string[]>> = Object.fromEntries(
  _raw.map((divObj) => {
    // Normalise legacy "Chittagong" spelling present in the source data
    const divName = divObj.division === "Chittagong" ? "Chattogram" : divObj.division;

    const districtMap = Object.fromEntries(
      divObj.districts.map((distObj) => [
        distObj.district,
        distObj.police_stations.map((ps) => ps.police_station).sort(),
      ])
    );

    return [divName, districtMap];
  })
);

// ── Pre-computed caches for fast lookup ────────────────────────────────────────
/**
 * Sorted list of all divisions. Computed once at module load.
 * Avoids repeated sorting in components.
 */
const _sortedDivisions = Object.keys(divisions).sort();

/**
 * Cache of sorted district lists by division.
 * Computed once at module load to avoid repeated sorting.
 */
const _sortedDistrictCache = Object.fromEntries(
  Object.entries(divisions).map(([div, dists]) => [
    div,
    Object.keys(dists).sort(),
  ])
);

/**
 * Cache of sorted postcode lists by division+district.
 * Computed once at module load to improve dropdown performance.
 */
const _sortedPostcodeCache = new Map<string, Postcode[]>();
_raw.forEach((divObj, di) => {
  const division = divObj.division === "Chittagong" ? "Chattogram" : divObj.division;
  divObj.districts.forEach((distObj) => {
    const key = `${division}|${distObj.district}`;
    const districtPostcodes = postcodes.filter(
      (p) => p.division === division && p.district === distObj.district
    );
    districtPostcodes.sort((a, b) => (a.postcode ?? "").localeCompare(b.postcode ?? ""));
    _sortedPostcodeCache.set(key, districtPostcodes);
  });
});

// ── Fast-path helper functions ─────────────────────────────────────────────────
/**
 * Get sorted division names. O(1) — pre-computed at module load.
 */
export function getDivisions(): string[] {
  return _sortedDivisions;
}

/**
 * Get sorted district names for a division. O(1) — pre-computed at module load.
 */
export function getDistricts(division: string): string[] {
  return _sortedDistrictCache[division] ?? [];
}

/**
 * Get sorted upazila/thana names for a division+district. O(1) — pre-computed at module load.
 */
export function getUpazilas(division: string, district: string): string[] {
  return divisions[division]?.[district] ?? [];
}

/**
 * Get sorted postcodes for a division+district. O(1) — pre-computed at module load.
 */
export function getPostcodes(division: string, district: string): Postcode[] {
  return _sortedPostcodeCache.get(`${division}|${district}`) ?? [];
}
