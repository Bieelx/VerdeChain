import jsPDF from 'jspdf'
import { suppliers, RISK_COLORS } from '../data/suppliers'

const RISK_LABELS = { LOW: 'BAIXO', MEDIUM: 'MÉDIO', HIGH: 'ALTO', CRITICAL: 'CRÍTICO' }

function hexToRGB(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

export function generateESGReport() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const H = 297
  const margin = 16
  let y = 0

  // Cover background
  doc.setFillColor(10, 10, 15)
  doc.rect(0, 0, W, H, 'F')

  // Header bar
  doc.setFillColor(0, 30, 20)
  doc.rect(0, 0, W, 42, 'F')

  // Accent line
  doc.setFillColor(0, 255, 136)
  doc.rect(0, 42, W, 0.8, 'F')

  // Logo text
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(0, 255, 136)
  doc.text('VerdeChain', margin, 18)

  doc.setFontSize(8)
  doc.setTextColor(100, 120, 110)
  doc.text('ESG SUPPLY CHAIN INTELLIGENCE PLATFORM', margin, 25)

  // Report title
  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  doc.text('Relatório de Risco ESG — Cadeia de Fornecedores', margin, 36)

  // Date
  const now = new Date()
  const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  doc.setFontSize(8)
  doc.setTextColor(80, 100, 90)
  doc.text(`Gerado em ${dateStr}`, W - margin, 36, { align: 'right' })

  y = 55

  // Summary section
  doc.setFontSize(10)
  doc.setTextColor(0, 212, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMO EXECUTIVO', margin, y)
  y += 6

  doc.setFillColor(15, 15, 26)
  doc.roundedRect(margin, y, W - margin * 2, 30, 2, 2, 'F')
  doc.setDrawColor(26, 26, 46)
  doc.roundedRect(margin, y, W - margin * 2, 30, 2, 2, 'S')

  const totalCarbon = suppliers.reduce((a, s) => a + s.carbonEstimate, 0)
  const avgCompliance = Math.round(suppliers.reduce((a, s) => a + s.complianceScore, 0) / suppliers.length)
  const activeAlerts = suppliers.reduce((a, s) => a + s.alerts.length, 0)
  const criticals = suppliers.filter((s) => s.risk === 'CRITICAL').length

  const summaryStats = [
    { label: 'Total Fornecedores', value: `${suppliers.length}` },
    { label: 'Fornecedores Críticos', value: `${criticals}` },
    { label: 'Alertas Ativos', value: `${activeAlerts}` },
    { label: 'Carbono Total Est.', value: `${(totalCarbon / 1000).toFixed(0)}k tCO₂` },
    { label: 'Compliance Médio', value: `${avgCompliance}%` },
  ]

  const colW = (W - margin * 2) / summaryStats.length
  summaryStats.forEach(({ label, value }, i) => {
    const cx = margin + i * colW + colW / 2
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(0, 255, 136)
    doc.text(value, cx, y + 14, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(100, 110, 105)
    doc.text(label, cx, y + 22, { align: 'center' })
  })

  y += 38

  // Risk distribution chart (manual bars)
  doc.setFontSize(10)
  doc.setTextColor(0, 212, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('DISTRIBUIÇÃO DE RISCO', margin, y)
  y += 6

  const riskGroups = [
    { label: 'CRÍTICO', key: 'CRITICAL', color: '#ff0040' },
    { label: 'ALTO', key: 'HIGH', color: '#ff6b35' },
    { label: 'MÉDIO', key: 'MEDIUM', color: '#ffd700' },
    { label: 'BAIXO', key: 'LOW', color: '#00ff88' },
  ]

  riskGroups.forEach(({ label, key, color }) => {
    const count = suppliers.filter((s) => s.risk === key).length
    const barW = ((W - margin * 2 - 55) * count) / suppliers.length

    doc.setFillColor(15, 15, 26)
    doc.rect(margin, y, W - margin * 2, 9, 'F')

    const [r, g, b] = hexToRGB(color)
    doc.setFillColor(r, g, b)
    doc.rect(margin + 40, y + 2, barW, 5, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(r, g, b)
    doc.text(label, margin + 2, y + 6)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(200, 200, 200)
    doc.text(`${count} fornecedor${count !== 1 ? 'es' : ''}`, margin + 40 + barW + 3, y + 6)

    y += 11
  })

  y += 8

  // Supplier table header
  doc.setFontSize(10)
  doc.setTextColor(0, 212, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('DETALHAMENTO POR FORNECEDOR', margin, y)
  y += 6

  // Table header
  doc.setFillColor(15, 25, 20)
  doc.rect(margin, y, W - margin * 2, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(0, 255, 136)

  const cols = [
    { label: 'FORNECEDOR', x: margin + 2, w: 42 },
    { label: 'REGIÃO', x: margin + 46, w: 22 },
    { label: 'RISCO', x: margin + 70, w: 16 },
    { label: 'SCORE', x: margin + 88, w: 16 },
    { label: 'COMPLIANCE', x: margin + 106, w: 20 },
    { label: 'DESMAT.', x: margin + 128, w: 18 },
    { label: 'CO₂ ktCO₂', x: margin + 148, w: 22 },
  ]

  cols.forEach(({ label, x }) => doc.text(label, x, y + 5.5))
  y += 10

  // Supplier rows
  suppliers.forEach((sup, i) => {
    const rowH = 13
    if (i % 2 === 0) {
      doc.setFillColor(12, 12, 20)
      doc.rect(margin, y, W - margin * 2, rowH, 'F')
    }

    const [r, g, b] = hexToRGB(RISK_COLORS[sup.risk])

    // Risk indicator left bar
    doc.setFillColor(r, g, b)
    doc.rect(margin, y, 1.5, rowH, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(220, 220, 220)
    doc.text(sup.name.substring(0, 24), margin + 3, y + 5.5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(140, 140, 140)
    doc.text(sup.commodity, margin + 3, y + 10)

    doc.setTextColor(180, 180, 180)
    doc.text(sup.region, cols[1].x, y + 5.5)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(r, g, b)
    doc.text(RISK_LABELS[sup.risk], cols[2].x, y + 5.5)

    doc.setTextColor(r, g, b)
    doc.text(`${sup.riskScore}`, cols[3].x, y + 5.5)

    doc.setTextColor(0, 255, 136)
    doc.text(`${sup.complianceScore}%`, cols[4].x, y + 5.5)

    const defColor = sup.deforestationAlert > 30 ? [255, 0, 64] : sup.deforestationAlert > 10 ? [255, 107, 53] : [0, 255, 136]
    doc.setTextColor(...defColor)
    doc.text(`${sup.deforestationAlert}%`, cols[5].x, y + 5.5)

    doc.setTextColor(0, 212, 255)
    doc.text(`${(sup.carbonEstimate / 1000).toFixed(1)}`, cols[6].x, y + 5.5)

    y += rowH
  })

  y += 12

  // AI Recommendations
  doc.setFontSize(10)
  doc.setTextColor(0, 212, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('RECOMENDAÇÕES DE INTELIGÊNCIA ARTIFICIAL', margin, y)
  y += 6

  suppliers.forEach((sup) => {
    if (y > H - 30) {
      doc.addPage()
      doc.setFillColor(10, 10, 15)
      doc.rect(0, 0, W, H, 'F')
      y = 20
    }

    const [r, g, b] = hexToRGB(RISK_COLORS[sup.risk])
    doc.setFillColor(15, 15, 26)
    doc.roundedRect(margin, y, W - margin * 2, 20, 1.5, 1.5, 'F')
    doc.setDrawColor(r, g, b)
    doc.setLineWidth(0.3)
    doc.roundedRect(margin, y, W - margin * 2, 20, 1.5, 1.5, 'S')

    doc.setFillColor(r, g, b)
    doc.rect(margin, y, 2, 20, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(r, g, b)
    doc.text(`${sup.name}  ·  ${RISK_LABELS[sup.risk]}`, margin + 5, y + 7)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(190, 190, 190)
    const lines = doc.splitTextToSize(sup.aiRecommendation, W - margin * 2 - 10)
    doc.text(lines[0] || '', margin + 5, y + 14)

    y += 24
  })

  y += 8

  // Footer
  doc.setFillColor(0, 30, 20)
  doc.rect(0, H - 16, W, 16, 'F')
  doc.setFillColor(0, 255, 136)
  doc.rect(0, H - 16, W, 0.5, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(80, 100, 90)
  doc.text(
    `VerdeChain ESG Intelligence Platform  ·  Gerado em ${dateStr}  ·  Dados mock para demonstração`,
    W / 2, H - 6,
    { align: 'center' }
  )

  // Save
  const filename = `VerdeChain_ESG_Report_${now.toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}
