import { marsZones, MARS_ZONE_COLORS, MARS_ZONE_BG, MARS_ZONE_LABELS, MARS_ZONE_TYPE_LABELS, getCurrentSol } from '../data/marsZones'

const TREND_ICONS = { up: '↑', down: '↓', stable: '→' }
const TREND_COLORS = { up: '#ff6b35', down: '#00ff88', stable: '#aaaacc' }

function ZoneDot({ status }) {
  return (
    <div
      className={`w-2 h-2 rounded-full flex-shrink-0 ${status === 'CRITICAL' ? 'critical-pulse' : ''}`}
      style={{ background: MARS_ZONE_COLORS[status], boxShadow: `0 0 6px ${MARS_ZONE_COLORS[status]}` }}
    />
  )
}

function ZoneBadge({ status }) {
  return (
    <span
      className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0"
      style={{
        background: MARS_ZONE_BG[status],
        color: MARS_ZONE_COLORS[status],
        border: `1px solid ${MARS_ZONE_COLORS[status]}44`,
        boxShadow: status === 'CRITICAL' ? `0 0 8px ${MARS_ZONE_COLORS[status]}44` : 'none',
      }}
    >
      {MARS_ZONE_LABELS[status]}
    </span>
  )
}

function DustIndexBar({ value }) {
  const color = value > 60 ? '#ff0040' : value > 35 ? '#ff6b35' : '#00ff88'
  return (
    <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${Math.min(100, value)}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          boxShadow: `0 0 4px ${color}66`,
        }}
      />
    </div>
  )
}

function formatScanTime(isoStr) {
  const d = new Date(isoStr)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' UTC'
}

export default function MarsZoneList({ selectedId, hoveredId, onSelect }) {
  const sol = getCurrentSol()

  const counts = {
    CRITICAL: marsZones.filter((z) => z.status === 'CRITICAL').length,
    EXTRACTION: marsZones.filter((z) => z.status === 'EXTRACTION').length,
    ACTIVE: marsZones.filter((z) => z.status === 'ACTIVE').length,
    STABLE: marsZones.filter((z) => z.status === 'STABLE').length,
    PROPOSED: marsZones.filter((z) => z.status === 'PROPOSED').length,
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(255,107,53,0.2)' }}
      >
        <div className="flex items-center justify-between mb-0.5">
          <h2 className="text-sm font-semibold text-white tracking-wide">Zonas de Recursos em Marte</h2>
          <span className="text-[10px]" style={{ color: '#ff8844' }}>Sol {sol}</span>
        </div>
        <div className="text-[9px] text-gray-500 mb-2">{marsZones.length} zonas monitoradas</div>

        {/* Status grid */}
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { key: 'CRITICAL', label: 'Crítico' },
            { key: 'ACTIVE', label: 'Habitat' },
            { key: 'STABLE', label: 'Estável' },
          ].map(({ key, label }) => (
            <div
              key={key}
              className="text-center py-1 rounded"
              style={{ background: `${MARS_ZONE_COLORS[key]}10`, border: `1px solid ${MARS_ZONE_COLORS[key]}20` }}
            >
              <div className="text-sm font-bold" style={{ color: MARS_ZONE_COLORS[key] }}>{counts[key]}</div>
              <div className="text-[8px] text-gray-500 uppercase">{label}</div>
            </div>
          ))}
        </div>

        {/* Personnel total */}
        <div
          className="mt-2 flex items-center justify-between px-2 py-1 rounded"
          style={{ background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.15)' }}
        >
          <span className="text-[9px] text-gray-400">Equipe total no local</span>
          <span className="text-[10px] font-bold" style={{ color: '#ff8844' }}>
            {marsZones.reduce((s, z) => s + z.personnel, 0)} tripulantes
          </span>
        </div>
      </div>

      {/* Zone list */}
      <div className="flex-1 overflow-y-auto py-1">
        {marsZones.map((zone, idx) => {
          const isSelected = selectedId === zone.id
          const isHovered = hoveredId === zone.id
          const color = MARS_ZONE_COLORS[zone.status]

          return (
            <button
              key={zone.id}
              onClick={() => onSelect(zone.id)}
              className="w-full text-left px-4 py-3 transition-all duration-150 flex flex-col gap-1.5 border-b"
              style={{
                borderColor: isSelected ? `${color}30` : 'rgba(255,107,53,0.08)',
                background: isSelected
                  ? `linear-gradient(90deg, ${color}0f, transparent)`
                  : isHovered
                  ? 'rgba(255,100,30,0.04)'
                  : 'transparent',
                animationDelay: `${idx * 50}ms`,
              }}
            >
              {/* Name row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <ZoneDot status={zone.status} />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate leading-tight">{zone.name}</div>
                    <div className="text-[10px] text-gray-500 truncate">
                      {MARS_ZONE_TYPE_LABELS[zone.type]}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[10px] font-semibold" style={{ color: TREND_COLORS[zone.trend] }}>
                    {TREND_ICONS[zone.trend]}
                  </span>
                  <ZoneBadge status={zone.status} />
                </div>
              </div>

              {/* Resource + dust */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                <div>
                  <div className="text-[8px] text-gray-600 mb-0.5 flex justify-between">
                    <span>Risco de tempestade</span>
                    <span style={{ color: zone.atmospheric.dustRiskIndex > 60 ? '#ff0040' : zone.atmospheric.dustRiskIndex > 35 ? '#ff6b35' : '#00ff88' }}>
                      {zone.atmospheric.dustRiskIndex}
                    </span>
                  </div>
                  <DustIndexBar value={zone.atmospheric.dustRiskIndex} />
                </div>
                <div>
                  <div className="text-[8px] text-gray-600 mb-0.5">Última varredura</div>
                  <div className="text-[9px] text-gray-400">{formatScanTime(zone.lastScan)}</div>
                </div>
              </div>

              {/* Personnel + resource rate */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {zone.personnel > 0 ? (
                    <>
                      <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: '#ff8844' }} />
                      <span className="text-[9px]" style={{ color: '#ff8844' }}>
                        {zone.personnel} no local
                      </span>
                    </>
                  ) : (
                    <span className="text-[9px] text-gray-600">não tripulada</span>
                  )}
                </div>
                {zone.alerts.length > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full" style={{ background: color }} />
                    <span className="text-[9px] text-gray-500">
                      {zone.alerts.length} alerta{zone.alerts.length > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
