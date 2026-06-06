import jsPDF from 'jspdf'
import { RISK_COLORS } from '../data/suppliers'

const RISK_LABELS = { LOW: 'BAIXO', MEDIUM: 'MÉDIO', HIGH: 'ALTO', CRITICAL: 'CRÍTICO' }
const DECISAO_LABELS = {
  APROVAR: 'APROVAR',
  MONITORAR: 'MONITORAR',
  ANALISE_COMPLEMENTAR: 'ANÁLISE COMPLEMENTAR',
  REJEITAR: 'REJEITAR',
}
const DECISAO_COLORS = {
  APROVAR: '#00ff88',
  MONITORAR: '#00d4ff',
  ANALISE_COMPLEMENTAR: '#ffd700',
  REJEITAR: '#ff0040',
}

function hexToRGB(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

export function generateGeoRiskReport(supplier) {
  const gr = supplier.geoRisk
  if (!gr) return

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const H = 297
  const margin = 16
  let y = 0

  const riskColor = RISK_COLORS[gr.level]
  const decisaoColor = DECISAO_COLORS[gr.decisaoSugerida]
  const [rr, rg, rb] = hexToRGB(riskColor)
  const [dr, dg, db] = hexToRGB(decisaoColor)

  // Background
  doc.setFillColor(10, 10, 15)
  doc.rect(0, 0, W, H, 'F')

  // Header bar
  doc.setFillColor(20, 10, 5)
  doc.rect(0, 0, W, 44, 'F')

  // Accent line laranja GeoRisk
  doc.setFillColor(255, 107, 53)
  doc.rect(0, 44, W, 0.8, 'F')

  // Logo GeoRisk
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(255, 107, 53)
  doc.text('GeoRisk', margin, 18)

  doc.setFontSize(8)
  doc.setTextColor(120, 80, 60)
  doc.text('INTELIGÊNCIA GEOESPACIAL PARA SEGUROS AGRÍCOLAS', margin, 25)

  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text('Laudo de Score de Risco Geoespacial', margin, 36)

  // Data
  const now = new Date()
  const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  doc.setFontSize(8)
  doc.setTextColor(100, 80, 60)
  doc.text(`Gerado em ${dateStr}`, W - margin, 36, { align: 'right' })

  y = 56

  // Identificação da propriedade
  doc.setFontSize(9)
  doc.setTextColor(255, 107, 53)
  doc.setFont('helvetica', 'bold')
  doc.text('IDENTIFICAÇÃO DA PROPRIEDADE', margin, y)
  y += 5

  doc.setFillColor(15, 12, 10)
  doc.roundedRect(margin, y, W - margin * 2, 28, 2, 2, 'F')
  doc.setDrawColor(50, 30, 15)
  doc.roundedRect(margin, y, W - margin * 2, 28, 2, 2, 'S')

  // Barra de cor lateral
  doc.setFillColor(rr, rg, rb)
  doc.rect(margin, y, 2, 28, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255)
  doc.text(supplier.name, margin + 6, y + 9)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(160, 140, 120)
  doc.text(`${supplier.company}`, margin + 6, y + 16)
  doc.text(`${supplier.region} · ${supplier.biome} · Cultura: ${supplier.cultura}`, margin + 6, y + 22)

  // Coords simuladas baseadas em lat/lng
  doc.setTextColor(100, 90, 80)
  doc.setFontSize(7)
  doc.text(`Lat ${supplier.lat.toFixed(4)}  Lng ${supplier.lng.toFixed(4)}  ·  Área segurada: ${supplier.areaSegura?.toLocaleString('pt-BR')} ha`, W - margin - 2, y + 9, { align: 'right' })
  doc.text(`Última varredura: ${gr.ultimaVarredura}`, W - margin - 2, y + 16, { align: 'right' })

  y += 34

  // Score principal
  doc.setFontSize(9)
  doc.setTextColor(255, 107, 53)
  doc.setFont('helvetica', 'bold')
  doc.text('SCORE GEORISK', margin, y)
  y += 5

  doc.setFillColor(15, 12, 10)
  doc.roundedRect(margin, y, W - margin * 2, 30, 2, 2, 'F')

  // Score número grande
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(36)
  doc.setTextColor(rr, rg, rb)
  doc.text(`${gr.score}`, margin + 10, y + 22)

  doc.setFontSize(8)
  doc.setTextColor(120, 100, 80)
  doc.text('/ 100', margin + 10 + (gr.score >= 100 ? 22 : gr.score >= 10 ? 16 : 10), y + 22)

  // Nível badge
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(rr, rg, rb)
  doc.text(RISK_LABELS[gr.level], margin + 52, y + 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(120, 100, 80)
  doc.text('Nível de Risco Geoespacial', margin + 52, y + 20)

  // Barra de score visual
  const barX = margin + 52
  const barW = W - margin * 2 - 60
  doc.setFillColor(30, 20, 15)
  doc.roundedRect(barX, y + 22, barW, 4, 1, 1, 'F')
  doc.setFillColor(rr, rg, rb)
  doc.roundedRect(barX, y + 22, (gr.score / 100) * barW, 4, 1, 1, 'F')

  y += 36

  // Breakdown dos fatores
  doc.setFontSize(9)
  doc.setTextColor(255, 107, 53)
  doc.setFont('helvetica', 'bold')
  doc.text('BREAKDOWN DOS FATORES DE RISCO', margin, y)
  y += 5

  const fatores = [
    { label: 'Queimadas Próximas', key: 'queimadas', max: 30, icon: 'Fogo' },
    { label: 'Histórico de Seca', key: 'seca', max: 25, icon: 'Seca' },
    { label: 'Saúde da Vegetação (NDVI)', key: 'vegetacao', max: 20, icon: 'NDVI' },
    { label: 'Histórico de Sinistros', key: 'historicoSinistros', max: 15, icon: 'Hist.' },
    { label: 'Proximidade Área Crítica', key: 'areaCritica', max: 10, icon: 'Área' },
  ]

  doc.setFillColor(15, 12, 10)
  doc.roundedRect(margin, y, W - margin * 2, fatores.length * 13 + 6, 2, 2, 'F')

  fatores.forEach((f, i) => {
    const val = gr.fatores[f.key]
    const pct = val / f.max
    const fy = y + 6 + i * 13
    const bx = margin + 72
    const bw = W - margin * 2 - 80

    const fColor = pct >= 0.8 ? '#ff0040' : pct >= 0.6 ? '#ff6b35' : pct >= 0.4 ? '#ffd700' : '#00ff88'
    const [fr, fg, fb] = hexToRGB(fColor)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(180, 160, 140)
    doc.text(f.label, margin + 4, fy + 4)

    // Barra
    doc.setFillColor(25, 20, 15)
    doc.roundedRect(bx, fy, bw, 5, 1, 1, 'F')
    doc.setFillColor(fr, fg, fb)
    doc.roundedRect(bx, fy, pct * bw, 5, 1, 1, 'F')

    // Valor
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(fr, fg, fb)
    doc.text(`${val}/${f.max}`, W - margin - 2, fy + 4, { align: 'right' })
  })

  y += fatores.length * 13 + 12

  // Alertas GeoRisk
  if (gr.alertasGeoRisk.length > 0) {
    doc.setFontSize(9)
    doc.setTextColor(255, 107, 53)
    doc.setFont('helvetica', 'bold')
    doc.text('ALERTAS GEOESPACIAIS ATIVOS', margin, y)
    y += 5

    gr.alertasGeoRisk.forEach((alert) => {
      const ac = RISK_COLORS[alert.severidade] || '#ff6b35'
      const [ar, ag, ab] = hexToRGB(ac)

      doc.setFillColor(15, 12, 10)
      doc.roundedRect(margin, y, W - margin * 2, 18, 1.5, 1.5, 'F')
      doc.setFillColor(ar, ag, ab)
      doc.rect(margin, y, 2, 18, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(ar, ag, ab)
      doc.text(alert.tipo, margin + 5, y + 7)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(170, 150, 130)
      const lines = doc.splitTextToSize(alert.msg, W - margin * 2 - 10)
      doc.text(lines[0] || '', margin + 5, y + 13)

      doc.setTextColor(90, 80, 70)
      doc.text(alert.data, W - margin - 2, y + 7, { align: 'right' })

      y += 22
    })
    y += 4
  }

  // Decisão sugerida
  doc.setFontSize(9)
  doc.setTextColor(255, 107, 53)
  doc.setFont('helvetica', 'bold')
  doc.text('DECISÃO SUGERIDA', margin, y)
  y += 5

  doc.setFillColor(15, 12, 10)
  doc.roundedRect(margin, y, W - margin * 2, 28, 2, 2, 'F')
  doc.setDrawColor(dr, dg, db)
  doc.setLineWidth(0.4)
  doc.roundedRect(margin, y, W - margin * 2, 28, 2, 2, 'S')
  doc.setLineWidth(0.1)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(dr, dg, db)
  doc.text(DECISAO_LABELS[gr.decisaoSugerida], margin + 6, y + 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(160, 140, 120)
  const decisaoMsgs = {
    APROVAR: 'Risco geoespacial aceitável. Apólice pode ser emitida normalmente.',
    MONITORAR: 'Risco moderado. Recomenda-se acompanhamento trimestral via satélite.',
    ANALISE_COMPLEMENTAR: 'Solicitar vistoria de campo antes de emitir apólice.',
    REJEITAR: 'Risco geoespacial crítico. Encaminhar para análise manual da equipe de subscrição.',
  }
  doc.text(decisaoMsgs[gr.decisaoSugerida], margin + 6, y + 20)

  y += 34

  // Disclaimer
  doc.setFillColor(18, 15, 12)
  doc.roundedRect(margin, y, W - margin * 2, 22, 2, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(150, 130, 110)
  doc.text('AVISO IMPORTANTE', margin + 4, y + 7)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(110, 95, 80)
  const disclaimer = 'Este laudo é baseado em dados geoespaciais de satélite (Sentinel-2, FIRMS NASA) e serve como camada de inteligência complementar ao processo de subscrição. O GeoRisk não vende seguros nem determina prêmios. A seguradora mantém autonomia total sobre aceitação, precificação e gestão de risco conforme suas regras atuariais.'
  const dlines = doc.splitTextToSize(disclaimer, W - margin * 2 - 8)
  doc.text(dlines, margin + 4, y + 13)

  y += 28

  // Footer
  doc.setFillColor(20, 10, 5)
  doc.rect(0, H - 16, W, 16, 'F')
  doc.setFillColor(255, 107, 53)
  doc.rect(0, H - 16, W, 0.5, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(100, 70, 50)
  doc.text(
    `GeoRisk — Inteligência Geoespacial para Seguros  ·  ${dateStr}  ·  Dados para demonstração acadêmica`,
    W / 2, H - 6,
    { align: 'center' }
  )

  const filename = `GeoRisk_Laudo_${supplier.name.replace(/\s/g, '_')}_${now.toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}
