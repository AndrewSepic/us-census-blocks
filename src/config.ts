export const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || import.meta.env.MAPBOX_ACCESS_TOKEN || ''

export const BLOCK_GROUPS_TILESET =
  import.meta.env.VITE_BLOCK_GROUPS_TILESET || 'andrewsepic1.us-census-block-groups-2023'

export const BLOCK_GROUPS_SOURCE_LAYER = 'block_groups'

/**
 * Properties baked into each feature by scripts/join_acs.py.
 * ACS fields are absent where the estimate is unavailable (e.g. territories,
 * zero-population block groups, suppressed medians).
 */
export interface BlockGroupProperties {
  GEOID: string
  NAMELSAD: string
  TRACTCE: string
  COUNTY: string
  STUSPS: string
  STATE_NAME: string
  ALAND_KM2: number
  AWATER_KM2: number
  POP?: number
  POP_DENSITY?: number
  MED_HH_INC?: number
  MED_AGE?: number
}

/** Static facts about the published dataset, computed when it was built. */
export const DATASET_SUMMARY = {
  blockGroups: 242_298,
  population: 335_563_144,
  statesAndTerritories: 56,
  vintage: '2023',
}

export type MetricKey = 'POP_DENSITY' | 'MED_HH_INC' | 'MED_AGE'

export interface Metric {
  key: MetricKey
  label: string
  unit: string
  format: (v: number) => string
  /** [lower bound, color] class breaks for a `step` expression. */
  breaks: ReadonlyArray<readonly [number, string]>
}

const int = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})
const compactUsd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 0,
})

// Sequential palettes tuned for a light basemap: the lowest class is still
// saturated (no near-white), luminance falls monotonically toward high values.
export const METRICS: Record<MetricKey, Metric> = {
  POP_DENSITY: {
    key: 'POP_DENSITY',
    label: 'Population density',
    unit: 'people / km²',
    format: (v) => int.format(v),
    breaks: [
      [0, '#f5a8d4'],
      [10, '#ee82c4'],
      [50, '#e05db3'],
      [250, '#cc3a9f'],
      [1000, '#b0228a'],
      [2500, '#8e1474'],
      [5000, '#6b0c5c'],
      [10000, '#470641'],
    ],
  },
  MED_HH_INC: {
    key: 'MED_HH_INC',
    label: 'Median household income',
    unit: 'USD',
    format: (v) => compactUsd.format(v),
    breaks: [
      [0, '#9fd486'],
      [40000, '#6cc38a'],
      [55000, '#43ab8e'],
      [75000, '#2a8f91'],
      [100000, '#21738f'],
      [150000, '#235686'],
      [200000, '#233a72'],
    ],
  },
  MED_AGE: {
    key: 'MED_AGE',
    label: 'Median age',
    unit: 'years',
    format: (v) => int.format(v),
    breaks: [
      [0, '#b9a6de'],
      [30, '#9d84d0'],
      [35, '#8466c0'],
      [40, '#6e4bab'],
      [45, '#5a3493'],
      [55, '#452178'],
      [65, '#2f115a'],
    ],
  },
}

export const NO_DATA_COLOR = '#d9d9d9'

export const formatInt = (v: number) => int.format(v)
export const formatUsd = (v: number) => usd.format(v)
