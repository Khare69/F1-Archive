"""
F1 Archive — Build Browser SQLite Generator
Extracts analytical F1DB tables and circuit elevations from scripts/.cache/f1db.sqlite
into an indexed, vacuumed, slim database at public/data/f1db-browser.sqlite (< 15 MB).
"""

import argparse
import glob
import json
import os
import sqlite3
import sys
from pathlib import Path


def build_browser_sqlite(src_path: Path, dest_path: Path, circuits_dir: Path) -> None:
    if not src_path.exists():
        print(f"ERROR: Source database not found at {src_path}", file=sys.stderr)
        sys.exit(1)

    dest_path.parent.mkdir(parents=True, exist_ok=True)
    if dest_path.exists():
        dest_path.unlink()

    print(f"Extracting from {src_path} -> {dest_path}...")
    conn = sqlite3.connect(str(dest_path))

    # Attach the source 74MB f1db.sqlite database as 'source'
    conn.execute("ATTACH DATABASE ? AS source", (str(src_path),))

    # 1. Copy core analytical tables verbatim
    core_tables = [
        "country",
        "continent",
        "driver",
        "constructor",
        "circuit",
        "season",
        "race",
        "season_driver_standing",
        "season_constructor_standing",
        "season_entrant_driver"
    ]

    for table in core_tables:
        print(f"  -> Copying table: {table}")
        conn.execute(f"CREATE TABLE {table} AS SELECT * FROM source.{table}")

    # 2. Extract normalized race_result from race_data (filtered strictly to RACE_RESULT)
    # This filters out massive qualifying/practice/pitstop tables, shrinking 74MB to ~4MB
    print("  -> Creating normalized race_result table...")
    conn.execute("""
    CREATE TABLE race_result AS
    SELECT
        race_id,
        driver_id,
        constructor_id,
        position_number,
        position_text,
        position_display_order,
        race_grid_position_number AS grid_position_number,
        race_points AS points,
        race_pole_position AS pole_position,
        race_fastest_lap AS fastest_lap,
        race_shared_car AS shared_car,
        race_laps AS laps,
        race_time AS time,
        race_reason_retired AS reason_retired
    FROM source.race_data
    WHERE type = 'RACE_RESULT';
    """)

    # 3. Extract sprint_result from race_data
    print("  -> Creating sprint_result table...")
    conn.execute("""
    CREATE TABLE sprint_result AS
    SELECT
        race_id,
        driver_id,
        constructor_id,
        position_number,
        position_text,
        position_display_order,
        race_grid_position_number AS grid_position_number,
        race_points AS points,
        race_laps AS laps,
        race_time AS time,
        race_reason_retired AS reason_retired
    FROM source.race_data
    WHERE type = 'SPRINT_RACE_RESULT';
    """)

    # 4. Create circuit_elevation table populated from Open-Meteo SRTM elevation metadata
    print("  -> Creating circuit_elevation table...")
    conn.execute("""
    CREATE TABLE circuit_elevation (
        circuit_id TEXT PRIMARY KEY,
        elevation_min_m REAL,
        elevation_max_m REAL,
        elevation_delta_m REAL
    );
    """)

    circuit_files = glob.glob(str(circuits_dir / "*.json"))
    elevation_count = 0
    for cf in circuit_files:
        try:
            with open(cf, "r", encoding="utf-8") as f:
                d = json.load(f)
                cid = d.get("circuitId")
                delta_m = d.get("elevationDeltaM")
                if cid and delta_m is not None:
                    conn.execute(
                        "INSERT INTO circuit_elevation VALUES (?, ?, ?, ?)",
                        (cid, d.get("elevationMinM"), d.get("elevationMaxM"), delta_m)
                    )
                    elevation_count += 1
        except Exception as e:
            print(f"    WARNING: failed to read {cf}: {e}", file=sys.stderr)

    print(f"  -> Inserted {elevation_count} circuit elevation records.")

    # 5. Create B-tree indexes for analytical query acceleration
    print("  -> Creating analytical indexes...")
    indexes = [
        "CREATE INDEX idx_rr_race_driver ON race_result (race_id, driver_id);",
        "CREATE INDEX idx_rr_driver ON race_result (driver_id);",
        "CREATE INDEX idx_rr_constructor ON race_result (constructor_id);",
        "CREATE INDEX idx_rr_position ON race_result (position_number);",
        "CREATE INDEX idx_rr_grid ON race_result (grid_position_number);",
        "CREATE INDEX idx_sr_race_driver ON sprint_result (race_id, driver_id);",
        "CREATE INDEX idx_race_year ON race (year);",
        "CREATE INDEX idx_race_circuit ON race (circuit_id);",
        "CREATE INDEX idx_sds_year_pos ON season_driver_standing (year, position_number);",
        "CREATE INDEX idx_sds_driver ON season_driver_standing (driver_id);",
        "CREATE INDEX idx_scs_year ON season_constructor_standing (year);",
        "CREATE INDEX idx_sed_year ON season_entrant_driver (year);",
        "CREATE INDEX idx_ce_delta ON circuit_elevation (elevation_delta_m DESC);",
    ]
    for idx_sql in indexes:
        conn.execute(idx_sql)

    # Detach source database before optimization
    conn.execute("DETACH DATABASE source;")
    conn.commit()

    # 6. Analyze and Vacuum
    print("  -> Running ANALYZE and VACUUM...")
    conn.execute("ANALYZE;")
    conn.commit()
    conn.execute("VACUUM;")
    conn.commit()

    # 7. Integrity Check
    integrity = conn.execute("PRAGMA integrity_check").fetchone()[0]
    conn.close()

    if integrity != "ok":
        print(f"ERROR: SQLite integrity check failed with: {integrity}", file=sys.stderr)
        sys.exit(1)

    file_size_bytes = os.path.getsize(dest_path)
    file_size_mb = file_size_bytes / (1024 * 1024)
    print(f"SUCCESS: Created {dest_path} ({file_size_mb:.2f} MB, {file_size_bytes} bytes). Integrity: {integrity}")

    if file_size_mb > 15.0:
        print(f"WARNING: Database size ({file_size_mb:.2f} MB) exceeds 15 MB budget!", file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Build slim browser SQLite database")
    parser.add_argument("--src", type=Path, default=Path(__file__).parent.parent / ".cache" / "f1db.sqlite")
    parser.add_argument("--dest", type=Path, default=Path(__file__).parent.parent.parent / "public" / "data" / "f1db-browser.sqlite")
    parser.add_argument("--circuits", type=Path, default=Path(__file__).parent.parent.parent / "public" / "data" / "circuits")
    args = parser.parse_args()

    build_browser_sqlite(args.src.resolve(), args.dest.resolve(), args.circuits.resolve())


if __name__ == "__main__":
    main()
