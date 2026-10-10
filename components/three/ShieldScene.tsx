'use client';

// Hero 3D scene: five glass "policy" layers assemble into a shield, circled by the renewal year
// (a ring with 12 month marks and one marigold marker for the next due date).
// Runs only in the browser, pauses when off-screen, and stays still for people who prefer less motion.
import { Environment, Float, Lightformer, PerformanceMonitor, Sparkles } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

function shieldShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 1.22);
  s.bezierCurveTo(0.42, 1.02, 0.78, 0.98, 1.0, 1.04);
  s.lineTo(1.0, 0.18);
  s.bezierCurveTo(1.0, -0.58, 0.52, -1.04, 0, -1.3);
  s.bezierCurveTo(-0.52, -1.04, -1.0, -0.58, -1.0, 0.18);
  s.lineTo(-1.0, 1.04);
  s.bezierCurveTo(-0.78, 0.98, -0.42, 1.02, 0, 1.22);
  return s;
}

const LAYERS = 5;
const ease = (t: number) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);

function Shield({ still }: { still: boolean }) {
  const group = useRef<THREE.Group>(null);
  const layers = useRef<(THREE.Mesh | null)[]>([]);
  const start = useRef<number | null>(null);

  const geometry = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(shieldShape(), {
      depth: 0.04, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 4, curveSegments: 48,
    });
    g.center();
    return g;
  }, []);

  const tick = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.38, 0.02, 0), new THREE.Vector3(-0.1, -0.28, 0), new THREE.Vector3(0.44, 0.36, 0)], false, 'catmullrom', 0.05);
    return new THREE.TubeGeometry(curve, 48, 0.055, 16, false);
  }, []);

  useFrame((state) => {
    if (start.current === null) start.current = state.clock.elapsedTime;
    const t = still ? 10 : state.clock.elapsedTime - start.current;
    // One orchestrated moment: the layers fly in and stack into the shield (about 1.8 s)
    layers.current.forEach((m, i) => {
      if (!m) return;
      const p = ease((t - i * 0.12) / 1.4);
      const targetZ = (i - (LAYERS - 1) / 2) * 0.16;
      m.position.z = THREE.MathUtils.lerp(targetZ - 2.4 + i * 0.9, targetZ, p);
      m.position.x = THREE.MathUtils.lerp((i - 2) * 0.9, 0, p);
      m.rotation.z = THREE.MathUtils.lerp((i - 2) * 0.35, 0, p);
      const s = THREE.MathUtils.lerp(0.55, 1 - (LAYERS - 1 - i) * 0.035, p);
      m.scale.setScalar(s);
    });
    if (group.current) {
      // Follows the pointer a little; a slow idle turn otherwise
      const idle = still ? 0 : Math.sin(state.clock.elapsedTime * 0.35) * 0.18;
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, idle + state.pointer.x * 0.45, 0.05);
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -state.pointer.y * 0.25, 0.05);
    }
  });

  return (
    <group ref={group}>
      {Array.from({ length: LAYERS }, (_, i) => (
        <mesh key={i} ref={(m) => { layers.current[i] = m; }} geometry={geometry}>
          <meshPhysicalMaterial
            color={i === LAYERS - 1 ? '#e2edfc' : i % 2 ? '#6f9de0' : '#3a75c4'}
            transmission={1}
            thickness={0.6}
            roughness={0.06}
            ior={1.5}
            metalness={0}
            clearcoat={1}
            clearcoatRoughness={0.05}
            iridescence={0.35}
            iridescenceIOR={1.3}
            attenuationColor="#2f66b3"
            attenuationDistance={0.9}
            specularIntensity={1}
            transparent
            opacity={i === LAYERS - 1 ? 1 : 0.88}
          />
        </mesh>
      ))}
      <mesh geometry={tick} position={[0, 0.02, 0.42]}>
        <meshStandardMaterial color="#ffffff" emissive="#dbe9ff" emissiveIntensity={0.9} roughness={0.25} />
      </mesh>
    </group>
  );
}

// The renewal year: 12 month marks and the next due date travelling around it
function RenewalRing({ still }: { still: boolean }) {
  const ring = useRef<THREE.Group>(null);
  const marker = useRef<THREE.Mesh>(null);
  const R = 1.78;
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2), []);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ring.current && !still) ring.current.rotation.z = t * 0.06;
    if (marker.current) {
      const a = still ? 0.6 : t * 0.45;
      marker.current.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);
      const pulse = still ? 1 : 1 + Math.sin(t * 3) * 0.15;
      marker.current.scale.setScalar(pulse);
    }
  });
  return (
    <group rotation={[1.15, 0.18, 0]}>
      <group ref={ring}>
        <mesh>
          <torusGeometry args={[R, 0.007, 8, 200]} />
          <meshBasicMaterial color="#7fa6dc" transparent opacity={0.7} />
        </mesh>
        {months.map((a, i) => (
          <mesh key={i} position={[Math.cos(a) * R, Math.sin(a) * R, 0]}>
            <sphereGeometry args={[0.026, 12, 12]} />
            <meshBasicMaterial color="#7fa6dc" />
          </mesh>
        ))}
      </group>
      <mesh ref={marker}>
        <sphereGeometry args={[0.07, 24, 24]} />
        <meshStandardMaterial color="#f2a93b" emissive="#f2a93b" emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const q = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(q.matches);
    update();
    q.addEventListener('change', update);
    return () => q.removeEventListener('change', update);
  }, []);
  return reduced;
}

export default function ShieldScene({ className }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [dpr, setDpr] = useState(1.5);
  const still = usePrefersReducedMotion();

  // Stop drawing while the hero is scrolled away (saves battery on phones)
  useEffect(() => {
    if (!host.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(!!e?.isIntersecting), { rootMargin: '100px' });
    io.observe(host.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={host} className={`canvas-fade ${className ?? ''}`} data-ready={ready} aria-hidden="true">
      <Canvas
        dpr={dpr}
        frameloop={visible ? 'always' : 'never'}
        camera={{ position: [0, 0, 6.1], fov: 38 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={() => setReady(true)}
        fallback={<ShieldFallback />}
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 4, 5]} intensity={1.6} />
        <pointLight position={[-3, -2, 2]} intensity={5} color="#3a75c4" />
        <Float speed={still ? 0 : 1.4} rotationIntensity={still ? 0 : 0.15} floatIntensity={still ? 0 : 0.5}>
          <Shield still={still} />
        </Float>
        <RenewalRing still={still} />
        {!still && <Sparkles count={50} scale={[7, 5, 3]} size={2.4} speed={0.25} color="#3a75c4" opacity={0.35} />}

        {/* Studio lights for the glass reflections (built in code, nothing is downloaded) */}
        <Environment resolution={256}>
          <Lightformer intensity={2.2} position={[0, 3, 2]} scale={[8, 1.2, 1]} color="#ffffff" />
          <Lightformer intensity={1.4} position={[-4, 0, 1]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} color="#a9c8f0" />
          <Lightformer intensity={1.2} position={[4, -1, 1]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} color="#3a75c4" />
          <Lightformer form="ring" intensity={1.6} position={[0, 0, -4]} scale={3} color="#f2a93b" />
        </Environment>
      </Canvas>
    </div>
  );
}

// Shown when the browser cannot draw 3D (very old phones, WebGL switched off)
export function ShieldFallback() {
  return (
    <svg viewBox="0 0 200 220" className="mx-auto h-full max-h-[420px] w-auto" role="img" aria-label="Shield">
      <defs>
        <linearGradient id="sg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#a9c8f0" />
          <stop offset="1" stopColor="#3a75c4" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="112" rx="96" ry="30" fill="none" stroke="#a9c8f0" strokeOpacity=".5" />
      <path d="M100 20l62 22v52c0 44-26 80-62 96-36-16-62-52-62-96V42l62-22z" fill="url(#sg)" opacity=".92" />
      <path d="M72 108l20 20 38-42" fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="186" cy="104" r="6" fill="#f2a93b" />
    </svg>
  );
}
