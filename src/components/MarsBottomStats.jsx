import { useEffect, useRef, useState } from 'react'
import { marsZones, MISSION_LOG, getCurrentSol } from '../data/marsZones'

function StatCard({ label, value, sub, color, pulse, last }) {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center py-1.5 px-2 relative overflow-hidden"
      style={{ borderRight: last ? 'none' : '1px solid rgba(255,107,53,0.15)' }}
    >
      <div className="text-lg font-bold leading-none mb-0.5 stat-enter" style={{ color }}>
        {value}
        {pulse && (
          <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse align-middle" />
        )}
      </div>
      <div className="text-[8px] text-gray-500 uppercase tracking-widest text-center">{label}</div>
      {sub && <div className="text-[8px] mt-0.5 text-center" style={{ color: `${color}88` }}>{sub}</div>}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${color}38, transparent)` }}
      />
    </div>
  )
}

function MissionLogTicker({ entries }) {
  const tickerRef = useRef(null)
  const [offset, setOffset] = useState(0)
  const animRef = useRef(null)
  const pausedRef = useRef(false)

  useEffect(() => {
    let pos = 0
    const step = () => {
      if (!pausedRef.current) {
        pos += 0.4
        const el = tickerRef.current
        if (el) {
          const totalW = el.scrollWidth / 2
          if (pos >= totalW) pos = 0
          el.style.transform = `translateX(-${pos}px)`
        }
      }
      animRef.current = requestAnimationFrame(step)
    }
    animRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  const duplicated = [...entries, ...entries]

  return (
    <div
      className="flex items-center overflow-hidden relative"
      style={{ height: '28px', borderTop: '1px solid rgba(255,107,53,0.12)' }}
      onMouseEnter={() => { pausedRef.current = true }}
      onMouseLeave={() => { pausedRef.current = false }}
    >
      {/* Label */}
      <div
        className="flex-shrink-0 flex items-center gap-1.5 px-3"
        style={{
          height: '100%',
          background: 'rgba(255,107,53,0.10)',
          borderRight: '1px solid rgba(255,107,53,0.20)',
          zIndex: 2,
        }}
      >
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#ff6b35' }} />
        <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: '#ff8844' }}>
          LOG DA MISSÃO
        </span>
      </div>

      {/* Fade edges */}
      <div
        className="absolute left-[88px] w-6 h-full pointer-events-none z-10"
        style={{ background: 'linear-gradient(90deg, rgba(10,3,0,0.95), transparent)' }}
      />
      <div
        className="absolute right-0 w-8 h-full pointer-events-none z-10"
        style={{ background: 'linear-gradient(270deg, rgba(10,3,0,0.95), transparent)' }}
      />

      {/* Scrolling content */}
      <div className="flex-1 overflow-hidden relative">
        <div ref={tickerRef} className="flex items-center whitespace-nowrap" style={{ willChange: 'transform' }}>
          {duplicated.map((entry, i) => (
            <span key={i} className="flex items-center gap-2 mr-10 text-[9px]">
              <span className="font-bold" style={{ color: '#ff8844' }}>Sol {entry.sol}</span>
              <span className="text-gray-400">—</span>
              <span className="text-gray-300">{entry.msg}</span>
              <span style={{ color: 'rgba(255,107,53,0.3)', marginLeft: '12px' }}>◆</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function SupplyWindowChip({ sol }) {
  const nextSupply = 901
  const solsRemaining = nextSupply - sol
  return (
    <div className="flex flex-col items-center">
      <div className="text-lg font-bold leading-none" style={{ color: '#9b59b6' }}>Sol {nextSupply}</div>
      <div className="text-[8px] text-gray-500 uppercase tracking-widest">Próximo Suprimento</div>
      <div className="text-[8px] mt-0.5" style={{ color: '#9b59b699' }}>
        em {solsRemaining} sóis
      </div>
    </div>
  )
}

export default function MarsBottomStats() {
  const sol = getCurrentSol()
  const totalPersonnel = marsZones.reduce((s, z) => s + z.personnel, 0)
  const activeZones = marsZones.filter((z) => z.status === 'STABLE' || z.status === 'ACTIVE').length
  const criticalAlerts = marsZones.filter((z) => z.status === 'CRITICAL').length

  // Total de recursos extraídos (equivalente em toneladas — mineração + água em milhares de L)
  const totalExtracted = marsZones.reduce((s, z) => {
    if (z.type === 'mining') return s + z.resourceValue / 1000
    if (z.type === 'water') return s + (z.resourceRate * sol) / 1000000
    return s
  }, 0)

  return (
    <div
      className="flex-shrink-0 border-t"
      style={{
        borderColor: 'rgba(255,107,53,0.18)',
        background: 'rgba(8,2,0,0.97)',
      }}
    >
      {/* Stats row */}
      <div className="flex items-stretch" style={{ height: '60px' }}>
        <StatCard
          label="Zonas Ativas"
          value={activeZones}
          sub={`de ${marsZones.length} no total`}
          color="#ff8844"
        />
        <StatCard
          label="Equipe"
          value={totalPersonnel}
          sub="tripulação em Marte"
          color="#00d4ff"
        />
        <StatCard
          label="Alertas Críticos"
          value={criticalAlerts}
          sub={criticalAlerts > 0 ? 'ops suspensas' : 'tudo liberado'}
          color={criticalAlerts > 0 ? '#ff0040' : '#00ff88'}
          pulse={criticalAlerts > 0}
        />
        <StatCard
          label="Dia da Missão"
          value={`Sol ${sol}`}
          sub="dia marciano"
          color="#ff6b35"
          pulse
        />
        <div
          className="flex-1 flex items-center justify-center"
          style={{ borderRight: '1px solid rgba(255,107,53,0.15)' }}
        >
          <SupplyWindowChip sol={sol} />
        </div>

        {/* Signal delay indicator */}
        <div className="flex items-center px-4 flex-shrink-0">
          <div
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg"
            style={{
              background: 'rgba(255,107,53,0.06)',
              border: '1px solid rgba(255,107,53,0.22)',
            }}
          >
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#ff6b35' }} />
              <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: '#ff8844' }}>
                Atraso do Sinal
              </span>
            </div>
            <div className="text-sm font-bold leading-none" style={{ color: '#ff6b35' }}>
              14 min 23 s
            </div>
            <div className="text-[8px] text-gray-600">Terra ↔ Marte</div>
          </div>
        </div>
      </div>

      {/* Mission log ticker */}
      <MissionLogTicker entries={MISSION_LOG} />
    </div>
  )
}
