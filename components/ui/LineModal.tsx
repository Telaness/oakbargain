'use client';

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';
import type { LineType } from '@/types/line';

interface LineModalProps {
  lineId: LineType | null;
  onClose: () => void;
}

// ===== ほこりパーティクル（額縁に触れると舞う） =====
const DustBurst = ({ active }: { active: boolean }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const velocitiesRef = useRef<Float32Array | null>(null);
  const lifetimesRef = useRef<Float32Array | null>(null);

  const COUNT = 300;

  const positions = useMemo(() => new Float32Array(COUNT * 3), []);
  const sizes = useMemo(() => {
    const s = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) s[i] = 0.02 + Math.random() * 0.04;
    return s;
  }, []);

  const spawn = useCallback(() => {
    const vel = new Float32Array(COUNT * 3);
    const life = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 3;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2.5;
      positions[i * 3 + 2] = Math.random() * 0.5;
      vel[i * 3] = (Math.random() - 0.5) * 0.03;
      vel[i * 3 + 1] = 0.008 + Math.random() * 0.025;
      vel[i * 3 + 2] = 0.005 + Math.random() * 0.02;
      life[i] = 1.0;
    }
    velocitiesRef.current = vel;
    lifetimesRef.current = life;
    if (pointsRef.current) {
      pointsRef.current.geometry.getAttribute('position').needsUpdate = true;
    }
  }, [positions]);

  useEffect(() => {
    if (active) spawn();
  }, [active, spawn]);

  useFrame(() => {
    if (!pointsRef.current || !velocitiesRef.current || !lifetimesRef.current) return;
    const pos = pointsRef.current.geometry.getAttribute('position');
    const arr = pos.array as Float32Array;
    const vel = velocitiesRef.current;
    const life = lifetimesRef.current;

    for (let i = 0; i < COUNT; i++) {
      if (life[i] <= 0) continue;
      arr[i * 3] += vel[i * 3];
      arr[i * 3 + 1] += vel[i * 3 + 1];
      arr[i * 3 + 2] += vel[i * 3 + 2];
      vel[i * 3 + 1] -= 0.00003;
      vel[i * 3] *= 0.997;
      vel[i * 3 + 2] *= 0.997;
      life[i] -= 0.003;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        vertexShader={`
          attribute float size;
          varying float vAlpha;
          void main() {
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (400.0 / -mvPos.z);
            gl_Position = projectionMatrix * mvPos;
            vAlpha = 1.0;
          }
        `}
        fragmentShader={`
          varying float vAlpha;
          void main() {
            float d = length(gl_PointCoord - 0.5) * 2.0;
            if (d > 1.0) discard;
            float alpha = (1.0 - d * d) * 0.7;
            gl_FragColor = vec4(0.5, 0.4, 0.28, alpha);
          }
        `}
      />
    </points>
  );
};

// ===== 額縁3Dモデル =====
const OrnateFrame = ({ onTouch }: { onTouch: () => void }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/3d/ornate_frame_3.glb');
  const cloned = useMemo(() => scene.clone(), [scene]);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.traverse((obj) => {
        obj.frustumCulled = false;
        if (obj instanceof THREE.Mesh && obj.material) {
          const mat = (obj.material as THREE.MeshStandardMaterial).clone();
          mat.emissive = new THREE.Color('#8B7355');
          mat.emissiveIntensity = 0.3;
          obj.material = mat;
        }
      });
    }
  }, [cloned]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.3) * 0.05;
  });

  return (
    <group
      ref={groupRef}
      onClick={onTouch}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      <primitive object={cloned} scale={8} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  );
};

useGLTF.preload('/3d/ornate_frame_3.glb');

// ===== 額縁シーン（額縁+ほこり） =====
const FrameScene = () => {
  const [dustKey, setDustKey] = useState(0);
  const handleTouch = useCallback(() => {
    setDustKey((k) => k + 1);
  }, []);

  return (
    <>
      <ambientLight intensity={0.4} color="#C4956A" />
      <directionalLight intensity={1.5} position={[3, 5, 4]} color="#FFE8C0" />
      <directionalLight intensity={0.3} position={[-2, 3, -1]} color="#8B7355" />
      <Environment preset="apartment" environmentIntensity={0.3} />
      <OrnateFrame onTouch={handleTouch} />
      <DustBurst key={dustKey} active={dustKey > 0} />
    </>
  );
};

// ===== 段階 =====
type Phase = 'idle' | 'sandstorm' | 'reveal' | 'closing';

// ===== 砂嵐2Dオーバーレイ（CSS背景で確実に表示） =====
const SandstormOverlay = ({ phase }: { phase: Phase }) => {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    // 複数テクスチャを生成してフレームごとに切り替え
    const textures: string[] = [];
    for (let t = 0; t < 4; t++) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      const imgData = ctx.createImageData(512, 512);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        if (Math.random() > 0.4) {
          d[i + 3] = 0;
          continue;
        }
        const v = 90 + Math.floor(Math.random() * 70);
        d[i] = v + 25;
        d[i + 1] = v + 8;
        d[i + 2] = v - 12;
        d[i + 3] = 160 + Math.floor(Math.random() * 95);
      }
      ctx.putImageData(imgData, 0, 0);
      textures.push(canvas.toDataURL());
    }

    el.style.backgroundSize = '512px 512px';

    let frame = 0;
    const animate = () => {
      // テクスチャ切り替え + 位置ランダムずらしで砂嵐アニメーション
      const idx = frame % textures.length;
      el.style.backgroundImage = `url(${textures[idx]})`;
      el.style.backgroundPosition = `${Math.floor(Math.random() * 512)}px ${Math.floor(Math.random() * 512)}px`;
      frame++;
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      ref={ref}
      className="fixed inset-0 z-[56]"
      style={{
        pointerEvents: 'none',
        opacity: phase === 'closing' ? 0 : phase === 'reveal' ? 0.5 : 1,
        transition: phase === 'closing' ? 'opacity 0.6s ease-out' : 'opacity 2s ease-out',
      }}
    />
  );
};

// ===== Line詳細（砂嵐→額縁） =====
export const LineModal = ({ lineId, onClose }: LineModalProps) => {
  const [phase, setPhase] = useState<Phase>('idle');

  // 開く: 砂嵐→額縁表示
  useEffect(() => {
    if (lineId && phase === 'idle') {
      setPhase('sandstorm');
      setTimeout(() => setPhase('reveal'), 1500);
    }
  }, [lineId, phase]);

  // 閉じる
  const handleClose = useCallback(() => {
    setPhase('closing');
    setTimeout(() => {
      setPhase('idle');
      onClose();
    }, 600);
  }, [onClose]);

  if (phase === 'idle') return null;

  return (
    <>
      {/* ===== 暗闇背景 ===== */}
      <div
        className="fixed inset-0 z-[55] bg-[#050505]"
        style={{
          opacity: phase === 'closing' ? 0 : 1,
          transition: 'opacity 0.6s ease-out',
        }}
        onClick={handleClose}
      />

      {/* ===== 砂嵐オーバーレイ ===== */}
      <SandstormOverlay phase={phase} />

      {/* ===== 閉じるボタン ===== */}
      {phase === 'reveal' && (
        <button
          onClick={handleClose}
          className="fixed top-6 right-8 z-[62] text-2xl transition-opacity hover:opacity-100"
          style={{ color: '#8B7355', opacity: 0.5 }}
        >
          ×
        </button>
      )}

      {/* ===== 額縁3D（クリック可能） ===== */}
      <div
        className="fixed z-[57]"
        style={{
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          opacity: phase === 'reveal' ? 1 : 0,
          transition: 'opacity 2s ease-out',
        }}
      >
        <Canvas
          camera={{ fov: 40, near: 0.1, far: 100, position: [0, 0, 5] }}
          gl={{ antialias: true, alpha: true }}
          style={{ width: '100vw', height: '100vh', background: 'transparent' }}
        >
          <Suspense fallback={null}>
            <FrameScene />
          </Suspense>
        </Canvas>
      </div>
    </>
  );
};
