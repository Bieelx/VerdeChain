import { useState } from 'react'
import { suppliers, RISK_COLORS, RISK_BG } from '../data/suppliers'

const SEVERITY_LABEL = {
  CRITICAL: 'CRÍTICO',
  HIGH: 'ALTO',
  MEDIUM: 'MÉDIO',
  LOW: 'BAIXO',
}

const DECISAO_CONFIG = {
  APROVAR: { label: 'APROVAR', color: '#00ff88' },
  MONITORAR: { label: 'MONITORAR', color: '#00d4ff' },
  ANALISE_COMPLEMENTAR: { label: 'ANÁLISE', color: '#ffd700' },
  REJEITAR: { label: 'REJEITAR', color: '#ff0040' },
}

// Digest mockado mas baseado nos dados reais
const DIGEST_ITEMS = [
  { tipo: 'alerta', msg: '3 propriedades no Mato Grosso e Pará tiveram aumento de risco de queimada nos últimos 7 dias', icon: '🔥' },
  { tipo: 'alerta', msg: '2 propriedades entraram em nível CRÍTICO — emissão de apólice suspensa automaticamente', icon: '⚠️' },
  { tipo: 'alerta', msg: 'Déficit hídrico acima da média detectado em 2 propriedades no Cerrado', icon: '☀️' },
  { tipo: 'ok', msg: '2 propriedades (SP e MG) mantiveram risco BAIXO — nenhum alerta ativo', icon: '✅' },
]

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div
      className="flex-1 rounded-xl p-4 flex flex-col gap-1"
      style={{
        background: `${color}08`,
        border: `1px solid ${color}20`,
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] text-gray-500 uppercase tracking-wider">{label}</span>
        <span className="text-base">{icon}</span>
      </div>
      <span className="text-3xl font-bold leading-none" style={{ color }}>{value}</span>
      {sub && <span className="text-[10px] text-gray-600 mt-0.5">{sub}</span>}
    </div>
  )
}

function RankRow({ position, supplier, delta }) {
  const gr = supplier.geoRisk
  if (!gr) return null
  const color = RISK_COLORS[gr.level]
  const decisao = DECISAO_CONFIG[gr.decisaoSugerida]

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.01]"
      style={{
        background: `${color}06`,
        border: `1px solid ${color}18`,
      }}
    >
      <span className="text-[10px] font-bold text-gray-600 w-4 flex-shrink-0">{position}</span>

      {/* Score ring pequeno */}
      <div className="relative w-10 h-10 flex-shrink-0">
        <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
          <circle cx="20" cy="20" r="15" fill="none" stroke="#1a1a2e" strokeWidth="4" />
          <circle
            cx="20" cy="20" r="15" fill="none"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={`${(gr.score / 100) * 94.2} 94.2`}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 3px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[9px] font-bold" style={{ color }}>{gr.score}</span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-white truncate">{supplier.name}</div>
        <div className="text-[9px] text-gray-500">{supplier.region} · {supplier.cultura}</div>
        <div className="text-[9px] text-gray-600">{supplier.areaSegura?.toLocaleString('pt-BR')} ha segurados</div>
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span
          className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
          style={{
            background: RISK_BG[gr.level],
            color,
            border: `1px solid ${color}33`,
          }}
        >
          {SEVERITY_LABEL[gr.level]}
        </span>
        <span
          className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
          style={{
            background: `${decisao.color}12`,
            color: decisao.color,
            border: `1px solid ${decisao.color}25`,
          }}
        >
          {decisao.label}
        </span>
        {delta > 0 && (
          <span className="text-[8px] text-red-400 font-mono">▲ +{delta}pts</span>
        )}
      </div>
    </div>
  )
}

export default function GeoRiskPortfolio() {
  const [filtro, setFiltro] = useState('todos')

  // Métricas calculadas dos dados reais
  const total = suppliers.length
  const emAlerta = suppliers.filter(s => s.geoRisk && ['HIGH', 'CRITICAL'].includes(s.geoRisk.level)).length
  const criticos = suppliers.filter(s => s.geoRisk && s.geoRisk.level === 'CRITICAL').length
  const aprovados = suppliers.filter(s => s.geoRisk && s.geoRisk.decisaoSugerida === 'APROVAR').length

  // Ranking por score decrescente
  const ranking = [...suppliers]
    .filter(s => s.geoRisk)
    .sort((a, b) => b.geoRisk.score - a.geoRisk.score)

  const filtrados = filtro === 'todos'
    ? ranking
    : ranking.filter(s => s.geoRisk.level === filtro)

  // Deltas simulados (deterioração na semana)
  const deltaMap = { 1: 8, 2: 5, 3: 3, 4: 0, 5: 0, 6: 0 }

  const hoje = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric'
  })

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{ background: '#0a0a0f' }}
    >
      {/* Header */}
      <div
        className="flex-shrink-0 px-6 py-4 border-b flex items-center justify-between"
        style={{ borderColor: 'rgba(255,107,53,0.2)', background: 'rgba(255,107,53,0.04)' }}
      >
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#ff6b35" strokeWidth="1.8" fill="rgba(255,107,53,0.15)" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h1 className="text-base font-bold" style={{ color: '#ff6b35' }}>
              GeoRisk <span className="text-white font-normal">— Monitoramento de Carteira</span>
            </h1>
          </div>
          <p className="text-[10px] text-gray-600">
            Inteligência geoespacial contínua · Dados de satélite atualizados em {hoje}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-[10px] text-orange-400 font-semibold uppercase tracking-wider">Ao vivo</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

        {/* Cards de métricas */}
        <div className="flex gap-3">
          <StatCard
            label="Propriedades Monitoradas"
            value={total}
            sub="na carteira ativa"
            color="#00d4ff"
            icon="🛰️"
          />
          <StatCard
            label="Em Alerta"
            value={emAlerta}
            sub="alto ou crítico"
            color="#ffd700"
            icon="⚠️"
          />
          <StatCard
            label="Nível Crítico"
            value={criticos}
            sub="requer ação imediata"
            color="#ff0040"
            icon="🚨"
          />
          <StatCard
            label="Aprovadas"
            value={aprovados}
            sub="baixo risco geoespacial"
            color="#00ff88"
            icon="✅"
          />
        </div>

        {/* Digest da semana */}
        <div
          className="rounded-xl p-4"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Digest da Semana</span>
            <span className="ml-auto text-[9px] text-gray-600">últimos 7 dias</span>
          </div>
          <div className="space-y-2">
            {DIGEST_ITEMS.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 rounded-lg px-3 py-2"
                style={{
                  background: item.tipo === 'alerta' ? 'rgba(255,107,53,0.05)' : 'rgba(0,255,136,0.04)',
                  border: `1px solid ${item.tipo === 'alerta' ? 'rgba(255,107,53,0.15)' : 'rgba(0,255,136,0.12)'}`,
                }}
              >
                <span className="text-sm flex-shrink-0 mt-0.5">{item.icon}</span>
                <p className="text-[11px] text-gray-300 leading-relaxed">{item.msg}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ranking */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">
                Ranking — Maior Score de Risco
              </span>
            </div>
            {/* Filtros */}
            <div
              className="flex rounded-md overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'CRITICAL', label: 'Crítico' },
                { id: 'HIGH', label: 'Alto' },
                { id: 'MEDIUM', label: 'Médio' },
                { id: 'LOW', label: 'Baixo' },
              ].map((f, idx, arr) => (
                <button
                  key={f.id}
                  onClick={() => setFiltro(f.id)}
                  className="px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider transition-all"
                  style={{
                    background: filtro === f.id ? 'rgba(255,107,53,0.15)' : 'transparent',
                    color: filtro === f.id ? '#ff6b35' : '#444455',
                    borderRight: idx < arr.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {filtrados.map((s, i) => (
              <RankRow
                key={s.id}
                position={i + 1}
                supplier={s}
                delta={deltaMap[s.id] || 0}
              />
            ))}
            {filtrados.length === 0 && (
              <div className="text-center py-8 text-[11px] text-gray-600">
                Nenhuma propriedade neste nível de risco
              </div>
            )}
          </div>
        </div>

        {/* Rodapé disclaimer */}
        <div
          className="rounded-xl px-4 py-3 flex items-start gap-2"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <span className="text-gray-600 text-xs mt-0.5">ℹ️</span>
          <p className="text-[10px] text-gray-600 leading-relaxed">
            <strong className="text-gray-500">GeoRisk não vende seguro.</strong> Os scores e decisões sugeridas são baseados em dados geoespaciais de satélite e servem como camada de inteligência complementar. Cada seguradora aplica suas próprias regras atuariais e tem autonomia total sobre aceitação, precificação e gestão de risco.
          </p>
        </div>

      </div>
    </div>
  )
}
