import type { ExpressionSpecification, Map as MapboxMap } from 'mapbox-gl'

/**
 * Adjust mapbox/light-v11 so it reads well on top of a dense, saturated
 * choropleth. The stock style tunes labels for near-white land: mid-gray text
 * (≈1.5:1 contrast over a mid-tone fill) and 0.5–1px halos.
 *
 * - Labels: near-black text on a solid white halo (≈16:1 regardless of the fill below).
 * - Declutter: hide POI, natural-feature and minor road labels that compete with the data.
 * - Borders: lift state/country lines above the data so they give orientation.
 */

const TEXT = '#1d2026'
const TEXT_SECONDARY = '#3a3f47'
const HALO = 'rgba(255, 255, 255, 0.9)'

/** Keep light-v11's rank hierarchy, just darker: major places darkest. */
const settlementColor: ExpressionSpecification = [
  'step',
  ['get', 'symbolrank'],
  TEXT,
  11,
  TEXT_SECONDARY,
  16,
  '#555b64',
]

const LABELS: Record<string, { color: string | ExpressionSpecification; halo: number }> = {
  'settlement-major-label': { color: settlementColor, halo: 1.75 },
  'settlement-minor-label': { color: settlementColor, halo: 1.5 },
  'state-label': { color: TEXT_SECONDARY, halo: 1.5 },
  'country-label': { color: TEXT, halo: 1.75 },
  'airport-label': { color: TEXT_SECONDARY, halo: 1.25 },
  'water-point-label': { color: '#2f5d8a', halo: 1.25 },
  'water-line-label': { color: '#2f5d8a', halo: 1.25 },
}

const HIDDEN = [
  'poi-label',
  'natural-point-label',
  'natural-line-label',
  'settlement-subdivision-label',
  'road-label-simple',
  'waterway-label',
]

const BORDERS: Record<string, string> = {
  'admin-1-boundary': 'rgba(40, 40, 48, 0.55)',
  'admin-0-boundary': 'rgba(30, 30, 36, 0.75)',
  'admin-0-boundary-disputed': 'rgba(30, 30, 36, 0.75)',
}

export function tuneBasemapForData(map: MapboxMap) {
  for (const [id, { color, halo }] of Object.entries(LABELS)) {
    if (!map.getLayer(id)) continue
    map.setPaintProperty(id, 'text-color', color)
    map.setPaintProperty(id, 'text-halo-color', HALO)
    map.setPaintProperty(id, 'text-halo-width', halo)
    map.setPaintProperty(id, 'text-halo-blur', 0.25)
  }
  // light-v11 draws state names at 50% opacity, too faint over color.
  if (map.getLayer('state-label')) map.setPaintProperty('state-label', 'text-opacity', 0.9)

  for (const id of HIDDEN) {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'none')
  }

  // Move borders from under the data to just above it (still below labels).
  const firstSymbol = map.getStyle()?.layers.find((l) => l.type === 'symbol')?.id
  for (const [id, color] of Object.entries(BORDERS)) {
    if (!map.getLayer(id)) continue
    map.moveLayer(id, firstSymbol)
    map.setPaintProperty(id, 'line-color', color)
  }
  // The wide light "-bg" casings would read as white halos around borders; drop them.
  for (const id of ['admin-0-boundary-bg', 'admin-1-boundary-bg']) {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'none')
  }
}
