import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { lunarZones, ZONE_COLORS } from '../data/lunarZones'

const MOON_RADIUS = 2.4
const STAR_COUNT = 6000
const MOON_OFFSET = -Math.PI / 2

function latLngToXYZ(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return {
    x: -(radius * Math.sin(phi) * Math.cos(theta)),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  }
}

let _glowTex = null
function getGlowTexture() {
  if (_glowTex) return _glowTex
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  const grd = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  grd.addColorStop(0, 'rgba(255,255,255,1)')
  grd.addColorStop(0.25, 'rgba(255,255,255,0.7)')
  grd.addColorStop(0.6, 'rgba(255,255,255,0.15)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, 64, 64)
  _glowTex = new THREE.CanvasTexture(canvas)
  return _glowTex
}

function seededRNG(seed) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function drawCrater(ctx, x, y, r, rand) {
  const rimOpacity = 0.12 + rand() * 0.22
  const floorOpacity = 0.14 + rand() * 0.18

  const rimGrd = ctx.createRadialGradient(x, y, r * 0.75, x, y, r * 1.18)
  rimGrd.addColorStop(0, 'rgba(0,0,0,0)')
  rimGrd.addColorStop(0.55, `rgba(200,200,210,${rimOpacity})`)
  rimGrd.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = rimGrd
  ctx.beginPath()
  ctx.arc(x, y, r * 1.18, 0, Math.PI * 2)
  ctx.fill()

  const floorGrd = ctx.createRadialGradient(x + r * 0.18, y + r * 0.18, 0, x, y, r * 0.78)
  floorGrd.addColorStop(0, `rgba(28,28,32,${floorOpacity})`)
  floorGrd.addColorStop(0.6, `rgba(45,45,50,${floorOpacity * 0.55})`)
  floorGrd.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = floorGrd
  ctx.beginPath()
  ctx.arc(x, y, r * 0.78, 0, Math.PI * 2)
  ctx.fill()
}

function createMoonTexture() {
  const W = 2048
  const H = 1024
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  const rand = seededRNG(42837)

  ctx.fillStyle = '#727272'
  ctx.fillRect(0, 0, W, H)

  const maria = [
    { cx: 0.51 * W, cy: 0.37 * H, rx: 0.19 * W, opacity: 0.22 },
    { cx: 0.41 * W, cy: 0.31 * H, rx: 0.13 * W, opacity: 0.18 },
    { cx: 0.34 * W, cy: 0.50 * H, rx: 0.10 * W, opacity: 0.14 },
    { cx: 0.62 * W, cy: 0.42 * H, rx: 0.09 * W, opacity: 0.13 },
    { cx: 0.22 * W, cy: 0.40 * H, rx: 0.07 * W, opacity: 0.12 },
    { cx: 0.76 * W, cy: 0.56 * H, rx: 0.06 * W, opacity: 0.10 },
    { cx: 0.88 * W, cy: 0.38 * H, rx: 0.08 * W, opacity: 0.11 },
  ]
  maria.forEach((m) => {
    const grd = ctx.createRadialGradient(m.cx, m.cy, 0, m.cx, m.cy, m.rx)
    grd.addColorStop(0, `rgba(40,40,44,${m.opacity})`)
    grd.addColorStop(0.65, `rgba(35,35,40,${m.opacity * 0.6})`)
    grd.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, W, H)
  })

  const highlands = [
    { cx: 0.72 * W, cy: 0.62 * H, rx: 0.11 * W, opacity: 0.07 },
    { cx: 0.14 * W, cy: 0.56 * H, rx: 0.08 * W, opacity: 0.06 },
    { cx: 0.83 * W, cy: 0.28 * H, rx: 0.06 * W, opacity: 0.06 },
    { cx: 0.29 * W, cy: 0.72 * H, rx: 0.05 * W, opacity: 0.05 },
  ]
  highlands.forEach((h) => {
    const grd = ctx.createRadialGradient(h.cx, h.cy, 0, h.cx, h.cy, h.rx)
    grd.addColorStop(0, `rgba(220,220,230,${h.opacity})`)
    grd.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, W, H)
  })

  for (let i = 0; i < 28; i++) {
    drawCrater(ctx, rand() * W, rand() * H, 22 + rand() * 65, rand)
  }
  for (let i = 0; i < 90; i++) {
    drawCrater(ctx, rand() * W, rand() * H, 8 + rand() * 20, rand)
  }
  for (let i = 0; i < 420; i++) {
    drawCrater(ctx, rand() * W, rand() * H, 2.5 + rand() * 7, rand)
  }
  for (let i = 0; i < 1200; i++) {
    drawCrater(ctx, rand() * W, rand() * H, 0.5 + rand() * 2.2, rand)
  }

  return new THREE.CanvasTexture(canvas)
}

function createDenseStarField() {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(STAR_COUNT * 3)
  const colors = new Float32Array(STAR_COUNT * 3)
  const rand = seededRNG(99134)

  for (let i = 0; i < STAR_COUNT; i++) {
    const theta = rand() * Math.PI * 2
    const phi = Math.acos(2 * rand() - 1)
    const r = 80 + rand() * 70
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)

    const t = rand()
    if (t < 0.04) {
      colors[i * 3] = 0.7
      colors[i * 3 + 1] = 0.8
      colors[i * 3 + 2] = 1.0
    } else if (t < 0.07) {
      colors[i * 3] = 1.0
      colors[i * 3 + 1] = 0.85
      colors[i * 3 + 2] = 0.6
    } else {
      colors[i * 3] = 1.0
      colors[i * 3 + 1] = 1.0
      colors[i * 3 + 2] = 1.0
    }
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const mat = new THREE.PointsMaterial({
    size: 0.16,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true,
    vertexColors: true,
  })
  return new THREE.Points(geometry, mat)
}

function createZoneMarker(zone) {
  const color = ZONE_COLORS[zone.risk]
  const threeColor = new THREE.Color(color)
  const group = new THREE.Group()
  group.userData = { zoneId: zone.id, zone }

  const ringGeo = new THREE.RingGeometry(0.065, 0.098, 32)
  const ringMat = new THREE.MeshBasicMaterial({
    color: threeColor,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.7,
  })
  group.add(new THREE.Mesh(ringGeo, ringMat))

  const ring2Geo = new THREE.RingGeometry(0.098, 0.118, 32)
  const ring2Mat = new THREE.MeshBasicMaterial({
    color: threeColor,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.28,
  })
  group.add(new THREE.Mesh(ring2Geo, ring2Mat))

  const dotGeo = new THREE.CircleGeometry(0.048, 24)
  const dotMat = new THREE.MeshBasicMaterial({ color: threeColor })
  group.add(new THREE.Mesh(dotGeo, dotMat))

  const spriteMat = new THREE.SpriteMaterial({
    map: getGlowTexture(),
    color: threeColor,
    transparent: true,
    opacity: zone.risk === 'CRITICAL' ? 0.7 : 0.38,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const sprite = new THREE.Sprite(spriteMat)
  const s = zone.risk === 'CRITICAL' ? 0.62 : 0.4
  sprite.scale.set(s, s, 1)
  group.add(sprite)

  return group
}

function createArtemisMarker() {
  const group = new THREE.Group()
  const green = new THREE.Color(0x00ff88)

  const outerRingGeo = new THREE.RingGeometry(0.16, 0.22, 48)
  group.add(
    new THREE.Mesh(
      outerRingGeo,
      new THREE.MeshBasicMaterial({ color: green, side: THREE.DoubleSide, transparent: true, opacity: 0.45 }),
    ),
  )

  const innerRingGeo = new THREE.RingGeometry(0.09, 0.13, 48)
  group.add(
    new THREE.Mesh(
      innerRingGeo,
      new THREE.MeshBasicMaterial({ color: green, side: THREE.DoubleSide, transparent: true, opacity: 0.75 }),
    ),
  )

  const dotGeo = new THREE.CircleGeometry(0.06, 24)
  group.add(new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ color: green })))

  const glowSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: getGlowTexture(),
      color: green,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  glowSprite.scale.set(0.72, 0.72, 1)
  group.add(glowSprite)

  const labelCanvas = document.createElement('canvas')
  labelCanvas.width = 400
  labelCanvas.height = 80
  const ctx = labelCanvas.getContext('2d')
  ctx.clearRect(0, 0, 400, 80)
  ctx.fillStyle = 'rgba(0,18,9,0.75)'
  ctx.beginPath()
  ctx.roundRect(2, 14, 396, 52, 7)
  ctx.fill()
  ctx.strokeStyle = 'rgba(0,255,136,0.55)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(2, 14, 396, 52, 7)
  ctx.stroke()
  ctx.font = 'bold 21px sans-serif'
  ctx.fillStyle = '#00ff88'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('Artemis Base Alpha', 200, 40)

  const labelTex = new THREE.CanvasTexture(labelCanvas)
  const labelSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: labelTex, transparent: true }),
  )
  labelSprite.scale.set(2.6, 0.52, 1)
  labelSprite.position.set(0, 0.42, 0)
  group.add(labelSprite)

  return group
}

function createOrbitalRing() {
  const points = []
  for (let i = 0; i <= 128; i++) {
    const a = (i / 128) * Math.PI * 2
    points.push(new THREE.Vector3(
      (MOON_RADIUS + 0.82) * Math.cos(a),
      0,
      (MOON_RADIUS + 0.82) * 0.91 * Math.sin(a),
    ))
  }
  const geo = new THREE.BufferGeometry().setFromPoints(points)
  return new THREE.Line(
    geo,
    new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.22 }),
  )
}

function createSatellite() {
  const group = new THREE.Group()
  const geo = new THREE.SphereGeometry(0.046, 8, 8)
  group.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x00d4ff })))
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: getGlowTexture(),
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  sprite.scale.set(0.25, 0.25, 1)
  group.add(sprite)
  return group
}

function createBackgroundEarth() {
  const group = new THREE.Group()
  group.position.set(-10, 3, -26)

  const geo = new THREE.SphereGeometry(2.6, 32, 32)
  const mat = new THREE.MeshPhongMaterial({
    color: 0x1144bb,
    emissive: 0x0033aa,
    emissiveIntensity: 0.28,
    specular: 0x224488,
    shininess: 18,
  })
  group.add(new THREE.Mesh(geo, mat))

  const atmoGeo = new THREE.SphereGeometry(2.8, 32, 32)
  const atmoMat = new THREE.MeshBasicMaterial({
    color: 0x2255ee,
    transparent: true,
    opacity: 0.14,
    side: THREE.BackSide,
  })
  group.add(new THREE.Mesh(atmoGeo, atmoMat))

  return group
}

export default function MoonGlobe3D({ onZoneHover, onZoneClick, selectedId }) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const globeRef = useRef(null)
  const markersRef = useRef([])
  const orbitSatRef = useRef(null)
  const orbitRadiusRef = useRef(MOON_RADIUS + 0.82)
  const animFrameRef = useRef(null)
  const isDraggingRef = useRef(false)
  const prevMouseRef = useRef({ x: 0, y: 0 })
  const rotationRef = useRef({ x: 0.3, y: 0 })
  const autoRotateRef = useRef(true)
  const raycasterRef = useRef(new THREE.Raycaster())
  const mouseRef = useRef(new THREE.Vector2())
  const [tooltip, setTooltip] = useState(null)

  const init = useCallback(() => {
    const mount = mountRef.current
    if (!mount) return

    const W = mount.clientWidth
    const H = mount.clientHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#000005')
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000)
    camera.position.z = 6.5
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(W, H)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    mount.appendChild(renderer.domElement)
    rendererRef.current = renderer

    scene.add(createDenseStarField())
    scene.add(createBackgroundEarth())

    scene.add(new THREE.AmbientLight(0x111122, 0.18))
    const sunLight = new THREE.DirectionalLight(0xffeedd, 1.7)
    sunLight.position.set(10, 5, 8)
    scene.add(sunLight)

    const globeGroup = new THREE.Group()
    scene.add(globeGroup)
    globeRef.current = globeGroup

    const loader = new THREE.TextureLoader()
    const moonTexture = loader.load('/textures/moon.jpg')
    moonTexture.colorSpace = THREE.SRGBColorSpace
    const moonGeo = new THREE.SphereGeometry(MOON_RADIUS, 96, 96)
    const moonMat = new THREE.MeshPhongMaterial({
      map: moonTexture,
      bumpMap: moonTexture,
      bumpScale: 0.06,
      specular: new THREE.Color(0x080808),
      shininess: 2,
    })
    globeGroup.add(new THREE.Mesh(moonGeo, moonMat))

    markersRef.current = []
    lunarZones.forEach((zone) => {
      const pos = latLngToXYZ(zone.lat, zone.lng, MOON_RADIUS + 0.012)
      const marker = createZoneMarker(zone)
      marker.position.set(pos.x, pos.y, pos.z)
      marker.lookAt(0, 0, 0)
      marker.rotateX(Math.PI)
      globeGroup.add(marker)
      markersRef.current.push(marker)
    })

    const artPos = latLngToXYZ(-90, 0, MOON_RADIUS + 0.012)
    const artMarker = createArtemisMarker()
    artMarker.position.set(artPos.x, artPos.y, artPos.z)
    artMarker.lookAt(0, 0, 0)
    artMarker.rotateX(Math.PI)
    globeGroup.add(artMarker)

    const orbitGroup = new THREE.Group()
    orbitGroup.rotation.x = Math.PI / 6
    orbitGroup.rotation.y = Math.PI / 9
    orbitGroup.add(createOrbitalRing())

    const sat = createSatellite()
    orbitGroup.add(sat)
    orbitSatRef.current = { sat, group: orbitGroup }
    scene.add(orbitGroup)

    globeGroup.rotation.x = rotationRef.current.x
    globeGroup.rotation.y = rotationRef.current.y + MOON_OFFSET

    return { scene, camera, renderer, globeGroup }
  }, [])

  useEffect(() => {
    const refs = init()
    if (!refs) return
    const { scene, camera, renderer, globeGroup } = refs
    let frameCount = 0

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate)
      frameCount++

      if (autoRotateRef.current && !isDraggingRef.current) {
        rotationRef.current.y += 0.001
        globeGroup.rotation.y = rotationRef.current.y + MOON_OFFSET
      }

      markersRef.current.forEach((marker) => {
        if (marker.userData.zone?.risk === 'CRITICAL') {
          const scale = 1 + Math.sin(frameCount * 0.08) * 0.48
          if (marker.children[0]) marker.children[0].scale.set(scale, scale, scale)
        }
      })

      if (orbitSatRef.current) {
        const { sat } = orbitSatRef.current
        const r = orbitRadiusRef.current
        const t = frameCount * 0.006
        sat.position.x = r * Math.cos(t)
        sat.position.z = r * 0.91 * Math.sin(t)
        sat.position.y = 0
      }

      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      const mount = mountRef.current
      if (!mount) return
      const W = mount.clientWidth
      const H = mount.clientHeight
      camera.aspect = W / H
      camera.updateProjectionMatrix()
      renderer.setSize(W, H)
    }
    window.addEventListener('resize', handleResize)

    const canvas = renderer.domElement
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animFrameRef.current)
      renderer.dispose()
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas)
    }
  }, [init])

  const getCanvasCoords = useCallback((e) => {
    const mount = mountRef.current
    const rect = mount.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
      px: e.clientX,
      py: e.clientY,
    }
  }, [])

  const hitTestMarkers = useCallback((nx, ny) => {
    mouseRef.current.set(nx, ny)
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
    const targets = markersRef.current.flatMap((g) =>
      g.children.filter((c) => c.isMesh || c.isSprite),
    )
    const hits = raycasterRef.current.intersectObjects(targets, false)
    if (hits.length > 0) {
      let obj = hits[0].object
      while (obj && !obj.userData.zoneId) obj = obj.parent
      return obj?.userData?.zone ?? null
    }
    return null
  }, [])

  const onMouseMove = useCallback(
    (e) => {
      if (isDraggingRef.current) {
        const dx = e.clientX - prevMouseRef.current.x
        const dy = e.clientY - prevMouseRef.current.y
        rotationRef.current.y += dx * 0.005
        rotationRef.current.x += dy * 0.005
        rotationRef.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationRef.current.x))
        if (globeRef.current) {
          globeRef.current.rotation.y = rotationRef.current.y + MOON_OFFSET
          globeRef.current.rotation.x = rotationRef.current.x
        }
        prevMouseRef.current = { x: e.clientX, y: e.clientY }
        return
      }
      const { x, y, px, py } = getCanvasCoords(e)
      const hit = hitTestMarkers(x, y)
      if (hit) {
        setTooltip({ zone: hit, px, py })
        mountRef.current.style.cursor = 'pointer'
        onZoneHover?.(hit.id)
      } else {
        setTooltip(null)
        mountRef.current.style.cursor = 'grab'
        onZoneHover?.(null)
      }
    },
    [getCanvasCoords, hitTestMarkers, onZoneHover],
  )

  const onMouseDown = useCallback((e) => {
    isDraggingRef.current = true
    autoRotateRef.current = false
    prevMouseRef.current = { x: e.clientX, y: e.clientY }
    mountRef.current.style.cursor = 'grabbing'
  }, [])

  const onMouseUp = useCallback(() => {
    isDraggingRef.current = false
    mountRef.current.style.cursor = 'grab'
    setTimeout(() => { autoRotateRef.current = true }, 3000)
  }, [])

  const onClick = useCallback(
    (e) => {
      if (e.target === mountRef.current || e.target.tagName === 'CANVAS') {
        const { x, y } = getCanvasCoords(e)
        const hit = hitTestMarkers(x, y)
        if (hit) onZoneClick?.(hit.id)
      }
    },
    [getCanvasCoords, hitTestMarkers, onZoneClick],
  )

  const onWheel = useCallback((e) => {
    e.preventDefault()
    const cam = cameraRef.current
    if (!cam) return
    cam.position.z = Math.max(3.5, Math.min(12, cam.position.z + e.deltaY * 0.008))
  }, [])

  return (
    <div className="relative w-full h-full">
      <div
        ref={mountRef}
        className="w-full h-full"
        style={{ cursor: 'grab' }}
        onMouseMove={onMouseMove}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onClick={onClick}
        onWheel={onWheel}
      />

      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: tooltip.px + 16, top: tooltip.py - 16 }}
        >
          <div
            className="card-glass rounded-lg px-3 py-2 min-w-[190px]"
            style={{
              border: `1px solid ${ZONE_COLORS[tooltip.zone.risk]}44`,
              boxShadow: `0 0 20px ${ZONE_COLORS[tooltip.zone.risk]}22`,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{
                  background: ZONE_COLORS[tooltip.zone.risk],
                  boxShadow: `0 0 6px ${ZONE_COLORS[tooltip.zone.risk]}`,
                }}
              />
              <span className="text-white font-semibold text-sm">{tooltip.zone.shortName}</span>
            </div>
            <div className="text-xs text-gray-400">
              {tooltip.zone.resource} {tooltip.zone.resourceIcon}
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-xs text-gray-500">Risco de Esgotamento</span>
              <span
                className="text-xs font-bold"
                style={{ color: ZONE_COLORS[tooltip.zone.risk] }}
              >
                {tooltip.zone.depletionRisk}/100
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none lunar-grid-overlay opacity-20" />

      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="text-xs opacity-60 font-mono" style={{ color: '#aaaacc' }}>LUNAR-SCAN-01 · LIVE</div>
        <div
          className="w-16 h-px mt-1 opacity-40"
          style={{ background: 'linear-gradient(90deg, #aaaacc, transparent)' }}
        />
      </div>
      <div className="absolute top-4 right-4 pointer-events-none text-right">
        <div className="text-xs opacity-60 font-mono" style={{ color: '#aaaacc' }}>SOUTH POLE</div>
        <div
          className="w-16 h-px mt-1 opacity-40 ml-auto"
          style={{ background: 'linear-gradient(270deg, #aaaacc, transparent)' }}
        />
      </div>

      <div className="absolute bottom-4 left-4 pointer-events-none">
        <div className="flex items-center gap-2">
          {[
            { label: 'Ativa', color: '#00d4ff' },
            { label: 'Em risco', color: '#ff6b35' },
            { label: 'Crítica', color: '#ff0040' },
            { label: 'Estável', color: '#00ff88' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: color, boxShadow: `0 0 4px ${color}` }}
              />
              <span className="text-[9px] font-mono opacity-60" style={{ color }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
