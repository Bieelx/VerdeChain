import { suppliers } from '../data/suppliers'

function StatItem({ label, value, sub, color, pulse }) {
  return (
    <div className="flex-1 flex items-center gap-3 px-5 py-0" style={{ borderRight: '1px solid rgba(255,255,255,0.07)' }}>
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-bold leading-none tabular-nums stat-enter" style={{ color }}>{value}</span>
          {pulse && <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse" style={{ color }} />}
        </div>
        <div className="text-[9px] text-gray-600 mt-0.5 uppercase tracking-wider">{label}</div>
        {sub && <div className="text-[9px] mt-0.5" style={{ color: `${color}88` }}>{sub}</div>}
      </div>
    </div>
  )
}

export default function BottomStats({ onExport }) {
  const totalCarbon   = suppliers.reduce((a, s) => a + s.carbonEstimate, 0)
  const avgCompliance = Math.round(suppliers.reduce((a, s) => a + s.complianceScore, 0) / suppliers.length)
  const activeAlerts  = suppliers.reduce((a, s) => a + s.alerts.length, 0)
  const criticalCount = suppliers.filter(s => s.risk === 'CRITICAL').length

  return (
    <div className="flex items-stretch border-t flex-shrink-0" style={{ height: '56px', borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(8,8,14,0.97)' }}>
      <StatItem label="Fornecedores" value={suppliers.length} sub={`${criticalCount} críticos`} color="#00d4ff" />
      <StatItem label="Alertas ativos" value={activeAlerts} sub="últimos 30 dias" color="#ff6b35" pulse={activeAlerts > 0} />
      <StatItem label="Risco de Carbono" value={`${(totalCarbon / 1000).toFixed(0)}k`} sub="tCO₂ estimado" color="#ffd700" />
      <StatItem
        label="Compliance médio"
        value={`${avgCompliance}%`}
        sub="todos os fornecedores"
        color={avgCompliance >= 70 ? '#00e07a' : avgCompliance >= 50 ? '#ffd700' : '#ff6b35'}
      />

      <div className="flex items-center px-5 flex-shrink-0" style={{ borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-colors duration-150"
          style={{
            background: 'rgba(0,224,122,0.08)',
            border: '1px solid rgba(0,224,122,0.2)',
            color: '#00e07a',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(0,224,122,0.14)'
            e.currentTarget.style.borderColor = 'rgba(0,224,122,0.35)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(0,224,122,0.08)'
            e.currentTarget.style.borderColor = 'rgba(0,224,122,0.2)'
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
