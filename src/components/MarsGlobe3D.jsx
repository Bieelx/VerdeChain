import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { marsZones, MARS_ZONE_COLORS } from '../data/marsZones'

const MARS_RADIUS = 2.4
const STAR_COUNT = 6000
const MARS_OFFSET = -Math.PI / 2

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

function createMarsTexture() {
  const W = 2048
  const H = 1024
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  const rand = seededRNG(55771)

  // Base: rusty red gradient
  const base = ctx.createLinearGradient(0, 0, 0, H)
  base.addColorStop(0, '#6b2808')
  base.addColorStop(0.12, '#7d2e0a')
  base.addColorStop(0.3, '#a63a12')
  base.addColorStop(0.5, '#c1440e')
  base.addColorStop(0.7, '#a63a12')
  base.addColorStop(0.88, '#7d2e0a')
  base.addColorStop(1, '#6b2808')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, W, H)

  // Arabia Terra: lighter ochre region (NE quadrant)
  const arabia = ctx.createRadialGradient(0.72 * W, 0.37 * H, 0, 0.72 * W, 0.37 * H, 0.28 * W)
  arabia.addColorStop(0, 'rgba(200,130,70,0.28)')
  arabia.addColorStop(0.5, 'rgba(180,100,50,0.14)')
  arabia.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = arabia
  ctx.fillRect(0, 0, W, H)

  // Southern highlands: slightly lighter tan
  const shighlands = ctx.createRadialGradient(0.55 * W, 0.68 * H, 0, 0.55 * W, 0.68 * H, 0.45 * W)
  shighlands.addColorStop(0, 'rgba(195,110,55,0.22)')
  shighlands.addColorStop(0.6, 'rgba(175,85,40,0.10)')
  shighlands.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = shighlands
  ctx.fillRect(0, 0, W, H)

  // Tharsis Bulge: darker volcanic region (lon≈-110, lat≈5)
  // x=(−110+180)/360*2048≈397, y=(90−5)/180*1024≈483
  const tharsis = ctx.createRadialGradient(0.19 * W, 0.50 * H, 0, 0.19 * W, 0.50 * H, 0.22 * W)
  tharsis.addColorStop(0, 'rgba(30,8,0,0.38)')
  tharsis.addColorStop(0.4, 'rgba(30,8,0,0.20)')
  tharsis.addColorStop(0.8, 'rgba(20,5,0,0.08)')
  tharsis.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = tharsis
  ctx.fillRect(0, 0, W, H)

  // Olympus Mons: dark shield volcano (lon≈−134, lat≈18)
  // x=(−134+180)/360*2048≈262, y=(90−18)/180*1024≈409
  const olympus = ctx.createRadialGradient(262, 409, 0, 262, 409, 95)
  olympus.addColorStop(0, 'rgba(22,5,0,0.65)')
  olympus.addColorStop(0.35, 'rgba(22,5,0,0.42)')
  olympus.addColorStop(0.7, 'rgba(22,5,0,0.18)')
  olympus.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = olympus
  ctx.beginPath()
  ctx.arc(262, 409, 95, 0, Math.PI * 2)
  ctx.fill()
  // Caldera
  const caldera = ctx.createRadialGradient(262, 409, 0, 262, 409, 28)
  caldera.addColorStop(0, 'rgba(10,2,0,0.85)')
  caldera.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = caldera
  ctx.beginPath()
  ctx.arc(262, 409, 28, 0, Math.PI * 2)
  ctx.fill()

  // Ascraeus, Pavonis, Arsia Mons (Tharsis volcanoes — smaller)
  ;[
    { x: 340, y: 440, r: 42 },
    { x: 375, y: 500, r: 38 },
    { x: 370, y: 565, r: 40 },
  ].forEach(({ x, y, r }) => {
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r)
    grd.addColorStop(0, 'rgba(18,4,0,0.55)')
    grd.addColorStop(0.5, 'rgba(18,4,0,0.28)')
    grd.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grd
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  })

  // Valles Marineris: long dark canyon (lon −30 to −90, lat≈−10)
  // x1=(−90+180)/360*2048≈512, x2=(−30+180)/360*2048≈853, y≈569
  ctx.save()
  for (let pass = 0; pass < 4; pass++) {
    const yOff = -14 + pass * 10
    const xStart = 490 + rand() * 20
    const xEnd = 860 + rand() * 20
    const yCtr = 569 + yOff
    const h = 12 + rand() * 22
    const canyon = ctx.createLinearGradient(xStart, yCtr, xEnd, yCtr)
    canyon.addColorStop(0, 'rgba(15,3,0,0)')
    canyon.addColorStop(0.06, `rgba(15,3,0,${0.55 + rand() * 0.35})`)
    canyon.addColorStop(0.94, `rgba(15,3,0,${0.55 + rand() * 0.35})`)
    canyon.addColorStop(1, 'rgba(15,3,0,0)')
    ctx.fillStyle = canyon
    ctx.beginPath()
    ctx.ellipse((xStart + xEnd) / 2, yCtr, (xEnd - xStart) / 2, h, 0.05 * pass, 0, Math.PI * 2)
    ctx.fill()
  }
  // Canyon branching fingers
  for (let i = 0; i < 8; i++) {
    const bx = 512 + rand() * 341
    const by = 558 + rand() * 28
    const blen = 25 + rand() * 55
    const bang = -Math.PI / 2 + (rand() - 0.5) * 0.8
    ctx.beginPath()
    ctx.moveTo(bx, by)
    ctx.lineTo(bx + Math.cos(bang) * blen, by + Math.sin(bang) * blen)
    ctx.strokeStyle = `rgba(12,2,0,${0.28 + rand() * 0.3})`
    ctx.lineWidth = 2 + rand() * 5
    ctx.stroke()
  }
  ctx.restore()

  // Hellas Basin: deep dark ellipse (lon=70, lat=−42)
  // x=(70+180)/360*2048≈1422, y=(90+42)/180*1024≈750
  const hellas = ctx.createRadialGradient(1422, 750, 0, 1422, 750, 130)
  hellas.addColorStop(0, 'rgba(12,3,0,0.55)')
  hellas.addColorStop(0.45, 'rgba(12,3,0,0.30)')
  hellas.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = hellas
  ctx.beginPath()
  ctx.ellipse(1422, 750, 130, 95, 0.1, 0, Math.PI * 2)
  ctx.fill()

  // Isidis Basin: slight depression (lon=87.5, lat=12.9)
  // x=(87.5+180)/360*2048≈1523, y=(90−12.9)/180*1024≈438
  const isidis = ctx.createRadialGradient(1523, 438, 0, 1523, 438, 75)
  isidis.addColorStop(0, 'rgba(15,4,0,0.32)')
  isidis.addColorStop(0.5, 'rgba(15,4,0,0.15)')
  isidis.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = isidis
  ctx.beginPath()
  ctx.ellipse(1523, 438, 75, 60, 0, 0, Math.PI * 2)
  ctx.fill()

  // Elysium Mons: small shield (lon=147, lat=25)
  // x=(147+180)/360*2048≈1859, y=(90-25)/180*1024≈369
  const elysium = ctx.createRadialGradient(1859, 369, 0, 1859, 369, 55)
  elysium.addColorStop(0, 'rgba(20,5,0,0.45)')
  elysium.addColorStop(0.5, 'rgba(20,5,0,0.22)')
  elysium.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = elysium
  ctx.beginPath()
  ctx.arc(1859, 369, 55, 0, Math.PI * 2)
  ctx.fill()

  // Impact craters
  const drawMarsCrater = (cx, cy, r) => {
    const ejecta = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.3)
    ejecta.addColorStop(0, 'rgba(0,0,0,0)')
    ejecta.addColorStop(0.4, `rgba(210,120,60,${0.06 + rand() * 0.10})`)
    ejecta.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = ejecta
    ctx.beginPath()
    ctx.arc(cx, cy, r * 1.3, 0, Math.PI * 2)
    ctx.fill()
    const bowl = ctx.createRadialGradient(cx + r * 0.15, cy + r * 0.15, 0, cx, cy, r * 0.85)
    bowl.addColorStop(0, `rgba(12,3,0,${0.22 + rand() * 0.20})`)
    bowl.addColorStop(0.6, `rgba(12,3,0,${0.10 + rand() * 0.12})`)
    bowl.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = bowl
    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2)
    ctx.fill()
  }

  for (let i = 0; i < 18; i++) drawMarsCrater(rand() * W, rand() * H, 28 + rand() * 70)
  for (let i = 0; i < 55; i++) drawMarsCrater(rand() * W, rand() * H, 10 + rand() * 26)
  for (let i = 0; i < 200; i++) drawMarsCrater(rand() * W, rand() * H, 3 + rand() * 9)
  for (let i = 0; i < 600; i++) drawMarsCrater(rand() * W, rand() * H, 0.8 + rand() * 3)

  // North polar cap
  const northGrd = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 80, 240)
  northGrd.addColorStop(0, 'rgba(228,232,245,0.98)')
  northGrd.addColorStop(0.35, 'rgba(210,215,235,0.80)')
  northGrd.addColorStop(0.65, 'rgba(195,198,220,0.45)')
  northGrd.addColorStop(0.85, 'rgba(185,185,210,0.18)')
  northGrd.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = northGrd
  ctx.fillRect(0, 0, W, 230)

  // South polar cap (smaller, offset — Mars south cap is mostly CO₂)
  const southGrd = ctx.createRadialGradient(W / 2, H, 0, W / 2, H - 60, 185)
  southGrd.addColorStop(0, 'rgba(235,238,250,0.95)')
  southGrd.addColorStop(0.3, 'rgba(220,222,240,0.75)')
  southGrd.addColorStop(0.6, 'rgba(200,202,225,0.40)')
  southGrd.addColorStop(0.85, 'rgba(185,185,210,0.15)')
  southGrd.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = southGrd
  ctx.fillRect(0, H - 185, W, 185)

  // General color noise / terrain variation
  for (let i = 0; i < 35; i++) {
    const nx = rand() * W
    const ny = rand() * H
    const nr = 40 + rand() * 120
    const bright = rand() > 0.5
    const patch = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr)
    if (bright) {
      patch.addColorStop(0, `rgba(215,130,65,${0.04 + rand() * 0.08})`)
    } else {
      patch.addColorStop(0, `rgba(18,5,0,${0.04 + rand() * 0.07})`)
    }
    patch.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = patch
    ctx.fillRect(0, 0, W, H)
  }

  return new THREE.CanvasTexture(canvas)
}

function createDustStormTexture() {
  const W = 1024
  const H = 512
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, W, H)

  const rand = seededRNG(33217)

  const clouds = [
    { cx: 0.52 * W, cy: 0.70 * H, rx: 0.30 * W, ry: 0.16 * H, opacity: 0.13 },
    { cx: 0.18 * W, cy: 0.50 * H, rx: 0.22 * W, ry: 0.12 * H, opacity: 0.10 },
    { cx: 0.78 * W, cy: 0.38 * H, rx: 0.18 * W, ry: 0.10 * H, opacity: 0.09 },
    { cx: 0.38 * W, cy: 0.80 * H, rx: 0.20 * W, ry: 0.11 * H, opacity: 0.07 },
    { cx: 0.88 * W, cy: 0.60 * H, rx: 0.14 * W, ry: 0.09 * H, opacity: 0.08 },
  ]

  clouds.forEach((c) => {
    for (let pass = 0; pass < 3; pass++) {
      const ox = (rand() - 0.5) * c.rx * 0.4
      const oy = (rand() - 0.5) * c.ry * 0.4
      const grd = ctx.createRadialGradient(c.cx + ox, c.cy + oy, 0, c.cx + ox, c.cy + oy, c.rx)
      grd.addColorStop(0, `rgba(210,110,45,${c.opacity * (1.8 + rand() * 0.8)})`)
      grd.addColorStop(0.4, `rgba(190,90,35,${c.opacity * (0.9 + rand() * 0.4)})`)
      grd.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grd
      ctx.beginPath()
      ctx.ellipse(c.cx + ox, c.cy + oy, c.rx * (0.8 + rand() * 0.4), c.ry * (0.8 + rand() * 0.4), rand() * Math.PI, 0, Math.PI * 2)
      ctx.fill()
    }
  })

  return new THREE.CanvasTexture(canvas)
}

function createDenseStarField() {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(STAR_COUNT * 3)
  const colors = new Float32Array(STAR_COUNT * 3)
  const rand = seededRNG(77231)

  for (let i = 0; i < STAR_COUNT; i++) {
    const theta = rand() * Math.PI * 2
    const phi = Math.acos(2 * rand() - 1)
    const r = 80 + rand() * 70
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
    const t = rand()
    if (t < 0.04) {
      colors[i * 3] = 0.7; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 1.0
    } else if (t < 0.07) {
      colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 0.6
    } else {
      colors[i * 3] = 1.0; colors[i * 3 + 1] = 1.0; colors[i * 3 + 2] = 1.0
    }
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const mat = new THREE.PointsMaterial({
    size: 0.14, transparent: true, opacity: 0.88, sizeAttenuation: true, vertexColors: true,
  })
  return new THREE.Points(geometry, mat)
}

function createZoneMarker(zone) {
  const color = MARS_ZONE_COLORS[zone.status]
  const threeColor = new THREE.Color(color)
  const group = new THREE.Group()
  group.userData = { zoneId: zone.id, zone }

  const ringGeo = new THREE.RingGeometry(0.065, 0.098, 32)
  group.add(new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
    color: threeColor, side: THREE.DoubleSide, transparent: true, opacity: 0.75,
  })))

  const ring2Geo = new THREE.RingGeometry(0.098, 0.122, 32)
  group.add(new THREE.Mesh(ring2Geo, new THREE.MeshBasicMaterial({
    color: threeColor, side: THREE.DoubleSide, transparent: true, opacity: 0.25,
  })))

  const dotGeo = new THREE.CircleGeometry(0.048, 24)
  group.add(new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ color: threeColor })))

  const isCritical = zone.status === 'CRITICAL'
  const spriteMat = new THREE.SpriteMaterial({
    map: getGlowTexture(), color: threeColor, transparent: true,
    opacity: isCritical ? 0.75 : 0.40, blending: THREE.AdditiveBlending, depthWrite: false,
  })
  const sprite = new THREE.Sprite(spriteMat)
  const s = isCritical ? 0.65 : 0.42
  sprite.scale.set(s, s, 1)
  group.add(sprite)

  return group
}

function createOrbitalRing() {
  const points = []
  for (let i = 0; i <= 128; i++) {
    const a = (i / 128) * Math.PI * 2
    points.push(new THREE.Vector3(
      (MARS_RADIUS + 0.9) * Math.cos(a),
      0,
      (MARS_RADIUS + 0.9) * 0.88 * Math.sin(a),
    ))
  }
  const geo = new THREE.BufferGeometry().setFromPoints(points)
  return new THREE.Line(geo, new THREE.LineBasicMaterial({
    color: 0xff6b35, transparent: true, opacity: 0.18,
  }))
}

function createSatellite(color = 0xff6b35) {
  const group = new THREE.Group()
  group.add(new THREE.Mesh(
    new THREE.SphereGeometry(0.042, 8, 8),
    new THREE.MeshBasicMaterial({ color }),
  ))
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: getGlowTexture(), color, transparent: true, opacity: 0.45,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }))
  sprite.scale.set(0.22, 0.22, 1)
  group.add(sprite)
  return group
}

function createDistantEarth() {
  const group = new THREE.Group()
  group.position.set(-14, 4, -32)
  const geo = new THREE.SphereGeometry(1.8, 24, 24)
  group.add(new THREE.Mesh(geo, new THREE.MeshPhongMaterial({
    color: 0x1144bb, emissive: 0x002299, emissiveIntensity: 0.35,
    specular: 0x2244aa, shininess: 14,
  })))
  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(1.95, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0x3366ee, transparent: true, opacity: 0.12, side: THREE.BackSide }),
  )
  group.add(atmo)
  // Moon near Earth
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 16, 16),
    new THREE.MeshPhongMaterial({ color: 0x888898, emissive: 0x111118, emissiveIntensity: 0.1 }),
  )
  moon.position.set(3.2, 0.8, 0)
  group.add(moon)
  return group
}

export default function MarsGlobe3D({ onZoneHover, onZoneClick, selectedId }) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const globeRef = useRef(null)
  const dustRef = useRef(null)
  const markersRef = useRef([])
  const orbitSatsRef = useRef([])
  const animFrameRef = useRef(null)
  const isDraggingRef = useRef(false)
  const prevMouseRef = useRef({ x: 0, y: 0 })
  const rotationRef = useRef({ x: 0.25, y: 0 })
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
    scene.background = new THREE.Color('#000003')
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
    scene.add(createDistantEarth())

    // Lighting: warm sun from upper right, faint ambient
    scene.add(new THREE.AmbientLight(0x1a0800, 0.22))
    const sunLight = new THREE.DirectionalLight(0xffddaa, 1.5)
    sunLight.position.set(12, 5, 8)
    scene.add(sunLight)

    const globeGroup = new THREE.Group()
    scene.add(globeGroup)
    globeRef.current = globeGroup

    const loader = new THREE.TextureLoader()
    const marsTexture = loader.load('/textures/mars.jpg')
    marsTexture.colorSpace = THREE.SRGBColorSpace
    const marsGeo = new THREE.SphereGeometry(MARS_RADIUS, 96, 96)
    const marsMat = new THREE.MeshPhongMaterial({
      map: marsTexture,
      bumpMap: marsTexture,
      bumpScale: 0.05,
      specular: new THREE.Color(0x040201),
      shininess: 1,
    })
    globeGroup.add(new THREE.Mesh(marsGeo, marsMat))

    // Thin Martian atmosphere glow
    const atmoGeo = new THREE.SphereGeometry(MARS_RADIUS * 1.025, 48, 48)
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0xc85a10, transparent: true, opacity: 0.055, side: THREE.BackSide,
    })
    globeGroup.add(new THREE.Mesh(atmoGeo, atmoMat))

    // Dust storm layer — slightly larger sphere, drifts independently via rotation
    const dustTex = createDustStormTexture()
    const dustGeo = new THREE.SphereGeometry(MARS_RADIUS + 0.018, 64, 64)
    const dustMat = new THREE.MeshBasicMaterial({
      map: dustTex, transparent: true, opacity: 0.55,
      blending: THREE.NormalBlending, depthWrite: false,
    })
    const dustSphere = new THREE.Mesh(dustGeo, dustMat)
    globeGroup.add(dustSphere)
    dustRef.current = dustSphere

    // Zone markers
    markersRef.current = []
    marsZones.forEach((zone) => {
      const pos = latLngToXYZ(zone.lat, zone.lng, MARS_RADIUS + 0.014)
      const marker = createZoneMarker(zone)
      marker.position.set(pos.x, pos.y, pos.z)
      marker.lookAt(0, 0, 0)
      marker.rotateX(Math.PI)
      globeGroup.add(marker)
      markersRef.current.push(marker)
    })

    // Orbital ring + 3 satellites (monitoring constellation)
    const orbitGroup = new THREE.Group()
    orbitGroup.rotation.x = Math.PI / 5
    orbitGroup.rotation.z = Math.PI / 8
    orbitGroup.add(createOrbitalRing())

    const satColors = [0xff6b35, 0xffaa44, 0xff8822]
    const sats = satColors.map((c) => {
      const s = createSatellite(c)
      orbitGroup.add(s)
      return s
    })
    orbitSatsRef.current = sats
    scene.add(orbitGroup)

    globeGroup.rotation.x = rotationRef.current.x
    globeGroup.rotation.y = rotationRef.current.y + MARS_OFFSET

    return { scene, camera, renderer, globeGroup }
  }, [])

  useEffect(() => {
    const refs = init()
    if (!refs) return
    const { camera, renderer, globeGroup } = refs
    let frameCount = 0
    const R = MARS_RADIUS + 0.9

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate)
      frameCount++

      if (autoRotateRef.current && !isDraggingRef.current) {
        rotationRef.current.y += 0.001
        globeGroup.rotation.y = rotationRef.current.y + MARS_OFFSET
      }

      // Dust storm drifts slightly faster
      if (dustRef.current) {
        dustRef.current.rotation.y += 0.0006
      }

      // Critical zone pulse
      markersRef.current.forEach((marker) => {
        if (marker.userData.zone?.status === 'CRITICAL') {
          const scale = 1 + Math.sin(frameCount * 0.08) * 0.52
          if (marker.children[0]) marker.children[0].scale.set(scale, scale, scale)
        }
      })

      // ACTIVE zone gentle pulse
      markersRef.current.forEach((marker) => {
        if (marker.userData.zone?.status === 'ACTIVE') {
          const scale = 1 + Math.sin(frameCount * 0.05 + marker.userData.zone.id.length) * 0.15
          if (marker.children[3]) marker.children[3].scale.set(scale * 0.42, scale * 0.42, 1)
        }
      })

      // 3 satellites orbiting at 120° phase offset
      orbitSatsRef.current.forEach((sat, idx) => {
        const t = frameCount * 0.005 + (idx * Math.PI * 2) / 3
        sat.position.x = R * Math.cos(t)
        sat.position.z = R * 0.88 * Math.sin(t)
        sat.position.y = 0
      })

      renderer.render(sceneRef.current, camera)
    }
    animate()

    const handleResize = () => {
      const mount = mountRef.current
      if (!mount) return
      const W = mount.clientWidth, H = mount.clientHeight
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

  const onMouseMove = useCallback((e) => {
    if (isDraggingRef.current) {
      const dx = e.clientX - prevMouseRef.current.x
      const dy = e.clientY - prevMouseRef.current.y
      rotationRef.current.y += dx * 0.005
      rotationRef.current.x += dy * 0.005
      rotationRef.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationRef.current.x))
      if (globeRef.current) {
        globeRef.current.rotation.y = rotationRef.current.y + MARS_OFFSET
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
  }, [getCanvasCoords, hitTestMarkers, onZoneHover])

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

  const onClick = useCallback((e) => {
    if (e.target === mountRef.current || e.target.tagName === 'CANVAS') {
      const { x, y } = getCanvasCoords(e)
      const hit = hitTestMarkers(x, y)
      if (hit) onZoneClick?.(hit.id)
    }
  }, [getCanvasCoords, hitTestMarkers, onZoneClick])

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
        <div className="fixed z-50 pointer-events-none" style={{ left: tooltip.px + 16, top: tooltip.py - 16 }}>
          <div
            className="rounded-lg px-3 py-2 min-w-[200px]"
            style={{
              background: 'rgba(12,4,0,0.88)',
              border: `1px solid ${MARS_ZONE_COLORS[tooltip.zone.status]}44`,
              boxShadow: `0 0 20px ${MARS_ZONE_COLORS[tooltip.zone.status]}22`,
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{
                  background: MARS_ZONE_COLORS[tooltip.zone.status],
                  boxShadow: `0 0 6px ${MARS_ZONE_COLORS[tooltip.zone.status]}`,
                }}
              />
              <span className="text-white font-semibold text-sm">{tooltip.zone.shortName}</span>
            </div>
            <div className="text-xs" style={{ color: MARS_ZONE_COLORS[tooltip.zone.status] }}>
              {tooltip.zone.type.toUpperCase()}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{tooltip.zone.resourceType}</div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-xs text-gray-500">Equipe</span>
              <span className="text-xs font-bold" style={{ color: '#ff8844' }}>
                {tooltip.zone.personnel > 0 ? `${tooltip.zone.personnel} no local` : 'não tripulada'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none mars-grid-overlay opacity-20" />

      {/* Scan label */}
      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="text-xs opacity-55 font-mono" style={{ color: '#ff8844' }}>MARS-OPS-01 · LIVE</div>
        <div className="w-16 h-px mt-1 opacity-35" style={{ background: 'linear-gradient(90deg, #ff6b35, transparent)' }} />
      </div>

      {/* Coordinate hint */}
      <div className="absolute top-4 right-4 pointer-events-none text-right">
        <div className="text-xs opacity-55 font-mono" style={{ color: '#ff8844' }}>NORTH POLE</div>
        <div className="w-16 h-px mt-1 opacity-35 ml-auto" style={{ background: 'linear-gradient(270deg, #ff6b35, transparent)' }} />
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { label: 'Habitat', color: '#00d4ff' },
            { label: 'Mining', color: '#ff6b35' },
            { label: 'Crítico', color: '#ff0040' },
            { label: 'Estável', color: '#00ff88' },
            { label: 'Proposed', color: '#9b59b6' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
              <span className="text-[9px] font-mono opacity-60" style={{ color }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
