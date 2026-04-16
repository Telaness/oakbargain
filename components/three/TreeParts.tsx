'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TreePartProps {
  onClick?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}

export interface BranchDef {
  yStart: number;
  angle: number;
  length: number;
  hGain: number;
  radius: number;
  twist: number;
  subs: number;
  startDepth?: number;
}

// ===== 幹: 巨大な大樹（カメラから頂上が見えないスケール） =====
const TRUNK_BASE_Y = -500;
const TRUNK_TOP_Y = 8000;
const TRUNK_HEIGHT = TRUNK_TOP_Y - TRUNK_BASE_Y;

// ===== 主枝12本（不規則にまばらに分岐する大樹構造） =====
// カメラ範囲は Y: -200〜3000 程度。枝は3000付近から上に広がる
export const BRANCH_DEFS: BranchDef[] = [
  { yStart: 3200, angle: 0.3,  length: 8000,  hGain: 2200, radius: 400, twist: 500,  subs: 3 },
  { yStart: 3400, angle: 4.4,  length: 7800,  hGain: 2100, radius: 390, twist: 420,  subs: 3 },
  { yStart: 4200, angle: 1.1,  length: 6500,  hGain: 1500, radius: 280, twist: -380, subs: 3 },
  { yStart: 4000, angle: 5.3,  length: 6800,  hGain: 1600, radius: 270, twist: -400, subs: 3 },
  { yStart: 5500, angle: 1.9,  length: 5000,  hGain: 900,  radius: 180, twist: -260, subs: 2, startDepth: 0.01 },
  { yStart: 6000, angle: 3.1,  length: 4500,  hGain: 750,  radius: 160, twist: 240,  subs: 2, startDepth: 0.01 },
  { yStart: 5800, angle: 4.8,  length: 4800,  hGain: 850,  radius: 170, twist: -280, subs: 2, startDepth: 0.01 },
  { yStart: 6500, angle: 5.8,  length: 4000,  hGain: 600,  radius: 140, twist: 200,  subs: 2, startDepth: 0.01 },
  { yStart: 7000, angle: 0.5,  length: 3500,  hGain: 500,  radius: 120, twist: -180, subs: 2, startDepth: 0.01 },
];

export const getTrunkRadius = (y: number): number => {
  const t = THREE.MathUtils.clamp((y - TRUNK_BASE_Y) / TRUNK_HEIGHT, 0, 1);
  // 根元2400、上部でも600を保つ巨大な幹
  return 2400 - t * 1800;
};

// ===== 主枝カーブ構築（幹表面から自然に分岐→横に広がり→先端垂れ下がる） =====
export const buildBranchCurve = (d: BranchDef): THREE.CatmullRomCurve3 => {
  const c = Math.cos(d.angle);
  const s = Math.sin(d.angle);
  const tR = getTrunkRadius(d.yStart);
  const peakH = d.hGain;
  const tipDrop = peakH * 0.35;
  const depth = d.startDepth ?? 0.6;
  // 起点は幹表面（枝が幹から自然に生えている見た目）
  return new THREE.CatmullRomCurve3([
    // 起点: 幹の表面から
    new THREE.Vector3(c * tR * depth, d.yStart, s * tR * depth),
    // 幹表面を抜けて斜め上に（太い枝の根元部分）
    new THREE.Vector3(
      c * (tR + d.length * 0.06) + d.twist * 0.04,
      d.yStart + peakH * 0.25,
      s * (tR + d.length * 0.06) + d.twist * 0.02
    ),
    // 緩やかにカーブしながら外側へ
    new THREE.Vector3(
      c * (tR + d.length * 0.2) + d.twist * 0.2,
      d.yStart + peakH * 0.65,
      s * (tR + d.length * 0.2) + d.twist * 0.1
    ),
    // 最高点付近（大きく横に広がる）
    new THREE.Vector3(
      c * (tR + d.length * 0.45) + d.twist * 0.5,
      d.yStart + peakH,
      s * (tR + d.length * 0.45) + d.twist * 0.3
    ),
    // 先端へ向けて緩やかに下降
    new THREE.Vector3(
      c * (tR + d.length * 0.75) + d.twist * 0.35,
      d.yStart + peakH * 0.75,
      s * (tR + d.length * 0.75) + d.twist * 0.12
    ),
    // 先端: 自然に垂れ下がる
    new THREE.Vector3(
      c * (tR + d.length) + d.twist * 0.2,
      d.yStart + peakH - tipDrop,
      s * (tR + d.length)
    ),
  ]);
};

// ===== 枝2からの枝3カーブ構築ヘルパー =====
const buildSubCurve = (
  parentCurve: THREE.CatmullRomCurve3, splitT: number, si: number,
  parentR: number, len: number, hAdds: [number, number, number]
) => {
  const sp = new THREE.Vector3();
  const st = new THREE.Vector3();
  parentCurve.getPoint(splitT, sp);
  parentCurve.getTangent(splitT, st);
  const up = new THREE.Vector3(0, 1, 0);
  const spread = ((si % 2 === 0) ? 1 : -1) * (0.6 + si * 0.25);
  const side = new THREE.Vector3().crossVectors(st, up).normalize();
  const dir = st.clone().multiplyScalar(0.5)
    .add(side.multiplyScalar(spread))
    .add(up.multiplyScalar(0.35)).normalize();
  const subR = parentR * (0.38 - splitT * 0.1);
  const pts = [
    sp.clone(),
    new THREE.Vector3(sp.x + dir.x * len * 0.33, sp.y + dir.y * len * 0.33 + hAdds[0], sp.z + dir.z * len * 0.33),
    new THREE.Vector3(sp.x + dir.x * len * 0.66, sp.y + dir.y * len * 0.66 + hAdds[1], sp.z + dir.z * len * 0.66),
    new THREE.Vector3(sp.x + dir.x * len, sp.y + dir.y * len + hAdds[2], sp.z + dir.z * len),
  ];
  return { curve: new THREE.CatmullRomCurve3(pts), radius: subR };
};

// ===== 枝3の先端位置を算出（Foliage用 — 葉は枝3先端にのみ） =====
export const computeFoliageTips = (): THREE.Vector3[] => {
  const tips: THREE.Vector3[] = [];

  BRANCH_DEFS.map((d) => {
    const primaryCurve = buildBranchCurve(d);

    // 枝2（二次枝）
    [0.4, 0.65, 0.88].slice(0, d.subs).map((splitT, si) => {
      const sec = buildSubCurve(primaryCurve, splitT, si, d.radius, 1625 + si * 310, [310, 560, 750]);

      // 枝3（三次枝）— 各枝2から3-4本
      [0.3, 0.5, 0.7, 0.9].map((terT, ti) => {
        const ter = buildSubCurve(sec.curve, terT, ti, sec.radius, 750 + ti * 225, [150, 275, 375]);
        const tip = new THREE.Vector3();
        ter.curve.getPoint(1.0, tip);
        tips.push(tip.clone());

        // 枝3先端からさらに放射状に散布（密な葉のために）
        [0, 1, 2].map((j) => {
          const a = (j / 3) * Math.PI * 2 + ti * 1.5 + si * 0.8;
          tips.push(new THREE.Vector3(
            tip.x + Math.cos(a) * (15 + j * 6),
            tip.y + 4 + j * 3,
            tip.z + Math.sin(a) * (15 + j * 6)
          ));
        });
      });
    });

    // 主枝先端にも枝3的な散布
    const mainTip = new THREE.Vector3();
    primaryCurve.getPoint(1.0, mainTip);
    [0, 1, 2, 3].map((j) => {
      const a = (j / 4) * Math.PI * 2 + d.angle;
      tips.push(new THREE.Vector3(
        mainTip.x + Math.cos(a) * 22,
        mainTip.y + 5 + j * 4,
        mainTip.z + Math.sin(a) * 22
      ));
    });
  });

  // ===== 幹の頂点に密な葉クラスター（断面を完全に隠す） =====
  const crownY = 8400;
  // 中心に大きなクラスター
  tips.push(new THREE.Vector3(0, crownY, 0));
  tips.push(new THREE.Vector3(0, crownY + 200, 0));
  tips.push(new THREE.Vector3(0, crownY + 400, 0));
  // 周囲にリング状に配置
  for (let ring = 0; ring < 3; ring++) {
    const ringR = 200 + ring * 250;
    const ringCount = 8 + ring * 4;
    const ringY = crownY - ring * 100;
    for (let i = 0; i < ringCount; i++) {
      const a = (i / ringCount) * Math.PI * 2 + ring * 0.3;
      tips.push(new THREE.Vector3(
        Math.cos(a) * ringR,
        ringY + (i % 3) * 40,
        Math.sin(a) * ringR
      ));
    }
  }

  return tips;
};

// ===== GLSL =====
const NOISE_GLSL = `
float hash(vec3 p){p=fract(p*vec3(443.897,441.423,437.195));p+=dot(p,p.yzx+19.19);return fract((p.x+p.y)*p.z);}
float noise3D(vec3 p){vec3 i=floor(p);vec3 f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float v=0.0,a=0.5;for(int i=0;i<6;i++){v+=a*noise3D(p);p*=2.0;a*=0.5;}return v;}
`;

const BARK_COLOR_GLSL = `
  float bN=fbm(vBarkWorldPos*0.08);float bN2=fbm(vBarkWorldPos*0.2+100.0);float bN3=noise3D(vBarkWorldPos*0.6);
  float bAng=atan(vBarkWorldPos.z,vBarkWorldPos.x);
  float fissure1=sin(bAng*16.0+bN*7.0+vBarkWorldPos.y*0.02);float plate1=smoothstep(-0.12,0.12,fissure1);
  float fissure2=sin(bAng*36.0+bN2*5.0+vBarkWorldPos.y*0.04);float plate2=smoothstep(-0.06,0.06,fissure2);
  float hCrack=sin(vBarkWorldPos.y*0.25+bN*4.0);float hPlate=smoothstep(-0.08,0.08,hCrack);
  float isPlate=plate1*(0.7+plate2*0.3)*(0.8+hPlate*0.2);float bPat=isPlate+bN3*0.15;
  vec3 fissureCol=vec3(0.02,0.018,0.012);vec3 darkPlate=vec3(0.08,0.075,0.06);
  vec3 midPlate=vec3(0.15,0.14,0.12);vec3 lightPlate=vec3(0.22,0.20,0.17);
  vec3 bark=mix(fissureCol,darkPlate,smoothstep(0.0,0.25,bPat));
  bark=mix(bark,midPlate,smoothstep(0.25,0.55,bPat));bark=mix(bark,lightPlate,smoothstep(0.55,0.9,bPat));
  bark+=(bN-0.5)*0.03;bark+=vec3(0.015,0.008,0.0)*isPlate*bN2;
  float bUp=max(dot(vBarkWorldNrm,vec3(0,1,0)),0.0);float bMossN=fbm(vBarkWorldPos*0.3);
  float mossYFade=smoothstep(240.0,-150.0,vBarkWorldPos.y);
  float bMoss=mossYFade*smoothstep(0.2,0.55,bMossN);
  bMoss+=smoothstep(0.4,0.8,bUp)*smoothstep(0.3,0.6,bMossN)*0.4;bMoss=min(bMoss,1.0);
  bark=mix(bark,mix(vec3(0.05,0.10,0.02),vec3(0.10,0.20,0.03),bMossN),bMoss*0.65);
  float bLichN=noise3D(vBarkWorldPos*0.4+50.0);
  float bLich=smoothstep(0.60,0.66,bLichN)*(1.0-mossYFade*0.5);
  bark=mix(bark,vec3(0.18,0.19,0.15),bLich*0.25);
  bark+=vec3(0.08,0.05,0.02)*uBarkHover;
  diffuseColor=vec4(bark,1.0);
`;

const BARK_ROUGHNESS_GLSL = `float roughnessFactor=mix(0.98,0.52,bPat);`;

const BARK_NORMAL_GLSL = `
  float bnx=noise3D(vBarkWorldPos*0.2+vec3(0.35,0,0))-noise3D(vBarkWorldPos*0.2-vec3(0.35,0,0));
  float bnz=noise3D(vBarkWorldPos*0.2+vec3(0,0,0.35))-noise3D(vBarkWorldPos*0.2-vec3(0,0,0.35));
  float bny=noise3D(vBarkWorldPos*0.12+vec3(0,0.35,0))-noise3D(vBarkWorldPos*0.12-vec3(0,0.35,0));
  float edgeStrength=1.0-smoothstep(0.0,0.3,abs(bPat-0.25));
  float nStr=3.0+edgeStrength*3.0;
  normal=normalize(normal+vec3(bnx,bny*0.3,bnz)*nStr);
`;

const createBarkMaterial = (): THREE.MeshStandardMaterial => {
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0.02, envMapIntensity: 0.5, side: THREE.DoubleSide });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uBarkHover = { value: 0 };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', ['#include <common>', 'varying vec3 vBarkWorldPos;varying vec3 vBarkWorldNrm;', NOISE_GLSL].join('\n'))
      .replace('#include <begin_vertex>', [
        'vec3 transformed=vec3(position);',
        'float bLBump=noise3D(position*0.06)*1.8;float bSBump=noise3D(position*0.25)*0.6;float bDBump=noise3D(position*0.8)*0.15;',
        'transformed+=normal*(bLBump+bSBump+bDBump);',
        'vBarkWorldPos=(modelMatrix*vec4(transformed,1.0)).xyz;vBarkWorldNrm=normalize(mat3(modelMatrix)*normal);',
      ].join('\n'));
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', ['#include <common>', 'varying vec3 vBarkWorldPos;varying vec3 vBarkWorldNrm;uniform float uBarkHover;', NOISE_GLSL].join('\n'))
      .replace('#include <color_fragment>', BARK_COLOR_GLSL)
      .replace('#include <roughnessmap_fragment>', BARK_ROUGHNESS_GLSL)
      .replace('#include <normal_fragment_maps>', BARK_NORMAL_GLSL);
    mat.userData.shader = shader;
  };
  return mat;
};

const createTaperedTube = (
  curve: THREE.CatmullRomCurve3, tubSegs: number, baseR: number, radSegs: number, taperEnd: number
): THREE.TubeGeometry => {
  const geo = new THREE.TubeGeometry(curve, tubSegs, baseR, radSegs, false);
  const pos = geo.getAttribute('position');
  const ringSize = radSegs + 1;
  const ringCount = tubSegs + 1;
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

// ===== 幹 =====
export const TreeTrunk = ({ onClick, onPointerOver, onPointerOut }: TreePartProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const hovered = useRef(false);

  const trunkGeometry = useMemo(() => {
    // 巨大な大樹の幹（根元2400、頂上付近600）— 前回の2倍
    const profile = [
      new THREE.Vector2(2400, -500),  new THREE.Vector2(2300, -300), new THREE.Vector2(2200, -100),
      new THREE.Vector2(2120, 200),   new THREE.Vector2(2040, 500),  new THREE.Vector2(1960, 800),
      new THREE.Vector2(1880, 1100),  new THREE.Vector2(1800, 1400), new THREE.Vector2(1720, 1700),
      new THREE.Vector2(1640, 2000),  new THREE.Vector2(1560, 2400), new THREE.Vector2(1480, 2800),
      new THREE.Vector2(1400, 3200),  new THREE.Vector2(1300, 3800), new THREE.Vector2(1160, 4500),
      new THREE.Vector2(1000, 5200),  new THREE.Vector2(860, 6000),  new THREE.Vector2(740, 6800),
      new THREE.Vector2(660, 7500),   new THREE.Vector2(600, 8000),
      // 頂点を閉じる（枝の付け根で自然に消える）
      new THREE.Vector2(400, 8100),   new THREE.Vector2(0.01, 8200),
    ];
    return new THREE.LatheGeometry(profile, 96, 0, Math.PI * 2);
  }, []);

  const roots = useMemo(() => {
    // 巨大な幹に合わせた太い根
    const defs = [
      { angle: 0.2, length: 1000, dip: -120, radius: 500 }, { angle: 0.85, length: 850, dip: -100, radius: 440 },
      { angle: 1.5, length: 1100, dip: -130, radius: 540 }, { angle: 2.2, length: 750, dip: -90, radius: 380 },
      { angle: 2.9, length: 950, dip: -110, radius: 470 }, { angle: 3.7, length: 880, dip: -100, radius: 430 },
      { angle: 4.4, length: 1050, dip: -125, radius: 500 }, { angle: 5.2, length: 700, dip: -85, radius: 350 },
      { angle: 5.8, length: 960, dip: -110, radius: 460 },
    ];
    return defs.map((d) => {
      const c2 = Math.cos(d.angle); const s2 = Math.sin(d.angle);
      const rootStart = 1800;
      return createTaperedTube(new THREE.CatmullRomCurve3([
        new THREE.Vector3(c2 * rootStart, -380, s2 * rootStart),
        new THREE.Vector3(c2 * (rootStart + d.length * 0.2), -410, s2 * (rootStart + d.length * 0.2)),
        new THREE.Vector3(c2 * (rootStart + d.length * 0.45), -440, s2 * (rootStart + d.length * 0.45)),
        new THREE.Vector3(c2 * (rootStart + d.length * 0.7), -470 + d.dip * 0.5, s2 * (rootStart + d.length * 0.7)),
        new THREE.Vector3(c2 * (rootStart + d.length), -500 + d.dip, s2 * (rootStart + d.length)),
      ]), 24, d.radius, 14, 0.15);
    });
  }, []);

  const barkMaterial = useMemo(() => createBarkMaterial(), []);

  useFrame(() => {
    const sh = barkMaterial.userData.shader as { uniforms: { uBarkHover: { value: number } } } | undefined;
    if (!sh) return;
    sh.uniforms.uBarkHover.value = THREE.MathUtils.lerp(sh.uniforms.uBarkHover.value, hovered.current ? 1 : 0, 0.08);
  });

  return (
    <group ref={groupRef} onClick={onClick}
      onPointerOver={() => { hovered.current = true; document.body.style.cursor = 'pointer'; onPointerOver?.(); }}
      onPointerOut={() => { hovered.current = false; document.body.style.cursor = 'default'; onPointerOut?.(); }}>
      <mesh geometry={trunkGeometry} material={barkMaterial} castShadow receiveShadow />
      <mesh position={[0, -500, 0]} rotation={[Math.PI / 2, 0, 0]} material={barkMaterial}>
        <circleGeometry args={[2500, 96]} />
      </mesh>
      {roots.map((g, i) => <mesh key={`r-${i}`} geometry={g} material={barkMaterial} castShadow receiveShadow />)}
    </group>
  );
};

// ===== 枝（主枝→小枝、テーパーで自然に細くなる） =====
export const TreeBranches = ({ onClick, onPointerOver, onPointerOut }: TreePartProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const hovered = useRef(false);
  const branchMaterial = useMemo(() => createBarkMaterial(), []);

  const geos = useMemo(() => {
    const allGeos: THREE.TubeGeometry[] = [];

    BRANCH_DEFS.map((d) => {
      // 枝1（主枝: 幹トップから分岐する太い枝）
      const curve = buildBranchCurve(d);
      allGeos.push(createTaperedTube(curve, 48, d.radius, 20, 0.12));

      // 枝2（二次枝: 枝1から生える）
      [0.4, 0.65, 0.88].slice(0, d.subs).map((splitT, si) => {
        const sec = buildSubCurve(curve, splitT, si, d.radius, 1625 + si * 310, [310, 560, 750]);
        allGeos.push(createTaperedTube(sec.curve, 30, sec.radius, 14, 0.15));

        // 枝3（三次枝: 枝2から大量に生える。葉はこの先端に）
        [0.3, 0.5, 0.7, 0.9].map((terT, ti) => {
          const ter = buildSubCurve(sec.curve, terT, ti, sec.radius, 750 + ti * 225, [150, 275, 375]);
          allGeos.push(createTaperedTube(ter.curve, 16, ter.radius, 8, 0.1));
        });
      });
    });

    return allGeos;
  }, []);

  useFrame(() => {
    const sh = branchMaterial.userData.shader as { uniforms: { uBarkHover: { value: number } } } | undefined;
    if (!sh) return;
    sh.uniforms.uBarkHover.value = THREE.MathUtils.lerp(sh.uniforms.uBarkHover.value, hovered.current ? 1 : 0, 0.08);
  });

  return (
    <group ref={groupRef} onClick={onClick}
      onPointerOver={() => { hovered.current = true; document.body.style.cursor = 'pointer'; onPointerOver?.(); }}
      onPointerOut={() => { hovered.current = false; document.body.style.cursor = 'default'; onPointerOut?.(); }}>
      {geos.map((g, i) => <mesh key={`b-${i}`} geometry={g} material={branchMaterial} castShadow receiveShadow />)}
    </group>
  );
};
