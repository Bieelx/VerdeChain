import { useState, useEffect, useMemo } from 'react'
import { suppliers, RISK_COLORS, RISK_BG } from '../data/suppliers'
import BrazilMap from './BrazilMap'
import {
  AlertCenter,
  ClaimsValidation,
  FinancialExposure,
  PricingIntelligence,
  QuotationSimulator,
  RiskForecast,
} from './GeoRiskAdvancedSections'

const SEVERITY_LABEL = {
  CRITICAL: 'CRÍTICO',
  HIGH: 'ALTO',
  MEDIUM: 'MÉDIO',
  LOW: 'BAIXO',
}

const DECISAO_CONFIG = {
  APROVAR:              { label: 'APROVAR',   color: '#00ff88' },
  MONITORAR:            { label: 'MONITORAR', color: '#00d4ff' },
  ANALISE_COMPLEMENTAR: { label: 'ANÁLISE',   color: '#ffd700' },
  REJEITAR:             { label: 'REJEITAR',  color: '#ff0040' },
}

const DIGEST_ITEMS = [
  {
    tipo: 'alerta',
    msg: '3 propriedades no MT e PA tiveram aumento de risco de queimada nos últimos 7 dias',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <path d="M12 2c0 0-7 7-7 13a7 7 0 0 0 14 0c0-6-7-13-7-13z" stroke="#ff6b35" strokeWidth="1.6" strokeLinecap="round"/>
        <path d="M12 12c0 0-3 3-3 5a3 3 0 0 0 6 0c0-2-3-5-3-5z" fill="rgba(255,107,53,0.3)" stroke="#ff6b35" strokeWidth="1.2"/>
      </svg>
    ),
  },
  {
    tipo: 'alerta',
    msg: '2 propriedades entraram em nível CRÍTICO — emissão de apólice suspensa automaticamente',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#ff0040" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="12" y1="9" x2="12" y2="13" stroke="#ff0040" strokeWidth="1.6" strokeLinecap="round"/>
        <circle cx="12" cy="17" r="0.8" fill="#ff0040"/>
      </svg>
    ),
  },
  {
    tipo: 'alerta',
    msg: 'Déficit hídrico acima da média detectado em 2 propriedades no Cerrado',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="5" stroke="#ffd700" strokeWidth="1.6"/>
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="#ffd700" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    tipo: 'ok',
    msg: '2 propriedades (SP e MG) mantiveram risco BAIXO — nenhum alerta ativo',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#00ff88" strokeWidth="1.6" strokeLinecap="round"/>
        <polyline points="22,4 12,14.01 9,11.01" stroke="#00ff88" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
]

const DELTA_MAP = { 1: 8, 2: 5, 3: 3, 4: 0, 5: 0, 6: 0 }



const SECOES = [
  {
    id: 'carteira',
    label: 'Carteira & Alertas',
    short: 'Carteira',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'mapa',
    label: 'Mapa de Calor',
    short: 'Mapa',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="8" y1="2" x2="8" y2="18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        <line x1="16" y1="6" x2="16" y2="22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'api',
    label: 'Simulador API',
    short: 'Simulador API',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <polyline points="16,18 22,12 16,6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="8,6 2,12 8,18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'pricing',
    label: 'Pricing Intelligence',
    short: 'Pricing',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <line x1="18" y1="20" x2="18" y2="10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        <line x1="12" y1="20" x2="12" y2="4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        <line x1="6" y1="20" x2="6" y2="14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'cotacao',
    label: 'Simulador de Cotação',
    short: 'Cotação',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.6"/>
        <line x1="8" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="8" y1="16" x2="12" y2="16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'sinistro',
    label: 'Validação de Sinistro',
    short: 'Sinistros',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'alertas',
    label: 'Central de Alertas',
    short: 'Alertas',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'exposicao',
    label: 'Exposição Financeira',
    short: 'Exposição',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6"/>
        <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'forecast',
    label: 'Risk Forecast',
    short: 'Forecast',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
]

function MapaBrasil({ suppliers: sups, onHover, hoveredId }) {
  const legend = ['CRITICAL','HIGH','MEDIUM','LOW'].map(level => ({
    color: RISK_COLORS[level],
    label: SEVERITY_LABEL[level],
  }))

  return (
    <BrazilMap
      legendItems={legend}
      renderMarkers={(proj, sw, s, dims) => (
        <>
          {/* Heat blobs */}
          {sups.map(sup => {
            if (!sup.geoRisk) return null
            const pos = proj([sup.lng, sup.lat])
            if (!pos) return null
            const color = RISK_COLORS[sup.geoRisk.level]
            const r = sup.geoRisk.level === 'CRITICAL' ? 20 : sup.geoRisk.level === 'HIGH' ? 14 : 9
            return (
              <circle key={`hz-${sup.id}`} cx={pos[0]} cy={pos[1]} r={r}
                fill={`${color}22`} style={{ filter: `blur(${r * 0.6}px)` }} />
            )
          })}

          {/* Pins */}
          {sups.map(sup => {
            if (!sup.geoRisk) return null
            const pos = proj([sup.lng, sup.lat])
            if (!pos) return null
            const [px, py] = pos
            const color = RISK_COLORS[sup.geoRisk.level]
            const isHov = hoveredId === sup.id
            const r = sw(isHov ? 10 : 7.5)
            const ttLeft = px < dims.w / (2 * s)
            const ttW = sw(114), ttH = sw(40)
            const ttX = ttLeft ? px + sw(12) : px - ttW - sw(12)

            return (
              <g key={sup.id} style={{ cursor: 'pointer' }}
                onMouseEnter={() => onHover(sup.id)}
                onMouseLeave={() => onHover(null)}>
                {sup.geoRisk.level === 'CRITICAL' && (
                  <circle cx={px} cy={py} r={r} fill="none" stroke={color} strokeWidth={sw(0.8)}>
                    <animate attributeName="r" values={`${sw(9)};${sw(22)};${sw(9)}`} dur="2.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0;0.5" dur="2.8s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle cx={px} cy={py} r={r} fill={`${color}1a`} stroke={color} strokeWidth={isHov ? sw(2) : sw(1.4)} />
                <text x={px} y={py + sw(3)} textAnchor="middle"
                  fontSize={sw(isHov ? 7.5 : 6.5)} fontWeight="700"
                  fill={color} fontFamily="Inter, ui-monospace, monospace"
                  style={{ userSelect: 'none' }}>
                  {sup.geoRisk.score}
                </text>
                {!isHov && (
                  <text x={ttLeft ? px + r + sw(3) : px - r - sw(3)} y={py + sw(3)}
                    textAnchor={ttLeft ? 'start' : 'end'}
                    fontSize={sw(5.5)} fill="rgba(255,255,255,0.4)"
                    fontFamily="Inter, sans-serif" style={{ userSelect: 'none' }}>
                    {sup.state}
                  </text>
                )}
                {isHov && (
                  <g>
                    <rect x={ttX} y={py - ttH * 0.5 - sw(2)} width={ttW} height={ttH} rx={sw(3)}
                      fill="rgba(7,7,12,0.97)" stroke={`${color}30`} strokeWidth={sw(0.8)} />
                    <text x={ttX + sw(9)} y={py - ttH * 0.5 + sw(11)} fontSize={sw(8)} fontWeight="600"
                      fill="rgba(255,255,255,0.9)" fontFamily="Inter, sans-serif" style={{ userSelect: 'none' }}>
                      {sup.shortName}
                    </text>
                    <text x={ttX + sw(9)} y={py - ttH * 0.5 + sw(22)} fontSize={sw(6.5)} fill={color}
                      fontFamily="Inter, sans-serif" style={{ userSelect: 'none' }}>
                      {SEVERITY_LABEL[sup.geoRisk.level]} · {sup.geoRisk.score}pts
                    </text>
                    <text x={ttX + sw(9)} y={py - ttH * 0.5 + sw(33)} fontSize={sw(6)}
                      fill="rgba(255,255,255,0.3)" fontFamily="Inter, sans-serif" style={{ userSelect: 'none' }}>
                      {sup.state} · {sup.biome}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </>
      )}
    />
  )
}

function calcScore(lat, lng) {
  const latN = Math.abs(parseFloat(lat) || 0)
  const lngN = Math.abs(parseFloat(lng) || 0)
  const q = Math.min(30, Math.round((latN < 10 ? 20 : latN < 20 ? 14 : 6) + (lngN > 55 ? 8 : 4)))
  const s = Math.min(25, Math.round((latN > 10 && latN < 20 ? 18 : latN < 10 ? 12 : 8)))
  const v = Math.min(20, Math.round((lngN > 50 ? 14 : 8)))
  const h = Math.min(15, Math.round((latN < 15 ? 12 : 7)))
  const a = Math.min(10, Math.round((latN < 10 ? 8 : 4)))
  const score = Math.min(100, q + s + v + h + a)
  const level = score >= 81 ? 'CRITICAL' : score >= 61 ? 'HIGH' : score >= 31 ? 'MEDIUM' : 'LOW'
  const decisao = score >= 81 ? 'REJEITAR' : score >= 61 ? 'ANALISE_COMPLEMENTAR' : score >= 31 ? 'MONITORAR' : 'APROVAR'
  const alertas = []
  if (q >= 20) alertas.push({ tipo: 'QUEIMADA', severidade: 'HIGH', msg: 'Focos de calor detectados no raio de 10km' })
  if (s >= 18) alertas.push({ tipo: 'SECA', severidade: 'MEDIUM', msg: 'Déficit hídrico acima da média histórica' })
  if (v >= 14) alertas.push({ tipo: 'VEGETAÇÃO', severidade: 'MEDIUM', msg: 'NDVI abaixo do índice saudável esperado' })
  return {
    riskScore: score, riskLevel: level,
    fireRisk: q >= 20 ? 'ALTO' : q >= 10 ? 'MÉDIO' : 'BAIXO',
    droughtRisk: s >= 18 ? 'ALTO' : s >= 10 ? 'MÉDIO' : 'BAIXO',
    vegetationHealth: v >= 14 ? 'BAIXA' : v >= 8 ? 'MÉDIA' : 'ALTA',
    historicalLossIndex: parseFloat((score / 130).toFixed(2)),
    fatores: { queimadas: q, seca: s, vegetacao: v, historicoSinistros: h, areaCritica: a },
    decisaoSugerida: decisao,
    alertas,
    ultimaVarredura: new Date().toISOString().slice(0, 10),
    fonte: 'Sentinel-2 · FIRMS NASA · CHIRPS · PRODES',
  }
}

function SimuladorAPI() {
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const PRESETS = [
    { label: 'Amazônia PA', lat: '-4.2', lng: '-55.9' },
    { label: 'Cerrado MT', lat: '-11.6', lng: '-52.4' },
    { label: 'Mata Atlântica MG', lat: '-22.4', lng: '-45.1' },
    { label: 'Cerrado BA', lat: '-12.5', lng: '-41.8' },
  ]

  function consultar() {
    if (!lat || !lng) return
    setLoading(true)
    setResult(null)
    setTimeout(() => { setResult(calcScore(lat, lng)); setLoading(false) }, 900)
  }

  function copiarJSON() {
    if (!result) return
    navigator.clipboard.writeText(JSON.stringify(result, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const levelColor = result ? RISK_COLORS[result.riskLevel] : '#ff6b35'

  return (
    <div className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-2 mb-4">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <polyline points="16,18 22,12 16,6" stroke="#ff6b35" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="8,6 2,12 8,18" stroke="#ff6b35" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Simulador de Consulta API</span>
        <span className="ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(0,255,136,0.08)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.15)' }}>
          POST /v1/score
        </span>
      </div>

      <div className="flex gap-1.5 mb-3 flex-wrap">
        {PRESETS.map(p => (
          <button key={p.label} onClick={() => { setLat(p.lat); setLng(p.lng); setResult(null) }}
            className="text-[8px] px-2 py-1 rounded transition-colors duration-150"
            style={{
              background: lat === p.lat ? 'rgba(255,107,53,0.12)' : 'rgba(255,255,255,0.03)',
              color: lat === p.lat ? '#ff6b35' : '#555566',
              border: `1px solid ${lat === p.lat ? 'rgba(255,107,53,0.25)' : 'rgba(255,255,255,0.07)'}`,
            }}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-3">
        {[
          { label: 'Latitude', value: lat, set: setLat, ph: '-4.2000' },
          { label: 'Longitude', value: lng, set: setLng, ph: '-55.9000' },
        ].map(f => (
          <div key={f.label} className="flex-1">
            <div className="text-[8px] text-gray-600 mb-1 uppercase tracking-wider">{f.label}</div>
            <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph}
              className="w-full px-2.5 py-1.5 rounded text-xs font-mono text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', caretColor: '#ff6b35' }} />
          </div>
        ))}
        <div className="flex items-end">
          <button onClick={consultar} disabled={!lat || !lng || loading}
            className="px-4 py-1.5 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors duration-150"
            style={{
              background: lat && lng && !loading ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.03)',
              color: lat && lng && !loading ? '#ff6b35' : '#333344',
              border: `1px solid ${lat && lng && !loading ? 'rgba(255,107,53,0.3)' : 'rgba(255,255,255,0.06)'}`,
              cursor: lat && lng && !loading ? 'pointer' : 'not-allowed',
            }}>
            {loading ? 'Aguarde...' : 'Consultar'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-4 justify-center">
          <div className="w-1 h-4 rounded-full bg-orange-500 opacity-40 animate-pulse" style={{ animationDelay: '0ms' }} />
          <div className="w-1 h-4 rounded-full bg-orange-500 opacity-40 animate-pulse" style={{ animationDelay: '150ms' }} />
          <div className="w-1 h-4 rounded-full bg-orange-500 opacity-40 animate-pulse" style={{ animationDelay: '300ms' }} />
          <span className="text-[10px] text-gray-600 ml-2">Processando dados geoespaciais...</span>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="flex items-center gap-4 rounded-lg px-4 py-3" style={{ background: `${levelColor}07`, border: `1px solid ${levelColor}20` }}>
            <div className="text-center min-w-[48px]">
              <div className="text-2xl font-bold leading-none tabular-nums" style={{ color: levelColor }}>{result.riskScore}</div>
              <div className="text-[8px] text-gray-600 mt-0.5 uppercase tracking-wider">Score</div>
            </div>
            <div className="w-px h-8 bg-gray-800" />
            <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1">
              {[
                ['Nível', result.riskLevel, levelColor],
                ['Decisão', result.decisaoSugerida.replace('_', ' '), DECISAO_CONFIG[result.decisaoSugerida]?.color],
                ['Queimada', result.fireRisk, '#aaa'],
                ['Seca', result.droughtRisk, '#aaa'],
                ['Vegetação', result.vegetationHealth, '#aaa'],
                ['Loss Index', result.historicalLossIndex, '#aaa'],
              ].map(([k, v, c]) => (
                <div key={k} className="flex items-center gap-1.5">
                  <span className="text-[8px] text-gray-600">{k}:</span>
                  <span className="text-[8px] font-semibold" style={{ color: c }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8px] text-gray-600 uppercase tracking-wider">JSON Response</span>
              <button onClick={copiarJSON} className="text-[8px] px-2 py-0.5 rounded transition-colors"
                style={{
                  background: copied ? 'rgba(0,255,136,0.08)' : 'rgba(255,255,255,0.04)',
                  color: copied ? '#00ff88' : '#555566',
                  border: `1px solid ${copied ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.07)'}`,
                }}>
                {copied ? '✓ Copiado' : 'Copiar JSON'}
              </button>
            </div>
            <pre className="text-[9px] font-mono leading-relaxed overflow-x-auto rounded-lg p-3"
              style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.05)', color: '#7788aa', maxHeight: '180px' }}>
              <span style={{ color: '#444' }}>{'{'}</span>{'\n'}
              {Object.entries({
                riskScore: result.riskScore, riskLevel: result.riskLevel,
                fireRisk: result.fireRisk, droughtRisk: result.droughtRisk,
                vegetationHealth: result.vegetationHealth,
                historicalLossIndex: result.historicalLossIndex,
                decisaoSugerida: result.decisaoSugerida,
              }).map(([k, v]) => (
                <span key={k}>
                  {'  '}<span style={{ color: '#ff8855' }}>"{k}"</span>
                  <span style={{ color: '#444' }}>: </span>
                  <span style={{ color: typeof v === 'number' ? '#00b4d8' : '#00cc77' }}>
                    {typeof v === 'string' ? `"${v}"` : v}
                  </span>
                  {'\n'}
                </span>
              ))}
              <span style={{ color: '#444' }}>{'}'}</span>
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricStrip({ total, emAlerta, criticos, aprovados }) {
  const items = [
    { label: 'Propriedades monitoradas', value: total, color: '#00d4ff' },
    { label: 'Em alerta (alto ou crítico)', value: emAlerta, color: '#ffd700' },
    { label: 'Nível crítico', value: criticos, color: '#ff0040' },
    { label: 'Aprovadas (baixo risco)', value: aprovados, color: '#00ff88' },
  ]
  return (
    <div className="flex-shrink-0 flex items-stretch border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
      {items.map((item, i) => (
        <div key={item.label} className="flex items-center gap-3 px-5 py-3 flex-1" style={{ borderRight: i < items.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
          <span className="text-xl font-bold leading-none tabular-nums" style={{ color: item.color }}>{item.value}</span>
          <span className="text-[10px] text-gray-600 leading-tight">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function RankRow({ position, supplier, delta }) {
  const gr = supplier.geoRisk
  if (!gr) return null
  const color = RISK_COLORS[gr.level]
  const decisao = DECISAO_CONFIG[gr.decisaoSugerida]

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-150 hover:bg-white/[0.02]"
      style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <span className="text-[10px] font-bold text-gray-700 w-4 flex-shrink-0 tabular-nums">{position}</span>

      <div className="relative w-9 h-9 flex-shrink-0">
        <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
          <circle cx="20" cy="20" r="15" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
          <circle cx="20" cy="20" r="15" fill="none" stroke={color} strokeWidth="4"
            strokeDasharray={`${(gr.score / 100) * 94.2} 94.2`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[8px] font-bold tabular-nums" style={{ color }}>{gr.score}</span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-white truncate">{supplier.name}</div>
        <div className="text-[9px] text-gray-600">{supplier.region} · {supplier.cultura}</div>
        <div className="text-[9px] text-gray-700">{supplier.areaSegura?.toLocaleString('pt-BR')} ha segurados</div>
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider"
          style={{ background: RISK_BG[gr.level], color, border: `1px solid ${color}28` }}>
          {SEVERITY_LABEL[gr.level]}
        </span>
        <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider"
          style={{ background: `${decisao.color}10`, color: decisao.color, border: `1px solid ${decisao.color}20` }}>
          {decisao.label}
        </span>
        {delta > 0
          ? <span className="text-[8px] text-red-400 font-mono tabular-nums">▲ +{delta}pts</span>
          : <span className="text-[8px] text-gray-700 font-mono">estável</span>
        }
      </div>
    </div>
  )
}

export default function GeoRiskPortfolio({ onSectionChange }) {
  const [filtro, setFiltro]         = useState('todos')
  const [secao, setSecao]           = useState('carteira')
  const [mapHover, setMapHover]     = useState(null)
  const [seguradora, setSeguradora] = useState('@seguradora')

  useEffect(() => { onSectionChange?.(secao) }, [secao, onSectionChange])

  const total     = suppliers.length
  const emAlerta  = suppliers.filter(s => s.geoRisk && ['HIGH','CRITICAL'].includes(s.geoRisk.level)).length
  const criticos  = suppliers.filter(s => s.geoRisk && s.geoRisk.level === 'CRITICAL').length
  const aprovados = suppliers.filter(s => s.geoRisk && s.geoRisk.decisaoSugerida === 'APROVAR').length

  const ranking = [...suppliers].filter(s => s.geoRisk).sort((a, b) => b.geoRisk.score - a.geoRisk.score)
  const filtrados = filtro === 'todos' ? ranking : ranking.filter(s => s.geoRisk.level === filtro)

  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  const secaoAtual = SECOES.find(s => s.id === secao) ?? SECOES[0]

  return (
    <div className="flex-1 flex overflow-hidden" style={{ background: '#0a0a0f' }}>

      {/* ── Left sidebar navigation ── */}
      <nav className="flex-shrink-0 flex flex-col border-r" style={{ width: '172px', borderColor: '#1a1a2e', background: 'rgba(10,10,15,0.92)' }}>
        <div className="flex-1 overflow-y-auto pt-3 pb-1.5">
          {SECOES.map(s => (
            <button
              key={s.id}
              onClick={() => setSecao(s.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors duration-150"
              style={{
                background: secao === s.id ? 'rgba(255,107,53,0.1)' : 'transparent',
                color: secao === s.id ? '#ff6b35' : '#444455',
              }}
            >
              <span style={{ color: secao === s.id ? '#ff6b35' : '#333344', flexShrink: 0 }}>{s.icon}</span>
              <span className="text-[10px] font-medium truncate">{s.short}</span>
            </button>
          ))}
        </div>

        <div className="px-3 py-3 border-t space-y-2.5" style={{ borderColor: '#1a1a2e' }}>
          <div>
            <p className="text-[9px] text-gray-600 mb-1">Seguradora</p>
            <input
              value={seguradora}
              onChange={e => setSeguradora(e.target.value)}
              className="w-full px-2 py-1 rounded text-[10px] font-semibold outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#ccccdd' }}
              aria-label="Identificador da seguradora"
            />
          </div>
          <p className="text-[9px] text-gray-700 leading-tight">{total} prop. · {hoje}</p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[8px] text-gray-700">FIRMS NASA · CHIRPS · PRODES</span>
          </div>
        </div>
      </nav>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Metric strip */}
        <MetricStrip total={total} emAlerta={emAlerta} criticos={criticos} aprovados={aprovados} />

        {/* Content */}
        <div className={`flex-1 overflow-hidden ${secao === 'mapa' ? 'flex flex-col' : 'overflow-y-auto px-6 py-4 space-y-4'}`}>

          {/* CARTEIRA & ALERTAS */}
          {secao === 'carteira' && (
            <>
              <div className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Digest da Semana</span>
                  <span className="ml-auto text-[9px] text-gray-700">últimos 7 dias</span>
                </div>
                <div className="space-y-2">
                  {DIGEST_ITEMS.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5 rounded-md px-3 py-2"
                      style={{
                        background: item.tipo === 'alerta' ? 'rgba(255,107,53,0.04)' : 'rgba(0,255,136,0.03)',
                        border: `1px solid ${item.tipo === 'alerta' ? 'rgba(255,107,53,0.12)' : 'rgba(0,255,136,0.1)'}`,
                      }}>
                      <span className="flex-shrink-0 mt-0.5">{item.icon}</span>
                      <p className="text-[11px] text-gray-400 leading-relaxed">{item.msg}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Ranking de Risco</span>
                  <div className="flex rounded-md overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                    {[
                      { id: 'todos', label: 'Todos' },
                      { id: 'CRITICAL', label: 'Crítico' },
                      { id: 'HIGH', label: 'Alto' },
                      { id: 'MEDIUM', label: 'Médio' },
                      { id: 'LOW', label: 'Baixo' },
                    ].map((f, idx, arr) => (
                      <button key={f.id} onClick={() => setFiltro(f.id)}
                        className="px-2.5 py-1 text-[9px] font-medium transition-colors duration-150"
                        style={{
                          background: filtro === f.id ? 'rgba(255,107,53,0.12)' : 'transparent',
                          color: filtro === f.id ? '#ff6b35' : '#444455',
                          borderRight: idx < arr.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                        }}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  {filtrados.map((s, i) => (
                    <RankRow key={s.id} position={i + 1} supplier={s} delta={DELTA_MAP[s.id] || 0} />
                  ))}
                  {filtrados.length === 0 && (
                    <div className="text-center py-8 text-[11px] text-gray-700">
                      Nenhuma propriedade neste nível de risco
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* MAPA DE CALOR */}
          {secao === 'mapa' && (
            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 overflow-hidden">
                <MapaBrasil suppliers={suppliers} onHover={setMapHover} hoveredId={mapHover} />
              </div>

              <div className="w-52 flex flex-col gap-3 overflow-y-auto py-4 pr-4 pl-2 flex-shrink-0">
                <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-3">Propriedades</div>
                  <div className="space-y-1.5">
                    {ranking.map(s => {
                      const color = RISK_COLORS[s.geoRisk.level]
                      const isHov = mapHover === s.id
                      return (
                        <div key={s.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors duration-100"
                          style={{ background: isHov ? `${color}0d` : 'transparent', border: `1px solid ${isHov ? `${color}22` : 'transparent'}` }}
                          onMouseEnter={() => setMapHover(s.id)} onMouseLeave={() => setMapHover(null)}>
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-[9px] text-gray-300 truncate">{s.shortName}</div>
                            <div className="text-[8px] text-gray-700">{s.state} · {s.geoRisk.score}pts</div>
                          </div>
                          <span className="text-[7px] font-semibold" style={{ color }}>{SEVERITY_LABEL[s.geoRisk.level]}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-2.5">Distribuição</div>
                  {['CRITICAL','HIGH','MEDIUM','LOW'].map(level => {
                    const count = suppliers.filter(s => s.geoRisk?.level === level).length
                    const pct = (count / suppliers.length) * 100
                    const color = RISK_COLORS[level]
                    return (
                      <div key={level} className="mb-2.5">
                        <div className="flex justify-between text-[8px] mb-1">
                          <span style={{ color }}>{SEVERITY_LABEL[level]}</span>
                          <span className="text-gray-700">{count} prop.</span>
                        </div>
                        <div className="h-1 bg-gray-900 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, opacity: 0.8 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SIMULADOR API */}
          {secao === 'api' && (
            <div className="max-w-2xl">
              <p className="text-[11px] text-gray-600 leading-relaxed mb-4">
                Simule uma chamada à API GeoRisk. Informe as coordenadas de uma propriedade e veja o JSON de resposta — exatamente o que uma seguradora receberia ao integrar com a plataforma.
              </p>
              <SimuladorAPI />
              <div className="mt-4 rounded-lg px-4 py-3 flex items-start gap-2.5"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" stroke="#555566" strokeWidth="1.5"/>
                  <line x1="12" y1="8" x2="12" y2="12" stroke="#555566" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="12" cy="16" r="0.8" fill="#555566"/>
                </svg>
                <p className="text-[10px] text-gray-700 leading-relaxed">
                  <strong className="text-gray-500">GeoRisk não vende seguro.</strong> O score é baseado em dados geoespaciais (Sentinel-2, FIRMS NASA, CHIRPS, PRODES) e serve como camada de inteligência complementar. Cada seguradora aplica suas próprias regras atuariais.
                </p>
              </div>
            </div>
          )}

          {secao === 'pricing'  && <PricingIntelligence />}
          {secao === 'cotacao'  && <QuotationSimulator />}
          {secao === 'sinistro' && <ClaimsValidation />}
          {secao === 'alertas'  && <AlertCenter insurerName={seguradora} />}
          {secao === 'exposicao'&& <FinancialExposure />}
          {secao === 'forecast' && <RiskForecast />}

        </div>
      </div>
    </div>
  )
}
