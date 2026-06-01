import { useState, useEffect } from 'react'

function SatelliteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-80">
      <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M19 9l3 3-3 3M9 19l3 3 3-3" stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="3" stroke="#00d4ff" strokeWidth="1.5"/>
      <path d="M12 9V5M12 19v-4M9 12H5M19 12h-4" stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="6" cy="6" r="1.5" fill="#00ff88"/>
    </svg>
  )
}

function LeafIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="none" stroke="#00ff88" strokeWidth="1.5"/>
      <path d="M8 16c2-4 6-6 8-8-2 4-6 6-8 8z" fill="#00ff88" opacity="0.8"/>
      <path d="M12 16v4" stroke="#00ff88" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function MoonPhaseIcon({ color = '#aaaacc' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        stroke={color}
        strokeWidth="1.5"
        fill={`${color}20`}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MarsIcon({ color = '#ff8844' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.6" fill={`${color}15`} />
      <path d="M6 13 Q9 11 12 13 Q15 15 18 13" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.7" />
      <path d="M7 10 Q10 8.5 13 10" stroke={color} strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

function ViewToggle({ view, onNavigateTo }) {
  const tabs = [
    {
      id: 'earth',
      label: 'Terra',
      color: '#00ff88',
      activeBg: 'rgba(0,255,136,0.15)',
      icon: (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="1.8"/>
        </svg>
      ),
    },
    {
      id: 'moon',
      label: 'Lua',
      color: '#aaaacc',
      activeBg: 'rgba(170,170,204,0.18)',
      icon: (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="1.8" fill="none"/>
        </svg>
      ),
    },
    {
      id: 'mars',
      label: 'Marte',
      color: '#ff8844',
      activeBg: 'rgba(255,107,53,0.18)',
      icon: (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" fill="none"/>
          <path d="M7 13 Q10 11 13 13 Q16 15 19 13" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.8"/>
        </svg>
      ),
    },
    {
      id: 'launch',
      label: 'Lançamento',
      color: '#4488ff',
      activeBg: 'rgba(0,102,255,0.22)',
      icon: (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C12 2 6 8 6 14a6 6 0 0 0 12 0c0-6-6-12-6-12z" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
          <path d="M9 21l-2 1M15 21l2 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="12" cy="13" r="1.5" fill="currentColor"/>
        </svg>
      ),
    },
  ]

  return (
    <div
      className="flex items-center gap-0 rounded-lg overflow-hidden"
      style={{
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(255,255,255,0.04)',
      }}
    >
      {tabs.map((tab, idx) => (
        <button
          key={tab.id}
          onClick={() => onNavigateTo(tab.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: view === tab.id ? tab.activeBg : 'transparent',
            color: view === tab.id ? tab.color : '#555566',
            borderRight: idx < tabs.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
          }}
          title={`Alternar para visão: ${tab.label}`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export default function TopNav({ view = 'earth', onNavigateTo }) {
  const [scanMinutes, setScanMinutes] = useState(7)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
      setScanMinutes((m) => (m <= 0 ? 14 : m - 1))
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const timeStr = time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = time.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

  const borderColor = view === 'moon' ? '#1a1a30' : view === 'mars' ? 'rgba(255,107,53,0.2)' : view === 'launch' ? 'rgba(0,102,255,0.25)' : '#1a1a2e'

  return (
    <header
      className="flex items-center justify-between px-5 py-0 border-b flex-shrink-0"
      style={{
        height: '52px',
        background: view === 'mars' ? 'rgba(8,2,0,0.97)' : view === 'launch' ? 'rgba(0,3,18,0.97)' : 'rgba(10,10,15,0.97)',
        borderColor,
        backdropFilter: 'blur(12px)',
        zIndex: 100,
        transition: 'border-color 0.4s ease, background 0.4s ease',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="relative">
          {view === 'moon' && <MoonPhaseIcon />}
          {view === 'earth' && <LeafIcon />}
          {view === 'mars' && <MarsIcon />}
          {view === 'launch' && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C12 2 6.5 7.5 6.5 14a5.5 5.5 0 0 0 11 0C17.5 7.5 12 2 12 2z" stroke="#4488ff" strokeWidth="1.5" fill="rgba(0,102,255,0.15)"/>
              <path d="M9 21.5l-1.5 1M15 21.5l1.5 1" stroke="#4488ff" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="12" cy="13.5" r="1.8" fill="#4488ff"/>
            </svg>
          )}
          <div
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse"
            style={{
              background: view === 'moon' ? '#aaaacc' : view === 'mars' ? '#ff8844' : view === 'launch' ? '#4488ff' : '#00ff88',
            }}
          />
        </div>
        <div className="flex flex-col leading-none">
          {view === 'launch' && (
            <>
              <span className="text-base font-bold tracking-tight" style={{ letterSpacing: '-0.02em', color: '#4488ff' }}>
                Verde<span className="text-white">Chain</span>{' '}
                <span style={{ color: '#0066ff' }}>Lançamento</span>
              </span>
              <span className="text-[9px] text-gray-500 font-medium tracking-widest uppercase">
                Monitor de Recursos da Missão
              </span>
            </>
          )}
          {view === 'moon' && (
            <>
              <span className="text-base font-bold tracking-tight" style={{ letterSpacing: '-0.02em', color: '#aaaacc' }}>
                Verde<span className="text-white">Chain</span>{' '}
                <span style={{ color: '#00d4ff' }}>Espaço</span>
              </span>
              <span className="text-[9px] text-gray-500 font-medium tracking-widest uppercase">
                Monitor Ambiental Lunar
              </span>
            </>
          )}
          {view === 'earth' && (
            <>
              <span className="text-base font-bold tracking-tight neon-text-green" style={{ letterSpacing: '-0.02em' }}>
                Verde<span className="text-white">Chain</span>
              </span>
              <span className="text-[9px] text-gray-500 font-medium tracking-widest uppercase">
                Inteligência ESG de Suprimentos
              </span>
            </>
          )}
          {view === 'mars' && (
            <>
              <span className="text-base font-bold tracking-tight" style={{ letterSpacing: '-0.02em', color: '#ff8844' }}>
                Verde<span className="text-white">Chain</span>{' '}
                <span style={{ color: '#ff6b35' }}>Marte</span>
              </span>
              <span className="text-[9px] text-gray-500 font-medium tracking-widest uppercase">
                Monitor de Recursos Planetários
              </span>
            </>
          )}
        </div>
      </div>

      {/* Center info */}
      {view === 'earth' && (
        <div
          className="flex items-center gap-2 px-4 py-1.5 rounded-full"
          style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}
        >
          <SatelliteIcon />
          <div className="text-xs text-gray-300 font-medium">
            Última varredura por satélite:{' '}
            <span className="neon-text-cyan font-semibold">
              {scanMinutes === 0 ? 'Agora mesmo' : `${scanMinutes} min atrás`}
            </span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse ml-1" />
        </div>
      )}
      {view === 'moon' && (
        <div
          className="flex items-center gap-2 px-4 py-1.5 rounded-full"
          style={{ background: 'rgba(170,170,204,0.06)', border: '1px solid rgba(170,170,204,0.15)' }}
        >
          <MoonPhaseIcon />
          <div className="text-xs text-gray-300 font-medium">
            Distância da Terra:{' '}
            <span className="font-semibold" style={{ color: '#aaaacc' }}>384,400 km</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse ml-1" style={{ background: '#aaaacc' }} />
        </div>
      )}
      {view === 'mars' && (
        <div
          className="flex items-center gap-2 px-4 py-1.5 rounded-full"
          style={{ background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.18)' }}
        >
          <MarsIcon color="#ff8844" />
          <div className="text-xs text-gray-300 font-medium">
            Sistema de coordenadas de Marte{' '}
            <span className="font-mono font-semibold" style={{ color: '#ff8844' }}>
              IAU 2000
            </span>
          </div>
          <div className="w-px h-3 bg-gray-700 mx-1" />
          <div className="text-xs text-gray-300 font-medium">
            Atraso do sinal{' '}
            <span className="font-semibold" style={{ color: '#ff6b35' }}>14 min 23 s</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse ml-1" style={{ background: '#ff8844' }} />
        </div>
      )}
      {view === 'launch' && (
        <div
          className="flex items-center gap-2 px-4 py-1.5 rounded-full"
          style={{ background: 'rgba(0,102,255,0.06)', border: '1px solid rgba(0,102,255,0.2)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#0066ff" strokeWidth="1.5"/>
            <path d="M12 6v6l4 2" stroke="#0066ff" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <div className="text-xs text-gray-300 font-medium">
            Cadeia de suprimentos:{' '}
            <span className="font-semibold" style={{ color: '#4488ff' }}>Terra — Lua — Marte</span>
          </div>
          <div className="w-px h-3 bg-gray-700 mx-1" />
          <div className="text-xs text-gray-300 font-medium">
            3 missões ativas
          </div>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse ml-1" style={{ background: '#0066ff' }} />
        </div>
      )}

      {/* Right */}
      <div className="flex items-center gap-3">
        <ViewToggle view={view} onNavigateTo={onNavigateTo} />

        <div className="text-right hidden sm:block">
          <div className="text-sm font-mono font-semibold text-white">{timeStr}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wide">{dateStr}</div>
        </div>

        <div className="flex items-center gap-1.5">
          {view === 'moon' && (
            <>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{ background: 'rgba(255,0,64,0.15)', color: '#ff0040', border: '1px solid rgba(255,0,64,0.3)' }}
              >
                1 Crítico
              </span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{ background: 'rgba(170,170,204,0.1)', color: '#aaaacc', border: '1px solid rgba(170,170,204,0.25)' }}
              >
                Orbital
              </span>
            </>
          )}
          {view === 'earth' && (
            <>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{ background: 'rgba(255,0,64,0.15)', color: '#ff0040', border: '1px solid rgba(255,0,64,0.3)' }}
              >
                2 Críticos
              </span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.25)' }}
              >
                Ao vivo
              </span>
            </>
          )}
          {view === 'mars' && (
            <>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{ background: 'rgba(255,0,64,0.15)', color: '#ff0040', border: '1px solid rgba(255,0,64,0.3)' }}
              >
                Alerta de tempestade
              </span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{ background: 'rgba(255,107,53,0.12)', color: '#ff8844', border: '1px solid rgba(255,107,53,0.3)' }}
              >
                Ops ao vivo
              </span>
            </>
          )}
          {view === 'launch' && (
            <>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{ background: 'rgba(0,102,255,0.15)', color: '#4488ff', border: '1px solid rgba(0,102,255,0.35)' }}
              >
                Em trânsito
              </span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.25)' }}
              >
                Controle ao vivo
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
