'use client';

// "From first call to renewal": five product screens stand on a ring (the customer's year).
// Scrolling turns the ring so the current step faces you; its bead on the ring turns marigold.
// The screens are ordinary HTML in a layer over the canvas. Every frame they are moved with CSS 3D
// matrices so they sit exactly on the ring (no extra React roots, so nothing to tear down later).
import { PerformanceMonitor, Sparkles } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import type { MotionValue } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import * as THREE from 'three';

export const STORY_STEPS = 5;
const R = 2.3;
const STEP_ANGLE = (Math.PI * 2) / STORY_STEPS;
const DISTANCE_FACTOR = 2.5; // how large a screen looks on the ring

// three.js matrix → CSS matrix3d (CSS has y pointing down, so some signs flip)
const num = (v: number) => (Math.abs(v) < 1e-10 ? 0 : v);
function cssMatrix(m: THREE.Matrix4, mul: number[], prefix = '') {
  return `${prefix}matrix3d(${m.elements.map((e, i) => num(e * (mul[i] ?? 1))).join(',')})`;
}
const CAMERA_MUL = [1, -1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 1];
const objectMul = (f: number) => [1 / f, 1 / f, 1 / f, 1, -1 / f, -1 / f, -1 / f, -1, 1 / f, 1 / f, 1 / f, 1, 1, 1, 1, 1];
const OBJECT_MUL = objectMul(400 / DISTANCE_FACTOR);

type LayerRefs = {
  rootRef: RefObject<HTMLDivElement | null>;
  cameraRef: RefObject<HTMLDivElement | null>;
  slotsRef: RefObject<(HTMLDivElement | null)[]>;
  wrappersRef: RefObject<(HTMLDivElement | null)[]>;
};

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[#e6edf6] py-1.5 last:border-0">
      <span className="text-[#55647d]">{k}</span>
      <span className={`tabular text-right ${strong ? 'font-semibold text-[#13213a]' : 'text-[#13213a]'}`}>{v}</span>
    </div>
  );
}

function Panel({ title, badge, badgeTone = 'blue', children }: { title: string; badge: string; badgeTone?: 'blue' | 'green' | 'marigold'; children: ReactNode }) {
  const tone = { blue: 'bg-[#e8f0fa] text-[#24528f]', green: 'bg-[#e4f5ec] text-[#1e7a4f]', marigold: 'bg-[#fdf0db] text-[#9a5f08]' }[badgeTone];
  return (
    <div className="w-[300px] select-none rounded-[22px] bg-white p-5 text-[13px] shadow-[0_30px_60px_-24px_rgba(19,33,58,.35)] ring-1 ring-[#dce4ef] backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-display text-[17px] font-semibold text-[#13213a]">{title}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tone}`}>{badge}</span>
      </div>
      {children}
    </div>
  );
}

// The same customer through the whole journey (data like the app's demo account)
const PANELS: ReactNode[] = [
  <Panel key="lead" title="New lead" badge="Referral">
    <Row k="Name" v="Ravi Kumar" strong />
    <Row k="Mobile" v="+91 98765 43210" />
    <Row k="Needs" v="Family health cover, 4 members" />
    <Row k="Follow up" v="Tomorrow, 11:00 am" />
  </Panel>,
  <Panel key="quote" title="Quotation Q-2026-00142" badge="Sent">
    <Row k="Family Health Optima" v="₹18,450" />
    <Row k="Critical illness cover" v="₹3,200" />
    <Row k="GST (health: 0%)" v="₹0" />
    <Row k="Total per year" v="₹21,650" strong />
  </Panel>,
  <Panel key="pay" title="Payment" badge="Paid" badgeTone="green">
    <Row k="Link shared on" v="WhatsApp" />
    <Row k="Paid by" v="UPI" />
    <Row k="Amount" v="₹21,650" strong />
    <Row k="Policy" v="Created automatically" />
  </Panel>,
  <Panel key="policy" title="POL-2026-00418" badge="Active" badgeTone="green">
    <Row k="Insurer" v="Star Health" />
    <Row k="Nominee" v="Lakshmi Kumar, 100%" />
    <Row k="Documents" v="PAN, Aadhaar verified" />
    <Row k="Renews on" v="11 Oct 2027" />
  </Panel>,
  <Panel key="renew" title="Renewal" badge="Due in 7 days" badgeTone="marigold">
    <Row k="Reminder" v="Sent on WhatsApp" />
    <Row k="Your task" v="Call Ravi today" />
    <Row k="Last year" v="₹21,650" />
    <Row k="Status" v="Contacted" strong />
  </Panel>,
];

// Current step fully visible, its neighbours faint, the ones behind the ring hidden
function opacityFor(i: number, active: number) {
  const d = Math.min(Math.abs(i - active), STORY_STEPS - Math.abs(i - active));
  return d === 0 ? 1 : d === 1 ? 0.12 : 0;
}

function Carousel({ progress, onStep, rootRef, cameraRef, slotsRef, wrappersRef }: { progress: MotionValue<number>; onStep: (i: number) => void } & LayerRefs) {
  const group = useRef<THREE.Group>(null);
  const beads = useRef<(THREE.Mesh | null)[]>([]);
  const anchors = useRef<(THREE.Group | null)[]>([]);
  const current = useRef(-1);

  useFrame((state) => {
    const p = progress.get() * (STORY_STEPS - 1); // 0 … 4
    // Hold each step facing the viewer for most of its scroll, then turn to the next
    const base = Math.floor(p);
    const eased = base + THREE.MathUtils.smoothstep(p - base, 0.35, 0.65);
    const step = Math.min(STORY_STEPS - 1, Math.max(0, Math.round(eased)));
    if (step !== current.current) {
      current.current = step;
      // Opacity is set on the DOM directly: re-rendering the screens every step is wasteful
      wrappersRef.current.forEach((w, i) => { if (w) w.style.opacity = String(opacityFor(i, step)); });
      onStep(step);
    }
    if (group.current) {
      const target = -eased * STEP_ANGLE;
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, target, 0.08);
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, 0.06 - state.pointer.y * 0.05, 0.05);
    }
    beads.current.forEach((b, i) => {
      if (!b) return;
      const mat = b.material as THREE.MeshStandardMaterial;
      const on = i === step;
      mat.color.set(on ? '#f2a93b' : '#7fa6dc');
      mat.emissive.set(on ? '#f2a93b' : '#000000');
      b.scale.setScalar(THREE.MathUtils.lerp(b.scale.x, on ? 1.8 : 1, 0.12));
    });

    // Place the HTML screens where their anchors are (same maths as a CSS3D renderer)
    const root = rootRef.current;
    const cam = cameraRef.current;
    if (!root || !cam) return;
    const { size, camera } = state;
    const w = size.width / 2;
    const h = size.height / 2;
    const fov = camera.projectionMatrix.elements[5] * h;
    camera.updateMatrixWorld();
    root.style.width = `${size.width}px`;
    root.style.height = `${size.height}px`;
    root.style.perspective = `${fov}px`;
    cam.style.width = `${size.width}px`;
    cam.style.height = `${size.height}px`;
    cam.style.transform = `translateZ(${fov}px)${cssMatrix(camera.matrixWorldInverse, CAMERA_MUL)}translate(${w}px,${h}px)`;
    anchors.current.forEach((a, i) => {
      const slot = slotsRef.current[i];
      if (!a || !slot) return;
      a.updateWorldMatrix(true, false);
      slot.style.transform = cssMatrix(a.matrixWorld, OBJECT_MUL, 'translate(-50%,-50%)');
    });
    root.style.visibility = 'visible';
  });

  return (
    <group ref={group} position={[0, 0.05, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -1.0, 0]}>
        <torusGeometry args={[R, 0.009, 8, 240]} />
        <meshBasicMaterial color="#7fa6dc" transparent opacity={0.7} />
      </mesh>
      {PANELS.map((panel, i) => {
        const a = i * STEP_ANGLE;
        const x = Math.sin(a) * R;
        const z = Math.cos(a) * R;
        return (
          <group key={i} position={[x, 0, z]} rotation={[0, a, 0]}>
            <group ref={(g) => { anchors.current[i] = g; }} position={[0, 0.1, 0]} />
            <mesh ref={(m) => { beads.current[i] = m; }} position={[0, -1.0, 0]}>
              <sphereGeometry args={[0.05, 20, 20]} />
              <meshStandardMaterial color="#7fa6dc" emissiveIntensity={0.7} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export default function StoryScene({ progress, onStep }: { progress: MotionValue<number>; onStep: (i: number) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [dpr, setDpr] = useState(1.5);
  const rootRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const slotsRef = useRef<(HTMLDivElement | null)[]>([]);
  const wrappersRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!host.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(!!e?.isIntersecting), { rootMargin: '200px' });
    io.observe(host.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={host} className="canvas-fade relative h-full w-full" data-ready={ready} aria-hidden="true">
      <Canvas
        dpr={dpr}
        frameloop={visible ? 'always' : 'never'}
        camera={{ position: [0, 0.7, 6.6], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={() => setReady(true)}
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} />
        <ambientLight intensity={0.8} />
        <pointLight position={[0, 2, 4]} intensity={8} color="#ffffff" />
        <Carousel progress={progress} onStep={onStep} rootRef={rootRef} cameraRef={cameraRef} slotsRef={slotsRef} wrappersRef={wrappersRef} />
        <Sparkles count={36} scale={[8, 4, 4]} size={2.2} speed={0.2} color="#3a75c4" opacity={0.3} />
      </Canvas>
      {/* The five screens; hidden until the first frame has put them in place */}
      <div ref={rootRef} className="pointer-events-none absolute left-0 top-0 overflow-hidden" style={{ visibility: 'hidden', zIndex: 1 }}>
        <div ref={cameraRef} className="absolute left-0 top-0" style={{ transformStyle: 'preserve-3d' }}>
          {PANELS.map((panel, i) => (
            <div key={i} ref={(el) => { slotsRef.current[i] = el; }} className="absolute">
              <div ref={(el) => { wrappersRef.current[i] = el; }} style={{ opacity: opacityFor(i, 0), transition: 'opacity 500ms ease', backfaceVisibility: 'hidden' }}>{panel}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
