import { lunarZones } from '../data/lunarZones'

function StatCard({ label, value, sub, color, pulse }) {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center py-2 px-3 relative overflow-hidden"
      style={{ borderRight: '1px solid #1a1a30' }}
    >
      <div className="text-xl font-bold leading-none mb-0.5 stat-enter" style={{ color }}>
        {value}
        {pulse && (
          <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse align-middle" />
        )}
      </div>
      <div className="text-[9px] text-gray-500 uppercase tracking-widest text-center">{label}</div>
      {sub && <div className="text-[9px] mt-0.5 text-center" style={{ color: `${color}99` }}>{sub}</div>}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${color}44, transparent)` }}
      />
    </div>
  )
}

export default function LunarBottomStats() {
  const activeZones = lunarZones.filter((z) => z.risk === 'STABLE' || z.risk === 'ACTIVE').length
  const criticalAlerts = lunarZones.filter((z) => z.risk === 'CRITICAL').length
  const totalExtracted = lunarZones.reduce((sum, z) => {
    return sum + (z.extractedUnit === 'kg' ? 0 : z.extracted)
  }, 0)

  return (
    <div
      className="flex items-stretch border-t flex-shrink-0"
      style={{
        height: '64px',
        borderColor: '#1a1a30',
        background: 'rgba(5,5,15,0.95)',
      }}
    >
      <StatCard
        label="Zonas Ativas"
        value={activeZones}
        sub={`de ${lunarZones.length} monitoradas`}
        color="#00d4ff"
      />
      <StatCard
        label="Alertas Críticos"
        value={criticalAlerts}
        sub={criticalAlerts > 0 ? 'pausa recomendada' : 'tudo liberado'}
        color={criticalAlerts > 0 ? '#ff0040' : '#00ff88'}
        pulse={criticalAlerts > 0}
      />
      <StatCard
        label="Total Extraído"
        value={`${totalExtracted.toLocaleString()}t`}
        sub="todos os recursos (toneladas)"
        color="#aaaacc"
      />
      <StatCard
        label="Varreduras Orbitais Hoje"
        value={12}
        sub="last: 07:00 UTC"
        color="#00ff88"
      />

      <div className="flex items-center px-4 flex-shrink-0">
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(170,170,204,0.15))',
            border: '1px solid rgba(0,212,255,0.4)',
            color: '#00d4ff',
            boxShadow: '0 0 20px rgba(0,212,255,0.15)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 30px rgba(0,212,255,0.3)'
            e.currentTarget.style.borderColor = 'rgba(0,212,255,0.7)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 20px rgba(0,212,255,0.15)'
            e.currentTarget.style.borderColor = 'rgba(0,212,255,0.4)'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          Relatório Lunar
        </button>
      </div>
    </div>
  )
}
