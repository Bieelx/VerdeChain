import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Stars, Trail } from '@react-three/drei'
import { useRef, useMemo, useEffect, Suspense } from 'react'
import * as THREE from 'three'

// ─── Materials ────────────────────────────────────────────────────────────────

function useMaterials() {
  return useMemo(() => ({
    body: new THREE.MeshStandardMaterial({ color: '#d8d8d8', metalness: 0.88, roughness: 0.18 }),
    bodyDark: new THREE.MeshStandardMaterial({ color: '#b8b8b8', metalness: 0.88, roughness: 0.22 }),
    heatShield: new THREE.MeshStandardMaterial({ color: '#1a1212', metalness: 0.15, roughness: 0.92 }),
    engine: new THREE.MeshStandardMaterial({ color: '#555555', metalness: 0.97, roughness: 0.04 }),
    engineSkirt: new THREE.MeshStandardMaterial({ color: '#888888', metalness: 0.92, roughness: 0.08 }),
    window: new THREE.MeshStandardMaterial({ color: '#001a33', emissive: new THREE.Color('#002244'), emissiveIntensity: 0.8, metalness: 0, roughness: 0 }),
    accent: new THREE.MeshStandardMaterial({ color: '#0066ff', emissive: new THREE.Color('#0033aa'), emissiveIntensity: 1.2 }),
    green: new THREE.MeshStandardMaterial({ color: '#00ff88', emissive: new THREE.Color('#00aa55'), emissiveIntensity: 1.0 }),
    glowBlue: new THREE.MeshStandardMaterial({ color: '#4488ff', emissive: new THREE.Color('#2255ff'), emissiveIntensity: 3.0, transparent: true, opacity: 0.9 }),
    exhaustOrange: new THREE.MeshStandardMaterial({ color: '#ff7700', emissive: new THREE.Color('#ff4400'), emissiveIntensity: 2.0, transparent: true, opacity: 0.7, side: THREE.DoubleSide }),
    exhaustCore: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: new THREE.Color('#aaddff'), emissiveIntensity: 4.0, transparent: true, opacity: 0.95 }),
  }), [])
}

// ─── Rocket Geometry ──────────────────────────────────────────────────────────

function RocketModel({ vizState, mission }) {
  const rocketRef = useRef()
  const t = useRef(0)
  const mats = useMaterials()

  useFrame((state, delta) => {
    t.current += delta
    if (!rocketRef.current) return
    if (vizState === 'launch') {
      rocketRef.current.position.y = Math.sin(t.current * 9) * 0.018
      rocketRef.current.rotation.z = Math.sin(t.current * 7) * 0.006
    } else if (vizState === 'transit') {
      rocketRef.current.rotation.y += delta * 0.08
    }
    // orbital handled by OrbitalScene wrapper
  })

  const fins = useMemo(() => {
    const result = []
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3
      result.push({ angle, x: Math.cos(angle), z: Math.sin(angle) })
    }
    return result
  }, [])

  return (
    <group ref={rocketRef}>
      {/* Nose tip */}
      <mesh position={[0, 3.78, 0]} material={mats.body}>
        <sphereGeometry args={[0.13, 16, 16]} />
      </mesh>

      {/* Nose cone */}
      <mesh position={[0, 3.0, 0]} material={mats.body}>
        <coneGeometry args={[0.48, 1.56, 32]} />
      </mesh>

      {/* Upper body */}
      <mesh position={[0, 1.55, 0]} material={mats.body}>
        <cylinderGeometry args={[0.48, 0.50, 2.1, 32]} />
      </mesh>

      {/* Mid band / cargo bay ring - slightly wider */}
      <mesh position={[0, 0.35, 0]} material={mats.bodyDark}>
        <cylinderGeometry args={[0.515, 0.515, 0.55, 32]} />
      </mesh>

      {/* Lower body */}
      <mesh position={[0, -0.72, 0]} material={mats.body}>
        <cylinderGeometry args={[0.50, 0.52, 1.75, 32]} />
      </mesh>

      {/* Heat shield tiles */}
      <mesh position={[0, -1.73, 0]} material={mats.heatShield}>
        <cylinderGeometry args={[0.52, 0.53, 0.62, 32]} />
      </mesh>

      {/* Engine skirt - flares outward */}
      <mesh position={[0, -2.18, 0]} material={mats.engineSkirt}>
        <cylinderGeometry args={[0.53, 0.70, 0.52, 32]} />
      </mesh>

      {/* 3 engine bells */}
      {fins.map(({ angle, x, z }, i) => {
        const ex = x * 0.34
        const ez = z * 0.34
        return (
          <group key={i} position={[ex, -2.66, ez]}>
            <mesh material={mats.engine}>
              <cylinderGeometry args={[0.10, 0.155, 0.52, 16]} />
            </mesh>
            <mesh position={[0, -0.37, 0]} material={mats.engine}>
              <cylinderGeometry args={[0.155, 0.215, 0.2, 16]} />
            </mesh>
          </group>
        )
      })}

      {/* Forward flaps (Starship-style, 3×) */}
      {fins.map(({ angle, x, z }, i) => (
        <mesh
          key={`ff-${i}`}
          position={[x * 0.54, 1.85, z * 0.54]}
          rotation={[0, -angle + Math.PI * 0.5, -0.42]}
          material={mats.bodyDark}
        >
          <boxGeometry args={[0.075, 0.95, 0.32]} />
        </mesh>
      ))}

      {/* Aft flaps (3×) */}
      {fins.map(({ angle, x, z }, i) => (
        <mesh
          key={`af-${i}`}
          position={[x * 0.57, -1.15, z * 0.57]}
          rotation={[0, -angle + Math.PI * 0.5, 0.32]}
          material={mats.bodyDark}
        >
          <boxGeometry args={[0.075, 1.5, 0.52]} />
        </mesh>
      ))}

      {/* Viewport window */}
      <mesh position={[0.51, 0.9, 0]} material={mats.window}>
        <circleGeometry args={[0.095, 32]} />
      </mesh>
      <mesh position={[0.505, 0.9, 0]} material={mats.window}>
        <ringGeometry args={[0.095, 0.115, 32]} />
      </mesh>

      {/* Blue accent ring - cargo bay */}
      <mesh position={[0, 0.62, 0]} material={mats.accent}>
        <torusGeometry args={[0.52, 0.018, 8, 48]} />
      </mesh>
      <mesh position={[0, 0.10, 0]} material={mats.accent}>
        <torusGeometry args={[0.52, 0.018, 8, 48]} />
      </mesh>

      {/* VerdeChain green band */}
      <mesh position={[0, -0.6, 0]} material={mats.green}>
        <torusGeometry args={[0.52, 0.012, 8, 48]} />
      </mesh>

      {/* Engine glow discs */}
      {vizState === 'launch' && fins.map(({ x, z }, i) => (
        <EngineBellGlow key={`eg-${i}`} x={x * 0.34} z={z * 0.34} mats={mats} />
      ))}
    </group>
  )
}

function EngineBellGlow({ x, z, mats }) {
  const glowRef = useRef()
  const t = useRef(Math.random() * Math.PI * 2)

  useFrame((state, delta) => {
    t.current += delta * 8
    if (glowRef.current) {
      const s = 0.85 + Math.sin(t.current) * 0.15
      glowRef.current.scale.setScalar(s)
      glowRef.current.material.opacity = 0.7 + Math.sin(t.current * 1.3) * 0.2
    }
  })

  return (
    <mesh ref={glowRef} position={[x, -2.95, z]} material={mats.glowBlue}>
      <sphereGeometry args={[0.14, 12, 12]} />
    </mesh>
  )
}

// ─── Exhaust Particle System ───────────────────────────────────────────────────

function ExhaustParticles() {
  const COUNT = 420
  const attribRef = useRef()
  const opacityRef = useRef()

  const { positions, opacities } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3)
    const opacities = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      const theta = Math.random() * Math.PI * 2
      const r = Math.random() * 0.18
      positions[i * 3] = Math.cos(theta) * r
      positions[i * 3 + 1] = -3.1 - Math.random() * 4.5
      positions[i * 3 + 2] = Math.sin(theta) * r
      opacities[i] = Math.random()
    }
    return { positions, opacities }
  }, [])

  useFrame(() => {
    if (!attribRef.current) return
    const arr = attribRef.current.array
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3 + 1] -= 0.035 + Math.random() * 0.04
      const y = arr[i * 3 + 1]
      const dist = Math.abs(y + 3.1) / 6.0
      if (y < -8.5) {
        const theta = Math.random() * Math.PI * 2
        const r = Math.random() * 0.15
        arr[i * 3] = Math.cos(theta) * r
        arr[i * 3 + 1] = -3.1 - Math.random() * 0.3
        arr[i * 3 + 2] = Math.sin(theta) * r
      } else {
        arr[i * 3] += (Math.random() - 0.5) * 0.008 * (1 + dist * 2)
        arr[i * 3 + 2] += (Math.random() - 0.5) * 0.008 * (1 + dist * 2)
      }
    }
    attribRef.current.needsUpdate = true
  })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          ref={attribRef}
          attach="attributes-position"
          array={positions}
          itemSize={3}
          count={COUNT}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.055}
        color="#ff8822"
        transparent
        opacity={0.75}
        sizeAttenuation
        vertexColors={false}
      />
    </points>
  )
}

function ExhaustCones() {
  const cone1Ref = useRef()
  const cone2Ref = useRef()
  const t = useRef(0)

  useFrame((state, delta) => {
    t.current += delta * 5
    if (cone1Ref.current) {
      cone1Ref.current.material.opacity = 0.55 + Math.sin(t.current) * 0.1
      const s = 0.9 + Math.sin(t.current * 1.4) * 0.08
      cone1Ref.current.scale.x = s
      cone1Ref.current.scale.z = s
    }
    if (cone2Ref.current) {
      cone2Ref.current.material.opacity = 0.18 + Math.sin(t.current * 0.8) * 0.06
    }
  })

  return (
    <>
      {/* Inner bright core */}
      <mesh ref={cone1Ref} position={[0, -4.5, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.45, 3.0, 24, 1, true]} />
        <meshStandardMaterial
          color="#aaddff"
          emissive={new THREE.Color('#5599ff')}
          emissiveIntensity={2.5}
          transparent
          opacity={0.65}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Outer orange plume */}
      <mesh ref={cone2Ref} position={[0, -5.8, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[1.4, 5.5, 24, 1, true]} />
        <meshStandardMaterial
          color="#ff6600"
          emissive={new THREE.Color('#cc3300')}
          emissiveIntensity={1.5}
          transparent
          opacity={0.22}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  )
}

// ─── Launch Pad Scene ─────────────────────────────────────────────────────────

function LaunchPad() {
  return (
    <group>
      {/* Ground concrete */}
      <mesh position={[0, -4.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[22, 22]} />
        <meshStandardMaterial color="#111118" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* Flame trench */}
      <mesh position={[0, -4.82, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.2, 8]} />
        <meshStandardMaterial color="#080808" roughness={1} />
      </mesh>

      {/* Launch pad base */}
      <mesh position={[0, -4.6, 0]}>
        <cylinderGeometry args={[1.8, 2.2, 0.45, 24]} />
        <meshStandardMaterial color="#1a1a22" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Pad ring */}
      <mesh position={[0, -4.32, 0]}>
        <torusGeometry args={[1.6, 0.12, 8, 32]} />
        <meshStandardMaterial color="#334455" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Launch tower - main column */}
      <mesh position={[2.2, 0, 0]}>
        <boxGeometry args={[0.28, 12, 0.28]} />
        <meshStandardMaterial color="#1e2233" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Tower cross arms */}
      {[-2, -0.5, 1.0, 2.2, 3.2].map((y, i) => (
        <mesh key={i} position={[1.1, y, 0]}>
          <boxGeometry args={[2.0, 0.1, 0.1]} />
          <meshStandardMaterial color="#1a2030" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* Mechazilla arms (hold-down arms) */}
      <mesh position={[1.6, 0.5, 0]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[1.2, 0.16, 0.16]} />
        <meshStandardMaterial color="#223344" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[1.6, -0.5, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[1.2, 0.16, 0.16]} />
        <meshStandardMaterial color="#223344" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Tower warning lights */}
      <mesh position={[2.2, 3.5, 0]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#ff0000" emissive={new THREE.Color('#ff0000')} emissiveIntensity={3} />
      </mesh>
      <mesh position={[2.2, 1.2, 0]}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshStandardMaterial color="#ff6600" emissive={new THREE.Color('#ff4400')} emissiveIntensity={2} />
      </mesh>
    </group>
  )
}

// ─── Transit Scene ────────────────────────────────────────────────────────────

function Planet({ position, radius, color, emissive, atmoColor, rings }) {
  const planetRef = useRef()
  useFrame((_, delta) => {
    if (planetRef.current) planetRef.current.rotation.y += delta * 0.06
  })
  return (
    <group position={position}>
      <mesh ref={planetRef}>
        <sphereGeometry args={[radius, 48, 48]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[radius * 1.08, 32, 32]} />
        <meshStandardMaterial
          color={atmoColor || color}
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  )
}

function TrajectoryArc({ from, to }) {
  const points = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(...from),
      new THREE.Vector3(
        (from[0] + to[0]) / 2,
        (from[1] + to[1]) / 2 + 2.5,
        (from[2] + to[2]) / 2
      ),
      new THREE.Vector3(...to),
    ])
    return curve.getPoints(80)
  }, [from, to])

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(points)
    return g
  }, [points])

  return (
    <line geometry={geo}>
      <lineBasicMaterial color="#0044aa" transparent opacity={0.4} />
    </line>
  )
}

function TransitScene({ mission }) {
  const isToMars = mission?.destination === 'mars'
  const originPos = isToMars ? [-9, -1.5, -4] : [-6, -0.5, -3]
  const destPos = isToMars ? [9, 2, -6] : [7, 1.5, -5]

  return (
    <>
      <Stars radius={100} depth={60} count={5000} factor={4} saturation={0} fade speed={0.4} />
      <Planet
        position={originPos}
        radius={1.8}
        color="#1155aa"
        atmoColor="#4488ff"
      />
      {isToMars ? (
        <Planet
          position={destPos}
          radius={1.2}
          color="#cc4422"
          atmoColor="#ff6633"
        />
      ) : (
        <Planet
          position={destPos}
          radius={1.0}
          color="#888888"
          atmoColor="#aaaaaa"
        />
      )}
      <TrajectoryArc from={originPos} to={destPos} />
    </>
  )
}

// ─── Orbital Scene ─────────────────────────────────────────────────────────────

function OrbitalScene({ mission }) {
  const isMoon = mission?.destination === 'moon'
  const bodyColor = isMoon ? '#888888' : '#cc4422'
  const atmoColor = isMoon ? '#aaaaaa' : '#ff6633'
  const bodySize = isMoon ? 5.5 : 6.2

  return (
    <>
      <Stars radius={100} depth={60} count={5000} factor={4} saturation={0} fade speed={0.4} />
      <Planet position={[0, -9, 0]} radius={bodySize} color={bodyColor} atmoColor={atmoColor} />
    </>
  )
}

// ─── Orbiting Rocket Wrapper ──────────────────────────────────────────────────

function OrbitingRocket({ mission }) {
  const groupRef = useRef()
  const t = useRef(0)

  useFrame((_, delta) => {
    t.current += delta * 0.18
    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(t.current) * 3.8
      groupRef.current.position.y = Math.sin(t.current) * 0.8 - 1.5
      groupRef.current.position.z = Math.sin(t.current) * 2.2
      groupRef.current.rotation.z = Math.cos(t.current + Math.PI * 0.5) * 0.3
      groupRef.current.rotation.x = 0.35
    }
  })

  const mats = useMaterials()
  const fins = useMemo(() => [0, 1, 2].map(i => ({ angle: (i * Math.PI * 2) / 3, x: Math.cos((i * Math.PI * 2) / 3), z: Math.sin((i * Math.PI * 2) / 3) })), [])

  return (
    <group ref={groupRef} scale={[0.55, 0.55, 0.55]}>
      <mesh position={[0, 3.78, 0]} material={mats.body}><sphereGeometry args={[0.13, 16, 16]} /></mesh>
      <mesh position={[0, 3.0, 0]} material={mats.body}><coneGeometry args={[0.48, 1.56, 32]} /></mesh>
      <mesh position={[0, 1.55, 0]} material={mats.body}><cylinderGeometry args={[0.48, 0.50, 2.1, 32]} /></mesh>
      <mesh position={[0, 0.35, 0]} material={mats.bodyDark}><cylinderGeometry args={[0.515, 0.515, 0.55, 32]} /></mesh>
      <mesh position={[0, -0.72, 0]} material={mats.body}><cylinderGeometry args={[0.50, 0.52, 1.75, 32]} /></mesh>
      <mesh position={[0, -1.73, 0]} material={mats.heatShield}><cylinderGeometry args={[0.52, 0.53, 0.62, 32]} /></mesh>
      <mesh position={[0, -2.18, 0]} material={mats.engineSkirt}><cylinderGeometry args={[0.53, 0.70, 0.52, 32]} /></mesh>
      {fins.map(({ x, z }, i) => (
        <group key={i} position={[x * 0.34, -2.66, z * 0.34]}>
          <mesh material={mats.engine}><cylinderGeometry args={[0.10, 0.155, 0.52, 16]} /></mesh>
        </group>
      ))}
      <mesh position={[0, 0.62, 0]} material={mats.accent}><torusGeometry args={[0.52, 0.018, 8, 48]} /></mesh>
      <mesh position={[0, -0.6, 0]} material={mats.green}><torusGeometry args={[0.52, 0.012, 8, 48]} /></mesh>
    </group>
  )
}

// ─── Camera Controller ────────────────────────────────────────────────────────

const CAM_TARGETS = {
  launch:  { pos: new THREE.Vector3(4.5, 1.2, 7.5),  look: new THREE.Vector3(0, 0.5, 0) },
  transit: { pos: new THREE.Vector3(0, 1.8, 9.0),    look: new THREE.Vector3(0, 0, 0) },
  orbital: { pos: new THREE.Vector3(5.5, 2.5, 6.0),  look: new THREE.Vector3(0, -1.5, 0) },
}

function CameraController({ vizState }) {
  const { camera } = useThree()
  const tgt = CAM_TARGETS[vizState] || CAM_TARGETS.launch

  useFrame(() => {
    camera.position.lerp(tgt.pos, 0.025)
    const cur = new THREE.Vector3()
    camera.getWorldDirection(cur)
    const desired = tgt.look.clone().sub(camera.position).normalize()
    cur.lerp(desired, 0.03)
    camera.lookAt(camera.position.clone().add(cur))
  })

  return null
}

// ─── Engine Lights ────────────────────────────────────────────────────────────

function EngineLights({ vizState }) {
  const lightRef = useRef()
  const t = useRef(0)

  useFrame((_, delta) => {
    t.current += delta * 6
    if (lightRef.current && vizState === 'launch') {
      lightRef.current.intensity = 5 + Math.sin(t.current) * 1.5
    }
  })

  if (vizState !== 'launch') return null
  return (
    <>
      <pointLight ref={lightRef} position={[0, -3.2, 0]} color="#4488ff" intensity={5} distance={12} decay={2} />
      <pointLight position={[0, -4.5, 0]} color="#ff6600" intensity={2.5} distance={8} decay={2} />
      <pointLight position={[2.5, 1.5, 2]} color="#112244" intensity={1.2} distance={15} decay={1.5} />
    </>
  )
}

// ─── Main Scene ───────────────────────────────────────────────────────────────

function Scene({ vizState, mission }) {
  const isLaunch = vizState === 'launch'
  const isTransit = vizState === 'transit'
  const isOrbital = vizState === 'orbital'

  return (
    <>
      <ambientLight intensity={isLaunch ? 0.06 : 0.04} color={isLaunch ? '#001122' : '#000011'} />

      {/* Sun / directional for space states */}
      {!isLaunch && (
        <directionalLight
          position={[15, 8, 5]}
          intensity={isTransit ? 2.2 : 1.8}
          color="#fffaee"
          castShadow={false}
        />
      )}

      {/* Night sky ambient for launch */}
      {isLaunch && (
        <>
          <ambientLight intensity={0.08} color="#000511' " />
          <Stars radius={80} depth={40} count={2000} factor={3} saturation={0} fade speed={0.2} />
        </>
      )}

      <EngineLights vizState={vizState} />

      {isLaunch && (
        <>
          <LaunchPad />
          <ExhaustParticles />
          <ExhaustCones />
          <RocketModel vizState={vizState} mission={mission} />
        </>
      )}

      {isTransit && (
        <>
          <TransitScene mission={mission} />
          <RocketModel vizState={vizState} mission={mission} />
        </>
      )}

      {isOrbital && (
        <>
          <OrbitalScene mission={mission} />
          <OrbitingRocket mission={mission} />
        </>
      )}

      <CameraController vizState={vizState} />
    </>
  )
}

// ─── Public Component ─────────────────────────────────────────────────────────

const BG_COLORS = {
  launch: '#010108',
  transit: '#000003',
  orbital: '#000005',
}

export default function RocketVisualization({ vizState = 'launch', mission }) {
  return (
    <div style={{ width: '100%', height: '100%', background: BG_COLORS[vizState], transition: 'background 0.8s ease' }}>
      <Canvas
        camera={{ position: [4.5, 1.2, 7.5], fov: 55, near: 0.1, far: 300 }}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <Scene vizState={vizState} mission={mission} />
        </Suspense>
      </Canvas>
    </div>
  )
}
