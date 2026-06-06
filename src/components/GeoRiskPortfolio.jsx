import { useState } from 'react'
import { suppliers, RISK_COLORS, RISK_BG } from '../data/suppliers'
import {
  AlertCenter,
  ClaimsValidation,
  FinancialExposure,
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
  APROVAR:               { label: 'APROVAR',    color: '#00ff88' },
  MONITORAR:             { label: 'MONITORAR',  color: '#00d4ff' },
  ANALISE_COMPLEMENTAR:  { label: 'ANÁLISE',    color: '#ffd700' },
  REJEITAR:              { label: 'REJEITAR',   color: '#ff0040' },
}

const DIGEST_ITEMS = [
  { tipo: 'alerta', msg: '3 propriedades no MT e PA tiveram aumento de risco de queimada nos últimos 7 dias', icon: '🔥' },
  { tipo: 'alerta', msg: '2 propriedades entraram em nível CRÍTICO — emissão de apólice suspensa automaticamente', icon: '⚠️' },
  { tipo: 'alerta', msg: 'Déficit hídrico acima da média detectado em 2 propriedades no Cerrado', icon: '☀️' },
  { tipo: 'ok',     msg: '2 propriedades (SP e MG) mantiveram risco BAIXO — nenhum alerta ativo', icon: '✅' },
]

const DELTA_MAP = { 1: 8, 2: 5, 3: 3, 4: 0, 5: 0, 6: 0 }

// ─── Posições aproximadas no SVG do Brasil (viewBox 0 0 520 580) ────────────
// Mapeadas a partir de lat/lng reais dos suppliers
const BRASIL_PINS = [
  { id: 1, x: 178, y: 132 }, // PA  lat -4.2  lng -55.9
  { id: 2, x: 278, y: 198 }, // MT  lat -11.6 lng -52.4
  { id: 3, x: 160, y: 118 }, // AM  lat -3.1  lng -60.0
  { id: 4, x: 330, y: 230 }, // BA  lat -12.5 lng -41.8
  { id: 5, x: 355, y: 358 }, // MG  lat -22.4 lng -45.1
  { id: 6, x: 335, y: 378 }, // SP  lat -22.9 lng -47.1
]

// ─── Mapa SVG simplificado do Brasil ─────────────────────────────────────
function MapaBrasil({ suppliers: sups, onHover, hoveredId }) {
  return (
    <svg
      viewBox="0 0 520 580"
      className="w-full h-full"
      style={{ filter: 'drop-shadow(0 0 20px rgba(255,107,53,0.1))' }}
    >
      {/* Contorno do Brasil — path simplificado */}
      <path
        d="M 185 30 L 210 25 L 240 28 L 265 20 L 290 28 L 315 22 L 340 30 L 360 42 L 375 55 L 385 70 L 395 88 L 405 108 L 415 125 L 420 145 L 418 165 L 410 182 L 415 198 L 425 210 L 430 228 L 425 245 L 415 258 L 408 272 L 405 290 L 400 308 L 392 325 L 380 340 L 368 355 L 360 372 L 355 390 L 348 408 L 338 420 L 325 432 L 312 442 L 298 450 L 285 460 L 272 468 L 260 475 L 248 480 L 235 485 L 222 490 L 210 492 L 198 490 L 188 484 L 180 476 L 172 465 L 165 452 L 158 438 L 150 424 L 142 408 L 135 392 L 128 375 L 122 358 L 118 340 L 115 322 L 112 303 L 110 285 L 108 267 L 106 248 L 105 230 L 108 212 L 112 195 L 118 178 L 124 162 L 128 145 L 130 128 L 132 110 L 135 93 L 140 77 L 148 62 L 158 50 L 170 38 Z"
        fill="rgba(255,107,53,0.06)"
        stroke="rgba(255,107,53,0.25)"
        strokeWidth="1.5"
      />
      {/* Estados internos simplificados */}
      <line x1="185" y1="30" x2="185" y2="490" stroke="rgba(255,107,53,0.06)" strokeWidth="0.5" />
      <line x1="108" y1="230" x2="430" y2="230" stroke="rgba(255,107,53,0.06)" strokeWidth="0.5" />
      <line x1="108" y1="320" x2="430" y2="320" stroke="rgba(255,107,53,0.06)" strokeWidth="0.5" />

      {/* Pins das propriedades */}
      {BRASIL_PINS.map((pin) => {
        const sup = sups.find(s => s.id === pin.id)
        if (!sup?.geoRisk) return null
        const color = RISK_COLORS[sup.geoRisk.level]
        const isHovered = hoveredId === pin.id
        const r = isHovered ? 10 : 7

        return (
          <g key={pin.id}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => onHover(pin.id)}
            onMouseLeave={() => onHover(null)}
          >
            {/* Halo pulsante */}
            <circle
              cx={pin.x} cy={pin.y} r={r + 6}
              fill={`${color}15`}
              stroke={`${color}30`}
              strokeWidth="1"
            >
              {sup.geoRisk.level === 'CRITICAL' && (
                <animate attributeName="r" values={`${r+4};${r+10};${r+4}`} dur="2s" repeatCount="indefinite" />
              )}
            </circle>
            {/* Pin principal */}
            <circle
              cx={pin.x} cy={pin.y} r={r}
              fill={`${color}22`}
              stroke={color}
              strokeWidth={isHovered ? 2 : 1.5}
              style={{ filter: `drop-shadow(0 0 ${isHovered ? 8 : 4}px ${color})` }}
            />
            {/* Score texto */}
            <text
              x={pin.x} y={pin.y + 3.5}
              textAnchor="middle"
              fontSize={isHovered ? "7" : "6"}
              fontWeight="bold"
              fill={color}
            >
              {sup.geoRisk.score}
            </text>
            {/* Tooltip */}
            {isHovered && (
              <g>
                <rect
                  x={pin.x - 48} y={pin.y - 38}
                  width="96" height="26"
                  rx="4"
                  fill="rgba(10,10,15,0.95)"
                  stroke={`${color}44`}
                  strokeWidth="1"
                />
                <text x={pin.x} y={pin.y - 26} textAnchor="middle" fontSize="7" fontWeight="bold" fill="white">
                  {sup.shortName}
                </text>
                <text x={pin.x} y={pin.y - 16} textAnchor="middle" fontSize="6.5" fill={color}>
                  {SEVERITY_LABEL[sup.geoRisk.level]} · Score {sup.geoRisk.score}
                </text>
              </g>
            )}
          </g>
        )
      })}

      {/* Legenda */}
      {['CRITICAL','HIGH','MEDIUM','LOW'].map((level, i) => (
        <g key={level} transform={`translate(12, ${i * 18 + 12})`}>
          <circle cx="6" cy="6" r="5" fill={`${RISK_COLORS[level]}20`} stroke={RISK_COLORS[level]} strokeWidth="1.2" />
          <text x="14" y="10" fontSize="7.5" fill={RISK_COLORS[level]} fontWeight="600">
            {SEVERITY_LABEL[level]}
          </text>
        </g>
      ))}
    </svg>
  )
}

// ─── Simulador de Consulta API ────────────────────────────────────────────
function calcScore(lat, lng) {
  // Score simulado baseado em coordenadas — lógica determinística para demo
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
    riskScore: score,
    riskLevel: level,
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
    setTimeout(() => {
      setResult(calcScore(lat, lng))
      setLoading(false)
    }, 900)
  }

  function copiarJSON() {
    if (!result) return
    navigator.clipboard.writeText(JSON.stringify(result, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const levelColor = result ? RISK_COLORS[result.riskLevel] : '#ff6b35'

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,107,53,0.2)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" stroke="#ff6b35" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Simulador de Consulta API</span>
        <span
          className="ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.2)' }}
        >
          POST /v1/score
        </span>
      </div>

      {/* Presets */}
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {PRESETS.map(p => (
          <button
            key={p.label}
            onClick={() => { setLat(p.lat); setLng(p.lng); setResult(null) }}
            className="text-[8px] px-2 py-1 rounded transition-all"
            style={{
              background: lat === p.lat ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.04)',
              color: lat === p.lat ? '#ff6b35' : '#666677',
              border: `1px solid ${lat === p.lat ? 'rgba(255,107,53,0.3)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <div className="text-[8px] text-gray-600 mb-1 uppercase tracking-wider">Latitude</div>
          <input
            value={lat}
            onChange={e => setLat(e.target.value)}
            placeholder="-4.2000"
            className="w-full px-2.5 py-1.5 rounded text-xs font-mono text-white outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              caretColor: '#ff6b35',
            }}
          />
        </div>
        <div className="flex-1">
          <div className="text-[8px] text-gray-600 mb-1 uppercase tracking-wider">Longitude</div>
          <input
            value={lng}
            onChange={e => setLng(e.target.value)}
            placeholder="-55.9000"
            className="w-full px-2.5 py-1.5 rounded text-xs font-mono text-white outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              caretColor: '#ff6b35',
            }}
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={consultar}
            disabled={!lat || !lng || loading}
            className="px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all"
            style={{
              background: lat && lng && !loading ? 'rgba(255,107,53,0.2)' : 'rgba(255,255,255,0.04)',
              color: lat && lng && !loading ? '#ff6b35' : '#444',
              border: `1px solid ${lat && lng && !loading ? 'rgba(255,107,53,0.4)' : 'rgba(255,255,255,0.08)'}`,
              cursor: lat && lng && !loading ? 'pointer' : 'not-allowed',
            }}
          >
            {loading ? '⟳ ...' : 'Consultar'}
          </button>
        </div>
      </div>

      {/* Resultado */}
      {loading && (
        <div className="flex items-center gap-2 py-4 justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          <span className="text-[10px] text-gray-600 ml-1">Processando dados geoespaciais...</span>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          {/* Score destaque */}
          <div
            className="flex items-center gap-4 rounded-lg px-4 py-3"
            style={{ background: `${levelColor}08`, border: `1px solid ${levelColor}25` }}
          >
            <div className="text-center">
              <div className="text-3xl font-bold leading-none" style={{ color: levelColor }}>{result.riskScore}</div>
              <div className="text-[8px] text-gray-600 mt-0.5">SCORE</div>
            </div>
            <div className="w-px h-10 bg-gray-800" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-gray-500">Nível:</span>
                <span className="text-[9px] font-bold" style={{ color: levelColor }}>{result.riskLevel}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-gray-500">Decisão:</span>
                <span className="text-[9px] font-bold" style={{ color: DECISAO_CONFIG[result.decisaoSugerida]?.color }}>
                  {result.decisaoSugerida.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-gray-500">Loss Index:</span>
                <span className="text-[9px] font-mono text-gray-300">{result.historicalLossIndex}</span>
              </div>
            </div>
            <div className="space-y-1 text-right">
              <div className="text-[8px] text-gray-500">Queimada: <span className="text-gray-300">{result.fireRisk}</span></div>
              <div className="text-[8px] text-gray-500">Seca: <span className="text-gray-300">{result.droughtRisk}</span></div>
              <div className="text-[8px] text-gray-500">Vegetação: <span className="text-gray-300">{result.vegetationHealth}</span></div>
            </div>
          </div>

          {/* JSON response */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8px] text-gray-600 uppercase tracking-wider">JSON Response</span>
              <button
                onClick={copiarJSON}
                className="text-[8px] px-2 py-0.5 rounded transition-all"
                style={{
                  background: copied ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.05)',
                  color: copied ? '#00ff88' : '#666677',
                  border: `1px solid ${copied ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                {copied ? '✓ Copiado' : 'Copiar JSON'}
              </button>
            </div>
            <pre
              className="text-[9px] font-mono leading-relaxed overflow-x-auto rounded-lg p-3"
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#8899aa',
                maxHeight: '180px',
              }}
            >
              <span style={{ color: '#555' }}>{'{'}</span>{'\n'}
              {Object.entries({
                riskScore: result.riskScore,
                riskLevel: result.riskLevel,
                fireRisk: result.fireRisk,
                droughtRisk: result.droughtRisk,
                vegetationHealth: result.vegetationHealth,
                historicalLossIndex: result.historicalLossIndex,
                decisaoSugerida: result.decisaoSugerida,
              }).map(([k, v]) => (
                <span key={k}>
                  {'  '}<span style={{ color: '#ff6b35' }}>"{k}"</span>
                  <span style={{ color: '#555' }}>: </span>
                  <span style={{ color: typeof v === 'number' ? '#00d4ff' : '#00ff88' }}>
                    {typeof v === 'string' ? `"${v}"` : v}
                  </span>
                  {'\n'}
                </span>
              ))}
              <span style={{ color: '#555' }}>{'}'}</span>
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon }) {
  return (
    <div
      className="flex-1 rounded-xl p-4 flex flex-col gap-1"
      style={{ background: `${color}08`, border: `1px solid ${color}20` }}
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

// ─── RankRow ──────────────────────────────────────────────────────────────
function RankRow({ position, supplier, delta }) {
  const gr = supplier.geoRisk
  if (!gr) return null
  const color = RISK_COLORS[gr.level]
  const decisao = DECISAO_CONFIG[gr.decisaoSugerida]

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.01]"
      style={{ background: `${color}06`, border: `1px solid ${color}18` }}
    >
      <span className="text-[10px] font-bold text-gray-600 w-4 flex-shrink-0">{position}</span>

      <div className="relative w-10 h-10 flex-shrink-0">
        <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
          <circle cx="20" cy="20" r="15" fill="none" stroke="#1a1a2e" strokeWidth="4" />
          <circle
            cx="20" cy="20" r="15" fill="none"
            stroke={color} strokeWidth="4"
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
          style={{ background: RISK_BG[gr.level], color, border: `1px solid ${color}33` }}
        >
          {SEVERITY_LABEL[gr.level]}
        </span>
        <span
          className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
          style={{ background: `${decisao.color}12`, color: decisao.color, border: `1px solid ${decisao.color}25` }}
        >
          {decisao.label}
        </span>
        {delta > 0
          ? <span className="text-[8px] text-red-400 font-mono">▲ +{delta}pts</span>
          : <span className="text-[8px] text-green-500 font-mono">● estável</span>
        }
      </div>
    </div>
  )
}

// ─── GeoRiskPortfolio principal ────────────────────────────────────────────
export default function GeoRiskPortfolio() {
  const [filtro, setFiltro]       = useState('todos')
  const [secao, setSecao]         = useState('carteira') // 'carteira' | 'mapa' | 'api'
  const [mapHover, setMapHover]   = useState(null)

  const total     = suppliers.length
  const emAlerta  = suppliers.filter(s => s.geoRisk && ['HIGH','CRITICAL'].includes(s.geoRisk.level)).length
  const criticos  = suppliers.filter(s => s.geoRisk && s.geoRisk.level === 'CRITICAL').length
  const aprovados = suppliers.filter(s => s.geoRisk && s.geoRisk.decisaoSugerida === 'APROVAR').length

  const ranking = [...suppliers]
    .filter(s => s.geoRisk)
    .sort((a, b) => b.geoRisk.score - a.geoRisk.score)

  const filtrados = filtro === 'todos'
    ? ranking
    : ranking.filter(s => s.geoRisk.level === filtro)

  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

  const SECOES = [
    { id: 'carteira', label: 'Carteira & Alertas' },
    { id: 'mapa',     label: 'Mapa de Calor' },
    { id: 'api',      label: 'Simulador API' },
    { id: 'cotacao',  label: 'Simulador de Cotacao' },
    { id: 'sinistro', label: 'Validacao de Sinistro' },
    { id: 'alertas',  label: 'Alert Center' },
    { id: 'exposicao', label: 'Exposicao Financeira' },
    { id: 'forecast', label: 'Risk Forecast' },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#0a0a0f' }}>

      {/* Header */}
      <div
        className="flex-shrink-0 px-6 py-3 border-b flex items-center justify-between"
        style={{ borderColor: 'rgba(255,107,53,0.2)', background: 'rgba(255,107,53,0.04)' }}
      >
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#ff6b35" strokeWidth="1.8" fill="rgba(255,107,53,0.15)" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h1 className="text-sm font-bold" style={{ color: '#ff6b35' }}>
              GeoRisk <span className="text-white font-normal">— Monitoramento de Carteira</span>
            </h1>
          </div>
          <p className="text-[9px] text-gray-600">
            Inteligência geoespacial contínua · Sentinel-2 · FIRMS NASA · Atualizado em {hoje}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Sub-navegação */}
          <div className="flex rounded-md overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            {SECOES.map((s, idx, arr) => (
              <button
                key={s.id}
                onClick={() => setSecao(s.id)}
                className="px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider transition-all"
                style={{
                  background: secao === s.id ? 'rgba(255,107,53,0.18)' : 'transparent',
                  color: secao === s.id ? '#ff6b35' : '#444455',
                  borderRight: idx < arr.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[9px] text-orange-400 font-semibold uppercase tracking-wider">Ao vivo</span>
          </div>
        </div>
      </div>

      {/* Cards de métricas — sempre visíveis */}
      <div className="flex-shrink-0 flex gap-3 px-6 pt-4 pb-2">
        <StatCard label="Propriedades"   value={total}     sub="monitoradas"          color="#00d4ff" icon="🛰️" />
        <StatCard label="Em Alerta"      value={emAlerta}  sub="alto ou crítico"      color="#ffd700" icon="⚠️" />
        <StatCard label="Nível Crítico"  value={criticos}  sub="ação imediata"        color="#ff0040" icon="🚨" />
        <StatCard label="Aprovadas"      value={aprovados} sub="baixo risco"          color="#00ff88" icon="✅" />
      </div>

      {/* Conteúdo por seção */}
      <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">

        {/* ── CARTEIRA & ALERTAS ── */}
        {secao === 'carteira' && (
          <>
            {/* Digest */}
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
                <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">
                  Ranking — Maior Score de Risco
                </span>
                <div className="flex rounded-md overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  {[
                    { id: 'todos',    label: 'Todos' },
                    { id: 'CRITICAL', label: 'Crítico' },
                    { id: 'HIGH',     label: 'Alto' },
                    { id: 'MEDIUM',   label: 'Médio' },
                    { id: 'LOW',      label: 'Baixo' },
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
                  <RankRow key={s.id} position={i + 1} supplier={s} delta={DELTA_MAP[s.id] || 0} />
                ))}
                {filtrados.length === 0 && (
                  <div className="text-center py-8 text-[11px] text-gray-600">
                    Nenhuma propriedade neste nível de risco
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── MAPA DE CALOR ── */}
        {secao === 'mapa' && (
          <div className="flex gap-4" style={{ minHeight: '480px' }}>
            {/* Mapa */}
            <div
              className="flex-1 rounded-xl overflow-hidden flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,107,53,0.15)' }}
            >
              <div style={{ width: '100%', maxWidth: '440px', padding: '16px' }}>
                <MapaBrasil
                  suppliers={suppliers}
                  onHover={setMapHover}
                  hoveredId={mapHover}
                />
              </div>
            </div>

            {/* Painel lateral do mapa */}
            <div className="w-56 flex flex-col gap-3">
              <div
                className="rounded-xl p-3"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-3">Propriedades</div>
                <div className="space-y-2">
                  {ranking.map(s => {
                    const color = RISK_COLORS[s.geoRisk.level]
                    const isHov = mapHover === s.id
                    return (
                      <div
                        key={s.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all"
                        style={{
                          background: isHov ? `${color}12` : 'transparent',
                          border: `1px solid ${isHov ? `${color}30` : 'transparent'}`,
                        }}
                        onMouseEnter={() => setMapHover(s.id)}
                        onMouseLeave={() => setMapHover(null)}
                      >
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: color, boxShadow: `0 0 4px ${color}` }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-[9px] text-white truncate">{s.shortName}</div>
                          <div className="text-[8px] text-gray-600">{s.state} · {s.geoRisk.score}pts</div>
                        </div>
                        <span className="text-[7px] font-bold" style={{ color }}>
                          {SEVERITY_LABEL[s.geoRisk.level]}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div
                className="rounded-xl p-3"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-2">Distribuição</div>
                {['CRITICAL','HIGH','MEDIUM','LOW'].map(level => {
                  const count = suppliers.filter(s => s.geoRisk?.level === level).length
                  const pct = (count / suppliers.length) * 100
                  const color = RISK_COLORS[level]
                  return (
                    <div key={level} className="mb-2">
                      <div className="flex justify-between text-[8px] mb-0.5">
                        <span style={{ color }}>{SEVERITY_LABEL[level]}</span>
                        <span className="text-gray-600">{count} prop.</span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${color}88, ${color})`,
                            boxShadow: `0 0 4px ${color}55`,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── SIMULADOR API ── */}
        {secao === 'api' && (
          <div className="max-w-2xl">
            <div className="mb-3">
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Simule uma chamada à API GeoRisk. Informe as coordenadas de uma propriedade e veja o JSON de resposta — exatamente o que uma seguradora receberia ao integrar com a plataforma.
              </p>
            </div>
            <SimuladorAPI />
            <div
              className="mt-4 rounded-xl px-4 py-3 flex items-start gap-2"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <span className="text-gray-600 text-xs mt-0.5">ℹ️</span>
              <p className="text-[10px] text-gray-600 leading-relaxed">
                <strong className="text-gray-500">GeoRisk não vende seguro.</strong> O score retornado é baseado em dados geoespaciais (Sentinel-2, FIRMS NASA, CHIRPS, PRODES) e serve como camada de inteligência complementar. Cada seguradora aplica suas próprias regras atuariais.
              </p>
            </div>
          </div>
        )}

        {/* NOVAS AREAS MVP GEORISK */}
        {secao === 'cotacao' && <QuotationSimulator />}
        {secao === 'sinistro' && <ClaimsValidation />}
        {secao === 'alertas' && <AlertCenter />}
        {secao === 'exposicao' && <FinancialExposure />}
        {secao === 'forecast' && <RiskForecast />}

      </div>
    </div>
  )
}
