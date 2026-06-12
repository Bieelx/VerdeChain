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
      id: 'georisk',
      label: 'GeoRisk',
      color: '#ff6b35',
      activeBg: 'rgba(255,107,53,0.18)',
      icon: (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
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

const SECAO_LABELS = {
  carteira: 'Carteira & Alertas',
  mapa: 'Mapa de Calor',
  api: 'Simulador API',
  pricing: 'Pricing',
  cotacao: 'Cotação',
  sinistros: 'Sinistros',
  alertas: 'Alertas',
  exposicao: 'Exposição',
  forecast: 'Forecast',
}

export default function TopNav({ view = 'earth', onNavigateTo, geoSection = 'carteira' }) {
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

  const borderColor = view === 'georisk' ? 'rgba(255,107,53,0.25)' : '#1a1a2e'

  return (
    <header
      className="flex items-center justify-between px-5 py-0 border-b flex-shrink-0"
      style={{
        height: '52px',
        background: 'rgba(10,10,15,0.97)',
        borderColor,
        backdropFilter: 'blur(12px)',
        zIndex: 100,
        transition: 'border-color 0.4s ease, background 0.4s ease',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="relative">
          {view === 'earth' && <LeafIcon />}
          {view === 'georisk' && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#ff6b35" strokeWidth="1.5" fill="rgba(255,107,53,0.15)" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          <div
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse"
            style={{
              background: view === 'georisk' ? '#ff6b35' : '#00ff88',
            }}
          />
        </div>
        <div className="flex flex-col leading-none">
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
          {view === 'georisk' && (
            <>
              <span className="text-base font-bold tracking-tight" style={{ letterSpacing: '-0.02em', color: '#ff6b35' }}>
                Geo<span className="text-white">Risk</span>
              </span>
              <span className="text-[9px] text-gray-500 font-medium tracking-widest uppercase">
                Inteligência Geoespacial para Seguros
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
      {view === 'georisk' && (
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-4 py-1.5 rounded-full"
            style={{ background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.2)' }}
          >
            <span className="text-xs font-semibold text-white">{SECAO_LABELS[geoSection] ?? geoSection}</span>
            <div className="w-px h-3 bg-gray-700 mx-0.5" />
            <SatelliteIcon />
            <span className="text-xs text-gray-400 font-medium">Sentinel-2 · FIRMS NASA</span>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse ml-1" style={{ background: '#ff6b35' }} />
          </div>
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
          {view === 'georisk' && (
            <>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{ background: 'rgba(255,0,64,0.15)', color: '#ff0040', border: '1px solid rgba(255,0,64,0.3)' }}
              >
                2 Críticos
              </span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{ background: 'rgba(255,107,53,0.12)', color: '#ff6b35', border: '1px solid rgba(255,107,53,0.3)' }}
              >
                Carteira ativa
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
