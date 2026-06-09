import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { geoEquirectangular, geoPath, geoGraticule } from 'd3-geo'
import { feature, mesh } from 'topojson-client'
import world from 'world-atlas/countries-110m.json'

const _countries = feature(world, world.objects.countries)
const _land      = feature(world, world.objects.land)
const _borders   = mesh(world, world.objects.countries, (a, b) => a !== b)
const _brazil    = _countries.features.find(f => f.id == 76)

/**
 * Reusable interactive Brazil map.
 * renderMarkers(proj, sw, s, dims) → JSX placed inside the zoomable group.
 * legendItems = [{ color, label }] shown bottom-left.
 * accentColor = border/glow color for Brazil outline (default orange).
 */
export default function BrazilMap({ renderMarkers, legendItems = [], accentColor = '#ff6b35' }) {
  const svgRef = useRef(null)
  const [dims, setDims] = useState({ w: 800, h: 600 })
  const [xf,   setXf]   = useState(null)
  const [drag,  setDrag] = useState(null)

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect
      if (w < 1 || h < 1) return
      const rw = Math.round(w), rh = Math.round(h)
      setDims(d => d.w === rw && d.h === rh ? d : { w: rw, h: rh })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const proj = useMemo(() =>
    geoEquirectangular().scale(83).translate([dims.w / 2, dims.h / 2])
  , [dims.w, dims.h])

  const pg = useMemo(() => geoPath().projection(proj), [proj])

  const landPath    = useMemo(() => pg(_land),    [pg])
  const bordersPath = useMemo(() => pg(_borders), [pg])
  const brazilPath  = useMemo(() => pg(_brazil),  [pg])
  const graticMinor = useMemo(() => pg(geoGraticule().step([10, 10])()), [pg])
  const graticMajor = useMemo(() => pg(geoGraticule().step([30, 30])()), [pg])
  const equatorPath = useMemo(() => pg({ type: 'LineString', coordinates: [[-180, 0],    [180, 0]]    }), [pg])
  const tropicPath  = useMemo(() => pg({ type: 'LineString', coordinates: [[-180, -23.5],[180, -23.5]] }), [pg])
  const spherePath  = useMemo(() => pg({ type: 'Sphere' }), [pg])
  const brCenter    = useMemo(() => proj([-53, -15]), [proj])

  useEffect(() => {
    if (xf !== null || dims.w < 100 || !brCenter) return
    const [brX, brY] = brCenter
    const s = 8
    setXf({ scale: s, tx: dims.w / 2 - brX * s, ty: dims.h / 2 - brY * s })
  }, [dims, brCenter, xf])

  const resetZoom = useCallback(() => {
    if (!brCenter) return
    const [brX, brY] = brCenter
    const s = 8
    setXf({ scale: s, tx: dims.w / 2 - brX * s, ty: dims.h / 2 - brY * s })
  }, [brCenter, dims])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const rect = svgRef.current.getBoundingClientRect()
    const mx = ((e.clientX - rect.left) / rect.width)  * dims.w
    const my = ((e.clientY - rect.top)  / rect.height) * dims.h
    const factor = e.deltaY < 0 ? 1.22 : 1 / 1.22
    setXf(prev => {
      if (!prev) return prev
      const newScale = Math.max(0.85, Math.min(20, prev.scale * factor))
      const ratio = newScale / prev.scale
      return { scale: newScale, tx: mx - (mx - prev.tx) * ratio, ty: my - (my - prev.ty) * ratio }
    })
  }, [dims])

  useEffect(() => {
    const el = svgRef.current
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  const onMouseDown = (e) => {
    if (e.button !== 0 || !xf) return
    e.preventDefault()
    const rect = svgRef.current.getBoundingClientRect()
    setDrag({ startX: e.clientX, startY: e.clientY, origTx: xf.tx, origTy: xf.ty,
              scaleX: dims.w / rect.width, scaleY: dims.h / rect.height })
  }
  const onMouseMove = (e) => {
    if (!drag) return
    setXf(prev => ({
      ...prev,
      tx: drag.origTx + (e.clientX - drag.startX) * drag.scaleX,
      ty: drag.origTy + (e.clientY - drag.startY) * drag.scaleY,
    }))
  }
  const onMouseUp = () => setDrag(null)

  const s  = xf?.scale ?? 1
  const sw = (b) => b / s
  const xfAttr = xf ? `translate(${xf.tx} ${xf.ty}) scale(${s})` : 'scale(1)'

  const [, eqY]  = proj([0, 0])
  const [, capY] = proj([0, -23.5])
  const [atlX, atlY] = proj([-25, -30])
  const ty_ = xf?.ty ?? 0
  const screenEqY  = eqY  * s + ty_
  const screenCapY = capY * s + ty_

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${dims.w} ${dims.h}`}
      style={{ display: 'block', width: '100%', height: '100%',
               overflow: 'hidden', cursor: drag ? 'grabbing' : 'grab',
               opacity: xf ? 1 : 0, transition: 'opacity 0.25s ease' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <defs>
        <radialGradient id={`bmap-br-ambient-${accentColor.replace('#','')}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={accentColor} stopOpacity="0.12" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0"    />
        </radialGradient>
        <radialGradient id="bmap-vignette" cx="50%" cy="50%" r="70%">
          <stop offset="50%"  stopColor="black" stopOpacity="0"    />
          <stop offset="100%" stopColor="black" stopOpacity="0.65" />
        </radialGradient>
        <clipPath id="bmap-clip">
          <rect width={dims.w} height={dims.h} />
        </clipPath>
      </defs>

      <g transform={xfAttr} clipPath="url(#bmap-clip)">
        <rect x="-99999" y="-99999" width="199998" height="199998" fill="rgba(0,6,16,1)" />
        <path d={spherePath} fill="rgba(0,10,24,0.85)" />

        <path d={graticMinor} fill="none" stroke="rgba(0,212,255,0.055)" strokeWidth={sw(0.45)} />
        <path d={graticMajor} fill="none" stroke="rgba(0,212,255,0.13)"  strokeWidth={sw(0.65)}
          strokeDasharray={`${sw(4)} ${sw(6)}`} />

        <path d={landPath}    fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.16)" strokeWidth={sw(0.55)} strokeLinejoin="round" />
        <path d={bordersPath} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={sw(0.35)} />
        <path d={spherePath}  fill="none" stroke="rgba(0,212,255,0.18)"   strokeWidth={sw(0.8)} />

        <path d={brazilPath} fill={`url(#bmap-br-ambient-${accentColor.replace('#','')})`} stroke="none" />

        {brazilPath && (
          <path d={brazilPath}
            fill={`${accentColor}0d`} stroke={`${accentColor}55`}
            strokeWidth={sw(1.1)} strokeLinejoin="round" />
        )}

        <path d={equatorPath} fill="none" stroke="rgba(0,212,255,0.35)" strokeWidth={sw(0.85)} />
        <path d={tropicPath}  fill="none" stroke="rgba(255,107,53,0.28)" strokeWidth={sw(0.7)}
          strokeDasharray={`${sw(5)} ${sw(5)}`} />

        <text x={atlX} y={atlY} fontSize={sw(7.5)} fill="rgba(0,212,255,0.1)"
          fontFamily="Inter, sans-serif" fontWeight="500"
          letterSpacing={sw(1.8)} textAnchor="middle" style={{ userSelect: 'none' }}>
          ATLÂNTICO SUL
        </text>

        {renderMarkers?.(proj, sw, s, dims)}
      </g>

      {/* Reference line labels */}
      <g style={{ pointerEvents: 'none' }}>
        {screenEqY > 8 && screenEqY < dims.h - 4 && (
          <text x={10} y={screenEqY - 4} fontSize="8" fill="rgba(0,212,255,0.65)"
            fontFamily="Inter, sans-serif" letterSpacing="0.6" style={{ userSelect: 'none' }}>
            EQUADOR
          </text>
        )}
        {screenCapY > 8 && screenCapY < dims.h - 4 && (
          <text x={10} y={screenCapY - 4} fontSize="7.5" fill="rgba(255,107,53,0.6)"
            fontFamily="Inter, sans-serif" letterSpacing="0.5" style={{ userSelect: 'none' }}>
            TRÓPICO DE CAPRICÓRNIO
          </text>
        )}
      </g>

      <rect width={dims.w} height={dims.h} fill="url(#bmap-vignette)" style={{ pointerEvents: 'none' }} />

      {/* Legend */}
      {legendItems.length > 0 && (
        <g style={{ pointerEvents: 'none' }}>
          {legendItems.map(({ color, label }, i) => (
            <g key={label} transform={`translate(12, ${dims.h - 14 - i * 18})`}>
              <circle cx="5" cy="0" r="4" fill={`${color}18`} stroke={color} strokeWidth="1.1" />
              <text x="12" y="4" fontSize="7" fill={color} fontWeight="600" fontFamily="Inter, sans-serif">
                {label}
              </text>
            </g>
          ))}
        </g>
      )}

      {/* Reset button */}
      <g style={{ pointerEvents: 'all', cursor: 'pointer' }}
        onClick={resetZoom}
        onMouseEnter={e => e.currentTarget.querySelector('rect').style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.querySelector('rect').style.opacity = '0.6'}
        transform={`translate(${dims.w - 42}, 8)`}>
        <rect width="34" height="18" rx="3"
          fill="rgba(0,212,255,0.08)" stroke="rgba(0,212,255,0.2)"
          strokeWidth="0.8" style={{ opacity: 0.6, transition: 'opacity 0.15s' }} />
        <text x="17" y="12" textAnchor="middle" fontSize="6.5"
          fill="rgba(0,212,255,0.7)" fontFamily="Inter, sans-serif" fontWeight="500">
          BR
        </text>
      </g>

      <text x={dims.w - 50} y={dims.h - 6} textAnchor="end" fontSize="6"
        fill="rgba(255,255,255,0.12)" fontFamily="Inter, sans-serif" style={{ pointerEvents: 'none' }}>
        scroll zoom · arrastar mover
      </text>
    </svg>
  )
}
