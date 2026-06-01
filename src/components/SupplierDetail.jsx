import { RISK_COLORS, RISK_BG } from '../data/suppliers'

const SEVERITY_LABEL = {
  CRITICAL: 'CRÍTICO',
  HIGH: 'ALTO',
  MEDIUM: 'MÉDIO',
  LOW: 'BAIXO',
}

function MetricCard({ label, value, unit, color, icon, alert }) {
  return (
    <div
      className="rounded-lg p-3 flex flex-col gap-1"
      style={{
        background: alert ? `${RISK_COLORS.CRITICAL}08` : 'rgba(255,255,255,0.03)',
        border: `1px solid ${alert ? RISK_COLORS.CRITICAL + '33' : '#1a1a2e'}`,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-gray-500 uppercase tracking-wider">{label}</span>
        <span className="text-sm">{icon}</span>
      </div>
      <div className="flex items-end gap-1">
        <span className="text-lg font-bold leading-none" style={{ color: color || '#fff' }}>{value}</span>
        {unit && <span className="text-[10px] text-gray-500 mb-0.5">{unit}</span>}
      </div>
      {alert && (
        <div className="text-[9px] text-red-400 font-medium">⚠ Alerta ativo</div>
      )}
    </div>
  )
}

function GaugeBar({ value, max = 100, color, label }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-[9px] text-gray-500">
        <span>{label}</span>
        <span style={{ color }}>{value}{max !== 100 ? `/${max}` : '%'}</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            boxShadow: `0 0 6px ${color}66`,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
    </div>
  )
}

export default function SupplierDetail({ supplier, onClose }) {
  if (!supplier) return null
  const riskColor = RISK_COLORS[supplier.risk]

  return (
    <div className="panel-enter flex flex-col h-full">
      {/* Header */}
      <div
        className="px-4 py-3 border-b flex-shrink-0"
        style={{
          borderColor: `${riskColor}33`,
          background: `linear-gradient(90deg, ${riskColor}08, transparent)`,
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <div
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${supplier.risk === 'CRITICAL' ? 'critical-pulse' : ''}`}
                style={{ background: riskColor, boxShadow: `0 0 8px ${riskColor}` }}
              />
              <h2 className="text-sm font-bold text-white truncate leading-tight">{supplier.name}</h2>
            </div>
            <div className="text-[10px] text-gray-400">{supplier.company}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{supplier.region} · {supplier.biome} · {supplier.commodity}</div>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
              style={{
                background: RISK_BG[supplier.risk],
                color: riskColor,
                border: `1px solid ${riskColor}44`,
                boxShadow: supplier.risk === 'CRITICAL' ? `0 0 10px ${riskColor}44` : 'none',
              }}
            >
              {SEVERITY_LABEL[supplier.risk]}
            </span>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-300 transition-colors text-xs p-0.5"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Risk score ring */}
        <div className="mt-3 flex items-center gap-3">
          <div className="relative w-14 h-14 flex-shrink-0">
            <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
              <circle cx="28" cy="28" r="22" fill="none" stroke="#1a1a2e" strokeWidth="5" />
              <circle
                cx="28" cy="28" r="22" fill="none"
                stroke={riskColor}
                strokeWidth="5"
                strokeDasharray={`${(supplier.riskScore / 100) * 138.2} 138.2`}
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 4px ${riskColor})` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-bold leading-none" style={{ color: riskColor }}>{supplier.riskScore}</span>
              <span className="text-[7px] text-gray-600">RISCO</span>
            </div>
          </div>
          <div className="flex-1 space-y-1.5">
            <GaugeBar value={supplier.complianceScore} color="#00ff88" label="Compliance" />
            <GaugeBar value={supplier.riskScore} color={riskColor} label="Risco" />
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            label="Desmatamento"
            value={supplier.deforestationAlert}
            unit="%"
            color={supplier.deforestationAlert > 30 ? RISK_COLORS.CRITICAL : supplier.deforestationAlert > 10 ? RISK_COLORS.HIGH : '#00ff88'}
            icon="🌳"
            alert={supplier.deforestationAlert > 30}
          />
          <MetricCard
            label="Focos de Calor"
            value={supplier.fireHotspots}
            unit="focos"
            color={supplier.fireHotspots > 50 ? RISK_COLORS.CRITICAL : supplier.fireHotspots > 10 ? RISK_COLORS.HIGH : '#00ff88'}
            icon="🔥"
            alert={supplier.fireHotspots > 50}
          />
          <MetricCard
            label="Carbono Est."
            value={(supplier.carbonEstimate / 1000).toFixed(1)}
            unit="ktCO₂"
            color="#00d4ff"
            icon="♻"
          />
          <MetricCard
            label="Mud. Uso Terra"
            value={supplier.landUseChange}
            unit="%"
            color={supplier.landUseChange > 15 ? RISK_COLORS.HIGH : supplier.landUseChange > 5 ? RISK_COLORS.MEDIUM : '#00ff88'}
            icon="🗺"
          />
        </div>

        {/* Protected area */}
        <div
          className="rounded-lg p-3"
          style={{
            background: supplier.protectedAreaProximity < 5 ? `${RISK_COLORS.CRITICAL}08` : 'rgba(255,255,255,0.03)',
            border: `1px solid ${supplier.protectedAreaProximity < 5 ? RISK_COLORS.CRITICAL + '33' : '#1a1a2e'}`,
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-gray-500 uppercase tracking-wider">Área Protegida Próxima</span>
            <span className="text-[9px]">🛡</span>
          </div>
          <div className="mt-1 flex items-end gap-1">
            <span className="text-lg font-bold" style={{
              color: supplier.protectedAreaProximity < 5 ? RISK_COLORS.CRITICAL
                : supplier.protectedAreaProximity < 15 ? RISK_COLORS.HIGH
                : '#00ff88'
            }}>
              {supplier.protectedAreaProximity}
            </span>
            <span className="text-[10px] text-gray-500 mb-0.5">km</span>
          </div>
          {supplier.protectedAreaProximity < 10 && (
            <div className="text-[9px] text-orange-400 mt-0.5">⚠ Proximidade crítica</div>
          )}
        </div>

        {/* Certifications */}
        <div>
          <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1.5">Certificações</div>
          {supplier.certifications.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {supplier.certifications.map((cert) => (
                <span
                  key={cert}
                  className="text-[9px] px-2 py-0.5 rounded-full"
                  style={{
                    background: cert.includes('exp') || cert.includes('pendente')
                      ? 'rgba(255,107,53,0.12)'
                      : 'rgba(0,255,136,0.1)',
                    color: cert.includes('exp') || cert.includes('pendente') ? '#ff6b35' : '#00ff88',
                    border: `1px solid ${cert.includes('exp') || cert.includes('pendente') ? '#ff6b3533' : '#00ff8833'}`,
                  }}
                >
                  {cert}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-[10px] text-red-400">Nenhuma certificação ativa</span>
          )}
        </div>

        {/* Active alerts */}
        {supplier.alerts.length > 0 && (
          <div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1.5">Alertas Ativos</div>
            <div className="space-y-1.5">
              {supplier.alerts.map((alert, i) => (
                <div
                  key={i}
                  className="rounded-lg px-3 py-2"
                  style={{
                    background: 'rgba(255,0,64,0.06)',
                    border: '1px solid rgba(255,0,64,0.2)',
                  }}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[8px] font-bold text-red-400 tracking-wider">{alert.type}</span>
                    <span className="text-[8px] text-gray-600">{alert.date}</span>
                  </div>
                  <div className="text-[10px] text-gray-300">{alert.msg}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Recommendation */}
        <div
          className="rounded-lg p-3"
          style={{
            background: 'rgba(0,212,255,0.05)',
            border: '1px solid rgba(0,212,255,0.2)',
          }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[9px] text-cyan-400 font-semibold uppercase tracking-wider">Recomendação IA</span>
            <span
              className="ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded"
              style={{
                background: RISK_BG[supplier.aiSeverity],
                color: RISK_COLORS[supplier.aiSeverity],
                border: `1px solid ${RISK_COLORS[supplier.aiSeverity]}44`,
              }}
            >
              {SEVERITY_LABEL[supplier.aiSeverity]}
            </span>
          </div>
          <p className="text-[10px] text-gray-300 leading-relaxed">{supplier.aiRecommendation}</p>
        </div>

        {/* Info footer */}
        <div className="flex justify-between text-[9px] text-gray-600 pb-2">
          <span>{supplier.hectares.toLocaleString('pt-BR')} ha</span>
          <span>Última auditoria: {supplier.lastAudit}</span>
          <span>{supplier.state}</span>
        </div>
      </div>
    </div>
  )
}
