import { suppliers } from '../data/suppliers'

function StatCard({ label, value, sub, color, pulse }) {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center py-2 px-3 relative overflow-hidden"
      style={{
        borderRight: '1px solid #1a1a2e',
      }}
    >
      <div className="text-xl font-bold leading-none mb-0.5 stat-enter" style={{ color }}>
        {value}
        {pulse && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse align-middle" />}
      </div>
      <div className="text-[9px] text-gray-500 uppercase tracking-widest text-center">{label}</div>
      {sub && <div className="text-[9px] mt-0.5 text-center" style={{ color: `${color}99` }}>{sub}</div>}
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{
        background: `linear-gradient(90deg, transparent, ${color}44, transparent)`,
      }} />
    </div>
  )
}

export default function BottomStats({ onExport }) {
  const totalCarbon = suppliers.reduce((a, s) => a + s.carbonEstimate, 0)
  const avgCompliance = Math.round(suppliers.reduce((a, s) => a + s.complianceScore, 0) / suppliers.length)
  const activeAlerts = suppliers.reduce((a, s) => a + s.alerts.length, 0)
  const criticalCount = suppliers.filter((s) => s.risk === 'CRITICAL').length

  return (
    <div
      className="flex items-stretch border-t flex-shrink-0"
      style={{
        height: '64px',
        borderColor: '#1a1a2e',
        background: 'rgba(10,10,15,0.95)',
      }}
    >
      <StatCard
        label="Total Fornecedores"
        value={suppliers.length}
        sub={`${criticalCount} críticos`}
        color="#00d4ff"
      />
      <StatCard
        label="Alertas Ativos"
        value={activeAlerts}
        sub="nos últimos 30 dias"
        color="#ff6b35"
        pulse={activeAlerts > 0}
      />
      <StatCard
        label="Risco de Carbono Total"
        value={`${(totalCarbon / 1000).toFixed(0)}k`}
        sub="tCO₂ estimado"
        color="#ffd700"
      />
      <StatCard
        label="Compliance Médio"
        value={`${avgCompliance}%`}
        sub="todos os fornecedores"
        color={avgCompliance >= 70 ? '#00ff88' : avgCompliance >= 50 ? '#ffd700' : '#ff6b35'}
      />

      {/* ESG Export Button */}
      <div className="flex items-center px-4 flex-shrink-0">
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,212,255,0.15))',
            border: '1px solid rgba(0,255,136,0.4)',
            color: '#00ff88',
            boxShadow: '0 0 20px rgba(0,255,136,0.15)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 30px rgba(0,255,136,0.3)'
            e.currentTarget.style.borderColor = 'rgba(0,255,136,0.7)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 20px rgba(0,255,136,0.15)'
            e.currentTarget.style.borderColor = 'rgba(0,255,136,0.4)'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          Gerar Relatório ESG
        </button>
      </div>
    </div>
  )
}
