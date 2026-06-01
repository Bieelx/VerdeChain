import { lunarZones, ZONE_COLORS, ZONE_BG, ZONE_LABELS } from '../data/lunarZones'

const TREND_ICONS = { up: '↑', down: '↓', stable: '→' }
const TREND_COLORS = { up: '#ff6b35', down: '#00ff88', stable: '#aaaacc' }

function ZoneDot({ risk }) {
  return (
    <div
      className={`w-2 h-2 rounded-full flex-shrink-0 ${risk === 'CRITICAL' ? 'critical-pulse' : ''}`}
      style={{ background: ZONE_COLORS[risk], boxShadow: `0 0 6px ${ZONE_COLORS[risk]}` }}
    />
  )
}

function ZoneBadge({ risk }) {
  return (
    <span
      className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0"
      style={{
        background: ZONE_BG[risk],
        color: ZONE_COLORS[risk],
        border: `1px solid ${ZONE_COLORS[risk]}44`,
        boxShadow: risk === 'CRITICAL' ? `0 0 8px ${ZONE_COLORS[risk]}44` : 'none',
      }}
    >
      {ZONE_LABELS[risk]}
    </span>
  )
}

function ScoreBar({ score, color }) {
  return (
    <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${score}%`,
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

export default function LunarZoneList({ selectedId, hoveredId, onSelect }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b flex-shrink-0" style={{ borderColor: '#1a1a30' }}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-white tracking-wide">Zonas de Recursos Lunares</h2>
          <span className="text-[10px] text-gray-500">{lunarZones.length} monitoradas</span>
        </div>
        <div className="flex gap-1.5 mt-2">
          {[
            { label: 'Crítica', count: lunarZones.filter((z) => z.risk === 'CRITICAL').length, color: '#ff0040' },
            { label: 'Em risco', count: lunarZones.filter((z) => z.risk === 'RISK').length, color: '#ff6b35' },
            { label: 'Ativa', count: lunarZones.filter((z) => z.risk === 'ACTIVE').length, color: '#00d4ff' },
            { label: 'Estável', count: lunarZones.filter((z) => z.risk === 'STABLE').length, color: '#00ff88' },
          ].map(({ label, count, color }) => (
            <div
              key={label}
              className="flex-1 text-center py-1 rounded"
              style={{ background: `${color}11`, border: `1px solid ${color}22` }}
            >
              <div className="text-sm font-bold" style={{ color }}>{count}</div>
              <div className="text-[8px] text-gray-500 uppercase">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {lunarZones.map((zone, idx) => {
          const isSelected = selectedId === zone.id
          const isHovered = hoveredId === zone.id

          return (
            <button
              key={zone.id}
              onClick={() => onSelect(zone.id)}
              className="w-full text-left px-4 py-3 transition-all duration-150 flex flex-col gap-1.5 border-b"
              style={{
                borderColor: isSelected ? `${ZONE_COLORS[zone.risk]}33` : '#1a1a30',
                background: isSelected
                  ? `linear-gradient(90deg, ${ZONE_COLORS[zone.risk]}12, transparent)`
                  : isHovered
                  ? 'rgba(255,255,255,0.03)'
                  : 'transparent',
                animationDelay: `${idx * 50}ms`,
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <ZoneDot risk={zone.risk} />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate leading-tight">
                      {zone.name}
                      {zone.isArtemis && (
                        <span className="ml-1.5 text-[8px] font-medium" style={{ color: '#00ff88' }}>
                          ◆ ARTEMIS
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-500 truncate">
                      {zone.resource} {zone.resourceIcon}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: TREND_COLORS[zone.trend] }}
                  >
                    {TREND_ICONS[zone.trend]}
                  </span>
                  <ZoneBadge risk={zone.risk} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                <div>
                  <div className="text-[8px] text-gray-600 mb-0.5 flex justify-between">
                    <span>Risco de esgotamento</span>
                    <span style={{ color: ZONE_COLORS[zone.risk] }}>{zone.depletionRisk}</span>
                  </div>
                  <ScoreBar score={zone.depletionRisk} color={ZONE_COLORS[zone.risk]} />
                </div>
                <div>
                  <div className="text-[8px] text-gray-600 mb-0.5">Última varredura</div>
                  <div className="text-[9px] text-gray-400">{formatScanTime(zone.lastScan)}</div>
                </div>
              </div>

              {zone.alerts.length > 0 && (
                <div className="flex items-center gap-1">
                  <div
                    className="w-1 h-1 rounded-full"
                    style={{ background: ZONE_COLORS[zone.risk] }}
                  />
                  <span className="text-[9px] text-gray-500">
                    {zone.alerts.length} alerta{zone.alerts.length > 1 ? 's' : ''} ativo{zone.alerts.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
