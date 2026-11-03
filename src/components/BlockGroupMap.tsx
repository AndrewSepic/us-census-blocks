import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import type { ExpressionSpecification, FeatureSelector } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import {
  BLOCK_GROUPS_SOURCE_LAYER,
  BLOCK_GROUPS_TILESET,
  MAPBOX_TOKEN,
  METRICS,
  NO_DATA_COLOR,
  type BlockGroupProperties,
  type MetricKey,
} from '../config'
import { tuneBasemapForData } from '../basemap'

interface BlockGroupMapProps {
  metric: MetricKey
  onHover: (blockGroup: BlockGroupProperties | null) => void
}

const SOURCE_ID = 'block-groups'
const FILL_LAYER = 'block-groups-fill'
const LINE_LAYER = 'block-groups-line'
const HOVER_LAYER = 'block-groups-hover'
const isHovered: ExpressionSpecification = ['boolean', ['feature-state', 'hover'], false]

/** Step expression for a metric, gray where the ACS value is missing. */
function fillColor(key: MetricKey): ExpressionSpecification {
  const { breaks } = METRICS[key]
  return [
    'case',
    ['has', key],
    [
      'step',
      ['get', key],
      ...breaks.flatMap(([value, color], i) => (i === 0 ? [color] : [value, color])),
    ],
    NO_DATA_COLOR,
  ] as ExpressionSpecification
}

export default function BlockGroupMap({ metric, onHover }: BlockGroupMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  // Keep the latest props in refs so the map is only created once.
  const onHoverRef = useRef(onHover)
  onHoverRef.current = onHover
  const metricRef = useRef(metric)
  metricRef.current = metric

  useEffect(() => {
    if (!containerRef.current) return
    mapboxgl.accessToken = MAPBOX_TOKEN

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-98.5, 39.5],
      zoom: 3.5,
      minZoom: 2,
      hash: true,
    })
    mapRef.current = map
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    let hoverId: string | number | null = null
    const setHover = (id: string | number | null) => {
      const target = (fid: string | number): FeatureSelector => ({
        source: SOURCE_ID,
        sourceLayer: BLOCK_GROUPS_SOURCE_LAYER,
        id: fid,
      })
      if (hoverId !== null) map.setFeatureState(target(hoverId), { hover: false })
      hoverId = id
      if (id !== null) map.setFeatureState(target(id), { hover: true })
    }

    map.on('load', () => {
      map.addSource(SOURCE_ID, { type: 'vector', url: `mapbox://${BLOCK_GROUPS_TILESET}` })

      // Insert below the first label layer so place names stay readable.
      const firstSymbol = map.getStyle()?.layers.find((l) => l.type === 'symbol')?.id

      map.addLayer(
        {
          id: FILL_LAYER,
          type: 'fill',
          source: SOURCE_ID,
          'source-layer': BLOCK_GROUPS_SOURCE_LAYER,
          paint: {
            'fill-color': fillColor(metricRef.current),
            'fill-opacity': ['case', isHovered, 1, 0.85],
          },
        },
        firstSymbol,
      )

      map.addLayer(
        {
          id: LINE_LAYER,
          type: 'line',
          source: SOURCE_ID,
          'source-layer': BLOCK_GROUPS_SOURCE_LAYER,
          minzoom: 7,
          paint: {
            'line-color': '#ffffff',
            'line-width': ['interpolate', ['linear'], ['zoom'], 7, 0.15, 12, 0.8],
          },
        },
        firstSymbol,
      )

      // Hover outline in its own layer above the white borders. Shared edges
      // are drawn once per neighbor; within a single layer a later neighbor's
      // white line would paint over the hovered black one. Feature-state can't
      // be used in filters, so non-hovered features are drawn at opacity 0.
      map.addLayer(
        {
          id: HOVER_LAYER,
          type: 'line',
          source: SOURCE_ID,
          'source-layer': BLOCK_GROUPS_SOURCE_LAYER,
          layout: { 'line-join': 'round' },
          paint: {
            'line-color': '#000000',
            'line-opacity': ['case', isHovered, 1, 0],
            'line-width': ['interpolate', ['linear'], ['zoom'], 4, 1.25, 8, 2, 12, 2.5],
          },
        },
        firstSymbol,
      )

      tuneBasemapForData(map)
      // Borders were lifted above the data; keep the hover outline above them too.
      map.moveLayer(HOVER_LAYER, firstSymbol)
    })

    map.on('mousemove', FILL_LAYER, (e) => {
      const feature = e.features?.[0]
      if (!feature) return
      map.getCanvas().style.cursor = 'pointer'
      setHover(feature.id ?? null)
      onHoverRef.current(feature.properties as BlockGroupProperties)
    })

    map.on('mouseleave', FILL_LAYER, () => {
      map.getCanvas().style.cursor = ''
      setHover(null)
      onHoverRef.current(null)
    })

    return () => {
      mapRef.current = null
      map.remove()
    }
  }, [])

  // Recolor when the selected metric changes (no-op until the layer exists;
  // the load handler reads metricRef for the initial color).
  useEffect(() => {
    const map = mapRef.current
    if (map?.getLayer(FILL_LAYER)) map.setPaintProperty(FILL_LAYER, 'fill-color', fillColor(metric))
  }, [metric])

  return <div ref={containerRef} className="map" />
}
