import { useState } from 'react'
import { RISK_COLORS, RISK_BG } from '../data/suppliers'
import { generateGeoRiskReport } from '../utils/geoRiskReport'

const SEVERITY_LABEL = {
  CRITICAL: 'CRÍTICO',
  HIGH: 'ALTO',
  MEDIUM: 'MÉDIO',
  LOW: 'BAIXO',
}

const DECISAO_CONFIG = {
  APROVAR: { label: 'APROVAR', color: '#00ff88', bg: 'rgba(0,255,136,0.1)', msg: 'Risco aceitável. Apólice pode ser emitida normalmente.' },
  MONITORAR: { label: 'MONITORAR', color: '#00d4ff', bg: 'rgba(0,212,255,0.1)', msg: 'Risco moderado. Recomenda-se acompanhamento trimestral.' },
  ANALISE_COMPLEMENTAR: { label: 'ANÁLISE COMPLEMENTAR', color: '#ffd700', bg: 'rgba(255,215,0,0.1)', msg: 'Solicitar vistoria de campo antes de emitir apólice.' },
  REJEITAR: { label: 'REJEITAR', color: '#ff0040', bg: 'rgba(255,0,64,0.1)', msg: 'Encaminhar para análise manual. Risco geoespacial crítico identificado.' },
}

const FATOR_CONFIG = [
  { key: 'queimadas',         label: 'Queimadas',       max: 30, icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 2c0 0-7 7-7 13a7 7 0 0 0 14 0c0-6-7-13-7-13z" stroke="#ff6b35" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { key: 'seca',              label: 'Seca',             max: 25, icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="#ffd700" strokeWidth="1.5"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="#ffd700" strokeWidth="1.4" strokeLinecap="round"/></svg> },
  { key: 'vegetacao',         label: 'Saúde Vegetação', max: 20, icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M2 22c0 0 4-8 10-10" stroke="#00e07a" strokeWidth="1.5" strokeLinecap="round"/><path d="M12 12C12 6 17 2 22 2c0 5-4 10-10 10z" stroke="#00e07a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { key: 'historicoSinistros',label: 'Hist. Sinistros', max: 15, icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><rect x="4" y="2" width="16" height="20" rx="2" stroke="#00d4ff" strokeWidth="1.5"/><line x1="8" y1="8" x2="16" y2="8" stroke="#00d4ff" strokeWidth="1.3" strokeLinecap="round"/><line x1="8" y1="12" x2="16" y2="12" stroke="#00d4ff" strokeWidth="1.3" strokeLinecap="round"/><line x1="8" y1="16" x2="12" y2="16" stroke="#00d4ff" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { key: 'areaCritica',       label: 'Área Crítica',    max: 10, icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#ff0040" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="#ff0040" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="17" r="0.7" fill="#ff0040"/></svg> },
]

// Histórico simulado de evolução do score (últimos 6 meses)
const HISTORICO_MOCK = {
  1: [62, 70, 78, 85, 91, 100],
  2: [55, 58, 63, 67, 72, 78],
  3: [50, 52, 55, 58, 62, 65],
  4: [38, 40, 42, 43, 44, 44],
  5: [15, 14, 13, 13, 12, 12],
  6: [20, 22, 21, 23, 22, 22],
}
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']

function MetricCard({ label, value, unit, color, icon, alert }) {
  return (
    <div
      className="rounded-lg p-3 flex flex-col gap-1"
      style={{
        background: alert ? `${RISK_COLORS.CRITICAL}08` : 'rgba(255,255,255,0.03)',
        border: `1px solid ${alert ? RISK_COLORS.CRITICAL + '33' : 'rgba(255,255,255,0.07)'}`,
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
      {alert && <div className="text-[9px] font-medium" style={{ color: RISK_COLORS.CRITICAL }}>Alerta ativo</div>}
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
            background: color,
            opacity: 0.85,
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </div>
  )
}

function FatorBar({ label, icon, value, max }) {
  const pct = Math.min(100, (value / max) * 100)
  const color = pct >= 80 ? '#ff0040' : pct >= 60 ? '#ff6b35' : pct >= 40 ? '#ffd700' : '#00ff88'
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">{icon}</span>
          <span className="text-[9px] text-gray-400">{label}</span>
        </div>
        <span className="text-[9px] font-bold font-mono" style={{ color }}>
          {value}<span className="text-gray-600">/{max}</span>
        </span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: color,
            opacity: 0.8,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
    </div>
  )
}

function ScoreRing({ score, color }) {
  const circumference = 138.2
  const dash = (score / 100) * circumference
  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
        <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
        <circle
          cx="28" cy="28" r="22" fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          style={{}}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-bold leading-none" style={{ color }}>{score}</span>
        <span className="text-[7px] text-gray-600">RISCO</span>
      </div>
    </div>
  )
}

// Gráfico de evolução sparkline SVG
function EvolucaoChart({ supplierId, color }) {
  const data = HISTORICO_MOCK[supplierId] || [50, 50, 50, 50, 50, 50]
  const min = 0
  const max = 100
  const W = 260
  const H = 52
  const padX = 28
  const padY = 6

  const points = data.map((v, i) => {
    const x = padX + (i / (data.length - 1)) * (W - padX - 8)
    const y = padY + ((max - v) / (max - min)) * (H - padY * 2)
    return [x, y]
  })

  const polyline = points.map(([x, y]) => `${x},${y}`).join(' ')

  // Área preenchida
  const areaPoints = [
    `${points[0][0]},${H - padY}`,
    ...points.map(([x, y]) => `${x},${y}`),
    `${points[points.length - 1][0]},${H - padY}`,
  ].join(' ')

  const last = data[data.length - 1]
  const prev = data[data.length - 2]
  const delta = last - prev
  const deltaColor = delta > 0 ? '#ff0040' : delta < 0 ? '#00ff88' : '#888'
  const deltaSign = delta > 0 ? '▲' : delta < 0 ? '▼' : '—'

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] text-gray-500 uppercase tracking-wider">Evolução do Score (6 meses)</span>
        <span className="text-[9px] font-bold font-mono" style={{ color: deltaColor }}>
          {deltaSign} {Math.abs(delta)} pts esta semana
        </span>
      </div>
      <div
        className="rounded-lg overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1a1a2e' }}
      >
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          {/* Grid lines */}
          {[25, 50, 75].map(v => {
            const gy = padY + ((max - v) / max) * (H - padY * 2)
            return (
              <line key={v} x1={padX} y1={gy} x2={W - 4} y2={gy}
                stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" strokeDasharray="3,3" />
            )
          })}
          {/* Area fill */}
          <polygon points={areaPoints} fill={`${color}12`} />
          {/* Line */}
          <polyline points={polyline} fill="none" stroke={color} strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 3px ${color}88)` }} />
          {/* Dots */}
          {points.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i === points.length - 1 ? 3 : 1.5}
              fill={color} style={{ filter: `drop-shadow(0 0 2px ${color})` }} />
          ))}
          {/* Labels eixo X */}
          {MESES.map((m, i) => {
            const x = padX + (i / (data.length - 1)) * (W - padX - 8)
            return (
              <text key={m} x={x} y={H - 1} textAnchor="middle"
                fontSize="7" fill="#444455">{m}</text>
            )
          })}
          {/* Labels eixo Y */}
          {[0, 50, 100].map(v => {
            const gy = padY + ((max - v) / max) * (H - padY * 2)
            return (
              <text key={v} x={padX - 3} y={gy + 2.5} textAnchor="end"
                fontSize="7" fill="#333344">{v}</text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

// ─── Aba ESG ───────────────────────────────────────────────────────────────
function TabESG({ supplier }) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <MetricCard
          label="Desmatamento"
          value={supplier.deforestationAlert}
          unit="%"
          color={supplier.deforestationAlert > 30 ? RISK_COLORS.CRITICAL : supplier.deforestationAlert > 10 ? RISK_COLORS.HIGH : '#00ff88'}
          icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 3v18M3 12l4-4M3 12l4 4M21 12l-4-4M21 12l-4 4" stroke="#00e07a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          alert={supplier.deforestationAlert > 30}
        />
        <MetricCard
          label="Focos de Calor"
          value={supplier.fireHotspots}
          unit="focos"
          color={supplier.fireHotspots > 50 ? RISK_COLORS.CRITICAL : supplier.fireHotspots > 10 ? RISK_COLORS.HIGH : '#00ff88'}
          icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 2c0 0-7 7-7 13a7 7 0 0 0 14 0c0-6-7-13-7-13z" stroke="#ff6b35" strokeWidth="1.5" strokeLinecap="round"/></svg>}
          alert={supplier.fireHotspots > 50}
        />
        <MetricCard
          label="Carbono Est."
          value={(supplier.carbonEstimate / 1000).toFixed(1)}
          unit="ktCO₂"
          color="#00d4ff"
          icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><polyline points="1,4 1,10 7,10" stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        />
        <MetricCard
          label="Mud. Uso Terra"
          value={supplier.landUseChange}
          unit="%"
          color={supplier.landUseChange > 15 ? RISK_COLORS.HIGH : supplier.landUseChange > 5 ? RISK_COLORS.MEDIUM : '#00ff88'}
          icon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><line x1="8" y1="2" x2="8" y2="18" stroke="#aaa" strokeWidth="1.3" strokeLinecap="round"/><line x1="16" y1="6" x2="16" y2="22" stroke="#aaa" strokeWidth="1.3" strokeLinecap="round"/></svg>}
        />
      </div>

      <div
        className="rounded-lg p-3"
        style={{
          background: supplier.protectedAreaProximity < 5 ? `${RISK_COLORS.CRITICAL}08` : 'rgba(255,255,255,0.03)',
          border: `1px solid ${supplier.protectedAreaProximity < 5 ? RISK_COLORS.CRITICAL + '33' : 'rgba(255,255,255,0.07)'}`,
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

      <div>
        <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1.5">Certificações</div>
        {supplier.certifications.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {supplier.certifications.map((cert) => (
              <span
                key={cert}
                className="text-[9px] px-2 py-0.5 rounded-full"
                style={{
                  background: cert.includes('exp') || cert.includes('pendente') ? 'rgba(255,107,53,0.12)' : 'rgba(0,255,136,0.1)',
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

      {supplier.alerts.length > 0 && (
        <div>
          <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1.5">Alertas Ativos</div>
          <div className="space-y-1.5">
            {supplier.alerts.map((alert, i) => (
              <div key={i} className="rounded-lg px-3 py-2"
                style={{ background: 'rgba(255,0,64,0.06)', border: '1px solid rgba(255,0,64,0.2)' }}>
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
        style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.2)' }}
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[9px] text-cyan-400 font-semibold uppercase tracking-wider">Recomendação IA</span>
          <span className="ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded"
            style={{
              background: RISK_BG[supplier.aiSeverity],
              color: RISK_COLORS[supplier.aiSeverity],
              border: `1px solid ${RISK_COLORS[supplier.aiSeverity]}44`,
            }}>
            {SEVERITY_LABEL[supplier.aiSeverity]}
          </span>
        </div>
        <p className="text-[10px] text-gray-300 leading-relaxed">{supplier.aiRecommendation}</p>
      </div>

      <div className="flex justify-between text-[9px] text-gray-600 pb-2">
        <span>{supplier.hectares.toLocaleString('pt-BR')} ha</span>
        <span>Última auditoria: {supplier.lastAudit}</span>
        <span>{supplier.state}</span>
      </div>
    </div>
  )
}

// ─── Aba GeoRisk ───────────────────────────────────────────────────────────
function TabGeoRisk({ supplier, onGerarLaudo }) {
  const gr = supplier.geoRisk
  if (!gr) return (
    <div className="flex-1 flex items-center justify-center text-[11px] text-gray-600">
      Dados GeoRisk não disponíveis
    </div>
  )

  const levelColor = RISK_COLORS[gr.level]
  const decisao = DECISAO_CONFIG[gr.decisaoSugerida]

  // Tendência da semana
  const hist = HISTORICO_MOCK[supplier.id] || []
  const delta = hist.length >= 2 ? hist[hist.length - 1] - hist[hist.length - 2] : 0
  const deltaColor = delta > 0 ? '#ff0040' : delta < 0 ? '#00ff88' : '#888'
  const deltaSign = delta > 0 ? '▲' : delta < 0 ? '▼' : '—'

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

      {/* Score header */}
      <div className="rounded-lg p-3" style={{ background: `${levelColor}08`, border: `1px solid ${levelColor}25` }}>
        <div className="flex items-center gap-3">
          <ScoreRing score={gr.score} color={levelColor} />
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                style={{ background: RISK_BG[gr.level], color: levelColor, border: `1px solid ${levelColor}44` }}>
                {SEVERITY_LABEL[gr.level]}
              </span>
              <span className="text-[9px] font-bold font-mono" style={{ color: deltaColor }}>
                {deltaSign} {Math.abs(delta)} pts
              </span>
            </div>
            <div className="text-[9px] text-gray-500">
              Cultura: <span className="text-gray-300">{supplier.cultura}</span>
            </div>
            <div className="text-[9px] text-gray-500">
              Área segurada: <span className="text-gray-300">{supplier.areaSegura?.toLocaleString('pt-BR')} ha</span>
            </div>
            <div className="text-[9px] text-gray-600">
              Varredura: <span className="text-gray-500">{gr.ultimaVarredura}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Evolução do score */}
      <EvolucaoChart supplierId={supplier.id} color={levelColor} />

      {/* Breakdown dos fatores */}
      <div className="rounded-lg p-3 space-y-2.5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1a1a2e' }}>
        <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Breakdown dos Fatores</div>
        {FATOR_CONFIG.map((f) => (
          <FatorBar key={f.key} label={f.label} icon={f.icon} value={gr.fatores[f.key]} max={f.max} />
        ))}
      </div>

      {/* Alertas GeoRisk */}
      {gr.alertasGeoRisk.length > 0 ? (
        <div>
          <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1.5">Alertas GeoRisk</div>
          <div className="space-y-1.5">
            {gr.alertasGeoRisk.map((alert, i) => {
              const ac = RISK_COLORS[alert.severidade] || '#ff6b35'
              return (
                <div key={i} className="rounded-lg px-3 py-2"
                  style={{ background: `${ac}08`, border: `1px solid ${ac}28` }}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[8px] font-bold tracking-wider" style={{ color: ac }}>{alert.tipo}</span>
                    <span className="text-[8px] text-gray-600">{alert.data}</span>
                  </div>
                  <div className="text-[10px] text-gray-300">{alert.msg}</div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-lg px-3 py-2.5 flex items-center gap-2"
          style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)' }}>
          <span className="text-sm">✅</span>
          <span className="text-[10px] text-green-400">Nenhum alerta geoespacial ativo</span>
        </div>
      )}

      {/* Decisão sugerida */}
      <div className="rounded-lg p-3"
        style={{ background: `${decisao.color}08`, border: `1px solid ${decisao.color}28` }}>
        <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-2">Decisão Sugerida</div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider"
            style={{ background: `${decisao.color}18`, color: decisao.color, border: `1px solid ${decisao.color}44`, boxShadow: `0 0 8px ${decisao.color}22` }}>
            {decisao.label}
          </span>
        </div>
        <p className="text-[10px] text-gray-300 leading-relaxed mb-2">{decisao.msg}</p>
        <div className="rounded px-2 py-1.5 flex items-start gap-1.5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-[9px] text-gray-600 mt-0.5">⚠</span>
          <p className="text-[9px] text-gray-600 leading-relaxed">
            Esta decisão é baseada em dados geoespaciais de satélite. A seguradora aplica suas próprias regras atuariais e tem autonomia total sobre a aceitação do risco.
          </p>
        </div>
      </div>

      {/* Botão gerar laudo */}
      <button
        onClick={onGerarLaudo}
        className="w-full py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
        style={{
          background: 'rgba(255,107,53,0.12)',
          border: '1px solid rgba(255,107,53,0.35)',
          color: '#ff6b35',
          boxShadow: '0 0 12px rgba(255,107,53,0.1)',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        Gerar Laudo GeoRisk (PDF)
      </button>

    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────
export default function SupplierDetail({ supplier, onClose }) {
  const [activeTab, setActiveTab] = useState('esg')
  const [laudoGerado, setLaudoGerado] = useState(false)

  if (!supplier) return null
  const riskColor = RISK_COLORS[supplier.risk]

  const tabs = [
    { id: 'esg', label: 'ESG' },
    { id: 'georisk', label: 'GeoRisk' },
  ]

  const handleGerarLaudo = () => {
    generateGeoRiskReport(supplier)
    setLaudoGerado(true)
    setTimeout(() => setLaudoGerado(false), 3000)
  }

  return (
    <div className="panel-enter flex flex-col h-full">
      {/* Header */}
      <div
        className="px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: '#1a1a2e' }}
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
            <button onClick={onClose} className="text-gray-600 hover:text-gray-300 transition-colors text-xs p-0.5">✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-3 flex rounded-md overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          {tabs.map((tab, idx) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-200"
              style={{
                background: activeTab === tab.id
                  ? tab.id === 'georisk' ? 'rgba(255,107,53,0.15)' : `${riskColor}15`
                  : 'transparent',
                color: activeTab === tab.id
                  ? tab.id === 'georisk' ? '#ff6b35' : riskColor
                  : '#444455',
                borderRight: idx < tabs.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
              }}
            >
              {tab.id === 'georisk' && <span className="mr-1">🛰</span>}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Toast laudo gerado */}
        {laudoGerado && (
          <div className="mt-2 rounded-lg px-3 py-1.5 flex items-center gap-2 panel-enter"
            style={{ background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.3)' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ff6b35" strokeWidth="2.5">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
            <span className="text-[9px] text-orange-400 font-medium">Laudo GeoRisk gerado com sucesso!</span>
          </div>
        )}
      </div>

      {/* Tab content */}
      {activeTab === 'esg' ? (
        <TabESG supplier={supplier} />
      ) : (
        <TabGeoRisk supplier={supplier} onGerarLaudo={handleGerarLaudo} />
      )}
    </div>
  )
}
