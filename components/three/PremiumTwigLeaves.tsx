'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getTrunkRadius } from './TreeParts';
import { PREMIUM_TWIG } from './TreeScene';

// ===== テーパー付きチューブ生成 =====
const createTapered = (
  curve: THREE.CatmullRomCurve3, segs: number, baseR: number, radSegs: number, taperEnd: number
): THREE.TubeGeometry => {
  const geo = new THREE.TubeGeometry(curve, segs, baseR, radSegs, false);
  const pos = geo.getAttribute('position');
  const ringSize = radSegs + 1;
  const ringCount = segs + 1;
  const center = new THREE.Vector3();
  for (let ring = 0; ring < ringCount; ring++) {
    const t = ring / (ringCount - 1);
    const scale = 1.0 - t * (1.0 - taperEnd);
    curve.getPoint(t, center);
    for (let j = 0; j < ringSize; j++) {
      const idx = ring * ringSize + j;
      pos.setX(idx, center.x + (pos.getX(idx) - center.x) * scale);
      pos.setY(idx, center.y + (pos.getY(idx) - center.y) * scale);
      pos.setZ(idx, center.z + (pos.getZ(idx) - center.z) * scale);
    }
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
};

// ===== 分岐枝カーブ生成（spread: 広がり係数） =====
// si % 3: 0=右, 1=左, 2=中央（前方向）
const buildSubCurve = (
  parentCurve: THREE.CatmullRomCurve3, splitT: number, si: number,
  subLen: number, subRise: number, spread: number
): THREE.CatmullRomCurve3 => {
  const sp = new THREE.Vector3();
  const st = new THREE.Vector3();
  parentCurve.getPoint(splitT, sp);
  parentCurve.getTangent(splitT, st);

  const up = new THREE.Vector3(0, 1, 0);
  const sideDir = new THREE.Vector3().crossVectors(st, up).normalize();

  // 右・左・中央の3方向パターン
  const pattern = si % 3;
  const sideAmount = pattern === 0 ? 1 : pattern === 1 ? -1 : 0;
  // 中央の枝は前方向に強く伸びる
  const fwdMul = sideAmount === 0 ? spread * 0.8 : spread * 0.3;

  return new THREE.CatmullRomCurve3([
    sp.clone(),
    new THREE.Vector3(
      sp.x + sideDir.x * sideAmount * subLen * 0.35 * spread + st.x * subLen * fwdMul,
      sp.y + subRise * 0.4,
      sp.z + sideDir.z * sideAmount * subLen * 0.35 * spread + st.z * subLen * fwdMul
    ),
    new THREE.Vector3(
      sp.x + sideDir.x * sideAmount * subLen * 0.7 * spread + st.x * subLen * fwdMul * 1.5,
      sp.y + subRise * 0.8,
      sp.z + sideDir.z * sideAmount * subLen * 0.7 * spread + st.z * subLen * fwdMul * 1.5
    ),
    new THREE.Vector3(
      sp.x + sideDir.x * sideAmount * subLen * spread + st.x * subLen * fwdMul * 2,
      sp.y + subRise,
      sp.z + sideDir.z * sideAmount * subLen * spread + st.z * subLen * fwdMul * 2
    ),
  ]);
};

// ===== Premium Line: 幹から生えた小枝 + 葉（扇状に広がる） =====
export const PremiumTwigLeaves = () => {
  const groupRef = useRef<THREE.Group>(null);
  const leafMeshRef = useRef<THREE.InstancedMesh>(null);
  const leafMaterialRef = useRef<THREE.ShaderMaterial>(null);

  const { angle, y, length, rise } = PREMIUM_TWIG;
  const trunkR = getTrunkRadius(y);
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);

  // メイン小枝カーブ: 幹の内側から開始
  const twigCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(ca * trunkR * 0.7, y - 20, sa * trunkR * 0.7),
      new THREE.Vector3(ca * (trunkR + length * 0.05), y + rise * 0.05, sa * (trunkR + length * 0.05)),
      new THREE.Vector3(ca * (trunkR + length * 0.2), y + rise * 0.15, sa * (trunkR + length * 0.2)),
      new THREE.Vector3(ca * (trunkR + length * 0.4), y + rise * 0.4, sa * (trunkR + length * 0.4)),
      new THREE.Vector3(ca * (trunkR + length * 0.65), y + rise * 0.7, sa * (trunkR + length * 0.65)),
      new THREE.Vector3(ca * (trunkR + length * 0.85), y + rise * 0.9, sa * (trunkR + length * 0.85)),
      new THREE.Vector3(ca * (trunkR + length), y + rise, sa * (trunkR + length)),
    ]);
  }, [ca, sa, trunkR, length, y, rise]);

  // メイン小枝ジオメトリ
  const twigGeo = useMemo(() => {
    return createTapered(twigCurve, 28, 28, 8, 0.12);
  }, [twigCurve]);

  // ===== 扇状の枝分かれ =====
  // 根元側: 少なく細い（2本だけ）
  // 先端側: 密に多く広がる（14本 + 大量の二次・三次分岐）
  const { subGeos, allCurves } = useMemo(() => {
    const geos: THREE.TubeGeometry[] = [];
    const curves: THREE.CatmullRomCurve3[] = [];

    // --- 根元側の一次分岐（2本、小さく控えめ） ---
    [0.25, 0.38].map((splitT, si) => {
      const sub = buildSubCurve(twigCurve, splitT, si, 80, 30, 0.6);
      geos.push(createTapered(sub, 8, 6, 5, 0.15));
      curves.push(sub);
    });

    // --- 先端側の一次分岐（14本、扇状に広がる） ---
    const fanSplits = [
      0.50, 0.54, 0.58, 0.62, 0.66, 0.70,
      0.74, 0.78, 0.82, 0.85, 0.88, 0.90, 0.93, 0.96,
    ];
    fanSplits.map((splitT, si) => {
      // 先端ほど長く、広がりも大きい
      const progress = (splitT - 0.5) / 0.46;
      const subLen = 140 + progress * 60;
      const subRise = 40 + progress * 30;
      const subR = 12 - progress * 4;
      const spread = 1.0 + progress * 0.8; // 先端ほど横に大きく広がる

      const sub = buildSubCurve(twigCurve, splitT, si + 2, subLen, subRise, spread);
      geos.push(createTapered(sub, 10, Math.max(subR, 4), 6, 0.12));
      curves.push(sub);

      // 二次分岐（各一次から4本、扇を密に）
      [0.3, 0.48, 0.65, 0.82].map((terT, ti) => {
        const terLen = 70 + progress * 30;
        const terRise = 20 + progress * 15;
        const terR = Math.max(subR * 0.4, 2.5);
        const terSpread = 1.0 + progress * 0.6;

        const ter = buildSubCurve(sub, terT, si + ti + 10, terLen, terRise, terSpread);
        geos.push(createTapered(ter, 6, terR, 4, 0.1));
        curves.push(ter);

        // 三次分岐（各二次から2本）
        [0.45, 0.78].map((qtT, qi) => {
          const qtLen = 35 + progress * 15;
          const qtRise = 10 + progress * 8;
          const qtR = Math.max(terR * 0.4, 1.5);

          const qt = buildSubCurve(ter, qtT, si + ti + qi + 20, qtLen, qtRise, terSpread);
          geos.push(createTapered(qt, 4, qtR, 3, 0.08));
          curves.push(qt);
        });
      });
    });

    return { subGeos: geos, allCurves: curves };
  }, [twigCurve]);

  // 葉のジオメトリ
  const leafGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0, 0.5, 0, -0.35, 0, -0.04, 0, 0.05, 0.08,
      0.35, 0, -0.04, 0, -0.5, 0,
    ]);
    const indices = new Uint16Array([0, 1, 2, 0, 2, 3, 1, 4, 2, 2, 4, 3]);
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    geo.computeVertexNormals();
    return geo;
  }, []);

  const barkMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#3A2A1A',
      roughness: 0.9,
      metalness: 0.02,
    });
  }, []);

  // 根元の2本: 各20枚、先端の分岐: 各250枚、メイン沿い100枚、先端クラスター800枚
  const ROOT_SUB_COUNT = 2;
  const ROOT_LEAVES_PER = 20;
  const FAN_LEAVES_PER = 250;
  const MAIN_LEAVES = 100;
  const TIP_CLUSTER = 800;
  const fanSubCount = allCurves.length - ROOT_SUB_COUNT;
  const totalLeaves = MAIN_LEAVES + TIP_CLUSTER
    + ROOT_SUB_COUNT * ROOT_LEAVES_PER
    + fanSubCount * FAN_LEAVES_PER;

  // マウント後に葉を配置
  const initialized = useRef(false);
  useEffect(() => {
    if (!leafMeshRef.current || initialized.current) return;
    initialized.current = true;

    const dummy = new THREE.Object3D();
    const mats: THREE.Matrix4[] = [];
    let gi = 0;

    const addLeaf = (x: number, ly: number, z: number) => {
      const la = gi * 2.39996 + gi * 0.07;
      dummy.position.set(x, ly, z);
      dummy.rotation.set(-0.3 + (gi % 7) * 0.09, la, (gi % 5) * 0.06);
      const sz = 10 + (gi % 8) * 2;
      dummy.scale.set(sz, sz, sz);
      dummy.updateMatrix();
      mats.push(dummy.matrix.clone());
      gi++;
    };

    // メイン小枝沿い（根元スカスカ、t=0.45以降に集中）
    const pt = new THREE.Vector3();
    for (let i = 0; i < MAIN_LEAVES; i++) {
      const raw = i / MAIN_LEAVES;
      const t = 0.45 + raw * raw * 0.55;
      twigCurve.getPoint(t, pt);
      const la = i * 2.4;
      const spread = 10 + (i % 6) * 5;
      addLeaf(
        pt.x + Math.cos(la) * spread,
        pt.y + 2 + (i % 5) * 3,
        pt.z + Math.sin(la) * spread
      );
    }

    // メイン先端の密なクラスター
    const tipPt = new THREE.Vector3();
    twigCurve.getPoint(1.0, tipPt);
    for (let i = 0; i < TIP_CLUSTER; i++) {
      const phi = Math.acos(2 * ((i + 0.5) / TIP_CLUSTER) - 1);
      const theta = i * 2.39996;
      const dist = 6 + (i % 10) * 4;
      addLeaf(
        tipPt.x + Math.sin(phi) * Math.cos(theta) * dist,
        tipPt.y + Math.sin(phi) * Math.sin(theta) * dist * 0.5 + (i % 5) * 2,
        tipPt.z + Math.cos(phi) * dist
      );
    }

    // 分岐枝の葉
    const sPt = new THREE.Vector3();
    allCurves.map((curve, ci) => {
      const isRoot = ci < ROOT_SUB_COUNT;
      const count = isRoot ? ROOT_LEAVES_PER : FAN_LEAVES_PER;

      // 沿線（先端寄りに密集）
      const alongCount = Math.floor(count * 0.4);
      for (let i = 0; i < alongCount; i++) {
        const raw = i / alongCount;
        const t = 0.25 + raw * raw * 0.75;
        curve.getPoint(t, sPt);
        const la = gi * 2.4;
        const spread = 5 + (i % 6) * 4;
        addLeaf(
          sPt.x + Math.cos(la) * spread,
          sPt.y + 2 + (i % 4) * 2,
          sPt.z + Math.sin(la) * spread
        );
      }

      // 先端クラスター（球状に密集）
      const tipCount = count - alongCount;
      curve.getPoint(1.0, sPt);
      for (let i = 0; i < tipCount; i++) {
        const phi = Math.acos(2 * ((i + 0.5) / tipCount) - 1);
        const theta = i * 2.39996 + ci * 0.7;
        const dist = 4 + (i % 8) * 3;
        addLeaf(
          sPt.x + Math.sin(phi) * Math.cos(theta) * dist,
          sPt.y + Math.sin(phi) * Math.sin(theta) * dist * 0.5 + (i % 4) * 2,
          sPt.z + Math.cos(phi) * dist
        );
      }
    });

    mats.map((m, idx) => leafMeshRef.current!.setMatrixAt(idx, m));
    leafMeshRef.current.instanceMatrix.needsUpdate = true;
  }, [twigCurve, allCurves]);

  useFrame(({ clock }) => {
    if (leafMaterialRef.current) {
      leafMaterialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={twigGeo} material={barkMaterial} castShadow />
      {subGeos.map((geo, i) => (
        <mesh key={`sub-${i}`} geometry={geo} material={barkMaterial} castShadow />
      ))}
      <instancedMesh
        ref={leafMeshRef}
        args={[leafGeo, undefined, totalLeaves]}
        castShadow
        frustumCulled={false}
      >
        <shaderMaterial
          ref={leafMaterialRef}
          side={THREE.DoubleSide}
          transparent
          uniforms={{ uTime: { value: 0 } }}
          vertexShader={`
            uniform float uTime;
            varying vec3 vWorldNormal;
            varying vec3 vWorldPos;
            void main() {
              vec3 pos = position;
              vec4 wp = instanceMatrix * vec4(0,0,0,1);
              float windPhase = wp.x * 0.02 + wp.z * 0.03;
              float wind = sin(uTime * 1.5 + windPhase) * 0.8;
              float tipFactor = smoothstep(-0.3, 0.5, pos.y);
              pos.x += wind * tipFactor * 0.15;
              vec4 worldPos = modelMatrix * instanceMatrix * vec4(pos, 1.0);
              vWorldPos = worldPos.xyz;
              vWorldNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
              gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
          `}
          fragmentShader={`
            varying vec3 vWorldNormal;
            varying vec3 vWorldPos;
            void main() {
              vec3 N = normalize(vWorldNormal);
              vec3 L = normalize(vec3(0.15, 0.96, 0.24));
              float diffuse = max(dot(N, L), 0.0) * 0.6;
              float sss = pow(max(dot(-N, L), 0.0), 2.0) * 0.4;
              vec3 baseColor = mix(vec3(0.06, 0.18, 0.04), vec3(0.12, 0.32, 0.06), diffuse);
              vec3 sssColor = baseColor * 1.5 + vec3(0.03, 0.06, 0.01);
              vec3 ambient = vec3(0.03, 0.05, 0.02);
              vec3 color = baseColor * (ambient + diffuse) + sssColor * sss;
              gl_FragColor = vec4(color, 0.92);
            }
          `}
        />
      </instancedMesh>
    </group>
  );
};
