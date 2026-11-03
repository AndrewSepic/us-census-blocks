# U.S. Census Block Groups — Mapbox GL JS + React + TypeScript + Vite

All 242,298 census block groups (50 states, DC, PR, island territories) served as vector
tiles from the Mapbox tileset `andrewsepic1.us-census-block-groups-2023`, joined with
ACS 2019–2023 5-year estimates. Color by population density, median household income or
median age; hover a block group to see its details in the info panel.

## Run

```sh
export MAPBOX_ACCESS_TOKEN=pk....   # public token; or set VITE_MAPBOX_ACCESS_TOKEN in .env.local
npm install
npm run dev        # dev server
npm run build      # tsc + production build
```

`.npmrc` pins this project to the public npm registry.

## Code layout

- `src/config.ts` — token, tileset id, `BlockGroupProperties`, metrics + class breaks, dataset summary
- `src/components/BlockGroupMap.tsx` — creates the map once, adds layers, hover feature-state, recolors on metric change
- `src/components/InfoPanel.tsx` — dataset summary, metric picker, hovered block group details, legend
- `scripts/join_acs.py` — joins ACS tables + county/state names onto the boundaries

## How the data was built

```sh
mkdir -p data/raw data/acs
# 1. Boundaries (Census cartographic boundary files, 2023, 1:500k)
curl -L -o data/raw/bg.zip https://www2.census.gov/geo/tiger/GENZ2023/shp/cb_2023_us_bg_500k.zip
curl -L -o data/raw/county.zip https://www2.census.gov/geo/tiger/GENZ2023/shp/cb_2023_us_county_500k.zip
(cd data/raw && unzip -o bg.zip && unzip -o county.zip)
ogr2ogr -f CSV data/counties.csv data/raw/cb_2023_us_county_500k.shp -select GEOID,NAMELSAD,STUSPS,STATE_NAME
ogr2ogr -f GeoJSONSeq -t_srs EPSG:4326 -lco RS=NO -lco COORDINATE_PRECISION=6 \
  -select GEOID,NAMELSAD,ALAND,AWATER data/bg_raw.ldgeojson data/raw/cb_2023_us_bg_500k.shp

# 2. ACS 5-year table-based summary files (no API key needed)
B=https://www2.census.gov/programs-surveys/acs/summary_file/2023/table-based-SF/data/5YRData
for t in b01003 b19013 b01002; do curl -L -o data/acs/acsdt5y2023-$t.dat $B/acsdt5y2023-$t.dat; done

# 3. Join
python3 -I scripts/join_acs.py data/bg_raw.ldgeojson data/acs data/counties.csv data/block-groups.ldgeojson

# 4. Tile with Mapbox Tiling Service via the Mapbox CLI (needs tilesets:write; --use-login uses `mapbox auth login`)
mapbox --use-login tilesets-cli upload-source andrewsepic1 us-census-block-groups-2023 data/block-groups.ldgeojson
mapbox --use-login tilesets-cli create andrewsepic1.us-census-block-groups-2023 --recipe data/recipe.json --name "US Census Block Groups 2023"
mapbox --use-login tilesets-cli publish andrewsepic1.us-census-block-groups-2023
```

`data/recipe.json`: one source layer `block_groups`, z3–z12, feature id = numeric GEOID (for
hover feature-state), extra simplification below z8 (more below z6 to stay under tile size limits).

## Tile attributes

`GEOID`, `NAMELSAD`, `TRACTCE`, `COUNTY`, `STUSPS`, `STATE_NAME`, `ALAND_KM2`, `AWATER_KM2`,
and where available `POP` (B01003), `POP_DENSITY` (people/km² of land), `MED_HH_INC` (B19013;
top-coded at 250,001), `MED_AGE` (B01002).

### Why some block groups show "No data"

| Cause | Block groups | Missing |
|---|---|---|
| Island territories (AS, GU, MP, VI) — ACS isn't conducted there | 405 | all ACS fields |
| GEOID mismatch: 2023 boundary file vs ACS 2023 tabulation geography (Suffolk County, NY) | 40 | all ACS fields |
| Zero population (water, parks, airports, industrial) | 1,704 | income, age |
| No land area (water-only block groups), so density is undefined | 203 | density |
| Median not published (too few sampled households, or group-quarters only such as dorms, prisons, bases) — ACS code `-666666666` | 15,799 | income (190 also lack age) |
