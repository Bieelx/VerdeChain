import { useState, useEffect, useRef, useCallback } from 'react'
import RocketVisualization from './RocketVisualization'
import { MISSIONS, PHASE_LABELS, PHASE_COLORS } from '../data/missionData'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_COLORS = {
  critical: { bg: 'rgba(255,0,64,0.12)', border: 'rgba(255,0,64,0.35)', text: '#ff3355' },
  standard: { bg: 'rgba(0,102,255,0.1)', border: 'rgba(0,102,255,0.3)', text: '#4488ff' },
  optional: { bg: 'rgba(100,100,120,0.12)', border: 'rgba(100,100,120,0.3)', text: '#888899' },
}

const STATUS_CONFIG = {
  completed: { color: '#00ff88', label: 'CONCLUÍDO', dot: '#00ff88' },
  'in-progress': { color: '#0066ff', label: 'EM ANDAMENTO', dot: '#0066ff' },
  upcoming: { color: '#444466', label: 'PRÓXIMO', dot: '#333355' },
}

const PRIORITY_LABELS = {
  critical: 'crítico',
  standard: 'padrão',
  optional: 'opcional',
}

const BODY_LABELS = {
  earth: 'TERRA',
  moon: 'LUA',
  mars: 'MARTE',
}

function fmt(n) {
  return n >= 1000000
    ? `${(n / 1000000).toFixed(1)}M`
    : n >= 1000
    ? `${(n / 1000).toFixed(1)}K`
    : String(n)
}

function fmtDist(km) {
  return km >= 1000000
    ? `${(km / 1000000).toFixed(2)}M km`
    : `${km.toLocaleString()} km`
}

// ─── Mission Clock ────────────────────────────────────────────────────────────

function MissionClock({ missionDay }) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])
  const h = Math.floor(tick / 3600)
  const m = Math.floor((tick % 3600) / 60)
  const s = tick % 60
  const pad = (n) => String(n).padStart(2, '0')
  return (
    <div className="flex items-center gap-1.5">
      <span style={{ color: '#0066ff', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.7 }}>MET</span>
      <span className="font-mono font-bold" style={{ color: '#00d4ff', fontSize: '13px', letterSpacing: '1px' }}>
        {missionDay}d {pad(h)}:{pad(m)}:{pad(s)}
      </span>
    </div>
  )
}

// ─── Viz State Toggle ─────────────────────────────────────────────────────────

function VizStateToggle({ vizState, onChange }) {
  const states = [
    { id: 'launch',  label: 'Lançamento',  icon: '🚀' },
    { id: 'transit', label: 'Trânsito', icon: '🛸' },
    { id: 'orbital', label: 'Orbital', icon: '🔵' },
  ]
  return (
    <div
      className="flex rounded-lg overflow-hidden"
      style={{ border: '1px solid rgba(0,102,255,0.3)', background: 'rgba(0,0,20,0.85)', backdropFilter: 'blur(8px)' }}
    >
      {states.map((s, i) => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all duration-200 hover:scale-105"
          style={{
            background: vizState === s.id ? 'rgba(0,102,255,0.25)' : 'transparent',
            color: vizState === s.id ? '#4488ff' : '#334466',
            borderRight: i < states.length - 1 ? '1px solid rgba(0,102,255,0.2)' : 'none',
          }}
        >
          <span style={{ fontSize: '10px' }}>{s.icon}</span>
          {s.label}
        </button>
      ))}
    </div>
  )
}

// ─── Tab: Cargo Manifest ──────────────────────────────────────────────────────

function CargoTab({ mission }) {
  const totalWeight = mission.cargo.flatMap((c) => c.items).reduce((a, i) => a + i.weight, 0)
  const totalVol = mission.cargo.flatMap((c) => c.items).reduce((a, i) => a + i.volume, 0)

  return (
    <div className="flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: '100%' }}>
      {/* Summary */}
      <div className="flex gap-2">
        {[
          { label: 'Massa total', value: `${(totalWeight / 1000).toFixed(1)} t` },
          { label: 'Volume total', value: `${totalVol.toFixed(1)} m³` },
          { label: 'Integridade', value: `${mission.cargoIntegrity}%` },
        ].map((s) => (
          <div
            key={s.label}
            className="flex-1 rounded-lg p-2 text-center"
            style={{ background: 'rgba(0,102,255,0.08)', border: '1px solid rgba(0,102,255,0.2)' }}
          >
            <div className="text-xs font-bold" style={{ color: '#4488ff' }}>{s.value}</div>
            <div className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: '#445566' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Category groups */}
      {mission.cargo.map((cat) => (
        <div key={cat.category}>
          <div
            className="flex items-center gap-1.5 px-2 py-1 mb-1 rounded"
            style={{ background: 'rgba(0,40,80,0.4)', borderLeft: '2px solid #0066ff' }}
          >
            <span style={{ fontSize: '11px' }}>{cat.icon}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#6699cc' }}>
              {cat.category}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {cat.items.map((item) => {
              const pc = PRIORITY_COLORS[item.priority]
              return (
                <div
                  key={item.name}
                  className="flex items-start justify-between gap-2 rounded px-2.5 py-1.5"
                  style={{ background: 'rgba(0,10,30,0.5)', border: '1px solid rgba(0,50,100,0.3)' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium truncate" style={{ color: '#ccddeeff' }}>{item.name}</div>
                    <div className="text-[9px] mt-0.5" style={{ color: '#446688' }}>
                    {item.weight.toLocaleString('pt-BR')} kg · {item.volume} m³ · {item.destination}
                    </div>
                  </div>
                  <span
                    className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{ background: pc.bg, border: `1px solid ${pc.border}`, color: pc.text }}
                  >
                    {PRIORITY_LABELS[item.priority] ?? item.priority}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Tab: Fuel & Energy ───────────────────────────────────────────────────────

function AnimatedGauge({ pct, color, label, sub }) {
  const barRef = useRef()
  useEffect(() => {
    if (!barRef.current) return
    barRef.current.style.width = '0%'
    const id = setTimeout(() => {
      if (barRef.current) barRef.current.style.width = `${pct}%`
    }, 80)
    return () => clearTimeout(id)
  }, [pct])

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-[10px] uppercase tracking-wider" style={{ color: '#556677' }}>{label}</span>
        <span className="text-sm font-bold font-mono" style={{ color }}>{pct.toFixed(1)}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,30,60,0.6)' }}>
        <div
          ref={barRef}
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            boxShadow: `0 0 8px ${color}66`,
          }}
        />
      </div>
      {sub && <div className="text-[9px] mt-0.5" style={{ color: '#334455' }}>{sub}</div>}
    </div>
  )
}

function FuelTab({ mission }) {
  const { fuel } = mission
  const consumedPct = (fuel.consumed / fuel.loaded) * 100
  const remainPct = 100 - consumedPct

  const rows = [
    { label: 'Tipo de combustível', value: fuel.type },
    { label: 'Total carregado', value: `${(fuel.loaded / 1000).toFixed(0)} t` },
    { label: 'Consumido', value: `${(fuel.consumed / 1000).toFixed(1)} t` },
    { label: 'Restante', value: `${((fuel.loaded - fuel.consumed) / 1000).toFixed(1)} t` },
    { label: 'Taxa de queima', value: fuel.burnRate > 0 ? `${fuel.burnRate} kg/s` : '— (em cruzeiro)' },
    { label: 'Custo energético da missão', value: `${fuel.energyCost.toLocaleString('pt-BR')} MWh` },
    { label: 'CO₂ equivalente', value: `${fuel.co2Emissions.toLocaleString('pt-BR')} t` },
  ]

  return (
    <div className="flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: '100%' }}>
      {/* Gauges */}
      <div
        className="rounded-lg p-3 flex flex-col gap-3"
        style={{ background: 'rgba(0,20,50,0.5)', border: '1px solid rgba(0,80,180,0.25)' }}
      >
        <AnimatedGauge pct={consumedPct} color="#0066ff" label="Combustível Consumido" />
        <AnimatedGauge pct={remainPct} color="#00d4ff" label="Combustível Restante" sub={`${((fuel.loaded - fuel.consumed) / 1000).toFixed(1)} toneladas restantes`} />
        {fuel.burnRate > 0 && (
          <div
            className="flex items-center gap-2 rounded px-3 py-2 mt-1"
            style={{ background: 'rgba(0,102,255,0.1)', border: '1px solid rgba(0,102,255,0.3)' }}
          >
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#0066ff' }} />
            <span className="text-xs font-mono font-bold" style={{ color: '#4488ff' }}>
              QUEIMA ATIVA — {fuel.burnRate} kg/s
            </span>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="flex flex-col gap-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between items-baseline px-2 py-1" style={{ borderBottom: '1px solid rgba(0,50,100,0.2)' }}>
            <span className="text-[10px] uppercase tracking-wider" style={{ color: '#445566' }}>{r.label}</span>
            <span className="text-[11px] font-mono font-semibold" style={{ color: '#aaccee' }}>{r.value}</span>
          </div>
        ))}
      </div>

      {/* Tree offset card */}
      <div
        className="rounded-lg p-3"
        style={{ background: 'rgba(0,80,30,0.15)', border: '1px solid rgba(0,200,80,0.2)' }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <span style={{ fontSize: '13px' }}>🌳</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#00aa55' }}>Equivalente de compensação de carbono</span>
        </div>
        <div className="font-mono text-lg font-bold" style={{ color: '#00ff88' }}>
          {fuel.treesToOffset.toLocaleString('pt-BR')} árvores
        </div>
        <div className="text-[9px] mt-1" style={{ color: '#336644' }}>
          Necessárias para compensar {fuel.co2Emissions.toLocaleString('pt-BR')} t CO₂ deste lançamento
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Mission Timeline ────────────────────────────────────────────────────

function TimelineTab({ mission }) {
  const [expandedId, setExpandedId] = useState(null)

  return (
    <div className="flex flex-col overflow-y-auto" style={{ maxHeight: '100%' }}>
      <div className="flex flex-col gap-0 relative">
        {/* Vertical line */}
        <div
          className="absolute left-[18px] top-4 bottom-4 w-px"
          style={{ background: 'linear-gradient(180deg, transparent, rgba(0,102,255,0.4) 10%, rgba(0,102,255,0.4) 90%, transparent)' }}
        />

        {mission.timeline.map((phase, idx) => {
          const cfg = STATUS_CONFIG[phase.status]
          const isExpanded = expandedId === phase.id
          const isActive = phase.status === 'in-progress'

          return (
            <div key={phase.id} className="relative pl-10 pr-1 pb-3">
              {/* Dot */}
              <div
                className="absolute left-[14px] top-1.5 w-[9px] h-[9px] rounded-full border-2"
                style={{
                  background: cfg.dot,
                  borderColor: isActive ? '#0066ff' : cfg.dot,
                  boxShadow: isActive ? `0 0 10px ${cfg.dot}` : 'none',
                  animation: isActive ? 'criticalPulse 1.4s ease-in-out infinite' : 'none',
                }}
              />

              <button
                className="w-full text-left rounded-lg px-2.5 py-2 transition-all duration-200"
                style={{
                  background: isExpanded ? 'rgba(0,50,120,0.25)' : isActive ? 'rgba(0,50,120,0.15)' : 'transparent',
                  border: `1px solid ${isExpanded || isActive ? 'rgba(0,102,255,0.3)' : 'transparent'}`,
                }}
                onClick={() => setExpandedId(isExpanded ? null : phase.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold" style={{ color: phase.status === 'upcoming' ? '#445566' : '#aaccee' }}>
                    {phase.name}
                  </span>
                  <span
                    className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      background: `${cfg.color}18`,
                      border: `1px solid ${cfg.color}44`,
                      color: cfg.color,
                    }}
                  >
                    {cfg.label}
                  </span>
                </div>

                <div className="flex gap-3 mt-0.5">
                  <span className="text-[9px] font-mono" style={{ color: '#334455' }}>
                    EST {new Date(phase.est).toLocaleString('pt-BR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {phase.actual && (
                    <span className="text-[9px] font-mono" style={{ color: '#00aa44' }}>
                      REAL {new Date(phase.actual).toLocaleString('pt-BR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </button>

              {isExpanded && (
                <div
                  className="mx-2.5 mt-1 px-2.5 py-2 rounded text-[10px] leading-relaxed"
                  style={{ background: 'rgba(0,20,60,0.5)', border: '1px solid rgba(0,60,120,0.3)', color: '#7799bb' }}
                >
                  {phase.details}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Tab: Environmental Impact ────────────────────────────────────────────────

function ImpactBar({ label, value, max, color }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-[10px] uppercase tracking-wider" style={{ color: '#556677' }}>{label}</span>
        <span className="text-[11px] font-mono font-bold" style={{ color }}>{value.toLocaleString()}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,30,20,0.6)' }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}66, ${color})`, boxShadow: `0 0 6px ${color}55`, transition: 'width 0.8s ease-out' }}
        />
      </div>
    </div>
  )
}

function ImpactTab({ mission }) {
  const { impact } = mission
  const scoreColor = impact.netImpactScore >= 80 ? '#00ff88' : impact.netImpactScore >= 60 ? '#ffd700' : '#ff6b35'
  const improving = impact.previousMissionImprovement <= 0

  return (
    <div className="flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: '100%' }}>
      {/* Net impact score */}
      <div
        className="rounded-lg p-3 flex items-center gap-4"
        style={{ background: 'rgba(0,30,10,0.4)', border: `1px solid ${scoreColor}33` }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ border: `3px solid ${scoreColor}`, boxShadow: `0 0 20px ${scoreColor}44` }}
        >
          <div className="text-center">
            <div className="text-lg font-black font-mono leading-none" style={{ color: scoreColor }}>{impact.netImpactScore}</div>
            <div className="text-[7px] uppercase tracking-wider" style={{ color: `${scoreColor}88` }}>/100</div>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: scoreColor }}>Pontuação de Impacto Líquido</div>
          <div className="text-[10px]" style={{ color: '#556677' }}>
            {improving ? '▼' : '▲'}{' '}
            <span style={{ color: improving ? '#00ff88' : '#ff6b35' }}>
              {Math.abs(impact.previousMissionImprovement)}%
            </span>{' '}
            vs missão anterior
          </div>
        </div>
      </div>

      {/* Emissions breakdown */}
      <div className="flex flex-col gap-2.5 rounded-lg p-3" style={{ background: 'rgba(0,10,30,0.5)', border: '1px solid rgba(0,50,100,0.25)' }}>
        <div className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: '#334455' }}>Análise de Emissões</div>
        <ImpactBar label="CO₂ equivalente (t)" value={impact.co2Emissions} max={5000} color="#ff6b35" />
        <ImpactBar label="Créditos de carbono (t compensadas)" value={impact.carbonCredits} max={2000} color="#00d4ff" />
        <ImpactBar label="Árvores plantadas (equiv.)" value={impact.treesPlanted} max={10000} color="#00ff88" />
      </div>

      {/* Offset strategy */}
      <div className="rounded-lg p-3 flex flex-col gap-2" style={{ background: 'rgba(0,20,40,0.4)', border: '1px solid rgba(0,80,160,0.25)' }}>
        <div className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: '#334455' }}>Estratégia de Compensação</div>
        {[
          { label: 'Recuperação de foguete reutilizável', value: `−${impact.reuseReduction}% emissões`, color: '#00d4ff', icon: '♻' },
          { label: 'Créditos de carbono adquiridos', value: `${impact.carbonCredits.toLocaleString('pt-BR')} t compensadas`, color: '#0066ff', icon: '📋' },
          { label: 'Programa de reflorestamento', value: `${impact.treesPlanted.toLocaleString('pt-BR')} árvores plantadas`, color: '#00ff88', icon: '🌱' },
        ].map((s) => (
          <div key={s.label} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span style={{ fontSize: '10px' }}>{s.icon}</span>
              <span className="text-[10px]" style={{ color: '#6688aa' }}>{s.label}</span>
            </div>
            <span className="text-[10px] font-semibold font-mono" style={{ color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Forest protected */}
      <div
        className="rounded-lg p-3"
        style={{ background: 'rgba(0,60,20,0.15)', border: '1px solid rgba(0,200,80,0.2)' }}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <span style={{ fontSize: '12px' }}>🌿</span>
          <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: '#00aa55' }}>Retorno Ambiental da Missão</span>
        </div>
        <div className="text-[10px] leading-relaxed" style={{ color: '#447755' }}>
          {impact.statement}
        </div>
        <div className="mt-2 font-mono text-sm font-bold" style={{ color: '#00ff88' }}>
          {impact.forestProtected.toLocaleString('pt-BR')} ha protegidos
        </div>
      </div>
    </div>
  )
}

// ─── Right Panel ──────────────────────────────────────────────────────────────

const TABS = [
  { id: 'cargo',    label: 'Carga' },
  { id: 'fuel',     label: 'Combustível' },
  { id: 'timeline', label: 'Linha do Tempo' },
  { id: 'impact',   label: 'Impacto Ambiental' },
]

function RightPanel({ mission }) {
  const [activeTab, setActiveTab] = useState('cargo')

  return (
    <div
      className="flex-shrink-0 flex flex-col"
      style={{
        width: '380px',
        borderLeft: '1px solid rgba(0,102,255,0.2)',
        background: 'rgba(0,3,15,0.95)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Tab headers */}
      <div
        className="flex flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(0,102,255,0.2)', background: 'rgba(0,10,30,0.6)' }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-all duration-200"
            style={{
              color: activeTab === tab.id ? '#4488ff' : '#334455',
              borderBottom: activeTab === tab.id ? '2px solid #0066ff' : '2px solid transparent',
              background: activeTab === tab.id ? 'rgba(0,102,255,0.08)' : 'transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3" style={{ scrollbarWidth: 'thin', scrollbarColor: '#0066ff33 transparent' }}>
        {activeTab === 'cargo'    && <CargoTab mission={mission} />}
        {activeTab === 'fuel'     && <FuelTab mission={mission} />}
        {activeTab === 'timeline' && <TimelineTab mission={mission} />}
        {activeTab === 'impact'   && <ImpactTab mission={mission} />}
      </div>
    </div>
  )
}

// ─── Bottom Stats Bar ─────────────────────────────────────────────────────────

function BottomBar({ mission }) {
  const stats = [
    { label: 'Dia da Missão',      value: `Dia ${mission.missionDay}`,               color: '#0066ff' },
    { label: 'Distância Percorrida', value: fmtDist(mission.distanceTraveled),        color: '#00d4ff' },
    { label: 'Distância Total',    value: fmtDist(mission.totalDistance),             color: '#4488ff' },
    { label: 'Combustível Restante', value: `${mission.fuelRemaining}%`,             color: mission.fuelRemaining < 20 ? '#ff6b35' : '#00d4ff', pulse: mission.fuelRemaining < 20 },
    { label: 'Integridade da Carga', value: `${mission.cargoIntegrity}%`,             color: mission.cargoIntegrity < 95 ? '#ffd700' : '#00ff88' },
    { label: 'Próxima Janela Com.', value: mission.nextCommsWindow,                   color: '#ffffff', pulse: true },
  ]

  return (
    <div
      className="flex-shrink-0 flex items-stretch"
      style={{
        height: '52px',
        borderTop: '1px solid rgba(0,102,255,0.2)',
        background: 'rgba(0,3,15,0.97)',
      }}
    >
      {stats.map((s, i) => (
        <div
          key={s.label}
          className="flex-1 flex flex-col items-center justify-center relative"
          style={{ borderRight: i < stats.length - 1 ? '1px solid rgba(0,80,160,0.2)' : 'none' }}
        >
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold font-mono" style={{ color: s.color }}>
              {s.value}
            </span>
            {s.pulse && (
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: s.color }} />
            )}
          </div>
          <div className="text-[8px] uppercase tracking-widest mt-0.5" style={{ color: '#334455' }}>
            {s.label}
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${s.color}28, transparent)` }}
          />
        </div>
      ))}
    </div>
  )
}

// ─── Mission Selector Header ──────────────────────────────────────────────────

function MissionHeader({ missions, selectedId, onSelect, selectedMission, vizState, onVizStateChange }) {
  const phase = selectedMission.phase
  const phaseColor = PHASE_COLORS[phase] || '#0066ff'
  const phaseLabel = PHASE_LABELS[phase] || phase

  return (
    <div
      className="flex-shrink-0 flex items-center gap-3 px-4"
      style={{
        height: '52px',
        borderBottom: '1px solid rgba(0,102,255,0.2)',
        background: 'rgba(0,3,20,0.98)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Mission buttons */}
      <div
        className="flex rounded-lg overflow-hidden flex-shrink-0"
        style={{ border: '1px solid rgba(0,102,255,0.25)', background: 'rgba(0,0,20,0.7)' }}
      >
        {missions.map((m, i) => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 hover:scale-105"
            style={{
              background: selectedId === m.id ? 'rgba(0,102,255,0.3)' : 'transparent',
              color: selectedId === m.id ? '#4488ff' : '#334466',
              borderRight: i < missions.length - 1 ? '1px solid rgba(0,102,255,0.2)' : 'none',
            }}
          >
            {m.shortName}
          </button>
        ))}
      </div>

      {/* Mission name */}
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold truncate" style={{ color: '#aaccee' }}>
          {selectedMission.name}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded"
            style={{
              background: `${phaseColor}18`,
              border: `1px solid ${phaseColor}44`,
              color: phaseColor,
            }}
          >
            {phaseLabel}
          </span>
          <span className="text-[9px]" style={{ color: '#334455' }}>
            {BODY_LABELS[selectedMission.origin] ?? selectedMission.origin.toUpperCase()} → {BODY_LABELS[selectedMission.destination] ?? selectedMission.destination.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Clock */}
      <MissionClock missionDay={selectedMission.missionDay} />

      {/* Viz state toggle */}
      <VizStateToggle vizState={vizState} onChange={onVizStateChange} />
    </div>
  )
}

// ─── HUD Overlay ──────────────────────────────────────────────────────────────

function HUDOverlay({ vizState, mission }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Grid lines */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,102,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,102,255,0.025) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Corner brackets */}
      {[
        { top: '12px', left: '12px', rotate: '0' },
        { top: '12px', right: '12px', rotate: '90deg' },
        { bottom: '12px', left: '12px', rotate: '270deg' },
        { bottom: '12px', right: '12px', rotate: '180deg' },
      ].map((style, i) => (
        <div key={i} className="absolute" style={{ ...style, width: '20px', height: '20px' }}>
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path d="M0 10 L0 0 L10 0" stroke="#0066ff" strokeWidth="1" fill="none" opacity="0.4" />
          </svg>
        </div>
      ))}

      {/* State label */}
      <div
        className="absolute bottom-4 left-4 text-[9px] uppercase tracking-[4px] font-semibold"
        style={{ color: 'rgba(0,102,255,0.4)' }}
      >
        {vizState === 'launch' ? 'lançamento' : vizState === 'transit' ? 'trânsito' : 'orbital'} — {mission.shortName}
      </div>

      {/* Signal indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        <div className="flex gap-0.5 items-end">
          {[3, 5, 7, 9, 11].map((h, i) => (
            <div
              key={i}
              className="w-[3px] rounded-sm"
              style={{
                height: `${h}px`,
                background: i < 3 ? '#0066ff' : 'rgba(0,102,255,0.2)',
              }}
            />
          ))}
        </div>
        <span className="text-[8px] font-mono" style={{ color: 'rgba(0,102,255,0.5)' }}>LINK</span>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LaunchView() {
  const [selectedMissionId, setSelectedMissionId] = useState('vcl-01')
  const [vizState, setVizState] = useState('launch')
  const mission = MISSIONS.find((m) => m.id === selectedMissionId) || MISSIONS[0]

  const handleSelectMission = useCallback((id) => {
    setSelectedMissionId(id)
  }, [])

  return (
    <div
      className="flex flex-col flex-1 min-h-0"
      style={{ background: '#000005', fontFamily: 'Space Grotesk, Inter, sans-serif' }}
    >
      {/* Mission selector header */}
      <MissionHeader
        missions={MISSIONS}
        selectedId={selectedMissionId}
        onSelect={handleSelectMission}
        selectedMission={mission}
        vizState={vizState}
        onVizStateChange={setVizState}
      />

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* 3D visualization */}
        <div className="flex-1 min-w-0 relative">
          <RocketVisualization vizState={vizState} mission={mission} />
          <HUDOverlay vizState={vizState} mission={mission} />
        </div>

        {/* Right panel */}
        <RightPanel mission={mission} />
      </div>

      {/* Bottom stats */}
      <BottomBar mission={mission} />
    </div>
  )
}
