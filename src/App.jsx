import { useState, useCallback, useRef, Suspense, lazy } from 'react'
import TopNav from './components/TopNav'
import Globe3D from './components/Globe3D'
import SupplierList from './components/SupplierList'
import SupplierDetail from './components/SupplierDetail'
import BottomStats from './components/BottomStats'
import MoonGlobe3D from './components/MoonGlobe3D'
import LunarZoneList from './components/LunarZoneList'
import LunarZoneDetail from './components/LunarZoneDetail'
import LunarBottomStats from './components/LunarBottomStats'
import MarsGlobe3D from './components/MarsGlobe3D'
import MarsZoneList from './components/MarsZoneList'
import MarsZoneDetail from './components/MarsZoneDetail'
import MarsBottomStats from './components/MarsBottomStats'
import LaunchView from './components/LaunchView'
import { getSupplierById } from './data/suppliers'
import { getZoneById } from './data/lunarZones'
import { getMarsZoneById } from './data/marsZones'
import { generateESGReport } from './utils/esgReport'

const GeoRiskPortfolio = lazy(() => import('./components/GeoRiskPortfolio'))

function ConstellationBg() {
  const dots = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: (((i * 137.508) % 100 + 100) % 100),
    y: (((i * 73.391) % 100 + 100) % 100),
    size: ((i * 0.618) % 1.5) + 0.3,
    opacity: ((i * 0.414) % 0.4) + 0.05,
  }))

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {dots.map((d) => (
          <circle key={d.id} cx={`${d.x}%`} cy={`${d.y}%`} r={d.size} fill="#ffffff" opacity={d.opacity} />
        ))}
      </svg>
    </div>
  )
}

function ExportToast({ visible }) {
  if (!visible) return null
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 panel-enter">
      <div
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
        style={{
          background: 'rgba(0,255,136,0.12)',
          border: '1px solid rgba(0,255,136,0.4)',
          color: '#00ff88',
          boxShadow: '0 0 30px rgba(0,255,136,0.2)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20,6 9,17 4,12" />
        </svg>
        Relatório ESG gerado com sucesso!
      </div>
    </div>
  )
}

const TRANSITION_LABELS = {
  moon: 'Iniciando Protocolo Lunar',
  mars: 'Iniciando Protocolo Marte',
  earth: 'Retornando à Órbita da Terra',
  launch: 'Lançamento VerdeChain — Controle da Missão',
}

function SpaceTransition({ active, targetView }) {
  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center overflow-hidden"
      style={{
        background: '#000005',
        opacity: active ? 1 : 0,
        transition: active ? 'opacity 0.38s ease-in' : 'opacity 0.55s ease-out',
        pointerEvents: active ? 'all' : 'none',
      }}
    >
      {active && (
        <>
          <div className="warp-container absolute inset-0 flex items-center justify-center">
            {Array.from({ length: 32 }, (_, i) => (
              <div
                key={i}
                className="warp-line"
                style={{
                  transform: `rotate(${i * 11.25}deg)`,
                  animationDelay: `${i * 0.018}s`,
                  background: targetView === 'mars'
                    ? 'linear-gradient(90deg, transparent 0%, rgba(255,107,53,0.5) 30%, rgba(255,107,53,0.1) 70%, transparent 100%)'
                    : targetView === 'launch'
                    ? 'linear-gradient(90deg, transparent 0%, rgba(0,102,255,0.5) 30%, rgba(0,102,255,0.1) 70%, transparent 100%)'
                    : undefined,
                }}
              />
            ))}
          </div>
          <div
            className="relative z-10 text-center"
            style={{ fontFamily: 'Space Grotesk, Inter, sans-serif' }}
          >
            <div
              style={{
                fontSize: '10px',
                letterSpacing: '6px',
                color: targetView === 'mars' ? '#ff8844' : targetView === 'launch' ? '#4488ff' : '#00d4ff',
                opacity: 0.55,
                marginBottom: '10px',
                textTransform: 'uppercase',
              }}
            >
              VerdeChain Espaço
            </div>
            <div
              style={{
                fontSize: '13px',
                letterSpacing: '3px',
                color: targetView === 'mars' ? '#ff8844' : targetView === 'launch' ? '#0066ff' : '#00d4ff',
                textTransform: 'uppercase',
              }}
            >
              {TRANSITION_LABELS[targetView] ?? 'Navegando...'}
            </div>
            <div
              style={{
                marginTop: '16px',
                width: '48px',
                height: '1px',
                background: targetView === 'mars'
                  ? 'linear-gradient(90deg, transparent, #ff8844, transparent)'
                  : targetView === 'launch'
                  ? 'linear-gradient(90deg, transparent, #0066ff, transparent)'
                  : 'linear-gradient(90deg, transparent, #00d4ff, transparent)',
                margin: '16px auto 0',
                opacity: 0.5,
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}

const BG_COLORS = {
  earth: '#0a0a0f',
  moon: '#000008',
  mars: '#080200',
  launch: '#000005',
  georisk: '#0a0a0f',
}

export default function App() {
  const [view, setView] = useState('earth')
  const [transPhase, setTransPhase] = useState('idle')
  const [targetView, setTargetView] = useState(null)
  const transTimersRef = useRef([])

  const [selectedId, setSelectedId] = useState(null)
  const [hoveredId, setHoveredId] = useState(null)
  const [showToast, setShowToast] = useState(false)

  const [selectedZoneId, setSelectedZoneId] = useState(null)
  const [hoveredZoneId, setHoveredZoneId] = useState(null)

  const [selectedMarsZoneId, setSelectedMarsZoneId] = useState(null)
  const [hoveredMarsZoneId, setHoveredMarsZoneId] = useState(null)

  const selectedSupplier = view === 'earth' && selectedId ? getSupplierById(selectedId) : null
  const selectedZone = view === 'moon' && selectedZoneId ? getZoneById(selectedZoneId) : null
  const selectedMarsZone = view === 'mars' && selectedMarsZoneId ? getMarsZoneById(selectedMarsZoneId) : null

  const handleNavigateTo = useCallback((next) => {
    if (transPhase !== 'idle' || next === view) return

    // GeoRisk não tem transição espacial — troca direta
    if (next === 'georisk' || view === 'georisk') {
      setView(next)
      setSelectedId(null)
      setSelectedZoneId(null)
      setSelectedMarsZoneId(null)
      return
    }

    setTargetView(next)
    setTransPhase('active')

    transTimersRef.current.forEach(clearTimeout)
    transTimersRef.current = [
      setTimeout(() => {
        setView(next)
        setSelectedId(null)
        setSelectedZoneId(null)
        setSelectedMarsZoneId(null)
        setHoveredId(null)
        setHoveredZoneId(null)
        setHoveredMarsZoneId(null)
      }, 700),
      setTimeout(() => {
        setTransPhase('idle')
        setTargetView(null)
      }, 1600),
    ]
  }, [transPhase, view])

  const handleSelectSupplier = useCallback((id) => {
    setSelectedId((prev) => (prev === id ? null : id))
  }, [])

  const handleSelectZone = useCallback((id) => {
    setSelectedZoneId((prev) => (prev === id ? null : id))
  }, [])

  const handleSelectMarsZone = useCallback((id) => {
    setSelectedMarsZoneId((prev) => (prev === id ? null : id))
  }, [])

  const handleExport = useCallback(() => {
    generateESGReport()
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }, [])

  const isTransitioning = transPhase === 'active'

  return (
    <div
      className="flex flex-col w-full h-full relative"
      style={{ background: BG_COLORS[view] ?? '#0a0a0f', transition: 'background 0.8s ease' }}
    >
      <ConstellationBg />

      <TopNav view={view} onNavigateTo={handleNavigateTo} />

      <div
        className="flex flex-1 min-h-0 relative"
        style={{
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'scale(1.06)' : 'scale(1)',
          transition: isTransitioning
            ? 'opacity 0.3s ease-in, transform 0.6s ease-in'
            : 'opacity 0.4s ease-out, transform 0.5s ease-out',
        }}
      >
        {view === 'earth' && (
          <>
            <div className="flex-1 min-w-0 relative">
              <Suspense fallback={<GlobeLoader color="#00ff88" msg="Carregando globo..." />}>
                <Globe3D
                  onSupplierHover={setHoveredId}
                  onSupplierClick={handleSelectSupplier}
                  selectedId={selectedId}
                />
              </Suspense>
            </div>
            <div
              className="flex-shrink-0 flex flex-col border-l overflow-hidden"
              style={{
                width: selectedSupplier ? '340px' : '280px',
                borderColor: '#1a1a2e',
                background: 'rgba(10,10,15,0.92)',
                backdropFilter: 'blur(12px)',
                transition: 'width 0.3s ease',
              }}
            >
              {selectedSupplier ? (
                <SupplierDetail supplier={selectedSupplier} onClose={() => setSelectedId(null)} />
              ) : (
                <SupplierList
                  selectedId={selectedId}
                  hoveredId={hoveredId}
                  onSelect={handleSelectSupplier}
                />
              )}
            </div>
          </>
        )}

        {view === 'moon' && (
          <>
            <div className="flex-1 min-w-0 relative">
              <Suspense fallback={<GlobeLoader color="#aaaacc" msg="Carregando globo lunar..." />}>
                <MoonGlobe3D
                  onZoneHover={setHoveredZoneId}
                  onZoneClick={handleSelectZone}
                  selectedId={selectedZoneId}
                />
              </Suspense>
            </div>
            <div
              className="flex-shrink-0 flex flex-col border-l overflow-hidden"
              style={{
                width: selectedZone ? '340px' : '280px',
                borderColor: '#1a1a30',
                background: 'rgba(5,5,15,0.92)',
                backdropFilter: 'blur(12px)',
                transition: 'width 0.3s ease',
              }}
            >
              {selectedZone ? (
                <LunarZoneDetail zone={selectedZone} onClose={() => setSelectedZoneId(null)} />
              ) : (
                <LunarZoneList
                  selectedId={selectedZoneId}
                  hoveredId={hoveredZoneId}
                  onSelect={handleSelectZone}
                />
              )}
            </div>
          </>
        )}

        {view === 'mars' && (
          <>
            <div className="flex-1 min-w-0 relative">
              <Suspense fallback={<GlobeLoader color="#ff8844" msg="Inicializando operações em Marte..." />}>
                <MarsGlobe3D
                  onZoneHover={setHoveredMarsZoneId}
                  onZoneClick={handleSelectMarsZone}
                  selectedId={selectedMarsZoneId}
                />
              </Suspense>
            </div>
            <div
              className="flex-shrink-0 flex flex-col border-l overflow-hidden"
              style={{
                width: selectedMarsZone ? '340px' : '280px',
                borderColor: 'rgba(255,107,53,0.18)',
                background: 'rgba(8,2,0,0.93)',
                backdropFilter: 'blur(12px)',
                transition: 'width 0.3s ease',
              }}
            >
              {selectedMarsZone ? (
                <MarsZoneDetail
                  zone={selectedMarsZone}
                  onClose={() => setSelectedMarsZoneId(null)}
                />
              ) : (
                <MarsZoneList
                  selectedId={selectedMarsZoneId}
                  hoveredId={hoveredMarsZoneId}
                  onSelect={handleSelectMarsZone}
                />
              )}
            </div>
          </>
        )}

        {view === 'launch' && <LaunchView />}
        {view === 'georisk' && (
          <Suspense fallback={<GlobeLoader color="#ff6b35" msg="Carregando GeoRisk..." />}>
            <GeoRiskPortfolio />
          </Suspense>
        )}
      </div>

      {view === 'earth' && <BottomStats onExport={handleExport} />}
      {view === 'moon' && <LunarBottomStats />}
      {view === 'mars' && <MarsBottomStats />}
      {/* launch view manages its own bottom bar */}

      <SpaceTransition active={isTransitioning} targetView={targetView} />
      <ExportToast visible={showToast} />
    </div>
  )
}

function GlobeLoader({ color, msg }) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-sm animate-pulse" style={{ color }}>{msg}</div>
    </div>
  )
}
