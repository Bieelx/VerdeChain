import { useMemo, useState } from 'react'
import BrazilMap from './BrazilMap'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { suppliers, RISK_COLORS } from '../data/suppliers'

const LEVEL_LABEL = {
  LOW: 'BAIXO',
  MEDIUM: 'MEDIO',
  HIGH: 'ALTO',
  CRITICAL: 'CRITICO',
}

const DECISIONS = {
  APROVAR: { label: 'APROVAR', color: '#00ff88' },
  MONITORAR: { label: 'MONITORAR', color: '#00d4ff' },
  ANALISE_COMPLEMENTAR: { label: 'ANALISE COMPLEMENTAR', color: '#ffd700' },
  REJEITAR: { label: 'REJEITAR', color: '#ff0040' },
}

const FACTOR_LABEL = {
  queimadas: 'Queimadas',
  seca: 'Seca',
  vegetacao: 'Vegetacao',
  historicoSinistros: 'Hist. sinistros',
  areaCritica: 'Area critica',
}

const FACTOR_MAX = {
  queimadas: 30,
  seca: 25,
  vegetacao: 20,
  historicoSinistros: 15,
  areaCritica: 10,
}

const BRASIL_PINS = [
  { id: 1, x: 178, y: 132 },
  { id: 2, x: 278, y: 198 },
  { id: 3, x: 160, y: 118 },
  { id: 4, x: 330, y: 230 },
  { id: 5, x: 355, y: 358 },
  { id: 6, x: 335, y: 378 },
]

const money = (value) => value.toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

function riskLevel(score) {
  if (score >= 81) return 'CRITICAL'
  if (score >= 61) return 'HIGH'
  if (score >= 31) return 'MEDIUM'
  return 'LOW'
}

function suggestedDecision(score) {
  if (score >= 81) return 'REJEITAR'
  if (score >= 61) return 'ANALISE_COMPLEMENTAR'
  if (score >= 31) return 'MONITORAR'
  return 'APROVAR'
}

function calcQuoteScore(lat, lng, area = 0, cultura = '') {
  const latN = Math.abs(parseFloat(lat) || 0)
  const lngN = Math.abs(parseFloat(lng) || 0)
  const areaN = Number(area) || 0
  const cropBoost = /soja|milho|algodao|cana/i.test(cultura) ? 3 : /pecuaria/i.test(cultura) ? 5 : 0

  const q = Math.min(30, Math.round((latN < 10 ? 20 : latN < 20 ? 14 : 6) + (lngN > 55 ? 8 : 4) + cropBoost))
  const s = Math.min(25, Math.round((latN > 10 && latN < 20 ? 18 : latN < 10 ? 12 : 8) + (areaN > 25000 ? 3 : 0)))
  const v = Math.min(20, Math.round((lngN > 50 ? 14 : 8) + (areaN > 40000 ? 2 : 0)))
  const h = Math.min(15, Math.round((latN < 15 ? 12 : 7) + (areaN > 20000 ? 2 : 0)))
  const a = Math.min(10, Math.round((latN < 10 ? 8 : 4) + (lngN > 58 ? 1 : 0)))
  const score = Math.min(100, q + s + v + h + a)

  return {
    score,
    level: riskLevel(score),
    decision: suggestedDecision(score),
    fatores: { queimadas: q, seca: s, vegetacao: v, historicoSinistros: h, areaCritica: a },
    fireRisk: q >= 20 ? 'ALTO' : q >= 10 ? 'MEDIO' : 'BAIXO',
    droughtRisk: s >= 18 ? 'ALTO' : s >= 10 ? 'MEDIO' : 'BAIXO',
    vegetationHealth: v >= 14 ? 'BAIXA' : v >= 8 ? 'MEDIA' : 'ALTA',
    lastScan: new Date().toISOString().slice(0, 10),
  }
}

function simulateClaim(form) {
  const base = calcQuoteScore(form.lat, form.lng)
  const weights = {
    Queimada: base.fatores.queimadas,
    Seca: base.fatores.seca,
    Enchente: 36 - Math.abs(parseFloat(form.lat) || 0),
    Tempestade: 42 - Math.abs(parseFloat(form.lng) || 0) / 2,
    Granizo: Math.abs(parseFloat(form.lat) || 0) > 18 ? 72 : 38,
  }
  const signal = Math.max(0, Math.min(100, Math.round((weights[form.claimType] || 35) * 3.1)))
  const confidence = Math.min(98, Math.max(28, signal + (base.score > 60 ? 9 : 0)))
  const status = confidence >= 78 ? 'Confirmado' : confidence >= 48 ? 'Parcialmente compativel' : 'Nao encontrado'
  const detectedDate = form.claimDate ? new Date(`${form.claimDate}T12:00:00`) : new Date()
  detectedDate.setDate(detectedDate.getDate() + (confidence >= 78 ? 0 : 2))

  return {
    property: form.property || 'Propriedade sem nome',
    claimType: form.claimType,
    claimDate: form.claimDate,
    eventDetected: status !== 'Nao encontrado',
    status,
    confidence,
    impactLevel: confidence >= 78 ? 'ALTO' : confidence >= 48 ? 'MEDIO' : 'BAIXO',
    eventDescription: status !== 'Nao encontrado'
      ? `${form.claimType} compativel com assinatura geoespacial identificada na regiao monitorada.`
      : `Nao houve sinal geoespacial suficiente para confirmar ${form.claimType.toLowerCase()} no periodo informado.`,
    detectedDate: detectedDate.toISOString().slice(0, 10),
    recommendedAction: status !== 'Nao encontrado'
      ? 'Prosseguir com analise do sinistro'
      : 'Solicitar evidencias complementares ao segurado',
  }
}

function Panel({ children, className = '', accent = 'rgba(255,255,255,0.06)' }) {
  return (
    <div className={`rounded-xl ${className}`} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${accent}` }}>
      {children}
    </div>
  )
}

function SectionTitle({ title, sub, right }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div>
        <div className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">{title}</div>
        {sub && <p className="text-[11px] text-gray-500 leading-relaxed mt-1">{sub}</p>}
      </div>
      {right}
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="block">
      <div className="text-[8px] text-gray-600 mb-1 uppercase tracking-wider">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-2.5 py-2 rounded text-xs font-mono text-white outline-none"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', caretColor: '#ff6b35' }}
      />
    </label>
  )
}

function SelectField({ label, value, onChange, options, labels }) {
  return (
    <label className="block">
      <div className="text-[8px] text-gray-600 mb-1 uppercase tracking-wider">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2.5 py-2 rounded text-xs text-white outline-none"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {options.map((option) => (
          <option key={option} value={option} style={{ background: '#11111a' }}>
            {labels?.[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  )
}

function ActionButton({ children, onClick, disabled = false, color = '#ff6b35' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-all"
      style={{
        background: !disabled ? `${color}20` : 'rgba(255,255,255,0.04)',
        color: !disabled ? color : '#444',
        border: `1px solid ${!disabled ? `${color}66` : 'rgba(255,255,255,0.08)'}`,
        cursor: !disabled ? 'pointer' : 'not-allowed',
      }}
    >
      {children}
    </button>
  )
}

function ScoreRing({ score, level, size = 92 }) {
  const color = RISK_COLORS[level]
  const radius = 36
  const circ = 2 * Math.PI * radius
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 92 92" className="w-full h-full -rotate-90">
        <circle cx="46" cy="46" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle
          cx="46"
          cy="46"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * circ} ${circ}`}
          style={{ filter: `drop-shadow(0 0 5px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold leading-none" style={{ color }}>{score}</span>
        <span className="text-[8px] text-gray-600 uppercase tracking-wider">score</span>
      </div>
    </div>
  )
}

function MiniMetric({ label, value, color }) {
  return (
    <div className="rounded-lg px-3 py-2" style={{ background: `${color}0d`, border: `1px solid ${color}22` }}>
      <div className="text-[8px] text-gray-600 uppercase tracking-wider">{label}</div>
      <div className="text-[10px] font-bold mt-1 truncate" style={{ color }}>{value}</div>
    </div>
  )
}

function FactorBars({ fatores }) {
  return (
    <div className="space-y-2">
      {Object.entries(fatores).map(([key, value]) => {
        const pct = (value / FACTOR_MAX[key]) * 100
        const color = pct > 72 ? '#ff0040' : pct > 48 ? '#ff6b35' : pct > 28 ? '#ffd700' : '#00ff88'
        return (
          <div key={key}>
            <div className="flex justify-between text-[9px] mb-1">
              <span className="text-gray-500">{FACTOR_LABEL[key]}</span>
              <span className="font-mono" style={{ color }}>{value}/{FACTOR_MAX[key]}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-gray-900">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}77, ${color})`, boxShadow: `0 0 8px ${color}44` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CompositionBar({ fatores }) {
  const colors = ['#ff6b35', '#ffd700', '#00d4ff', '#9f7aea', '#ff0040']
  return (
    <div className="flex h-3 overflow-hidden rounded-full bg-gray-900">
      {Object.entries(fatores).map(([key, value], index) => (
        <div
          key={key}
          title={FACTOR_LABEL[key]}
          style={{ width: `${value}%`, minWidth: value ? '6px' : 0, background: colors[index] }}
        />
      ))}
    </div>
  )
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-1" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
      <span className="text-[9px] text-gray-500 uppercase tracking-wider">{label}</span>
      <span className="text-2xl font-bold leading-none" style={{ color }}>{value}</span>
      {sub && <span className="text-[10px] text-gray-600 mt-0.5">{sub}</span>}
    </div>
  )
}

function ChartPanel({ title, children }) {
  return (
    <Panel className="p-4">
      <SectionTitle title={title} />
      <div className="h-56">{children}</div>
    </Panel>
  )
}

export function QuotationSimulator() {
  const [form, setForm] = useState({ nome: 'Fazenda Boa Vista', lat: '-11.6', lng: '-52.4', cultura: 'Soja', area: '31800' })
  const [result, setResult] = useState(() => calcQuoteScore('-11.6', '-52.4', 31800, 'Soja'))
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))
  const trend = [
    { mes: 'Jan', score: Math.max(8, result.score - 14) },
    { mes: 'Fev', score: Math.max(8, result.score - 11) },
    { mes: 'Mar', score: Math.max(8, result.score - 7) },
    { mes: 'Abr', score: Math.max(8, result.score - 4) },
    { mes: 'Mai', score: Math.max(8, result.score - 2) },
    { mes: 'Jun', score: result.score },
  ]

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-4">
      <Panel className="p-4" accent="rgba(255,107,53,0.18)">
        <SectionTitle title="Simulador de Cotacao" sub="Analise preliminar de risco antes da emissao da apolice." />
        <div className="space-y-3">
          <Field label="Nome da propriedade" value={form.nome} onChange={(v) => update('nome', v)} />
          <div className="grid grid-cols-2 gap-2">
            <Field label="Latitude" value={form.lat} onChange={(v) => update('lat', v)} />
            <Field label="Longitude" value={form.lng} onChange={(v) => update('lng', v)} />
          </div>
          <SelectField label="Cultura agricola" value={form.cultura} onChange={(v) => update('cultura', v)} options={['Soja', 'Milho', 'Algodao', 'Cafe', 'Cana-de-acucar', 'Pecuaria']} />
          <Field label="Area segurada (ha)" value={form.area} onChange={(v) => update('area', v)} type="number" />
          <ActionButton onClick={() => setResult(calcQuoteScore(form.lat, form.lng, form.area, form.cultura))}>Calcular cotacao</ActionButton>
        </div>
      </Panel>

      <div className="space-y-4">
        <Panel className="p-4" accent={`${RISK_COLORS[result.level]}33`}>
          <div className="flex flex-col md:flex-row gap-5 md:items-center">
            <ScoreRing score={result.score} level={result.level} />
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">{form.nome}</div>
              <div className="text-[10px] text-gray-500 mt-1">{form.cultura} - {Number(form.area || 0).toLocaleString('pt-BR')} ha segurados - Varredura {result.lastScan}</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                <MiniMetric label="Nivel" value={LEVEL_LABEL[result.level]} color={RISK_COLORS[result.level]} />
                <MiniMetric label="Decisao" value={DECISIONS[result.decision].label} color={DECISIONS[result.decision].color} />
                <MiniMetric label="Queimada" value={result.fireRisk} color="#ff6b35" />
                <MiniMetric label="Vegetacao" value={result.vegetationHealth} color="#00d4ff" />
              </div>
            </div>
          </div>
        </Panel>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel className="p-4">
            <SectionTitle title="Fatores de risco" />
            <FactorBars fatores={result.fatores} />
            <div className="mt-4">
              <div className="text-[8px] text-gray-600 uppercase tracking-wider mb-1">Composicao do score</div>
              <CompositionBar fatores={result.fatores} />
            </div>
          </Panel>
          <Panel className="p-4">
            <SectionTitle title="Evolucao 6 meses" />
            <div className="h-48">
              <ResponsiveContainer>
                <LineChart data={trend}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="mes" stroke="#555" fontSize={10} />
                  <YAxis stroke="#555" fontSize={10} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: '#11111a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                  <Line dataKey="score" stroke={RISK_COLORS[result.level]} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel className="p-4">
          <SectionTitle title="Recomendacao operacional" />
          <p className="text-sm text-gray-300 leading-relaxed">
            {result.score >= 81
              ? 'Rejeitar a cotacao ate que novos dados de campo e imagens recentes reduzam a exposicao geoespacial.'
              : result.score >= 61
                ? 'Enviar para analise complementar com foco em exclusoes, franquias e vistoria remota.'
                : result.score >= 31
                  ? 'Monitorar no ciclo de subscricao e manter alertas ativos durante a vigencia.'
                  : 'Aprovar fluxo padrao com monitoramento orbital semestral.'}
          </p>
        </Panel>
      </div>
    </div>
  )
}

export function ClaimsValidation() {
  const [form, setForm] = useState({ property: 'Fazenda Boa Vista', lat: '-4.2', lng: '-55.9', claimDate: '2026-05-15', claimType: 'Queimada' })
  const [result, setResult] = useState(() => simulateClaim(form))
  const [copied, setCopied] = useState(false)
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))
  const color = result.status === 'Confirmado' ? '#00ff88' : result.status === 'Parcialmente compativel' ? '#ffd700' : '#ff0040'

  async function exportPdf() {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('VALIDACAO DE SINISTRO - GeoRisk', 14, 18)
    doc.setFontSize(11)
    ;[
      `Propriedade: ${result.property}`,
      `Evento: ${result.claimType}`,
      `Status: ${result.status}`,
      `Confiabilidade: ${result.confidence}%`,
      `Data detectada: ${result.detectedDate}`,
      `Impacto estimado: ${result.impactLevel}`,
      `Recomendacao: ${result.recommendedAction}`,
    ].forEach((line, index) => doc.text(line, 14, 34 + index * 9))
    doc.save(`georisk-sinistro-${result.property.replace(/\s+/g, '-').toLowerCase()}.pdf`)
  }

  function copyJson() {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-4">
      <Panel className="p-4" accent="rgba(0,212,255,0.18)">
        <SectionTitle title="Validacao de Sinistro" sub="Consulta geoespacial simulada para confirmar compatibilidade do evento informado." />
        <div className="space-y-3">
          <Field label="Nome da propriedade" value={form.property} onChange={(v) => update('property', v)} />
          <div className="grid grid-cols-2 gap-2">
            <Field label="Latitude" value={form.lat} onChange={(v) => update('lat', v)} />
            <Field label="Longitude" value={form.lng} onChange={(v) => update('lng', v)} />
          </div>
          <Field label="Data do sinistro" value={form.claimDate} onChange={(v) => update('claimDate', v)} type="date" />
          <SelectField label="Tipo do sinistro" value={form.claimType} onChange={(v) => update('claimType', v)} options={['Queimada', 'Seca', 'Enchente', 'Tempestade', 'Granizo']} />
          <ActionButton color="#00d4ff" onClick={() => setResult(simulateClaim(form))}>Validar sinistro</ActionButton>
        </div>
      </Panel>

      <div className="space-y-4">
        <Panel className="p-5" accent={`${color}33`}>
          <div className="flex flex-col md:flex-row gap-5 md:items-center">
            <ScoreRing score={result.confidence} level={result.confidence >= 78 ? 'LOW' : result.confidence >= 48 ? 'MEDIUM' : 'CRITICAL'} />
            <div className="flex-1">
              <div className="text-[9px] text-gray-500 uppercase tracking-wider">Card de validacao</div>
              <div className="text-xl font-bold mt-1" style={{ color }}>{result.status}</div>
              <p className="text-sm text-gray-300 mt-3 leading-relaxed">{result.eventDescription}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                <MiniMetric label="Confiabilidade" value={`${result.confidence}%`} color={color} />
                <MiniMetric label="Evento" value={result.claimType} color="#00d4ff" />
                <MiniMetric label="Data detectada" value={result.detectedDate} color="#ffd700" />
                <MiniMetric label="Impacto" value={result.impactLevel} color={color} />
              </div>
            </div>
          </div>
        </Panel>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel className="p-4">
            <SectionTitle title="Retorno amigavel" />
            <div className="text-[11px] text-gray-300 leading-6 whitespace-pre-line">{`VALIDACAO DE SINISTRO

Propriedade:
${result.property}

Evento:
${result.claimType}

Status:
${result.status}

Confiabilidade:
${result.confidence}%

Evento detectado:
${result.eventDescription}

Impacto estimado:
${result.impactLevel}

Recomendacao:
${result.recommendedAction}.`}</div>
          </Panel>
          <Panel className="p-4">
            <SectionTitle
              title="Retorno JSON"
              right={<div className="flex gap-2"><ActionButton color="#00ff88" onClick={copyJson}>{copied ? 'Copiado' : 'Copiar JSON'}</ActionButton><ActionButton color="#ffd700" onClick={exportPdf}>Exportar PDF</ActionButton></div>}
            />
            <pre className="text-[9px] font-mono leading-relaxed overflow-x-auto rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)', color: '#8899aa', maxHeight: '250px' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </Panel>
        </div>
      </div>
    </div>
  )
}

function buildAlerts() {
  return suppliers.map((supplier, index) => {
    const current = supplier.geoRisk.score
    const previous = Math.max(8, current - ({ 1: 8, 2: 5, 3: 3 }[supplier.id] || (index % 2 ? -3 : 2)))
    const severity = current >= 81 ? 'CRITICAL' : current >= 61 ? 'HIGH' : current >= 31 ? 'MEDIUM' : 'INFO'
    return {
      id: supplier.id,
      property: supplier.name,
      previous,
      current,
      date: `2026-06-${String(5 - (index % 5)).padStart(2, '0')}`,
      severity,
      reasons: supplier.geoRisk.alertasGeoRisk?.length
        ? supplier.geoRisk.alertasGeoRisk.map((a) => a.tipo)
        : ['Carteira estavel', 'Monitoramento orbital sem anomalias'],
      action: current >= 81 ? 'Solicitar revisao da apolice.' : current >= 61 ? 'Acionar analista senior.' : current >= 31 ? 'Manter monitoramento semanal.' : 'Sem acao imediata.',
    }
  })
}

export function PricingIntelligence() {
  const [selectedId, setSelectedId] = useState(String(suppliers[1].id))
  const selected = suppliers.find((s) => s.id === Number(selectedId))
  const gr = selected.geoRisk
  const color = RISK_COLORS[gr.level]
  const agravantes = [
    gr.fatores.queimadas >= 20 && 'Pressao relevante de focos de calor',
    gr.fatores.seca >= 18 && 'Deficit hidrico acima do padrao regional',
    gr.fatores.vegetacao >= 14 && 'Saude da vegetacao abaixo do esperado',
    gr.fatores.historicoSinistros >= 11 && 'Historico regional de perdas elevado',
    gr.fatores.areaCritica >= 8 && 'Proximidade com area sensivel ou critica',
  ].filter(Boolean)
  const mitigadores = [
    selected.certifications?.length > 0 && `${selected.certifications.length} certificacao(oes) ativa(s)`,
    gr.score < 61 && 'Score abaixo da faixa de alto risco',
    selected.protectedAreaProximity > 15 && 'Baixa proximidade com area protegida',
    selected.fireHotspots < 10 && 'Baixa recorrencia recente de focos de calor',
  ].filter(Boolean)
  const classeTecnica = gr.score >= 81 ? 'Restritiva' : gr.score >= 61 ? 'Agravada' : gr.score >= 31 ? 'Monitorada' : 'Preferencial'
  const cadence = gr.score >= 81 ? 'Semanal' : gr.score >= 61 ? 'Quinzenal' : gr.score >= 31 ? 'Mensal' : 'Semestral'
  const confidence = Math.min(96, Math.max(68, 100 - Math.abs(gr.score - selected.complianceScore) / 2))
  const payload = {
    propertyId: selected.id,
    property: selected.name,
    insurerUse: 'pricing_support',
    geoRiskScore: gr.score,
    geoRiskLevel: gr.level,
    technicalClass: classeTecnica,
    underwritingSignals: {
      aggravatingFactors: agravantes,
      mitigatingFactors: mitigadores,
      monitoringCadence: cadence,
      dataConfidence: Math.round(confidence),
    },
    nonBindingRecommendation: 'Usar como insumo geoespacial complementar ao motor atuarial da seguradora.',
    disclaimer: 'GeoRisk nao define premio, franquia, limite, aceite ou condicoes contratuais.',
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[330px_1fr] gap-4">
      <Panel className="p-4" accent="rgba(255,107,53,0.18)">
        <SectionTitle title="Pricing Intelligence" sub="Dossie de apoio a precificacao, sem calculo de premio ou decisao atuarial vinculante." />
        <SelectField label="Propriedade" value={selectedId} onChange={setSelectedId} options={suppliers.map((s) => String(s.id))} labels={Object.fromEntries(suppliers.map((s) => [String(s.id), s.shortName]))} />
        <div className="mt-4 rounded-lg p-3" style={{ background: `${color}08`, border: `1px solid ${color}24` }}>
          <div className="text-[8px] text-gray-600 uppercase tracking-wider">Classe tecnica GeoRisk</div>
          <div className="text-xl font-bold mt-1" style={{ color }}>{classeTecnica}</div>
          <div className="text-[10px] text-gray-500 mt-2">Score {gr.score} - {LEVEL_LABEL[gr.level]} - monitoramento {cadence}</div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <MiniMetric label="Conf. dados" value={`${Math.round(confidence)}%`} color="#00d4ff" />
          <MiniMetric label="Decisao atual" value={DECISIONS[gr.decisaoSugerida].label} color={DECISIONS[gr.decisaoSugerida].color} />
        </div>
      </Panel>

      <div className="space-y-4">
        <Panel className="p-4" accent={`${color}24`}>
          <div className="flex flex-col lg:flex-row gap-5">
            <ScoreRing score={gr.score} level={gr.level} />
            <div className="flex-1">
              <SectionTitle title={selected.name} sub={`${selected.region} - ${selected.cultura} - ${selected.areaSegura.toLocaleString('pt-BR')} ha segurados`} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-2">Fatores agravantes</div>
                  <SignalList items={agravantes.length ? agravantes : ['Nenhum agravante critico no recorte atual']} color="#ff6b35" />
                </div>
                <div>
                  <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-2">Fatores mitigadores</div>
                  <SignalList items={mitigadores.length ? mitigadores : ['Sem mitigador material identificado']} color="#00ff88" />
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel className="p-4">
            <SectionTitle title="Insumos para motor atuarial" />
            <FactorBars fatores={gr.fatores} />
            <div className="mt-4"><CompositionBar fatores={gr.fatores} /></div>
            <p className="text-[10px] text-gray-600 leading-relaxed mt-4">
              A GeoRisk entrega variaveis geoespaciais, evidencias e classificacao tecnica. Premio, franquia, limite, aceite e condicoes finais permanecem sob responsabilidade exclusiva da seguradora.
            </p>
          </Panel>
          <Panel className="p-4">
            <SectionTitle title="Payload de integracao" />
            <pre className="text-[9px] font-mono leading-relaxed overflow-x-auto rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)', color: '#8899aa', maxHeight: '260px' }}>
              {JSON.stringify(payload, null, 2)}
            </pre>
          </Panel>
        </div>
      </div>
    </div>
  )
}

function SignalList({ items, color }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item} className="rounded-lg px-3 py-2 text-[11px] text-gray-300" style={{ background: `${color}08`, border: `1px solid ${color}22` }}>
          {item}
        </div>
      ))}
    </div>
  )
}

export function AlertCenter({ insurerName = '@seguradora' }) {
  const [filter, setFilter] = useState('TODOS')
  const [sortDesc, setSortDesc] = useState(true)
  const [selectedAlertId, setSelectedAlertId] = useState(1)
  const [channel, setChannel] = useState('Email')
  const [recipient, setRecipient] = useState('subscricao@seguradora.com')
  const [message, setMessage] = useState('Solicitar revisao tecnica da apolice e atualizar acompanhamento da propriedade.')
  const [sentLog, setSentLog] = useState([])
  const [copiedPayload, setCopiedPayload] = useState(false)
  const alerts = useMemo(() => buildAlerts(), [])
  const filtered = alerts
    .filter((alert) => filter === 'TODOS' || alert.severity === filter)
    .sort((a, b) => sortDesc ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date))
  const selectedAlert = alerts.find((alert) => alert.id === Number(selectedAlertId)) ?? alerts[0]
  const severityColor = (severity) => severity === 'CRITICAL' ? '#ff0040' : severity === 'HIGH' ? '#ff6b35' : severity === 'MEDIUM' ? '#ffd700' : '#00d4ff'
  const notificationPayload = {
    notificationId: `geo-${selectedAlert.id}-${Date.now().toString().slice(-5)}`,
    insurer: insurerName,
    channel,
    recipient,
    property: selectedAlert.property,
    severity: selectedAlert.severity,
    scoreChange: {
      previous: selectedAlert.previous,
      current: selectedAlert.current,
    },
    reasons: selectedAlert.reasons,
    message,
    suggestedAction: selectedAlert.action,
  }

  function sendNotification() {
    const payload = {
      ...notificationPayload,
      notificationId: `geo-${selectedAlert.id}-${Date.now()}`,
      sentAt: new Date().toLocaleString('pt-BR'),
      status: channel === 'Webhook' ? 'POST simulado' : 'Enviado',
    }
    setSentLog((current) => [payload, ...current].slice(0, 5))
  }

  function copyPayload() {
    navigator.clipboard.writeText(JSON.stringify(notificationPayload, null, 2))
    setCopiedPayload(true)
    setTimeout(() => setCopiedPayload(false), 1800)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard label="Alertas ativos" value={alerts.length} sub="monitoramento continuo" color="#00d4ff" />
        <StatCard label="Recentes" value={alerts.filter((a) => a.date >= '2026-06-03').length} sub="ultimos 3 dias" color="#ffd700" />
        <StatCard label="Criticos" value={alerts.filter((a) => a.severity === 'CRITICAL').length} sub="acao imediata" color="#ff0040" />
      </div>

      <Panel className="p-4">
        <SectionTitle
          title="Alert Center"
          sub="Notificacoes automaticas de mudancas criticas no score geoespacial."
          right={<div className="flex gap-2 flex-wrap"><select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-2 py-1 rounded text-[10px] text-white" style={{ background: '#11111a', border: '1px solid rgba(255,255,255,0.1)' }}>{['TODOS','INFO','MEDIUM','HIGH','CRITICAL'].map((option) => <option key={option}>{option}</option>)}</select><ActionButton onClick={() => setSortDesc((v) => !v)}>{sortDesc ? 'Mais recentes' : 'Mais antigos'}</ActionButton></div>}
        />
        <div className="space-y-3">
          {filtered.map((alert) => {
            const color = severityColor(alert.severity)
            return (
              <div key={alert.id} className="rounded-xl p-4" style={{ background: `${color}07`, border: `1px solid ${color}22` }}>
                <div className="flex flex-col md:flex-row md:items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ color, background: `${color}12`, border: `1px solid ${color}33` }}>{alert.severity}</span>
                      <span className="text-[10px] text-gray-600">{alert.date}</span>
                    </div>
                    <div className="text-sm font-semibold text-white mt-2">{alert.property}</div>
                    <div className="text-[11px] text-gray-400 mt-1">Score: <span className="text-gray-500">{alert.previous}</span> {'->'} <span style={{ color }}>{alert.current}</span></div>
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      {alert.reasons.map((reason) => (
                        <span key={reason} className="text-[8px] px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: '#aaa', border: '1px solid rgba(255,255,255,0.07)' }}>{reason}</span>
                      ))}
                    </div>
                  </div>
                  <div className="md:w-64 text-[11px] text-gray-400 leading-relaxed">
                    <span className="text-gray-500 uppercase text-[8px] tracking-wider">Acao sugerida</span><br />
                    {alert.action}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Panel>

      <Panel className="p-4">
        <SectionTitle title="Envio de notificacao" sub={`Mensagem operacional personalizada para ${insurerName}.`} />
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
          <div className="space-y-3">
            <SelectField label="Alerta" value={String(selectedAlertId)} onChange={setSelectedAlertId} options={alerts.map((alert) => String(alert.id))} labels={Object.fromEntries(alerts.map((alert) => [String(alert.id), `${alert.property} - ${alert.severity}`]))} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SelectField label="Canal" value={channel} onChange={setChannel} options={['Email', 'Teams', 'Slack', 'Webhook']} />
              <Field label="Destinatario / endpoint" value={recipient} onChange={setRecipient} />
            </div>
            <label className="block">
              <div className="text-[8px] text-gray-600 mb-1 uppercase tracking-wider">Mensagem</div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full px-2.5 py-2 rounded text-xs text-white outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', caretColor: '#ff6b35' }}
              />
            </label>
            <div className="flex gap-2 flex-wrap">
              <ActionButton onClick={sendNotification} disabled={!recipient || !message}>Enviar notificacao</ActionButton>
              <ActionButton color="#00d4ff" onClick={copyPayload}>{copiedPayload ? 'Payload copiado' : 'Copiar payload'}</ActionButton>
            </div>
          </div>
          <div className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-[8px] text-gray-600 uppercase tracking-wider mb-2">Preview JSON</div>
            <pre className="text-[8px] font-mono leading-relaxed overflow-x-auto" style={{ color: '#8899aa', maxHeight: '245px' }}>
              {JSON.stringify(notificationPayload, null, 2)}
            </pre>
          </div>
        </div>
      </Panel>

      <Panel className="p-4">
        <SectionTitle title="Historico de envios" sub="Registro local simulado para demonstracao do fluxo operacional." />
        <div className="space-y-2">
          {sentLog.length === 0 && <div className="text-[11px] text-gray-600 py-3">Nenhuma notificacao enviada nesta sessao.</div>}
          {sentLog.map((item) => {
            const color = severityColor(item.severity)
            return (
              <div key={item.notificationId} className="rounded-lg px-3 py-2 flex flex-col md:flex-row md:items-center gap-2" style={{ background: `${color}07`, border: `1px solid ${color}22` }}>
                <div className="flex-1">
                  <div className="text-[10px] text-white font-semibold">{item.channel} - {item.recipient}</div>
                  <div className="text-[8px] text-gray-600 mt-0.5">{item.property} - {item.sentAt}</div>
                </div>
                <span className="text-[8px] font-bold px-2 py-1 rounded" style={{ color, background: `${color}12`, border: `1px solid ${color}33` }}>{item.status}</span>
              </div>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}

function FinanceMap({ hoveredId, onHover }) {
  return (
    <svg viewBox="0 0 520 580" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 20px rgba(0,212,255,0.1))' }}>
      <path
        d="M 185 30 L 210 25 L 240 28 L 265 20 L 290 28 L 315 22 L 340 30 L 360 42 L 375 55 L 385 70 L 395 88 L 405 108 L 415 125 L 420 145 L 418 165 L 410 182 L 415 198 L 425 210 L 430 228 L 425 245 L 415 258 L 408 272 L 405 290 L 400 308 L 392 325 L 380 340 L 368 355 L 360 372 L 355 390 L 348 408 L 338 420 L 325 432 L 312 442 L 298 450 L 285 460 L 272 468 L 260 475 L 248 480 L 235 485 L 222 490 L 210 492 L 198 490 L 188 484 L 180 476 L 172 465 L 165 452 L 158 438 L 150 424 L 142 408 L 135 392 L 128 375 L 122 358 L 118 340 L 115 322 L 112 303 L 110 285 L 108 267 L 106 248 L 105 230 L 108 212 L 112 195 L 118 178 L 124 162 L 128 145 L 130 128 L 132 110 L 135 93 L 140 77 L 148 62 L 158 50 L 170 38 Z"
        fill="rgba(0,212,255,0.05)"
        stroke="rgba(0,212,255,0.25)"
        strokeWidth="1.5"
      />
      {BRASIL_PINS.map((pin) => {
        const supplier = suppliers.find((s) => s.id === pin.id)
        const exposure = supplier.areaSegura * (supplier.geoRisk.score + 35) * 120
        const color = exposure > 520000000 ? '#ff0040' : exposure > 320000000 ? '#ff6b35' : exposure > 120000000 ? '#ffd700' : '#00d4ff'
        const r = Math.min(18, 7 + exposure / 80000000)
        const isHovered = hoveredId === pin.id
        return (
          <g key={pin.id} onMouseEnter={() => onHover(pin.id)} onMouseLeave={() => onHover(null)} style={{ cursor: 'pointer' }}>
            <circle cx={pin.x} cy={pin.y} r={r + 7} fill={`${color}13`} stroke={`${color}30`} strokeWidth="1">
              {exposure > 520000000 && <animate attributeName="r" values={`${r + 5};${r + 13};${r + 5}`} dur="2s" repeatCount="indefinite" />}
            </circle>
            <circle cx={pin.x} cy={pin.y} r={r} fill={`${color}22`} stroke={color} strokeWidth={isHovered ? 2 : 1.5} />
            <text x={pin.x} y={pin.y + 3.5} textAnchor="middle" fontSize="5.5" fontWeight="bold" fill={color}>{supplier.state}</text>
            {isHovered && (
              <g>
                <rect x={pin.x - 58} y={pin.y - 42} width="116" height="30" rx="4" fill="rgba(10,10,15,0.96)" stroke={`${color}44`} strokeWidth="1" />
                <text x={pin.x} y={pin.y - 29} textAnchor="middle" fontSize="7" fontWeight="bold" fill="white">{supplier.shortName}</text>
                <text x={pin.x} y={pin.y - 18} textAnchor="middle" fontSize="6.5" fill={color}>{money(exposure)}</text>
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}

export function FinancialExposure() {
  const [hoveredId, setHoveredId] = useState(null)
  const exposureBySupplier = suppliers.map((s) => ({ ...s, exposure: s.areaSegura * (s.geoRisk.score + 35) * 120, potential: s.areaSegura * s.geoRisk.score * 34 }))
  const total = exposureBySupplier.reduce((sum, s) => sum + s.exposure, 0)
  const critical = exposureBySupplier.filter((s) => ['HIGH', 'CRITICAL'].includes(s.geoRisk.level)).reduce((sum, s) => sum + s.exposure, 0)
  const potential = exposureBySupplier.reduce((sum, s) => sum + s.potential, 0)
  const ranking = [...exposureBySupplier].sort((a, b) => b.exposure - a.exposure)
  const stateData = exposureBySupplier.map((s) => ({ state: s.state, exposure: Math.round(s.exposure / 1000000) }))
  const riskData = ['CRITICAL','HIGH','MEDIUM','LOW'].map((level) => ({
    name: LEVEL_LABEL[level],
    value: Math.round(exposureBySupplier.filter((s) => s.geoRisk.level === level).reduce((sum, s) => sum + s.exposure, 0) / 1000000),
    color: RISK_COLORS[level],
  }))
  const temporal = [{ mes: 'Jan', exp: 880 }, { mes: 'Fev', exp: 940 }, { mes: 'Mar', exp: 1020 }, { mes: 'Abr', exp: 1090 }, { mes: 'Mai', exp: 1160 }, { mes: 'Jun', exp: Math.round(total / 1000000) }]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard label="Exposicao total" value={money(total)} sub="valor segurado agregado" color="#00d4ff" />
        <StatCard label="Areas criticas" value={money(critical)} sub="alto ou critico" color="#ff6b35" />
        <StatCard label="Prop. criticas" value={suppliers.filter((s) => s.geoRisk.level === 'CRITICAL').length} sub="score acima de 80" color="#ff0040" />
        <StatCard label="Potencial em risco" value={money(potential)} sub="perda esperada simulada" color="#ffd700" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4">
        <Panel className="p-4" accent="rgba(0,212,255,0.15)">
          <SectionTitle title="Heatmap de exposição financeira" sub="Propriedades monitoradas com intensidade proporcional à exposição segurada." />
          <div className="h-[470px]">
            <BrazilMap
              accentColor="#00d4ff"
              legendItems={[
                { color: '#ff0040', label: '> R$500M' },
                { color: '#ff6b35', label: '> R$300M' },
                { color: '#ffd700', label: '> R$100M' },
                { color: '#00d4ff', label: '< R$100M' },
              ]}
              renderMarkers={(proj, sw, s, dims) => (
                <>
                  {exposureBySupplier.map((sup) => {
                    const pos = proj([sup.lng, sup.lat])
                    if (!pos) return null
                    const [px, py] = pos
                    const color = sup.exposure > 500000000 ? '#ff0040'
                      : sup.exposure > 300000000 ? '#ff6b35'
                      : sup.exposure > 100000000 ? '#ffd700'
                      : '#00d4ff'
                    const r = sw(Math.min(22, 7 + sup.exposure / 80000000))
                    const isHov = hoveredId === sup.id
                    const ttLeft = px < dims.w / (2 * s)
                    const ttW = sw(120), ttH = sw(38)
                    const ttX = ttLeft ? px + sw(14) : px - ttW - sw(14)

                    return (
                      <g key={sup.id} style={{ cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredId(sup.id)}
                        onMouseLeave={() => setHoveredId(null)}>
                        {sup.exposure > 500000000 && (
                          <circle cx={px} cy={py} r={r} fill="none" stroke={color} strokeWidth={sw(0.7)}>
                            <animate attributeName="r" values={`${sw(12)};${sw(24)};${sw(12)}`} dur="2.4s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.4;0;0.4" dur="2.4s" repeatCount="indefinite" />
                          </circle>
                        )}
                        <circle cx={px} cy={py} r={r}
                          fill={`${color}18`} stroke={color}
                          strokeWidth={isHov ? sw(2) : sw(1.2)} />
                        <text x={px} y={py + sw(3)} textAnchor="middle"
                          fontSize={sw(isHov ? 7 : 6)} fontWeight="700"
                          fill={color} fontFamily="Inter, ui-monospace, monospace"
                          style={{ userSelect: 'none' }}>
                          {sup.state}
                        </text>
                        {isHov && (
                          <g>
                            <rect x={ttX} y={py - ttH * 0.5 - sw(2)} width={ttW} height={ttH} rx={sw(3)}
                              fill="rgba(7,7,12,0.97)" stroke={`${color}35`} strokeWidth={sw(0.8)} />
                            <text x={ttX + sw(9)} y={py - ttH * 0.5 + sw(11)} fontSize={sw(8)} fontWeight="600"
                              fill="rgba(255,255,255,0.9)" fontFamily="Inter, sans-serif" style={{ userSelect: 'none' }}>
                              {sup.shortName}
                            </text>
                            <text x={ttX + sw(9)} y={py - ttH * 0.5 + sw(22)} fontSize={sw(7)} fill={color}
                              fontFamily="Inter, ui-monospace, monospace" style={{ userSelect: 'none' }}>
                              {money(sup.exposure)}
                            </text>
                            <text x={ttX + sw(9)} y={py - ttH * 0.5 + sw(32)} fontSize={sw(6)}
                              fill="rgba(255,255,255,0.3)" fontFamily="Inter, sans-serif" style={{ userSelect: 'none' }}>
                              {sup.state} · {LEVEL_LABEL[sup.geoRisk.level]}
                            </text>
                          </g>
                        )}
                      </g>
                    )
                  })}
                </>
              )}
            />
          </div>
        </Panel>
        <Panel className="p-4">
          <SectionTitle title="Carteira sincronizada" />
          <div className="space-y-2">
            {ranking.map((s) => {
              const color = RISK_COLORS[s.geoRisk.level]
              return (
                <div key={s.id} onMouseEnter={() => setHoveredId(s.id)} onMouseLeave={() => setHoveredId(null)} className="rounded-lg px-3 py-2" style={{ background: hoveredId === s.id ? `${color}12` : 'rgba(255,255,255,0.02)', border: `1px solid ${hoveredId === s.id ? `${color}35` : 'rgba(255,255,255,0.06)'}` }}>
                  <div className="flex justify-between gap-2">
                    <span className="text-[10px] text-white truncate">{s.shortName}</span>
                    <span className="text-[9px] font-mono" style={{ color }}>{money(s.exposure)}</span>
                  </div>
                  <div className="text-[8px] text-gray-600 mt-0.5">{s.state} - {LEVEL_LABEL[s.geoRisk.level]}</div>
                </div>
              )
            })}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartPanel title="Distribuicao por estado">
          <ResponsiveContainer>
            <BarChart data={stateData}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="state" stroke="#555" fontSize={10} />
              <YAxis stroke="#555" fontSize={10} />
              <Tooltip contentStyle={{ background: '#11111a', border: '1px solid rgba(255,255,255,0.1)' }} />
              <Bar dataKey="exposure" fill="#00d4ff" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Por nivel de risco">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={riskData} dataKey="value" nameKey="name" innerRadius={42} outerRadius={72}>
                {riskData.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#11111a', border: '1px solid rgba(255,255,255,0.1)' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Evolucao temporal">
          <ResponsiveContainer>
            <AreaChart data={temporal}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="mes" stroke="#555" fontSize={10} />
              <YAxis stroke="#555" fontSize={10} />
              <Tooltip contentStyle={{ background: '#11111a', border: '1px solid rgba(255,255,255,0.1)' }} />
              <Area type="monotone" dataKey="exp" stroke="#ffd700" fill="rgba(255,215,0,0.16)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>
    </div>
  )
}

export function RiskForecast() {
  const [selectedId, setSelectedId] = useState(String(suppliers[0].id))
  const selected = suppliers.find((s) => s.id === Number(selectedId))
  const base = selected.geoRisk.score
  const drift = selected.geoRisk.level === 'CRITICAL' ? 6 : selected.geoRisk.level === 'HIGH' ? 5 : selected.geoRisk.level === 'MEDIUM' ? 2 : -1
  const forecast = [
    { label: 'Atual', score: base },
    { label: '30 dias', score: Math.max(0, Math.min(100, base + drift)) },
    { label: '60 dias', score: Math.max(0, Math.min(100, base + drift * 2)) },
    { label: '90 dias', score: Math.max(0, Math.min(100, base + drift * 3)) },
  ]
  const trend = drift > 1 ? 'Crescente' : drift < 0 ? 'Decrescente' : 'Estavel'
  const color = trend === 'Crescente' ? '#ff6b35' : trend === 'Decrescente' ? '#00ff88' : '#ffd700'

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-4">
      <Panel className="p-4">
        <SectionTitle title="Risk Forecast" sub="Projecao de risco geoespacial para apoiar decisoes preventivas." />
        <SelectField label="Propriedade" value={selectedId} onChange={setSelectedId} options={suppliers.map((s) => String(s.id))} labels={Object.fromEntries(suppliers.map((s) => [String(s.id), s.shortName]))} />
        <div className="mt-3 text-xs text-white">{selected.name}</div>
        <div className="text-[10px] text-gray-600 mt-1">{selected.region} - {selected.cultura}</div>
        <div className="mt-4"><MiniMetric label="Tendencia" value={trend} color={color} /></div>
      </Panel>

      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {forecast.map((f, index) => <StatCard key={f.label} label={f.label} value={f.score} sub={index === 0 ? 'score atual' : 'score previsto'} color={RISK_COLORS[riskLevel(f.score)]} />)}
        </div>
        <Panel className="p-4">
          <SectionTitle title="Grafico de projecao" right={<span className="text-[10px] font-bold" style={{ color }}>Tendencia {trend}</span>} />
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={forecast}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" stroke="#555" fontSize={10} />
                <YAxis stroke="#555" fontSize={10} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#11111a', border: '1px solid rgba(255,255,255,0.1)' }} />
                <Line dataKey="score" stroke={color} strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel className="p-4">
            <SectionTitle title="Motivos projetados" />
            <div className="space-y-2">
              {['Persistencia da seca regional', 'Historico climatico local', 'Queda continua da vegetacao', 'Pressao de queimadas no entorno'].slice(0, trend === 'Decrescente' ? 2 : 4).map((item) => (
                <div key={item} className="text-[11px] text-gray-300 rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>{item}</div>
              ))}
            </div>
          </Panel>
          <Panel className="p-4" accent={`${color}24`}>
            <SectionTitle title="Decisao preventiva sugerida" />
            <p className="text-sm text-gray-300 leading-relaxed">
              {trend === 'Crescente'
                ? 'Realizar revisao preventiva da exposicao segurada e elevar cadencia de monitoramento.'
                : trend === 'Decrescente'
                  ? 'Manter apolice em monitoramento padrao e registrar melhora de perfil.'
                  : 'Manter acompanhamento semanal ate o proximo ciclo de imagens orbitais.'}
            </p>
          </Panel>
        </div>
      </div>
    </div>
  )
}
