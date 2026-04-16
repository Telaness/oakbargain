'use client';

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useTexture, Environment } from '@react-three/drei';
import * as THREE from 'three';
import type { LineType } from '@/types/line';
import { LINE_CONFIGS } from '@/lib/constants';

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

// ===== ライン画像パス =====
const LINE_IMAGE_PATHS: Record<LineType, string> = {
  luxury: '/img/line/luxury.jpg',
  premium: '/img/line/premium.JPG',
  standard: '/img/line/standard.JPG',
  entry: '/img/line/entry.JPEG',
};

// ===== 額縁内の画像 =====
const FrameImage = ({ lineId, showDetail, isMobile }: { lineId: LineType; showDetail: boolean; isMobile: boolean }) => {
  const texture = useTexture(LINE_IMAGE_PATHS[lineId]);
  const meshRef = useRef<THREE.Mesh>(null);

  // 全ライン正方形表示、画像を中央トリミング
  useMemo(() => {
    const img = texture.image as HTMLImageElement | undefined;
    if (!img || !img.width || !img.height) return;
    const aspect = img.width / img.height;
    if (aspect > 1) {
      texture.repeat.set(1 / aspect, 1);
      texture.offset.set((1 - 1 / aspect) / 2, 0);
    } else {
      texture.repeat.set(1, aspect);
      texture.offset.set(0, (1 - aspect) / 2);
    }
    texture.needsUpdate = true;
  }, [texture]);

  useFrame(() => {
    if (!meshRef.current) return;
    if (isMobile) {
      const targetY = showDetail ? 0.8 : 0;
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.05);
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, 0, 0.05);
    } else {
      const targetX = showDetail ? -1.5 : 0;
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, 0.05);
    }
  });

  const size = isMobile ? 0.8 : 1.6;

  return (
    <mesh ref={meshRef} position={[0, 0, -0.05]}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
};

// ===== 額縁3Dモデル =====
const OrnateFrame = ({ onTouch, showDetail, isMobile }: { onTouch: () => void; showDetail: boolean; isMobile: boolean }) => {
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
    if (isMobile) {
      const targetY = showDetail ? 0.8 : 0;
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.05);
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 0, 0.05);
    } else {
      const targetX = showDetail ? -1.5 : 0;
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.05);
    }
    groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.3) * 0.05;
  });

  const frameScale = isMobile ? 4 : 8;

  return (
    <group
      ref={groupRef}
      onClick={onTouch}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      <primitive object={cloned} scale={frameScale} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  );
};

// preloadは削除 — LineModal表示時に遅延読み込み

// ===== 落ち葉（クリックで払い落とす） =====
interface LeafState {
  pos: THREE.Vector3;
  rot: THREE.Euler;
  vel: THREE.Vector3;
  rotVel: THREE.Vector3;
  scale: number;
  resting: boolean;
  gone: boolean;
  modelIdx: number;
}

const LEAF_COUNT_DESKTOP = 250;
const LEAF_COUNT_MOBILE = 80;

// 各ウェーブで飛ばす割合: 1回目25%, 2回目25%, 3回目30%, 4回目で残り全部
const WAVE_RATIOS = [0.25, 0.25, 0.3, 1.0];
const WAVE_COUNT = 4;

const FallenLeaves = ({ wave, onAllCleared, isMobile }: { wave: number; onAllCleared: () => void; isMobile: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const leafRefs = useRef<(THREE.Object3D | null)[]>([]);
  const { scene: damagedScene } = useGLTF('/3d/cannabis_damaged.glb', '/draco/');
  const processedWave = useRef(0);

  const leafStates = useRef<LeafState[]>([]);

  const leafCount = isMobile ? LEAF_COUNT_MOBILE : LEAF_COUNT_DESKTOP;

  const clones = useMemo(() => {
    const states: LeafState[] = [];
    const clonedScenes: THREE.Object3D[] = [];

    const gaussian = () => {
      const u1 = Math.random();
      const u2 = Math.random();
      return Math.sqrt(-2 * Math.log(u1 || 0.001)) * Math.cos(2 * Math.PI * u2);
    };

    // モバイル: σを小さくして中央に密集させ、少ない枚数でも額縁中央を覆う
    const spreadX = isMobile ? 0.35 : 0.7;
    const spreadY = isMobile ? 0.28 : 0.55;
    // モバイル: 葉を少し大きくして隙間を埋める
    const scaleBase = isMobile ? 0.28 : 0.2;
    const scaleRange = isMobile ? 0.3 : 0.25;

    for (let i = 0; i < leafCount; i++) {
      const x = gaussian() * spreadX;
      const y = gaussian() * spreadY;
      const z = 0.05 + Math.random() * 0.4;

      states.push({
        pos: new THREE.Vector3(x, y, z),
        rot: new THREE.Euler(
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3,
          Math.random() * Math.PI * 2,
        ),
        vel: new THREE.Vector3(),
        rotVel: new THREE.Vector3(),
        scale: scaleBase + Math.random() * scaleRange,
        resting: true,
        gone: false,
        modelIdx: 1,
      });

      const c = damagedScene.clone();
      c.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.material) {
          const mat = (obj.material as THREE.MeshStandardMaterial).clone();
          mat.color = new THREE.Color('#2A1A0E');
          mat.emissive = new THREE.Color('#0A0604');
          mat.emissiveIntensity = 0.15;
          mat.roughness = 0.95;
          obj.material = mat;
        }
      });
      clonedScenes.push(c);
    }

    leafStates.current = states;
    return clonedScenes;
  }, [damagedScene, leafCount, isMobile]);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.traverse((obj) => { obj.frustumCulled = false; });
    }
  }, []);

  // ウェーブごとに葉を飛ばす
  useEffect(() => {
    if (wave <= 0 || wave <= processedWave.current) return;
    processedWave.current = wave;

    const states = leafStates.current;
    const restingLeaves = states.filter((s) => s.resting && !s.gone);
    const ratio = WAVE_RATIOS[Math.min(wave - 1, WAVE_RATIOS.length - 1)];
    const countToScatter = wave >= WAVE_COUNT ? restingLeaves.length : Math.ceil(restingLeaves.length * ratio);

    const shuffled = [...restingLeaves].sort(() => Math.random() - 0.5);
    const toScatter = shuffled.slice(0, countToScatter);

    const forceMultiplier = wave === 1 ? 1 : wave === 2 ? 1.3 : wave === 3 ? 1.8 : 2.5;

    toScatter.map((leaf) => {
      const delay = Math.random() * (wave === WAVE_COUNT ? 200 : 100);
      setTimeout(() => {
        leaf.resting = false;
        const angle = Math.random() * Math.PI * 2;
        const force = (0.06 + Math.random() * 0.1) * forceMultiplier;
        leaf.vel.set(
          Math.cos(angle) * force + (Math.random() - 0.5) * 0.03,
          Math.sin(angle) * force + (Math.random() - 0.5) * 0.03,
          (0.02 + Math.random() * 0.04) * forceMultiplier,
        );
        leaf.rotVel.set(
          (Math.random() - 0.5) * 0.3 * forceMultiplier,
          (Math.random() - 0.5) * 0.3 * forceMultiplier,
          (Math.random() - 0.5) * 0.5 * forceMultiplier,
        );
      }, delay);
    });

    if (wave >= WAVE_COUNT) {
      setTimeout(() => onAllCleared(), 800);
    }
  }, [wave, onAllCleared]);

  // アニメーション
  useFrame(() => {
    const states = leafStates.current;
    states.map((leaf, i) => {
      if (leaf.gone || leaf.resting) return;
      const ref = leafRefs.current[i];
      if (!ref) return;

      leaf.pos.add(leaf.vel);
      leaf.rot.x += leaf.rotVel.x;
      leaf.rot.y += leaf.rotVel.y;
      leaf.rot.z += leaf.rotVel.z;

      leaf.vel.y -= 0.001;
      leaf.vel.multiplyScalar(0.98);
      leaf.rotVel.multiplyScalar(0.98);

      ref.position.copy(leaf.pos);
      ref.rotation.copy(leaf.rot);

      if (leaf.pos.z > 5 || leaf.pos.y < -5 || leaf.pos.y > 5 || leaf.pos.x < -5 || leaf.pos.x > 5) {
        leaf.gone = true;
        ref.visible = false;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {clones.map((cloned, i) => (
        <primitive
          key={`leaf-${i}`}
          ref={(r: THREE.Object3D | null) => { leafRefs.current[i] = r; }}
          object={cloned}
          position={[leafStates.current[i]?.pos.x ?? 0, leafStates.current[i]?.pos.y ?? 0, leafStates.current[i]?.pos.z ?? 0]}
          rotation={[leafStates.current[i]?.rot.x ?? 0, leafStates.current[i]?.rot.y ?? 0, leafStates.current[i]?.rot.z ?? 0]}
          scale={leafStates.current[i]?.scale ?? 0.2}
        />
      ))}
    </group>
  );
};

// ===== 額縁シーン =====
const FrameScene = ({ lineId, showDetail, wave, onAllCleared, isMobile }: {
  lineId: LineType;
  showDetail: boolean;
  wave: number;
  onAllCleared: () => void;
  isMobile: boolean;
}) => {
  const [dustKey, setDustKey] = useState(0);

  // ウェーブが進むたびにダストも発生
  useEffect(() => {
    if (wave > 0) setDustKey((k) => k + 1);
  }, [wave]);

  const handleTouch = useCallback(() => {
    setDustKey((k) => k + 1);
  }, []);

  return (
    <>
      <ambientLight intensity={0.4} color="#C4956A" />
      <directionalLight intensity={1.5} position={[3, 5, 4]} color="#FFE8C0" />
      <directionalLight intensity={0.3} position={[-2, 3, -1]} color="#8B7355" />
      <Environment preset="apartment" environmentIntensity={0.3} />
      <FrameImage lineId={lineId} showDetail={showDetail} isMobile={isMobile} />
      <OrnateFrame onTouch={handleTouch} showDetail={showDetail} isMobile={isMobile} />
      <FallenLeaves wave={wave} onAllCleared={onAllCleared} isMobile={isMobile} />
      <DustBurst key={dustKey} active={dustKey > 0} />
    </>
  );
};

// ===== 段階 =====
type Phase = 'idle' | 'sandstorm' | 'reveal' | 'detail' | 'closing';

// ===== 砂嵐オーバーレイ（削除済み） =====
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SandstormOverlay = ({ phase }: { phase: Phase }) => null;

// ===== ライン説明テキスト =====
const LINE_DESCRIPTIONS: Record<LineType, string[]> = {
  entry: [
    'OAK BARGAINの入口となるラインです。\nヴィンテージジュエリーを初めて手に取る方にも親しみやすく、日常の中に自然に取り入れやすい商品を中心に構成しています。',
    '気軽に楽しめる価格帯でありながら、OAK BARGAINらしい世界観やヴィンテージならではの魅力をしっかり感じられるラインです。\nブランドに初めて触れるお客様にとって、最初の出会いとなる位置づけです。',
  ],
  standard: [
    '日常使いのしやすさと、ヴィンテージジュエリーとしての存在感のバランスを意識したラインです。\nシンプルでありながらも安っぽくならず、日々の装いに自然と溶け込むような、定番として選ばれる商品を想定しています。',
    'OAK BARGAINの中でも、最も幅広いお客様に支持される中心的なラインであり、日常に寄り添うヴィンテージジュエリーとして提案していきます。',
  ],
  premium: [
    'Standard Lineよりも、デザイン性・存在感・希少性を高めたラインです。\n日常使いもできる一方で、より強く"特別感"を感じられる商品群として位置づけています。',
    '「少し背伸びをしてでも欲しくなるもの」\n「人と少し違う、ワンランク上のヴィンテージジュエリー」',
    'そうした価値を求める方に向けたラインであり、OAK BARGAINの世界観をより深く感じてもらうための中上位ラインです。',
  ],
  luxury: [
    'K18やプラチナなど、素材そのものにも高い価値を持つ最上位ライン。\n美しさだけでなく、本物ならではの価値と特別感を備えたシリーズです。',
  ],
};

// ===== ライン説明パネル =====
const LineDescription = ({ lineId, visible, isMobile }: { lineId: LineType; visible: boolean; isMobile: boolean }) => {
  const config = LINE_CONFIGS[lineId];
  const paragraphs = LINE_DESCRIPTIONS[lineId];

  return (
    <div
      className="fixed z-[60] flex flex-col overflow-y-auto"
      style={isMobile ? {
        bottom: 0,
        left: 0,
        width: '100vw',
        height: '50vh',
        padding: '24px 24px',
        justifyContent: 'flex-start',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transition: 'opacity 1s ease-out 0.5s, transform 1s ease-out 0.5s',
        pointerEvents: visible ? 'auto' : 'none',
      } : {
        top: 0,
        right: 0,
        width: '45vw',
        height: '100vh',
        padding: '0 48px',
        justifyContent: 'center',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(40px)',
        transition: 'opacity 1s ease-out 0.5s, transform 1s ease-out 0.5s',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      {/* サブ名 */}
      <div
        style={{
          color: config.colors.accent,
          fontSize: '0.85rem',
          letterSpacing: '0.3em',
          marginBottom: '8px',
          fontFamily: 'var(--font-serif)',
        }}
      >
        {config.nameSub}
      </div>

      {/* ライン名 */}
      <h2
        style={{
          color: '#F0EDE6',
          fontSize: '2.5rem',
          fontWeight: 300,
          letterSpacing: '0.15em',
          marginBottom: '24px',
          fontFamily: 'var(--font-serif)',
        }}
      >
        {config.name}
      </h2>

      {/* コンセプト */}
      <div
        style={{
          color: config.colors.accent,
          fontSize: '1.3rem',
          fontWeight: 300,
          marginBottom: '32px',
          fontStyle: 'italic',
          fontFamily: 'var(--font-serif)',
        }}
      >
        「{config.concept}」
      </div>

      {/* 区切り線 */}
      <div
        style={{
          width: '60px',
          height: '1px',
          background: `linear-gradient(90deg, ${config.colors.accent}, transparent)`,
          marginBottom: '32px',
        }}
      />

      {/* 説明文（段落ごと） */}
      {paragraphs.map((text, i) => (
        <p
          key={i}
          style={{
            color: '#C8C0B4',
            fontSize: '1rem',
            lineHeight: 2,
            fontWeight: 300,
            maxWidth: '480px',
            marginBottom: '20px',
            whiteSpace: 'pre-line',
          }}
        >
          {text}
        </p>
      ))}
    </div>
  );
};

// ===== Line詳細（砂嵐→クリック3回で葉を払う→額縁+説明） =====
export const LineModal = ({ lineId, onClose }: LineModalProps) => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [wave, setWave] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // 開く: 砂嵐→額縁表示
  useEffect(() => {
    if (lineId && phase === 'idle') {
      setPhase('sandstorm');
      setTimeout(() => setPhase('reveal'), 1500);
    }
  }, [lineId, phase]);

  // クリックでウェーブを進める（3回まで）
  const handleWaveClick = useCallback(() => {
    if (phase !== 'reveal') return;
    setWave((w) => {
      if (w >= WAVE_COUNT) return w;
      return w + 1;
    });
  }, [phase]);

  // 全部払い終わったらdetailへ
  const handleAllCleared = useCallback(() => {
    setPhase('detail');
  }, []);

  // 閉じる
  const handleClose = useCallback(() => {
    setPhase('closing');
    setTimeout(() => {
      setPhase('idle');
      setWave(0);
      onClose();
    }, 600);
  }, [onClose]);

  if (phase === 'idle') return null;

  const showDetail = phase === 'detail';

  return (
    <>
      {/* ===== 暗闇背景 ===== */}
      <div
        className="fixed inset-0 z-[55] bg-[#0B1A0E]"
        style={{
          opacity: phase === 'closing' ? 0 : 1,
          transition: 'opacity 0.6s ease-out',
        }}
        onClick={showDetail ? handleClose : undefined}
      />

      {/* ===== 砂嵐オーバーレイ ===== */}
      <SandstormOverlay phase={phase} />

      {/* ===== 閉じるボタン ===== */}
      {(phase === 'reveal' || phase === 'detail') && (
        <button
          onClick={handleClose}
          className="fixed top-6 right-8 z-[62] text-2xl transition-opacity hover:opacity-100"
          style={{ color: '#8B7355', opacity: 0.5 }}
        >
          ×
        </button>
      )}

      {/* ===== 額縁3D ===== */}
      <div
        className="fixed z-[57]"
        style={{
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          opacity: phase === 'reveal' || phase === 'detail' ? 1 : 0,
          transition: 'opacity 2s ease-out',
          cursor: phase === 'reveal' && wave < WAVE_COUNT ? 'pointer' : 'default',
        }}
        onClick={handleWaveClick}
      >
        <Canvas
          camera={{ fov: 40, near: 0.1, far: 100, position: [0, 0, 5] }}
          gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
          dpr={[1, 1.5]}
          style={{ width: '100%', height: '100vh', background: 'transparent' }}
        >
          <Suspense fallback={null}>
            <FrameScene lineId={lineId!} showDetail={showDetail} wave={wave} onAllCleared={handleAllCleared} isMobile={isMobile} />
          </Suspense>
        </Canvas>
      </div>

      {/* ===== ライン説明（右側） ===== */}
      {lineId && <LineDescription key={lineId} lineId={lineId} visible={showDetail} isMobile={isMobile} />}
    </>
  );
};
