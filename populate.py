import argparse
import json
import os
from pathlib import Path

try:
    import psycopg
except ImportError:  # pragma: no cover - depends on local environment
    psycopg = None

try:
    import psycopg2
except ImportError:  # pragma: no cover - depends on local environment
    psycopg2 = None


# conn string
# Password: 6yjayCN5Wk:a!Te
# postgresql://postgres.lisnsbnngmmcwlodtbzj:[YOUR-PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require
DEFAULT_DATABASE_URL = (
    "postgresql://postgres.lisnsbnngmmcwlodtbzj:6yjayCN5Wk%3Aa%21Te"
    "@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require"
)

ROOT = Path(__file__).resolve().parent


def connect(database_url):
    if psycopg is not None:
        return psycopg.connect(database_url)
    if psycopg2 is not None:
        return psycopg2.connect(database_url)
    raise RuntimeError("Install a PostgreSQL driver first: pip install psycopg[binary]")


def infer_branch_type(office_name):
    name = office_name.upper()
    for branch_type in ("GPO", "HO", "EDSO", "TSO", "SO", "BO"):
        if name.endswith(f" {branch_type}") or name.endswith(f"({branch_type})"):
            return branch_type
    return None


def fetch_id(cur, query, params):
    cur.execute(query, params)
    row = cur.fetchone()
    return row[0] if row else None


def get_or_create_division(cur, name):
    existing_id = fetch_id(cur, "SELECT id FROM divisions WHERE name = %s LIMIT 1", (name,))
    if existing_id:
        return existing_id, False

    cur.execute("INSERT INTO divisions (name) VALUES (%s) RETURNING id", (name,))
    return cur.fetchone()[0], True


def get_or_create_district(cur, division_id, name):
    existing_id = fetch_id(
        cur,
        """
        SELECT id
        FROM districts
        WHERE division_id = %s AND name = %s
        LIMIT 1
        """,
        (division_id, name),
    )
    if existing_id:
        return existing_id, False

    cur.execute(
        """
        INSERT INTO districts (division_id, name)
        VALUES (%s, %s)
        RETURNING id
        """,
        (division_id, name),
    )
    return cur.fetchone()[0], True


def get_or_create_upazilla(cur, district_id, name):
    existing_id = fetch_id(
        cur,
        """
        SELECT id
        FROM upazillas
        WHERE district_id = %s AND name = %s
        LIMIT 1
        """,
        (district_id, name),
    )
    if existing_id:
        return existing_id, False

    cur.execute(
        """
        INSERT INTO upazillas (district_id, name)
        VALUES (%s, %s)
        RETURNING id
        """,
        (district_id, name),
    )
    return cur.fetchone()[0], True


def get_or_create_post_office(cur, upazilla_id, office):
    name = office["office_name"].strip()
    post_code = str(office["post_code"]).strip()

    existing_id = fetch_id(
        cur,
        """
        SELECT id
        FROM post_offices
        WHERE upazilla_id = %s AND name = %s AND post_code = %s
        LIMIT 1
        """,
        (upazilla_id, name, post_code),
    )
    if existing_id:
        return existing_id, False

    cur.execute(
        """
        INSERT INTO post_offices (upazilla_id, name, post_code, branch_type)
        VALUES (%s, %s, %s, %s)
        RETURNING id
        """,
        (upazilla_id, name, post_code, infer_branch_type(name)),
    )
    return cur.fetchone()[0], True


def execute_schema(cur, schema_path):
    cur.execute(schema_path.read_text(encoding="utf-8"))


def reset_data(cur):
    print("Resetting hierarchy tables...", flush=True)
    cur.execute(
        """
        TRUNCATE TABLE
            post_boundaries,
            post_offices,
            upazillas,
            districts,
            divisions
        RESTART IDENTITY CASCADE
        """
    )
    print("Reset complete.", flush=True)


def flatten_data(data):
    divisions = []
    districts = []
    upazillas = []
    post_offices = []
    seen_divisions = set()
    seen_districts = set()
    seen_upazillas = set()

    for division in data:
        division_name = division["division"].strip()
        if division_name not in seen_divisions:
            seen_divisions.add(division_name)
            divisions.append(division_name)

        for district in division.get("districts", []):
            district_name = district["district"].strip()
            district_key = (division_name, district_name)
            if district_key not in seen_districts:
                seen_districts.add(district_key)
                districts.append(district_key)

            for police_station in district.get("police_stations", []):
                upazilla_name = police_station["police_station"].strip()
                upazilla_key = (division_name, district_name, upazilla_name)
                if upazilla_key not in seen_upazillas:
                    seen_upazillas.add(upazilla_key)
                    upazillas.append(upazilla_key)

                for office in police_station.get("post_offices", []):
                    office_name = office["office_name"].strip()
                    post_code = str(office["post_code"]).strip()
                    post_offices.append(
                        (
                            division_name,
                            district_name,
                            upazilla_name,
                            office_name,
                            post_code,
                            infer_branch_type(office_name),
                        )
                    )

    return divisions, districts, upazillas, post_offices


def populate_after_reset(cur, data):
    divisions, districts, upazillas, post_offices = flatten_data(data)

    print(f"Inserting {len(divisions)} divisions...", flush=True)
    cur.executemany(
        "INSERT INTO divisions (name) VALUES (%s)",
        [(name,) for name in divisions],
    )
    cur.execute("SELECT id, name FROM divisions")
    division_ids = {name: row_id for row_id, name in cur.fetchall()}

    print(f"Inserting {len(districts)} districts...", flush=True)
    cur.executemany(
        "INSERT INTO districts (division_id, name) VALUES (%s, %s)",
        [(division_ids[division_name], district_name) for division_name, district_name in districts],
    )
    cur.execute(
        """
        SELECT d.id, v.name, d.name
        FROM districts d
        JOIN divisions v ON v.id = d.division_id
        """
    )
    district_ids = {
        (division_name, district_name): row_id
        for row_id, division_name, district_name in cur.fetchall()
    }

    print(f"Inserting {len(upazillas)} upazillas/police stations...", flush=True)
    cur.executemany(
        "INSERT INTO upazillas (district_id, name) VALUES (%s, %s)",
        [
            (district_ids[(division_name, district_name)], upazilla_name)
            for division_name, district_name, upazilla_name in upazillas
        ],
    )
    cur.execute(
        """
        SELECT u.id, v.name, d.name, u.name
        FROM upazillas u
        JOIN districts d ON d.id = u.district_id
        JOIN divisions v ON v.id = d.division_id
        """
    )
    upazilla_ids = {
        (division_name, district_name, upazilla_name): row_id
        for row_id, division_name, district_name, upazilla_name in cur.fetchall()
    }

    print(f"Inserting {len(post_offices)} post offices...", flush=True)
    cur.executemany(
        """
        INSERT INTO post_offices (upazilla_id, name, post_code, branch_type)
        VALUES (%s, %s, %s, %s)
        """,
        [
            (
                upazilla_ids[(division_name, district_name, upazilla_name)],
                office_name,
                post_code,
                branch_type,
            )
            for (
                division_name,
                district_name,
                upazilla_name,
                office_name,
                post_code,
                branch_type,
            ) in post_offices
        ],
    )

    return {
        "divisions": len(divisions),
        "districts": len(districts),
        "upazillas": len(upazillas),
        "post_offices": len(post_offices),
    }


def populate(cur, data):
    counts = {
        "divisions": 0,
        "districts": 0,
        "upazillas": 0,
        "post_offices": 0,
    }

    for division in data:
        division_name = division["division"].strip()
        print(f"Loading division: {division_name}", flush=True)
        division_id, created = get_or_create_division(cur, division_name)
        counts["divisions"] += int(created)

        for district in division.get("districts", []):
            district_name = district["district"].strip()
            district_id, created = get_or_create_district(cur, division_id, district_name)
            counts["districts"] += int(created)

            for police_station in district.get("police_stations", []):
                upazilla_name = police_station["police_station"].strip()
                upazilla_id, created = get_or_create_upazilla(
                    cur,
                    district_id,
                    upazilla_name,
                )
                counts["upazillas"] += int(created)

                for office in police_station.get("post_offices", []):
                    _, created = get_or_create_post_office(cur, upazilla_id, office)
                    counts["post_offices"] += int(created)

    return counts


def parse_args():
    parser = argparse.ArgumentParser(
        description="Populate the PostgreSQL schema with Bangladesh postcode data."
    )
    parser.add_argument(
        "--database-url",
        default=os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL),
        help="PostgreSQL connection URL. Defaults to DATABASE_URL, then the commented Supabase URL.",
    )
    parser.add_argument(
        "--schema",
        type=Path,
        default=ROOT / "schema.sql",
        help="Path to schema.sql.",
    )
    parser.add_argument(
        "--json",
        type=Path,
        default=ROOT / "bangladesh_post_codes_hierarchical.json",
        help="Path to bangladesh_post_codes_hierarchical.json.",
    )
    parser.add_argument(
        "--create-schema",
        action="store_true",
        help="Execute schema.sql before inserting data. Use this only for a fresh database.",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Clear hierarchy tables before inserting data.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Read and count the JSON records without connecting to the database.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    data = json.loads(args.json.read_text(encoding="utf-8"))

    if args.dry_run:
        offices = sum(
            len(police_station.get("post_offices", []))
            for division in data
            for district in division.get("districts", [])
            for police_station in district.get("police_stations", [])
        )
        print(f"Ready to load {len(data)} divisions and {offices} post offices.")
        return

    with connect(args.database_url) as conn:
        with conn.cursor() as cur:
            if args.create_schema:
                print("Creating schema...", flush=True)
                execute_schema(cur, args.schema)
            if args.reset:
                reset_data(cur)

            if args.reset:
                counts = populate_after_reset(cur, data)
            else:
                counts = populate(cur, data)

        conn.commit()

    print("Inserted rows:")
    for table, count in counts.items():
        print(f"  {table}: {count}")


if __name__ == "__main__":
    main()

