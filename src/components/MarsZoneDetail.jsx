import { MARS_ZONE_COLORS, MARS_ZONE_BG, MARS_ZONE_LABELS, MARS_ZONE_TYPE_LABELS } from '../data/marsZones'

const SEV_COLORS = { ok: '#00ff88', warning: '#ff6b35', critical: '#ff0040' }
const SEV_BG = { ok: 'rgba(0,255,136,0.07)', warning: 'rgba(255,107,53,0.07)', critical: 'rgba(255,0,64,0.07)' }

function GaugeBar({ value, color, label, max = 100 }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-[9px] text-gray-500">
        <span>{label}</span>
        <span style={{ color }}>{typeof value === 'number' && max === 100 ? `${value}%` : value}</span>
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

function MetricCard({ label, value, color, alert }) {
  return (
    <div
      className="rounded-lg p-2.5 flex flex-col gap-1"
      style={{
        background: alert ? 'rgba(255,0,64,0.07)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${alert ? 'rgba(255,0,64,0.28)' : 'rgba(255,107,53,0.12)'}`,
      }}
    >
      <span className="text-[9px] text-gray-500 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-bold leading-snug" style={{ color: color || '#ff8844' }}>{value}</span>
      {alert && <div className="text-[9px] text-red-400 font-medium">⚠ Alerta ativo</div>}
    </div>
  )
}

function AtmosphericPanel({ atmospheric }) {
  const dustColor = atmospheric.dustRiskIndex > 60 ? '#ff0040'
    : atmospheric.dustRiskIndex > 35 ? '#ff6b35' : '#00ff88'

  return (
    <div
      className="rounded-lg p-3 space-y-2.5"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,107,53,0.12)' }}
    >
      <div className="text-[9px] text-gray-500 uppercase tracking-wider">Leituras Atmosféricas</div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-xs font-bold" style={{ color: '#ff8844' }}>{atmospheric.co2Level}</div>
          <div className="text-[8px] text-gray-600 mt-0.5">CO₂ Atm.</div>
        </div>
        <div>
          <div className="text-xs font-bold" style={{ color: dustColor }}>{atmospheric.dustRiskIndex}</div>
          <div className="text-[8px] text-gray-600 mt-0.5">Índice Poeira</div>
        </div>
        <div>
          <div className="text-xs font-bold" style={{ color: '#ffcc44' }}>{atmospheric.solarRadiation}</div>
          <div className="text-[8px] text-gray-600 mt-0.5">W/m² Solar</div>
        </div>
      </div>
      <GaugeBar
        value={atmospheric.dustRiskIndex}
        color={dustColor}
        label="Índice de risco de tempestade"
      />
    </div>
  )
}

function AiChip({ recommendation, severity, action }) {
  const color = SEV_COLORS[severity]
  return (
    <div
      className="rounded-lg p-3 space-y-2"
      style={{ background: SEV_BG[severity], border: `1px solid ${color}28` }}
    >
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
        <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color }}>
          Recomendação IA
        </span>
        <span
          className="ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded"
          style={{ background: SEV_BG[severity], color, border: `1px solid ${color}40` }}
        >
          {severity === 'critical' ? 'CRÍTICO' : severity === 'warning' ? 'ALERTA' : 'NOMINAL'}
        </span>
      </div>
      <p className="text-[10px] text-gray-300 leading-relaxed">{recommendation}</p>
      <div
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-md cursor-default"
        style={{ background: `${color}14`, border: `1px solid ${color}35` }}
      >
        <div className="w-1 h-1 rounded-full" style={{ background: color }} />
        <span className="text-[9px] font-semibold" style={{ color }}>{action}</span>
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

export default function MarsZoneDetail({ zone, onClose }) {
  if (!zone) return null
  const color = MARS_ZONE_COLORS[zone.status]

  return (
    <div className="panel-enter flex flex-col h-full">
      {/* Header */}
      <div
        className="px-4 py-3 border-b flex-shrink-0"
        style={{
          borderColor: `${color}28`,
          background: `linear-gradient(90deg, ${color}07, transparent)`,
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <div
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${zone.status === 'CRITICAL' ? 'critical-pulse' : ''}`}
                style={{ background: color, boxShadow: `0 0 8px ${color}` }}
              />
              <h2 className="text-sm font-bold text-white truncate leading-tight">{zone.name}</h2>
            </div>
            <div className="text-[10px] text-gray-400">{MARS_ZONE_TYPE_LABELS[zone.type]}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              {Math.abs(zone.lat).toFixed(1)}°{zone.lat >= 0 ? 'N' : 'S'} ·{' '}
              {Math.abs(zone.lng).toFixed(1)}°{zone.lng >= 0 ? 'E' : 'W'}
              {zone.personnel > 0 && (
                <span className="ml-2 font-medium" style={{ color: '#ff8844' }}>
                  ◆ {zone.personnel} tripulantes no local
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
              style={{
                background: MARS_ZONE_BG[zone.status],
                color,
                border: `1px solid ${color}40`,
                boxShadow: zone.status === 'CRITICAL' ? `0 0 10px ${color}40` : 'none',
              }}
            >
              {MARS_ZONE_LABELS[zone.status]}
            </span>
            <button onClick={onClose} className="text-gray-600 hover:text-gray-300 transition-colors text-xs p-0.5">
              ✕
            </button>
          </div>
        </div>

        {/* Resource gauge */}
        <div className="mt-3 flex items-center gap-3">
          <div className="relative w-14 h-14 flex-shrink-0">
            <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
              <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,107,53,0.15)" strokeWidth="5" />
              <circle
                cx="28" cy="28" r="22" fill="none" stroke={color} strokeWidth="5"
                strokeDasharray={`${(zone.depletionPct / 100) * 138.2} 138.2`}
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 4px ${color})` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-bold leading-none" style={{ color }}>
                {zone.depletionPct}
              </span>
              <span className="text-[7px] text-gray-600">USADO</span>
            </div>
          </div>
          <div className="flex-1 space-y-1.5">
            <GaugeBar value={zone.depletionPct} color={color} label="Recurso usado" />
            <GaugeBar
              value={Math.max(0, 100 - zone.depletionPct)}
              color="#00ff88"
              label="Capacidade restante"
            />
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

        {/* Primary resource stats */}
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            label="Produção"
            value={`${zone.resourceValue} ${zone.resourceUnit}`}
            color={color}
          />
          <MetricCard
            label="Taxa"
            value={zone.resourceRateUnit}
            color={zone.status === 'CRITICAL' ? '#ff0040' : '#ff8844'}
            alert={zone.status === 'CRITICAL'}
          />
        </div>

        {/* Atmospheric readings */}
        <AtmosphericPanel atmospheric={zone.atmospheric} />

        {/* Structural integrity (habitat zones) */}
        {zone.structuralIntegrity !== null && (
          <div
            className="rounded-lg p-3 space-y-2"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,107,53,0.12)' }}
          >
            <div className="text-[9px] text-gray-500 uppercase tracking-wider">Integridade Estrutural</div>
            <div className="flex items-center gap-3">
              <div
                className="text-2xl font-bold"
                style={{ color: zone.structuralIntegrity >= 90 ? '#00ff88' : zone.structuralIntegrity >= 70 ? '#ff6b35' : '#ff0040' }}
              >
                {zone.structuralIntegrity}%
              </div>
              <div className="flex-1">
                <GaugeBar
                  value={zone.structuralIntegrity}
                  color={zone.structuralIntegrity >= 90 ? '#00ff88' : zone.structuralIntegrity >= 70 ? '#ff6b35' : '#ff0040'}
                  label="Integridade do domo/casco"
                />
              </div>
            </div>
          </div>
        )}

        {/* Zone-specific detail grid */}
        <div
          className="rounded-lg p-3 space-y-2"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,107,53,0.12)' }}
        >
          <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Detalhes da Zona</div>
          <div className="grid grid-cols-1 gap-1.5">
            {Object.entries(zone.details).map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-3">
                <span className="text-[9px] text-gray-600 capitalize flex-shrink-0">
                  {k.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="text-[10px] text-gray-300 text-right leading-tight">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        {zone.alerts.length > 0 && (
          <div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1.5">Alertas ativos</div>
            <div className="space-y-1.5">
              {zone.alerts.map((alert, i) => (
                <div
                  key={i}
                  className="rounded-lg px-3 py-2"
                  style={{ background: 'rgba(255,0,64,0.06)', border: '1px solid rgba(255,0,64,0.22)' }}
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
        <AiChip
          recommendation={zone.aiRecommendation}
          severity={zone.aiSeverity}
          action={zone.aiAction}
        />

        {/* Last scan */}
        <div
          className="rounded-lg p-3"
          style={{ background: 'rgba(255,107,53,0.04)', border: '1px solid rgba(255,107,53,0.15)' }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#ff8844' }} />
            <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: '#ff8844' }}>
              Última varredura orbital
            </span>
          </div>
          <div className="text-[10px] text-gray-300">{formatScanTime(zone.lastScan)}</div>
        </div>

        <div className="flex justify-between text-[9px] text-gray-600 pb-2">
          <span>{zone.type} · {zone.lat.toFixed(1)}°, {zone.lng.toFixed(1)}°</span>
          <span>{zone.personnel > 0 ? `${zone.personnel} pessoas` : 'não tripulada'}</span>
        </div>
      </div>
    </div>
  )
}
