import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { suppliers, RISK_COLORS } from '../data/suppliers'

const GLOBE_RADIUS = 2.4
const STAR_COUNT = 3000

function latLngToXYZ(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return {
    x: -(radius * Math.sin(phi) * Math.cos(theta)),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  }
}

let _glowTexture = null
function getGlowTexture() {
  if (_glowTexture) return _glowTexture
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
  _glowTexture = new THREE.CanvasTexture(canvas)
  return _glowTexture
}

function createStarField() {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(STAR_COUNT * 3)
  const sizes = new Float32Array(STAR_COUNT)
  for (let i = 0; i < STAR_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = 80 + Math.random() * 60
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
    sizes[i] = Math.random() * 1.5 + 0.3
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  const mat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.18,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
  })
  return new THREE.Points(geometry, mat)
}

function createPinMesh(risk, isCritical) {
  const color = RISK_COLORS[risk]
  const threeColor = new THREE.Color(color)

  const group = new THREE.Group()

  // Outer ring
  const ringGeo = new THREE.RingGeometry(0.055, 0.085, 24)
  const ringMat = new THREE.MeshBasicMaterial({
    color: threeColor,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.5,
  })
  const ring = new THREE.Mesh(ringGeo, ringMat)
  group.add(ring)

  // Core dot
  const dotGeo = new THREE.CircleGeometry(0.04, 24)
  const dotMat = new THREE.MeshBasicMaterial({ color: threeColor })
  const dot = new THREE.Mesh(dotGeo, dotMat)
  group.add(dot)

  // Glow sprite for critical
  if (isCritical) {
    const spriteMat = new THREE.SpriteMaterial({
      map: getGlowTexture(),
      color: threeColor,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const sprite = new THREE.Sprite(spriteMat)
    sprite.scale.set(0.42, 0.42, 1)
    group.add(sprite)
  }

  return group
}

export default function Globe3D({ onSupplierHover, onSupplierClick, selectedId }) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const globeRef = useRef(null)
  const pinsRef = useRef([])
  const animFrameRef = useRef(null)
  const isDraggingRef = useRef(false)
  const prevMouseRef = useRef({ x: 0, y: 0 })
  const rotationRef = useRef({ x: 0.3, y: 0 })
  const autoRotateRef = useRef(true)
  const tooltipRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)
  const raycasterRef = useRef(new THREE.Raycaster())
  const mouseRef = useRef(new THREE.Vector2())
  const criticalAnimRef = useRef(0)

  const init = useCallback(() => {
    const mount = mountRef.current
    if (!mount) return

    const W = mount.clientWidth
    const H = mount.clientHeight

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#0a0a0f')
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000)
    camera.position.z = 6.5
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(W, H)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    mount.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Stars
    scene.add(createStarField())

    // Lights — low ambient so night texture city lights stay visible
    scene.add(new THREE.AmbientLight(0x223355, 0.25))
    const sunLight = new THREE.DirectionalLight(0x8899cc, 0.4)
    sunLight.position.set(8, 4, 6)
    scene.add(sunLight)

    // Globe group
    const globeGroup = new THREE.Group()
    scene.add(globeGroup)
    globeRef.current = globeGroup

    const loader = new THREE.TextureLoader()
    const sphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 96, 96)

    // Load NASA Black Marble night texture
    const earthTexture = loader.load('/textures/earth-night.jpg')
    earthTexture.colorSpace = THREE.SRGBColorSpace
    const waterTexture = loader.load('/textures/earth-water.png')

    // Outer atmosphere halo (BackSide = visible rim from outside)
    const haloGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.08, 64, 64)
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x0044aa,
      transparent: true,
      opacity: 0.07,
      side: THREE.BackSide,
    })
    globeGroup.add(new THREE.Mesh(haloGeo, haloMat))

    // Thin atmosphere rim (FrontSide, very transparent)
    const atmGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.015, 64, 64)
    const atmMat = new THREE.MeshBasicMaterial({
      color: 0x1133aa,
      transparent: true,
      opacity: 0.03,
      side: THREE.FrontSide,
    })
    globeGroup.add(new THREE.Mesh(atmGeo, atmMat))

    const sphereMat = new THREE.MeshPhongMaterial({
      map: earthTexture,
      specularMap: waterTexture,
      specular: new THREE.Color(0x224466),
      shininess: 12,
      emissiveMap: earthTexture,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.82,
    })
    const sphere = new THREE.Mesh(sphereGeo, sphereMat)
    globeGroup.add(sphere)

    // Supplier pins
    pinsRef.current = []
    suppliers.forEach((sup) => {
      const pos = latLngToXYZ(sup.lat, sup.lng, GLOBE_RADIUS + 0.01)
      const pinGroup = createPinMesh(sup.risk, sup.risk === 'CRITICAL')
      pinGroup.position.set(pos.x, pos.y, pos.z)

      // Orient the flat pin to face outward from globe center
      pinGroup.lookAt(0, 0, 0)
      pinGroup.rotateX(Math.PI)

      pinGroup.userData = { supplierId: sup.id, supplier: sup }
      globeGroup.add(pinGroup)
      pinsRef.current.push(pinGroup)
    })

    // lng=-52 faces camera: offset = -(theta_brazil - PI/2) = -(2.234 - 1.571) = -0.663 rad
    const BRAZIL_OFFSET = -0.663
    globeGroup.rotation.x = rotationRef.current.x
    globeGroup.rotation.y = rotationRef.current.y + BRAZIL_OFFSET

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
      criticalAnimRef.current = frameCount

      if (autoRotateRef.current && !isDraggingRef.current) {
        rotationRef.current.y += 0.0015
        globeGroup.rotation.y = rotationRef.current.y - 0.663
      }

      // Animate critical pins
      pinsRef.current.forEach((pin) => {
        if (pin.userData.supplier?.risk === 'CRITICAL') {
          const scale = 1 + Math.sin(frameCount * 0.08) * 0.45
          pin.children.forEach((child, i) => {
            if (i === 0) child.scale.set(scale, scale, scale)
          })
        }
      })

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

  const hitTestPins = useCallback((nx, ny) => {
    mouseRef.current.set(nx, ny)
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
    const targets = pinsRef.current.flatMap((g) => g.children.filter((c) => c.isMesh || c.isSprite))
    const hits = raycasterRef.current.intersectObjects(targets, false)
    if (hits.length > 0) {
      let obj = hits[0].object
      while (obj && !obj.userData.supplierId) obj = obj.parent
      return obj?.userData?.supplier ?? null
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
        globeRef.current.rotation.y = rotationRef.current.y - 0.663
        globeRef.current.rotation.x = rotationRef.current.x
      }
      prevMouseRef.current = { x: e.clientX, y: e.clientY }
      return
    }

    const { x, y, px, py } = getCanvasCoords(e)
    const hit = hitTestPins(x, y)
    if (hit) {
      setTooltip({ supplier: hit, px, py })
      mountRef.current.style.cursor = 'pointer'
      onSupplierHover?.(hit.id)
    } else {
      setTooltip(null)
      mountRef.current.style.cursor = 'grab'
      onSupplierHover?.(null)
    }
  }, [getCanvasCoords, hitTestPins, onSupplierHover])

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
      const hit = hitTestPins(x, y)
      if (hit) onSupplierClick?.(hit.id)
    }
  }, [getCanvasCoords, hitTestPins, onSupplierClick])

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

      {/* Tooltip */}
      {tooltip && (
        <div
          ref={tooltipRef}
          className="fixed z-50 pointer-events-none"
          style={{
            left: tooltip.px + 16,
            top: tooltip.py - 16,
          }}
        >
          <div className="card-glass rounded-lg px-3 py-2 min-w-[180px]" style={{
            border: `1px solid ${RISK_COLORS[tooltip.supplier.risk]}44`,
            boxShadow: `0 0 20px ${RISK_COLORS[tooltip.supplier.risk]}22`,
          }}>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{
                  background: RISK_COLORS[tooltip.supplier.risk],
                  boxShadow: `0 0 6px ${RISK_COLORS[tooltip.supplier.risk]}`,
                }}
              />
              <span className="text-white font-semibold text-sm">{tooltip.supplier.name}</span>
            </div>
            <div className="text-xs text-gray-400">{tooltip.supplier.region} · {tooltip.supplier.biome}</div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-xs text-gray-500">Pontuação de Risco</span>
              <span className="text-xs font-bold" style={{ color: RISK_COLORS[tooltip.supplier.risk] }}>
                {tooltip.supplier.riskScore}/100
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Satellite grid overlay hint */}
      <div className="absolute inset-0 pointer-events-none grid-overlay opacity-30" />

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="text-xs text-neon-cyan opacity-60 font-mono">SAT-VIEW-03 · LIVE</div>
        <div className="w-16 h-px bg-gradient-to-r from-cyan-400 to-transparent mt-1 opacity-40" />
      </div>
      <div className="absolute top-4 right-4 pointer-events-none text-right">
        <div className="text-xs text-neon-cyan opacity-60 font-mono">BZ-REGION</div>
        <div className="w-16 h-px bg-gradient-to-l from-cyan-400 to-transparent mt-1 opacity-40 ml-auto" />
      </div>
    </div>
  )
}
