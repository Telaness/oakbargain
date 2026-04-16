'use client';

import { Suspense, useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { LogoMesh } from './LogoMesh';
import { Sky } from '@react-three/drei';
import { TreeTrunk, TreeBranches, BRANCH_DEFS, buildBranchCurve, getTrunkRadius } from './TreeParts';
import { Foliage } from './Foliage';
import { CameraRig, getActiveLineName } from './CameraRig';
import { LuxuryJewelry, PremiumJewelry, StandardJewelry, EntryJewelry } from './Jewelry';
import { PremiumTwigLeaves } from './PremiumTwigLeaves';
import { useMousePosition } from '@/hooks/useMousePosition';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import { useResponsive } from '@/hooks/useResponsive';

// ===== ジュエリー位置計算 =====
// Entry: 幹の根元付近（Y=200）
// Standard: 低い枝の上（BRANCH_DEFS[0]）
// Premium: 幹から生えた小枝の先端上（Y=4500付近）
// Luxury: 高い枝上 + 花の演出（BRANCH_DEFS[6]）

// --- Premium小枝パラメータ（PremiumTwigLeavesと共有） ---
export const PREMIUM_TWIG = {
  angle: 2.5,        // 幹上の角度
  y: 4500,           // 幹上のY座標
  length: 900,       // 小枝の長さ（幹表面からの距離）
  rise: 350,         // 小枝の上昇量
  floatOffset: 120,  // ジュエリーの浮遊高さ
} as const;

const computeJewelryPositions = () => {
  const positions: Record<string, [number, number, number]> = {};

  // Entry Line: 幹の根元付近に浮かぶ
  const entryAngle = 0.3;
  const entryY = 200;
  const entryTrunkR = getTrunkRadius(entryY);
  positions.entry = [
    Math.cos(entryAngle) * (entryTrunkR + 300),
    entryY,
    Math.sin(entryAngle) * (entryTrunkR + 300),
  ];

  // Standard: 低い枝上
  const stdDef = BRANCH_DEFS[0];
  const stdCurve = buildBranchCurve(stdDef);
  const stdPt = new THREE.Vector3();
  stdCurve.getPoint(0.6, stdPt);
  const stdR = stdDef.radius * (1.0 - 0.6 * (1.0 - 0.18));
  positions.standard = [stdPt.x, stdPt.y + stdR + 10, stdPt.z];

  // Premium: 幹から生えた小枝の先端上に浮かぶ
  const pt = PREMIUM_TWIG;
  const trunkR = getTrunkRadius(pt.y);
  const tipX = Math.cos(pt.angle) * (trunkR + pt.length);
  const tipZ = Math.sin(pt.angle) * (trunkR + pt.length);
  const tipY = pt.y + pt.rise;
  positions.premium = [tipX, tipY + pt.floatOffset, tipZ];

  // Luxury: 木の頂上付近の空中に浮かぶ
  const luxAngle = 0.9;
  const luxY = 15000;
  positions.luxury = [
    Math.cos(luxAngle) * 800,
    luxY,
    Math.sin(luxAngle) * 800,
  ];

  return positions;
};

const JEWELRY_POSITIONS = computeJewelryPositions();


// ===== 緑の草原の地面 =====
const GrassGround = () => {
  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      roughness: 0.85,
      metalness: 0,
      envMapIntensity: 0.5,
    });

    mat.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', [
          '#include <common>',
          'varying vec3 vGWP;',
          'float gh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
          'float gn(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(gh(i),gh(i+vec2(1,0)),f.x),mix(gh(i+vec2(0,1)),gh(i+vec2(1,1)),f.x),f.y);}',
          'float gfbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<5;i++){v+=a*gn(p);p*=2.0;a*=0.5;}return v;}',
        ].join('\n'))
        .replace('#include <begin_vertex>', [
          'vec3 transformed = vec3(position);',
          'float hill = gfbm(position.xz * 0.003) * 12.0 + gn(position.xz * 0.02) * 2.0;',
          'transformed.z += hill;',
          'vGWP = (modelMatrix * vec4(transformed, 1.0)).xyz;',
        ].join('\n'));

      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', [
          '#include <common>',
          'varying vec3 vGWP;',
          'float gh2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
          'float gn2(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(gh2(i),gh2(i+vec2(1,0)),f.x),mix(gh2(i+vec2(0,1)),gh2(i+vec2(1,1)),f.x),f.y);}',
          'float gfbm2(vec2 p){float v=0.0,a=0.5;for(int i=0;i<5;i++){v+=a*gn2(p);p*=2.0;a*=0.5;}return v;}',
        ].join('\n'))
        .replace('#include <color_fragment>', [
          'vec2 gp = vGWP.xz;',
          'float gN1=gfbm2(gp*0.04); float gN2=gn2(gp*0.3); float gN3=gn2(gp*1.2);',
          // 草原の緑ベースカラー
          'vec3 gDk=vec3(0.12,0.18,0.06); vec3 gMd=vec3(0.18,0.28,0.08);',
          'vec3 gLt=vec3(0.25,0.38,0.12); vec3 gYl=vec3(0.30,0.35,0.10);',
          'vec3 gc=mix(gDk,gMd,gN1); gc=mix(gc,gLt,gN2*0.6);',
          // 黄緑のパッチ
          'float dp=smoothstep(0.48,0.60,gn2(gp*0.06+5.0)); gc=mix(gc,gYl,dp*0.3);',
          'gc+=gN3*0.03;',
          // 木の根元は少し暗い（日陰）
          'float dt = length(gp);',
          'float canopyShade = smoothstep(4000.0, 1500.0, dt) * 0.2;',
          'gc *= (1.0 - canopyShade);',
          // 根元付近は土っぽく
          'float bareRing = smoothstep(2200.0, 1600.0, dt);',
          'vec3 earthColor = vec3(0.18,0.14,0.08);',
          'gc = mix(gc, earthColor, bareRing * 0.4);',
          'diffuseColor=vec4(gc,1.0);',
        ].join('\n'));

      mat.userData.shader = shader;
    };
    return mat;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -500, 0]} receiveShadow material={material}>
      <planeGeometry args={[16000, 16000, 128, 128]} />
    </mesh>
  );
};

// ===== 緑の草の葉 =====
const GrassBlades = ({ count }: { count: number }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const matrices = useMemo(() => {
    const dummy = new THREE.Object3D();
    const result: THREE.Matrix4[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const nearTree = Math.random() < 0.3;
      const r = nearTree
        ? 2200 + Math.random() * 600
        : 2600 + Math.random() * 3000;
      dummy.position.set(Math.cos(angle) * r, -500, Math.sin(angle) * r);
      dummy.rotation.set((Math.random() - 0.5) * 0.15, Math.random() * Math.PI, 0);
      const baseH = nearTree ? 0.6 + Math.random() * 1.0 : 0.4 + Math.random() * 1.5;
      dummy.scale.set(0.12 + Math.random() * 0.08, baseH, 0.12);
      dummy.updateMatrix();
      result.push(dummy.matrix.clone());
    }
    return result;
  }, [count]);

  useEffect(() => {
    if (!meshRef.current) return;
    matrices.map((m, i) => meshRef.current!.setMatrixAt(i, m));
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [matrices]);

  useFrame(({ clock }) => {
    if (materialRef.current) materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const v = new Float32Array([
      -0.5,0,0, 0.5,0,0, 0.15,0.5,0.05,
      -0.5,0,0, 0.15,0.5,0.05, -0.15,0.5,-0.05,
      -0.15,0.5,-0.05, 0.15,0.5,0.05, 0,1.0,0.1,
    ]);
    const uv = new Float32Array([0,0,1,0,0.65,0.5, 0,0,0.65,0.5,0.35,0.5, 0.35,0.5,0.65,0.5,0.5,1.0]);
    geo.setAttribute('position', new THREE.BufferAttribute(v, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, count]} castShadow>
      <shaderMaterial
        ref={materialRef}
        side={THREE.DoubleSide}
        transparent
        uniforms={{ uTime: { value: 0 } }}
        vertexShader={`
          uniform float uTime;
          varying float vH;
          void main() {
            vH = uv.y;
            vec3 pos = position;
            vec4 wb = instanceMatrix * vec4(0,0,0,1);
            float wp = wb.x*0.06+wb.z*0.08;
            float w = sin(uTime*2.0+wp)*0.35 + sin(uTime*0.7+wp*0.5)*0.2;
            float g = sin(uTime*0.3+wb.x*0.02)*0.5+0.5;
            pos.x += w*pos.y*(1.0+g*0.5);
            pos.z += w*pos.y*0.3;
            gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos,1.0);
          }
        `}
        fragmentShader={`
          varying float vH;
          void main() {
            // 根元は濃い緑、先端は明るい黄緑
            vec3 baseGreen = vec3(0.10, 0.20, 0.04);
            vec3 midGreen  = vec3(0.18, 0.32, 0.08);
            vec3 tipGreen  = vec3(0.30, 0.45, 0.12);
            vec3 c = mix(baseGreen, mix(midGreen, tipGreen, smoothstep(0.4,1.0,vH)), smoothstep(0.0,0.4,vH));
            gl_FragColor = vec4(c, mix(1.0,0.7,smoothstep(0.7,1.0,vH)));
          }
        `}
      />
    </instancedMesh>
  );
};

// ===== 物理ベースの青空（Preetham大気散乱モデル） =====
// turbidity: 大気の濁り（低い=澄んだ青空）
// rayleigh: レイリー散乱係数（高い=より青い空）
// sunPosition: 太陽の位置
const SkyDome = () => (
  <Sky
    distance={450000}
    sunPosition={[10000, 500, 5000]}
    turbidity={10}
    rayleigh={0.3}
    mieCoefficient={0.0005}
    mieDirectionalG={0.4}
  />
);

// ===== 常に晴天のライティング =====
const Atmosphere = ({ isMobile }: { isMobile: boolean }) => {
  const { scene, gl } = useThree();

  useEffect(() => {
    scene.background = new THREE.Color('#4A90D0');
    gl.toneMappingExposure = 0.3;
  }, [scene, gl]);

  return (
    <>
      {/* 環境光: 空全体からの柔らかい光 */}
      <ambientLight intensity={0.4} color="#D8E8FF" />
      {/* 太陽: 自然な強さ */}
      <directionalLight
        intensity={1.0}
        position={[5000, 4000, 3000]}
        castShadow={!isMobile}
        color="#FFF8F0"
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={25000}
        shadow-camera-left={-12000}
        shadow-camera-right={12000}
        shadow-camera-top={12000}
        shadow-camera-bottom={-1500}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
      />
      {/* 空（青）と地面（緑）の反射光 */}
      <hemisphereLight args={['#5090D0', '#3A8030', 0.45]} />
      {/* 遠景の空気遠近感 */}
      <fog attach="fog" args={['#B8D8F0', 12000, 45000]} />
    </>
  );
};

// ===== ポストプロセッシング =====
const PostProcessing = ({ isMobile }: { isMobile: boolean }) => (
  <EffectComposer multisampling={isMobile ? 0 : 2}>
    <Bloom
      luminanceThreshold={0.5}
      intensity={isMobile ? 0.5 : 0.9}
      mipmapBlur
      luminanceSmoothing={0.4}
    />
    <Vignette
      eskil={false}
      offset={0.2}
      darkness={0.15}
    />
  </EffectComposer>
);

// ===== メインシーン =====
const TreeSceneContent = ({ onNavigate }: { onNavigate: (path: string) => void }) => {
  const mousePosition = useMousePosition();
  const scrollProgress = useScrollProgress();
  const { isMobile } = useResponsive();

  const grassCount = isMobile ? 3000 : 15000;
  const leafCount = isMobile ? 200000 : 800000;

  return (
    <>
      <CameraRig
        scrollProgress={scrollProgress}
        mouseNX={mousePosition.normalizedX}
        mouseNY={mousePosition.normalizedY}
      />

      {/* 常に晴天のライティング */}
      <Atmosphere isMobile={isMobile} />

      <GrassGround />
      <GrassBlades count={grassCount} />

      <TreeTrunk onClick={() => onNavigate('/lines/entry')} />
      <TreeBranches onClick={() => onNavigate('/lines/standard')} />
      <Foliage leafCount={leafCount} />

      <LuxuryJewelry position={JEWELRY_POSITIONS.luxury} onClick={() => onNavigate('/lines/luxury')} />
      <PremiumTwigLeaves onClick={() => onNavigate('/lines/premium')} />
      <PremiumJewelry position={JEWELRY_POSITIONS.premium} onClick={() => onNavigate('/lines/premium')} />
      <StandardJewelry position={JEWELRY_POSITIONS.standard} onClick={() => onNavigate('/lines/standard')} />
      <EntryJewelry position={JEWELRY_POSITIONS.entry} onClick={() => onNavigate('/lines/entry')} />

      <LogoMesh scrollProgress={scrollProgress} />

      {/* 満点の青�� */}
      <SkyDome />

      <PostProcessing isMobile={isMobile} />
    </>
  );
};

interface TreeSceneProps {
  onNavigate: (path: string) => void;
  paused?: boolean;
}

// ===== ライン名オーバーレイ =====
const LineNameOverlay = ({ scrollProgress }: { scrollProgress: number }) => {
  const lineName = getActiveLineName(scrollProgress);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    if (lineName) {
      setDisplayName(lineName);
      // フェードイン
      const timer = setTimeout(() => setOpacity(1), 50);
      return () => clearTimeout(timer);
    } else {
      // フェードアウト
      setOpacity(0);
      const timer = setTimeout(() => setDisplayName(null), 500);
      return () => clearTimeout(timer);
    }
  }, [lineName]);

  if (!displayName) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '15%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        pointerEvents: 'none',
        opacity,
        transition: 'opacity 0.5s ease-in-out',
      }}
    >
      <div style={{
        color: '#B8964E',
        fontSize: '2.5rem',
        fontWeight: 300,
        letterSpacing: '0.5em',
        textTransform: 'uppercase',
        textShadow: '0 0 20px rgba(184,150,78,0.4), 0 0 60px rgba(184,150,78,0.15)',
        fontFamily: 'serif',
      }}>
        {displayName}
      </div>
      <div style={{
        width: '60px',
        height: '1px',
        background: 'linear-gradient(90deg, transparent, #B8964E, transparent)',
        margin: '12px auto 0',
      }} />
    </div>
  );
};

export const TreeScene = ({ onNavigate, paused }: TreeSceneProps) => {
  const scrollProgress = useScrollProgress();

  return (
    <>
      <LineNameOverlay scrollProgress={scrollProgress} />
      <Canvas
        camera={{ fov: 65, near: 0.1, far: 50000, position: [0, -300, 600] }}
        gl={{
          antialias: true,
          toneMappingExposure: 0.3,
          toneMapping: THREE.ACESFilmicToneMapping,
          powerPreference: 'high-performance',
        }}
        shadows={{ type: THREE.PCFSoftShadowMap }}
        dpr={[1, 1.5]}
        frameloop={paused ? 'never' : 'always'}
        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
      >
        <Suspense fallback={null}>
          <TreeSceneContent onNavigate={onNavigate} />
        </Suspense>
      </Canvas>
    </>
  );
};

export default TreeScene;
