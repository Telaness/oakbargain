'use client';

import { Suspense, useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette, DepthOfField, Noise, Sepia } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { DustParticles } from './DustParticles';
import { LogoMesh } from './LogoMesh';
import { TreeTrunk, TreeBranches, BRANCH_DEFS, buildBranchCurve } from './TreeParts';
import { Foliage } from './Foliage';
import { CameraRig, getActiveLineName } from './CameraRig';
import { LuxuryJewelry, PremiumJewelry, StandardJewelry, EntryJewelry } from './Jewelry';
import { Fireflies, FloatingSpores } from './EnvironmentEffects';
import { useMousePosition } from '@/hooks/useMousePosition';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import { useResponsive } from '@/hooks/useResponsive';
import { DUST_CONFIG } from '@/lib/constants';

// ===== ジュエリー位置を枝元付近に配置し、枝上面に浮かせる =====
// 枝ごとのt値: 幹が太い高所の枝は少し先に配置して幹との被りを防ぐ
const JEWELRY_T_PER_BRANCH = [0.6, 0.6, 0.6, 0.6]; // Entry, Standard, Premium, Luxury
const computeJewelryPositions = () => {
  const positions: Record<string, [number, number, number]> = {};
  const names = ['entry', 'standard', 'premium', 'luxury'];
  names.map((name, i) => {
    const t = JEWELRY_T_PER_BRANCH[i];
    const d = BRANCH_DEFS[i];
    const curve = buildBranchCurve(d);
    const pt = new THREE.Vector3();
    curve.getPoint(t, pt);
    const branchRadiusAtT = d.radius * (1.0 - t * (1.0 - 0.18));
    positions[name] = [pt.x, pt.y + branchRadiusAtT + 10, pt.z];
  });
  return positions;
};

const JEWELRY_POSITIONS = computeJewelryPositions();

// ===== 草原の地面 =====
const GrassGround = () => {
  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      roughness: 0.88,
      metalness: 0,
      envMapIntensity: 0.3,
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
          'float hill = gfbm(position.xz * 0.004) * 8.0 + gn(position.xz * 0.025) * 1.0;',
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
          'float gN1=gfbm2(gp*0.06); float gN2=gn2(gp*0.4); float gN3=gn2(gp*1.5);',
          'vec3 gDk=vec3(0.04,0.03,0.02); vec3 gMd=vec3(0.08,0.06,0.04);',
          'vec3 gLt=vec3(0.12,0.09,0.05); vec3 gYl=vec3(0.10,0.07,0.04);',
          'vec3 gc=mix(gDk,gMd,gN1); gc=mix(gc,gLt,gN2*0.5);',
          'float dp=smoothstep(0.52,0.62,gn2(gp*0.08+5.0)); gc=mix(gc,gYl,dp*0.35);',
          'gc+=gN3*0.05;',
          'float dt = length(gp);',
          'float canopyShade = smoothstep(5000.0, 1800.0, dt) * 0.15;',
          'gc *= (1.0 - canopyShade);',
          'float mossBlend = smoothstep(2800.0, 2000.0, dt);',
          'float mossNoise = gfbm2(gp * 0.3 + 10.0);',
          'vec3 mossGreen = mix(vec3(0.05,0.04,0.02), vec3(0.08,0.06,0.03), mossNoise);',
          'gc = mix(gc, mossGreen, mossBlend * 0.6);',
          'float bareRing = smoothstep(2600.0, 2000.0, dt);',
          'gc = mix(gc, vec3(0.06,0.05,0.03), bareRing * 0.2);',
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

// ===== 草の葉 =====
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
            vec3 c = mix(vec3(0.04,0.03,0.02), mix(vec3(0.08,0.06,0.03), vec3(0.12,0.08,0.04), smoothstep(0.4,1.0,vH)), smoothstep(0.0,0.4,vH));
            gl_FragColor = vec4(c, mix(1.0,0.7,smoothstep(0.7,1.0,vH)));
          }
        `}
      />
    </instancedMesh>
  );
};

// ===== ゴッドレイ =====
const GodRays = () => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.children.map((child, i) => {
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.opacity = 0.025 + Math.sin(t * 0.15 + i * 1.2) * 0.012;
    });
  });

  const rays = useMemo(() => [
    { x: 100, z: 50, rot: -0.2, w: 44, h: 1200 },
    { x: 36, z: -24, rot: -0.15, w: 30, h: 1140 },
    { x: -50, z: 70, rot: -0.25, w: 48, h: 1260 },
    { x: 140, z: -36, rot: -0.1, w: 32, h: 1080 },
    { x: -24, z: 120, rot: -0.3, w: 40, h: 1170 },
    { x: 70, z: -100, rot: -0.18, w: 44, h: 1230 },
  ], []);

  return (
    <group ref={groupRef}>
      {rays.map((r, i) => (
        <mesh key={i} position={[r.x, 1200, r.z]} rotation={[0, 0, r.rot]}>
          <planeGeometry args={[r.w, r.h]} />
          <meshBasicMaterial color="#4A3520" transparent opacity={0.015} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
};

// ===== 微細な砂塵（カメラ周辺に常に漂う極小パーティクル） =====
const FineDust = ({ count }: { count: number }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 2000;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2000;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2000;
      vel[i * 3] = (Math.random() - 0.5) * 0.3;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.15 + 0.05;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }
    return { positions: pos, velocities: vel };
  }, [count]);

  useFrame(({ camera, clock }) => {
    if (!pointsRef.current || !materialRef.current) return;
    // カメラに追従
    pointsRef.current.position.copy(camera.position);
    materialRef.current.uniforms.uTime.value = clock.getElapsedTime();

    // パーティクルをゆっくり動かす
    const posAttr = pointsRef.current.geometry.getAttribute('position');
    const arr = posAttr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3] += velocities[i * 3];
      arr[i * 3 + 1] += velocities[i * 3 + 1];
      arr[i * 3 + 2] += velocities[i * 3 + 2];
      // 範囲外に出たら反対側にワープ
      if (Math.abs(arr[i * 3]) > 1000) arr[i * 3] *= -0.99;
      if (Math.abs(arr[i * 3 + 1]) > 1000) arr[i * 3 + 1] *= -0.99;
      if (Math.abs(arr[i * 3 + 2]) > 1000) arr[i * 3 + 2] *= -0.99;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        uniforms={{ uTime: { value: 0 } }}
        vertexShader={`
          uniform float uTime;
          varying float vAlpha;
          void main() {
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            float dist = length(mvPos.xyz);
            // 近い粒子は見えやすく、遠いと薄くなる
            vAlpha = smoothstep(800.0, 50.0, dist) * (0.15 + 0.1 * sin(uTime * 0.5 + position.x * 0.01));
            gl_PointSize = max(0.5, 2.5 - dist * 0.002);
            gl_Position = projectionMatrix * mvPos;
          }
        `}
        fragmentShader={`
          varying float vAlpha;
          void main() {
            float d = length(gl_PointCoord - 0.5) * 2.0;
            if (d > 1.0) discard;
            float alpha = (1.0 - d * d) * vAlpha;
            gl_FragColor = vec4(0.85, 0.78, 0.65, alpha);
          }
        `}
      />
    </points>
  );
};

// ===== メインシーン =====
const TreeSceneContent = ({ onNavigate }: { onNavigate: (path: string) => void }) => {
  const mousePosition = useMousePosition();
  const scrollProgress = useScrollProgress();
  const { isMobile } = useResponsive();
  const [dustVisible, setDustVisible] = useState(true);

  const handleClearProgress = useCallback((progress: number) => {
    if (progress >= 1) setDustVisible(false);
  }, []);

  const particleCount = isMobile ? DUST_CONFIG.sp.count : DUST_CONFIG.pc.count;
  const grassCount = isMobile ? 6000 : 22000;
  const leafCount = isMobile ? 500000 : 2000000;

  return (
    <>
      <CameraRig
        scrollProgress={scrollProgress}
        mouseNX={mousePosition.normalizedX}
        mouseNY={mousePosition.normalizedY}
      />

      {/* 黒い世界: 空なし、暗いEnvironment */}
      <color attach="background" args={['#080808']} />
      <Environment preset="night" background={false} environmentIntensity={0.15} />

      <ambientLight intensity={0.08} color="#1A1410" />
      <directionalLight
        intensity={1.2}
        position={[200, 4000, 400]}
        castShadow
        color="#8B7355"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={25000}
        shadow-camera-left={-12000}
        shadow-camera-right={12000}
        shadow-camera-top={10000}
        shadow-camera-bottom={-1500}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
      />
      <hemisphereLight args={['#0A0A0F', '#0A0804', 0.15]} />
      <directionalLight intensity={0.3} position={[-120, 800, 250]} color="#6B4A28" />
      <directionalLight intensity={0.2} position={[-150, 600, -400]} color="#4A3520" />
      <pointLight intensity={0.08} position={[0, -400, 150]} color="#3A2A10" distance={500} decay={2} />

      <fog attach="fog" args={['#050505', 3000, 25000]} />

      <GrassGround />
      <GrassBlades count={grassCount} />

      <TreeTrunk onClick={() => onNavigate('/lines/entry')} />
      <TreeBranches onClick={() => onNavigate('/lines/standard')} />
      <Foliage leafCount={leafCount} />

      <LuxuryJewelry position={JEWELRY_POSITIONS.luxury} onClick={() => onNavigate('/lines/luxury')} />
      <PremiumJewelry position={JEWELRY_POSITIONS.premium} onClick={() => onNavigate('/lines/premium')} />
      <StandardJewelry position={JEWELRY_POSITIONS.standard} onClick={() => onNavigate('/lines/standard')} />
      <EntryJewelry position={JEWELRY_POSITIONS.entry} onClick={() => onNavigate('/lines/entry')} />

      <LogoMesh scrollProgress={scrollProgress} />

      <FineDust count={isMobile ? 3000 : 8000} />
      <Fireflies />
      <FloatingSpores />
      <GodRays />

      {dustVisible && (
        <DustParticles
          mousePosition={mousePosition}
          onClearProgress={handleClearProgress}
          particleCount={particleCount}
        />
      )}

      <EffectComposer multisampling={4}>
        <DepthOfField focusDistance={0.01} focalLength={0.06} bokehScale={2.5} />
        <Bloom luminanceThreshold={0.4} intensity={1.2} mipmapBlur />
        <Noise opacity={0.12} blendFunction={BlendFunction.SOFT_LIGHT} />
        <Sepia intensity={0.25} blendFunction={BlendFunction.NORMAL} />
        <Vignette eskil={false} offset={0.05} darkness={0.85} />
      </EffectComposer>
    </>
  );
};

interface TreeSceneProps {
  onNavigate: (path: string) => void;
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

export const TreeScene = ({ onNavigate }: TreeSceneProps) => {
  const scrollProgress = useScrollProgress();

  return (
    <>
      <LineNameOverlay scrollProgress={scrollProgress} />
      <Canvas
        camera={{ fov: 65, near: 0.1, far: 50000, position: [0, 6500, 600] }}
        gl={{
          antialias: true,
          toneMappingExposure: 0.7,
          toneMapping: THREE.ACESFilmicToneMapping,
          powerPreference: 'high-performance',
        }}
        shadows={{ type: THREE.PCFSoftShadowMap }}
        dpr={[1, 2]}
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
