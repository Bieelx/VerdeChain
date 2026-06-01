import { suppliers, RISK_COLORS, RISK_BG } from '../data/suppliers'

const RISK_LABELS = {
  LOW: 'BAIXO',
  MEDIUM: 'MÉDIO',
  HIGH: 'ALTO',
  CRITICAL: 'CRÍTICO',
}

const TREND_ICONS = {
  up: '↑',
  down: '↓',
  stable: '→',
}

const TREND_COLORS = {
  up: '#ff6b35',
  down: '#00ff88',
  stable: '#ffd700',
}

function RiskBadge({ risk }) {
  return (
    <span
      className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0"
      style={{
        background: RISK_BG[risk],
        color: RISK_COLORS[risk],
        border: `1px solid ${RISK_COLORS[risk]}44`,
        boxShadow: risk === 'CRITICAL' ? `0 0 8px ${RISK_COLORS[risk]}44` : 'none',
      }}
    >
      {RISK_LABELS[risk]}
    </span>
  )
}

function RiskDot({ risk }) {
  const isCritical = risk === 'CRITICAL'
  return (
    <div
      className={`w-2 h-2 rounded-full flex-shrink-0 ${isCritical ? 'critical-pulse' : ''}`}
      style={{
        background: RISK_COLORS[risk],
        boxShadow: `0 0 6px ${RISK_COLORS[risk]}`,
      }}
    />
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

export default function SupplierList({ selectedId, onSelect, hoveredId }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b flex-shrink-0" style={{ borderColor: '#1a1a2e' }}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-white tracking-wide">Fornecedores</h2>
          <span className="text-[10px] text-gray-500">{suppliers.length} monitorados</span>
        </div>
        <div className="flex gap-1.5 mt-2">
          {[
            { label: 'Crítico', count: suppliers.filter(s=>s.risk==='CRITICAL').length, color: '#ff0040' },
            { label: 'Alto', count: suppliers.filter(s=>s.risk==='HIGH').length, color: '#ff6b35' },
            { label: 'Médio', count: suppliers.filter(s=>s.risk==='MEDIUM').length, color: '#ffd700' },
            { label: 'Baixo', count: suppliers.filter(s=>s.risk==='LOW').length, color: '#00ff88' },
          ].map(({ label, count, color }) => (
            <div key={label} className="flex-1 text-center py-1 rounded" style={{ background: `${color}11`, border: `1px solid ${color}22` }}>
              <div className="text-sm font-bold" style={{ color }}>{count}</div>
              <div className="text-[8px] text-gray-500 uppercase">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1">
        {suppliers.map((sup, idx) => {
          const isSelected = selectedId === sup.id
          const isHovered = hoveredId === sup.id

          return (
            <button
              key={sup.id}
              onClick={() => onSelect(sup.id)}
              className="w-full text-left px-4 py-3 transition-all duration-150 flex flex-col gap-1.5 border-b"
              style={{
                borderColor: isSelected ? `${RISK_COLORS[sup.risk]}33` : '#1a1a2e',
                background: isSelected
                  ? `linear-gradient(90deg, ${RISK_COLORS[sup.risk]}12, transparent)`
                  : isHovered
                  ? 'rgba(255,255,255,0.03)'
                  : 'transparent',
                animationDelay: `${idx * 50}ms`,
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <RiskDot risk={sup.risk} />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate leading-tight">{sup.name}</div>
                    <div className="text-[10px] text-gray-500 truncate">{sup.region} · {sup.commodity}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: TREND_COLORS[sup.trend] }}
                    title={sup.trend === 'up' ? 'Risco aumentando' : sup.trend === 'down' ? 'Risco diminuindo' : 'Estável'}
                  >
                    {TREND_ICONS[sup.trend]}
                  </span>
                  <RiskBadge risk={sup.risk} />
                </div>
              </div>

              {/* Score bars */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                <div>
                  <div className="text-[8px] text-gray-600 mb-0.5 flex justify-between">
                    <span>Risco</span>
                    <span style={{ color: RISK_COLORS[sup.risk] }}>{sup.riskScore}</span>
                  </div>
                  <ScoreBar score={sup.riskScore} color={RISK_COLORS[sup.risk]} />
                </div>
                <div>
                  <div className="text-[8px] text-gray-600 mb-0.5 flex justify-between">
                    <span>Compliance</span>
                    <span className="text-neon-green">{sup.complianceScore}</span>
                  </div>
                  <ScoreBar score={sup.complianceScore} color="#00ff88" />
                </div>
              </div>

              {/* Alerts indicator */}
              {sup.alerts.length > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full" style={{ background: RISK_COLORS[sup.risk] }} />
                  <span className="text-[9px] text-gray-500">{sup.alerts.length} alerta{sup.alerts.length > 1 ? 's' : ''} ativo{sup.alerts.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
