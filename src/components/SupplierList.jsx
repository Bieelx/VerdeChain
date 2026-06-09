import { suppliers, RISK_COLORS, RISK_BG } from '../data/suppliers'

const RISK_LABELS = {
  LOW: 'Baixo',
  MEDIUM: 'Médio',
  HIGH: 'Alto',
  CRITICAL: 'Crítico',
}

const TREND_ICONS = { up: '↑', down: '↓', stable: '→' }
const TREND_COLORS = { up: '#ff6b35', down: '#00e07a', stable: '#ffd700' }

function RiskBadge({ risk }) {
  return (
    <span
      className="text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0"
      style={{
        background: RISK_BG[risk],
        color: RISK_COLORS[risk],
        border: `1px solid ${RISK_COLORS[risk]}30`,
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
      style={{ background: RISK_COLORS[risk] }}
    />
  )
}

export default function SupplierList({ selectedId, onSelect, hoveredId }) {
  const critical = suppliers.filter(s => s.risk === 'CRITICAL').length
  const high     = suppliers.filter(s => s.risk === 'HIGH').length

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b flex-shrink-0" style={{ borderColor: '#1a1a2e' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Fornecedores</h2>
          <div className="flex items-center gap-2 text-[10px]">
            {critical > 0 && (
              <span style={{ color: RISK_COLORS.CRITICAL }}>{critical} crítico{critical > 1 ? 's' : ''}</span>
            )}
            {high > 0 && (
              <span style={{ color: RISK_COLORS.HIGH }}>{high} alto{high > 1 ? 's' : ''}</span>
            )}
            <span className="text-gray-600">{suppliers.length} total</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {suppliers.map((sup) => {
          const isSelected = selectedId === sup.id
          const isHovered  = hoveredId === sup.id

          return (
            <button
              key={sup.id}
              onClick={() => onSelect(sup.id)}
              className="w-full text-left px-4 py-2.5 transition-colors duration-100 flex items-center gap-2.5 border-b"
              style={{
                borderColor: isSelected ? `${RISK_COLORS[sup.risk]}20` : 'rgba(255,255,255,0.04)',
                background: isSelected
                  ? `${RISK_COLORS[sup.risk]}0a`
                  : isHovered
                  ? 'rgba(255,255,255,0.02)'
                  : 'transparent',
              }}
            >
              <RiskDot risk={sup.risk} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white truncate leading-tight">{sup.name}</div>
                <div className="text-[10px] text-gray-600 truncate">{sup.region} · {sup.commodity}</div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[10px] font-semibold" style={{ color: TREND_COLORS[sup.trend] }}>
                  {TREND_ICONS[sup.trend]}
                </span>
                <RiskBadge risk={sup.risk} />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
