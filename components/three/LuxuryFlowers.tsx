'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface LuxuryFlowersProps {
  position: [number, number, number];
  scrollProgress: number;
}

// ===== Luxury Line: 大量の花に囲まれたジュエリー演出 =====
// scrollが花ゾーン(0.73付近)に近づくと花が開き、ジュエリーが中から出てくる
export const LuxuryFlowers = ({ position, scrollProgress }: LuxuryFlowersProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const petalMeshRef = useRef<THREE.InstancedMesh>(null);
  const petalMaterialRef = useRef<THREE.ShaderMaterial>(null);

  // 花の配置（中心を囲むように球状に配置）
  const { petalCount, petalData } = useMemo(() => {
    const dummy = new THREE.Object3D();
    const mats: THREE.Matrix4[] = [];
    const data: { ringIdx: number; angle: number; baseY: number }[] = [];

    // 中心周辺に3層のリングで花弁を配置
    const rings = [
      { count: 8, radius: 60, yOffset: 0, petalSize: 35 },
      { count: 14, radius: 130, yOffset: -20, petalSize: 30 },
      { count: 20, radius: 200, yOffset: -40, petalSize: 25 },
      { count: 28, radius: 280, yOffset: -50, petalSize: 22 },
    ];

    rings.map((ring, ri) => {
      for (let i = 0; i < ring.count; i++) {
        const angle = (i / ring.count) * Math.PI * 2 + ri * 0.3;
        const jitter = (Math.random() - 0.5) * 20;
        const yJitter = (Math.random() - 0.5) * 15;

        dummy.position.set(
          Math.cos(angle) * (ring.radius + jitter),
          ring.yOffset + yJitter,
          Math.sin(angle) * (ring.radius + jitter)
        );
        // 花弁は外側を向いて上に開く
        dummy.rotation.set(
          -Math.PI * 0.3 + Math.random() * 0.2,
          angle + Math.PI,
          Math.random() * 0.3
        );
        const sz = ring.petalSize + Math.random() * 8;
        dummy.scale.set(sz, sz * 1.3, sz);
        dummy.updateMatrix();
        mats.push(dummy.matrix.clone());
        data.push({ ringIdx: ri, angle, baseY: ring.yOffset + yJitter });
      }
    });

    return { petalCount: mats.length, petalData: data };
  }, []);

  // 花弁ジオメトリ（楕円形のカーブした花弁）
  const petalGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0, 0, 0,
      -0.3, 0.4, 0.08,
      0, 0.9, 0.15,
      0.3, 0.4, 0.08,
      -0.15, 0.7, 0.12,
      0.15, 0.7, 0.12,
    ]);
    const indices = new Uint16Array([
      0, 1, 4, 0, 4, 2, 0, 2, 5, 0, 5, 3,
      1, 4, 2, 2, 5, 3,
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    geo.computeVertexNormals();
    return geo;
  }, []);

  // 花の開き具合をスクロールに連動
  // scroll 0.65-0.73: 花が閉じている→開いていく
  // scroll 0.73-0.80: 完全に開いてジュエリーが見える
  useFrame(({ clock }) => {
    if (!petalMeshRef.current || !petalMaterialRef.current) return;

    const t = clock.getElapsedTime();
    // 花ゾーンでの開き具合 (0=閉じている, 1=完全に開いている)
    const openAmount = THREE.MathUtils.smoothstep(scrollProgress, 0.65, 0.75);

    petalMaterialRef.current.uniforms.uTime.value = t;
    petalMaterialRef.current.uniforms.uOpen.value = openAmount;

    const dummy = new THREE.Object3D();
    petalData.map((pd, i) => {
      // 内側のリングほど遅く開く（ジュエリーが最後に見える）
      const ringDelay = pd.ringIdx * 0.15;
      const adjustedOpen = THREE.MathUtils.clamp(openAmount - ringDelay, 0, 1);
      const tilt = adjustedOpen * Math.PI * 0.4;

      const jitter = Math.sin(t * 0.5 + pd.angle * 3) * 3;
      const radius = 60 + pd.ringIdx * 70 + adjustedOpen * 30;

      dummy.position.set(
        Math.cos(pd.angle) * radius,
        pd.baseY + adjustedOpen * 20 + jitter,
        Math.sin(pd.angle) * radius
      );
      dummy.rotation.set(
        -Math.PI * 0.3 + tilt,
        pd.angle + Math.PI,
        Math.sin(t * 0.3 + i) * 0.1
      );

      const baseSize = 35 - pd.ringIdx * 3;
      const sz = baseSize + Math.random() * 2;
      dummy.scale.set(sz, sz * 1.3, sz);
      dummy.updateMatrix();
      petalMeshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    petalMeshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef} position={position}>
      <instancedMesh
        ref={petalMeshRef}
        args={[petalGeo, undefined, petalCount]}
        castShadow
        frustumCulled={false}
      >
        <shaderMaterial
          ref={petalMaterialRef}
          side={THREE.DoubleSide}
          transparent
          uniforms={{
            uTime: { value: 0 },
            uOpen: { value: 0 },
          }}
          vertexShader={`
            uniform float uTime;
            uniform float uOpen;
            varying vec3 vWorldNormal;
            varying vec3 vWorldPos;
            varying float vHeight;
            void main() {
              vec3 pos = position;
              vHeight = pos.y;
              // 花弁の先端を微妙に揺らす
              vec4 wp = instanceMatrix * vec4(0,0,0,1);
              float wind = sin(uTime * 1.0 + wp.x * 0.05) * 0.03 * pos.y;
              pos.x += wind;
              vec4 worldPos = modelMatrix * instanceMatrix * vec4(pos, 1.0);
              vWorldPos = worldPos.xyz;
              vWorldNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
              gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
          `}
          fragmentShader={`
            uniform float uOpen;
            varying vec3 vWorldNormal;
            varying vec3 vWorldPos;
            varying float vHeight;
            void main() {
              vec3 N = normalize(vWorldNormal);
              vec3 L = normalize(vec3(0.15, 0.96, 0.24));
              float diffuse = max(dot(N, L), 0.0) * 0.6;

              // 花弁のグラデーション（白〜ピンク〜ゴールド）
              vec3 innerColor = vec3(0.95, 0.85, 0.80); // 内側: 淡いピンク
              vec3 outerColor = vec3(0.90, 0.70, 0.65); // 外側: ローズ
              vec3 tipColor = vec3(0.85, 0.75, 0.50);   // 先端: ゴールドかかり
              vec3 baseColor = mix(innerColor, outerColor, smoothstep(0.0, 0.5, vHeight));
              baseColor = mix(baseColor, tipColor, smoothstep(0.6, 1.0, vHeight));

              // 開き具合で発光
              float glow = uOpen * 0.15;
              vec3 ambient = vec3(0.08, 0.06, 0.05) + glow;
              vec3 color = baseColor * (ambient + diffuse);

              // SSS（花弁の半透明感）
              float sss = pow(max(dot(-N, L), 0.0), 2.0) * 0.3;
              color += baseColor * 1.3 * sss;

              gl_FragColor = vec4(color, 0.95);
            }
          `}
        />
      </instancedMesh>

      {/* 花の中心部（しべ） - ゴールドの小さな粒 */}
      <CenterStamens />
    </group>
  );
};

// ===== 花のしべ（中心部の装飾） =====
const CenterStamens = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const { matrices, count } = useMemo(() => {
    const dummy = new THREE.Object3D();
    const mats: THREE.Matrix4[] = [];
    const stamenCount = 30;

    for (let i = 0; i < stamenCount; i++) {
      const angle = (i / stamenCount) * Math.PI * 2 + Math.random() * 0.5;
      const r = 10 + Math.random() * 30;
      dummy.position.set(
        Math.cos(angle) * r,
        Math.random() * 15 + 5,
        Math.sin(angle) * r
      );
      const sz = 3 + Math.random() * 3;
      dummy.scale.set(sz, sz, sz);
      dummy.updateMatrix();
      mats.push(dummy.matrix.clone());
    }
    return { matrices: mats, count: mats.length };
  }, []);

  useMemo(() => {
    if (!meshRef.current) return;
    matrices.map((m, i) => meshRef.current!.setMatrixAt(i, m));
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [matrices]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial
        color="#D4AF37"
        emissive="#FFD700"
        emissiveIntensity={0.3}
        metalness={0.6}
        roughness={0.3}
      />
    </instancedMesh>
  );
};
