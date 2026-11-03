import { useState } from 'react'
import BlockGroupMap from './components/BlockGroupMap'
import InfoPanel from './components/InfoPanel'
import { MAPBOX_TOKEN, type BlockGroupProperties, type MetricKey } from './config'

export default function App() {
  const [hovered, setHovered] = useState<BlockGroupProperties | null>(null)
  const [metric, setMetric] = useState<MetricKey>('POP_DENSITY')

  if (!MAPBOX_TOKEN) {
    return (
      <div className="panel">
        Set <code>MAPBOX_ACCESS_TOKEN</code> (pk.*) in your shell or{' '}
        <code>VITE_MAPBOX_ACCESS_TOKEN</code> in <code>.env.local</code>, then restart Vite.
      </div>
    )
  }

  return (
    <>
      <BlockGroupMap metric={metric} onHover={setHovered} />
      <InfoPanel blockGroup={hovered} metric={metric} onMetricChange={setMetric} />
    </>
  )
}
