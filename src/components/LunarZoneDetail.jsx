import { ZONE_COLORS, ZONE_BG, ZONE_LABELS } from '../data/lunarZones'

const SEV_COLORS = { ok: '#00ff88', warning: '#ff6b35', critical: '#ff0040' }
const SEV_BG = {
  ok: 'rgba(0,255,136,0.08)',
  warning: 'rgba(255,107,53,0.08)',
  critical: 'rgba(255,0,64,0.08)',
}
const SEV_LABELS = { ok: 'ESTÁVEL', warning: 'ALERTA', critical: 'CRÍTICO' }

function MetricCard({ label, value, color, alert }) {
  return (
    <div
      className="rounded-lg p-3 flex flex-col gap-1"
      style={{
        background: alert ? 'rgba(255,0,64,0.08)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${alert ? 'rgba(255,0,64,0.3)' : '#1a1a30'}`,
      }}
    >
      <span className="text-[9px] text-gray-500 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-bold leading-snug" style={{ color: color || '#aaaacc' }}>
        {value}
      </span>
      {alert && <div className="text-[9px] text-red-400 font-medium">⚠ Alerta ativo</div>}
    </div>
  )
}

function GaugeBar({ value, color, label }) {
  const pct = Math.min(100, value)
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-[9px] text-gray-500">
        <span>{label}</span>
        <span style={{ color }}>{value}%</span>
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

function formatScanTime(isoStr) {
  const d = new Date(isoStr)
  return (
    d.toLocaleDateString('pt-BR', { month: 'short', day: '2-digit' }) +
    ' · ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false }) +
    ' UTC'
  )
}

export default function LunarZoneDetail({ zone, onClose }) {
  if (!zone) return null
  const color = ZONE_COLORS[zone.risk]

  return (
    <div className="panel-enter flex flex-col h-full">
      <div
        className="px-4 py-3 border-b flex-shrink-0"
        style={{
          borderColor: `${color}33`,
          background: `linear-gradient(90deg, ${color}08, transparent)`,
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <div
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${zone.risk === 'CRITICAL' ? 'critical-pulse' : ''}`}
                style={{ background: color, boxShadow: `0 0 8px ${color}` }}
              />
              <h2 className="text-sm font-bold text-white truncate leading-tight">{zone.name}</h2>
            </div>
            <div className="text-[10px] text-gray-400">
              {zone.resource} {zone.resourceIcon}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              {Math.abs(zone.lat).toFixed(1)}°{zone.lat >= 0 ? 'N' : 'S'} ·{' '}
              {Math.abs(zone.lng).toFixed(1)}°{zone.lng >= 0 ? 'E' : 'W'}
              {zone.isArtemis && (
                <span className="ml-2 font-medium" style={{ color: '#00ff88' }}>
                  ◆ Base Artemis Alpha
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
              style={{
                background: ZONE_BG[zone.risk],
                color,
                border: `1px solid ${color}44`,
                boxShadow: zone.risk === 'CRITICAL' ? `0 0 10px ${color}44` : 'none',
              }}
            >
              {ZONE_LABELS[zone.risk]}
            </span>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-300 transition-colors text-xs p-0.5"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="relative w-14 h-14 flex-shrink-0">
            <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
              <circle cx="28" cy="28" r="22" fill="none" stroke="#1a1a30" strokeWidth="5" />
              <circle
                cx="28"
                cy="28"
                r="22"
                fill="none"
                stroke={color}
                strokeWidth="5"
                strokeDasharray={`${(zone.depletionRisk / 100) * 138.2} 138.2`}
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 4px ${color})` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-bold leading-none" style={{ color }}>
                {zone.depletionRisk}
              </span>
              <span className="text-[7px] text-gray-600">RISCO</span>
            </div>
          </div>
          <div className="flex-1 space-y-1.5">
            <GaugeBar value={zone.depletionRisk} color={color} label="Risco de esgotamento" />
            <GaugeBar value={100 - zone.depletionRisk} color="#00ff88" label="Saúde da reserva" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            label="Taxa de extração"
            value={zone.details.extractionRate}
            color="#00d4ff"
          />
          <MetricCard
            label="Reservas"
            value={zone.details.reserves}
            color={zone.depletionRisk > 70 ? '#ff0040' : zone.depletionRisk > 40 ? '#ff6b35' : '#00ff88'}
            alert={zone.depletionRisk > 70}
          />
          <MetricCard label="Profundidade" value={zone.details.depth} color="#aaaacc" />
          <MetricCard label="Área pesquisada" value={zone.details.area} color="#aaaacc" />
        </div>

        <div
          className="rounded-lg p-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1a1a30' }}
        >
          <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Concentração</div>
          <div className="text-xs text-gray-200">{zone.details.concentration}</div>
        </div>

        <div
          className="rounded-lg p-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1a1a30' }}
        >
          <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Total extraído</div>
          <div className="flex items-end gap-1">
            <span className="text-xl font-bold" style={{ color: '#00d4ff' }}>
              {zone.extracted < 100 && zone.extractedUnit === 'kg'
                ? zone.extracted.toFixed(1)
                : zone.extracted.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-500 mb-0.5">{zone.extractedUnit}</span>
          </div>
        </div>

        {zone.alerts.length > 0 && (
          <div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1.5">Alertas ativos</div>
            <div className="space-y-1.5">
              {zone.alerts.map((alert, i) => (
                <div
                  key={i}
                  className="rounded-lg px-3 py-2"
                  style={{ background: 'rgba(255,0,64,0.06)', border: '1px solid rgba(255,0,64,0.2)' }}
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

        <div
          className="rounded-lg p-3"
          style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.15)' }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[9px] text-cyan-400 font-semibold uppercase tracking-wider">
              Última varredura orbital
            </span>
          </div>
          <div className="text-[10px] text-gray-300">{formatScanTime(zone.lastScan)}</div>
        </div>

        <div
          className="rounded-lg p-3"
          style={{
            background: SEV_BG[zone.severity],
            border: `1px solid ${SEV_COLORS[zone.severity]}33`,
          }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: SEV_COLORS[zone.severity] }}
            />
            <span
              className="text-[9px] font-semibold uppercase tracking-wider"
              style={{ color: SEV_COLORS[zone.severity] }}
            >
              Recomendação IA
            </span>
            <span
              className="ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded"
              style={{
                background: SEV_BG[zone.severity],
                color: SEV_COLORS[zone.severity],
                border: `1px solid ${SEV_COLORS[zone.severity]}44`,
              }}
            >
              {SEV_LABELS[zone.severity]}
            </span>
          </div>
          <p className="text-[10px] text-gray-300 leading-relaxed">{zone.recommendation}</p>
        </div>

        <div className="flex justify-between text-[9px] text-gray-600 pb-2">
          <span>{zone.details.area}</span>
          <span>Varredura: {formatScanTime(zone.lastScan)}</span>
        </div>
      </div>
    </div>
  )
}
