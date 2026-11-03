import {
  DATASET_SUMMARY,
  METRICS,
  NO_DATA_COLOR,
  formatInt,
  formatUsd,
  type BlockGroupProperties,
  type MetricKey,
} from '../config'

interface InfoPanelProps {
  blockGroup: BlockGroupProperties | null
  metric: MetricKey
  onMetricChange: (metric: MetricKey) => void
}

const area = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
const NA = <span className="na">n/a</span>

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </>
  )
}

export default function InfoPanel({ blockGroup: bg, metric, onMetricChange }: InfoPanelProps) {
  const active = METRICS[metric]

  return (
    <div className="panel">
      <h1>U.S. Census Block Groups</h1>
      <p className="subtitle">
        {formatInt(DATASET_SUMMARY.blockGroups)} block groups ·{' '}
        {DATASET_SUMMARY.statesAndTerritories} states &amp; territories ·{' '}
        {formatInt(DATASET_SUMMARY.population)} people (ACS {DATASET_SUMMARY.vintage} 5-year)
      </p>

      <label className="metric">
        Color by{' '}
        <select value={metric} onChange={(e) => onMetricChange(e.target.value as MetricKey)}>
          {Object.values(METRICS).map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
      </label>

      <div className="info">
        {bg ? (
          <>
            <strong>
              {bg.NAMELSAD}, Tract {Number(bg.TRACTCE) / 100}
            </strong>
            <div className="place">
              {bg.COUNTY ? `${bg.COUNTY}, ` : ''}
              {bg.STATE_NAME || bg.STUSPS}
            </div>
            <dl>
              <Row label="GEOID">{bg.GEOID}</Row>
              <Row label="Population">{bg.POP != null ? formatInt(bg.POP) : NA}</Row>
              <Row label="Density">
                {bg.POP_DENSITY != null ? `${formatInt(bg.POP_DENSITY)} / km²` : NA}
              </Row>
              <Row label="Median HH income">
                {bg.MED_HH_INC != null
                  ? `${formatUsd(bg.MED_HH_INC)}${bg.MED_HH_INC >= 250001 ? '+' : ''}`
                  : NA}
              </Row>
              <Row label="Median age">{bg.MED_AGE != null ? bg.MED_AGE : NA}</Row>
              <Row label="Land / water">
                {area.format(bg.ALAND_KM2)} / {area.format(bg.AWATER_KM2)} km²
              </Row>
            </dl>
          </>
        ) : (
          <span className="hint">Hover a block group for details</span>
        )}
      </div>

      <div className="legend">
        <strong>
          {active.label} <span className="unit">({active.unit})</span>
        </strong>
        {active.breaks.map(([value, color], i) => {
          const next = active.breaks[i + 1]?.[0]
          return (
            <div className="row" key={value}>
              <span className="swatch" style={{ background: color }} />
              {next !== undefined
                ? `${active.format(value)} – ${active.format(next)}`
                : `${active.format(value)}+`}
            </div>
          )
        })}
        <div className="row">
          <span className="swatch" style={{ background: NO_DATA_COLOR }} />
          No data
        </div>
      </div>

      <small>
        Boundaries:{' '}
        <a
          href="https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          Census cartographic boundary files
        </a>{' '}
        (2023, 1:500k). Estimates:{' '}
        <a
          href="https://www.census.gov/programs-surveys/acs/data/summary-file.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          ACS 2019–2023 5-year
        </a>{' '}
        (B01003, B19013, B01002).
      </small>
    </div>
  )
}
