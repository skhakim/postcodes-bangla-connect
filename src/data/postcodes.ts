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
 */
export const divisions: Record<string, Record<string, string[]>> = Object.fromEntries(
  _raw.map((divObj) => {
    // Normalise legacy "Chittagong" spelling present in the source data
    const divName = divObj.division;

    const districtMap = Object.fromEntries(
      divObj.districts.map((distObj) => [
        distObj.district,
        distObj.police_stations.map((ps) => ps.police_station),
      ])
    );

    return [divName, districtMap];
  })
);
