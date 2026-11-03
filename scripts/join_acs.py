"""Join ACS 2023 5-year estimates and county/state names onto block group GeoJSONSeq.

Usage: python3 -I scripts/join_acs.py data/bg_raw.ldgeojson data/acs data/counties.csv data/block-groups.ldgeojson
"""
import csv
import json
import sys
from pathlib import Path

src, acs_dir, counties_csv, out = (Path(a) for a in sys.argv[1:5])

# ACS uses large negative sentinels (e.g. -666666666) for "not available".
def num(value):
    try:
        v = float(value)
    except ValueError:
        return None
    return None if v < 0 else v

def load_table(name, column):
    table = {}
    with open(acs_dir / f"acsdt5y2023-{name}.dat", newline="") as f:
        for row in csv.DictReader(f, delimiter="|"):
            geo = row["GEO_ID"]
            if geo.startswith("1500000US"):  # summary level 150 = block group
                table[geo[9:]] = num(row[column])
    return table

pop = load_table("b01003", "B01003_E001")
income = load_table("b19013", "B19013_E001")
age = load_table("b01002", "B01002_E001")

counties = {}
with open(counties_csv, newline="") as f:
    for row in csv.DictReader(f):
        counties[row["GEOID"]] = row

missing_acs = 0
n = 0
with open(src) as fin, open(out, "w") as fout:
    for line in fin:
        feat = json.loads(line)
        p = feat["properties"]
        geoid = p["GEOID"]
        county = counties.get(geoid[:5], {})
        aland_km2 = p["ALAND"] / 1e6
        props = {
            "GEOID": geoid,
            "NAMELSAD": p["NAMELSAD"],
            "TRACTCE": geoid[5:11],
            "COUNTY": county.get("NAMELSAD", ""),
            "STUSPS": county.get("STUSPS", ""),
            "STATE_NAME": county.get("STATE_NAME", ""),
            "ALAND_KM2": round(aland_km2, 4),
            "AWATER_KM2": round(p["AWATER"] / 1e6, 4),
        }
        if geoid not in pop:
            missing_acs += 1
        population = pop.get(geoid)
        if population is not None:
            props["POP"] = int(population)
            if aland_km2 > 0:
                props["POP_DENSITY"] = round(population / aland_km2, 1)
        if income.get(geoid) is not None:
            props["MED_HH_INC"] = int(income[geoid])
        if age.get(geoid) is not None:
            props["MED_AGE"] = age[geoid]
        feat["properties"] = props
        fout.write(json.dumps(feat, separators=(",", ":")) + "\n")
        n += 1

print(f"wrote {n} features to {out}; {missing_acs} without ACS match", file=sys.stderr)
