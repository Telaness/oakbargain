'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BRANCH_DEFS, buildBranchCurve, getTrunkRadius } from './TreeParts';

// ===== 枝衝突回避用 =====
interface BranchSample { pos: THREE.Vector3; radius: number; }
const BRANCH_MARGIN = 200;
const SAMPLE_COUNT = 12;

const computeBranchSamples = (): BranchSample[] => {
  const samples: BranchSample[] = [];
  BRANCH_DEFS.map((d) => {
    const curve = buildBranchCurve(d);
    const pt = new THREE.Vector3();
    for (let i = 0; i <= SAMPLE_COUNT; i++) {
      const t = i / SAMPLE_COUNT;
      curve.getPoint(t, pt);
      const r = d.radius * (1.0 - t * (1.0 - 0.12));
      samples.push({ pos: pt.clone(), radius: r + BRANCH_MARGIN });
    }
  });
  return samples;
};

const branchSamples = computeBranchSamples();

const pushAwayFromBranches = (camPos: THREE.Vector3): void => {
  const diff = new THREE.Vector3();
  for (const sample of branchSamples) {
    diff.subVectors(camPos, sample.pos);
    const dist = diff.length();
    if (dist < sample.radius && dist > 0.01) {
      diff.normalize().multiplyScalar(sample.radius - dist);
      camPos.add(diff);
    }
  }
};

// ===== ジュエリー配置（TreeSceneと同じ計算で一致させる） =====
// TreeScene側: branch 0=entry, 1=standard, 2=premium, 3=luxury
const JEWELRY_T = [0.6, 0.6, 0.6, 0.6];
const JEWELRY_BRANCH_INDICES = [0, 1, 2, 3]; // entry, standard, premium, luxury
const LINE_NAMES = ['Entry', 'Standard', 'Premium', 'Luxury'];

const jewelryPositions = JEWELRY_BRANCH_INDICES.map((bi) => {
  const t = JEWELRY_T[bi];
  const d = BRANCH_DEFS[bi];
  const curve = buildBranchCurve(d);
  const pt = new THREE.Vector3();
  curve.getPoint(t, pt);
  const branchR = d.radius * (1.0 - t * (1.0 - 0.12));
  return new THREE.Vector3(pt.x, pt.y + branchR + 10, pt.z);
});

// Y座標の高い順にソート → スクロール降下順にマッピング
const SORTED_ORDER = jewelryPositions
  .map((jp, i) => ({ i, y: jp.y }))
  .sort((a, b) => b.y - a.y)
  .map((v) => v.i);

// フォーカス用カメラ位置（上から見下ろす）
const FOCUS_DIST = 500;
const FOCUS_UP = 300;
const focusCamPositions = jewelryPositions.map((jp) => {
  const jAngle = Math.atan2(jp.z, jp.x);
  const camAngle = jAngle + Math.PI / 6;
  return new THREE.Vector3(
    jp.x + Math.cos(camAngle) * FOCUS_DIST,
    jp.y + FOCUS_UP,
    jp.z + Math.sin(camAngle) * FOCUS_DIST
  );
});

// ===== 螺旋パラメータ =====
const SURFACE_MARGIN = 300;
const START_Y = 6500;
const END_Y = -300;
const SPIRAL_END_SCROLL = 0.80;
const REVOLUTIONS = 4.0;

// フォーカスのscroll区間（4つのジュエリー用）
const FOCUS_CENTERS = [0.13, 0.33, 0.53, 0.73];
const FOCUS_HALF = 0.06;

const TOTAL_SPIRAL_ANGLE = REVOLUTIONS * Math.PI * 2;

// 最初に訪問するジュエリー（最も高い位置）の角度に開始角度を合わせる
const firstJewelryIdx = SORTED_ORDER[0];
const FIRST_TARGET_ANGLE = Math.atan2(jewelryPositions[firstJewelryIdx].z, jewelryPositions[firstJewelryIdx].x) + Math.PI / 5;
const FIRST_BASE_ANGLE = (FOCUS_CENTERS[0] / SPIRAL_END_SCROLL) * TOTAL_SPIRAL_ANGLE;
const ANGLE_OFFSET = (() => {
  let d = FIRST_TARGET_ANGLE - FIRST_BASE_ANGLE;
  d = ((d % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
  return d;
})();

const getSpiralAngle = (scroll: number): number =>
  (scroll / SPIRAL_END_SCROLL) * TOTAL_SPIRAL_ANGLE + ANGLE_OFFSET;

// Yキーフレーム: 高い順に訪問、常に降下
interface YKF { scroll: number; y: number; }
const buildYKFs = (): YKF[] => {
  const kfs: YKF[] = [{ scroll: 0, y: START_Y }];

  SORTED_ORDER.map((ji, si) => {
    const center = FOCUS_CENTERS[si];
    const camY = focusCamPositions[ji].y;
    kfs.push({ scroll: center - 0.07, y: camY + 200 });
    kfs.push({ scroll: center, y: camY });
    kfs.push({ scroll: center + 0.07, y: camY - 200 });
  });

  kfs.push({ scroll: SPIRAL_END_SCROLL, y: END_Y });
  return kfs;
};

const Y_KFS = buildYKFs();

const interpolateKFs = (kfs: { scroll: number; value: number }[], scroll: number): number => {
  if (scroll <= kfs[0].scroll) return kfs[0].value;
  if (scroll >= kfs[kfs.length - 1].scroll) return kfs[kfs.length - 1].value;

  for (let i = 0; i < kfs.length - 1; i++) {
    if (scroll >= kfs[i].scroll && scroll <= kfs[i + 1].scroll) {
      const t = (scroll - kfs[i].scroll) / (kfs[i + 1].scroll - kfs[i].scroll);
      const eased = t * t * (3 - 2 * t);
      return kfs[i].value + eased * (kfs[i + 1].value - kfs[i].value);
    }
  }
  return kfs[kfs.length - 1].value;
};

const getY = (scroll: number): number =>
  interpolateKFs(Y_KFS.map((k) => ({ scroll: k.scroll, value: k.y })), scroll);

// フォーカスblend
const getFocusBlend = (scroll: number): { blend: number; idx: number } => {
  for (let i = 0; i < FOCUS_CENTERS.length; i++) {
    const dist = Math.abs(scroll - FOCUS_CENTERS[i]);
    if (dist < FOCUS_HALF) {
      const b = 1.0 - dist / FOCUS_HALF;
      return { blend: b * b * (3 - 2 * b), idx: SORTED_ORDER[i] };
    }
  }
  return { blend: 0, idx: -1 };
};

// ===== 毎フレームのカメラ位置計算 =====
const _spiralPos = new THREE.Vector3();
const _targetPos = new THREE.Vector3();
const _targetLook = new THREE.Vector3();

const computeCamera = (scroll: number): { pos: THREE.Vector3; lookAt: THREE.Vector3 } => {
  // 全景引き区間
  if (scroll > SPIRAL_END_SCROLL) {
    const pullT = (scroll - SPIRAL_END_SCROLL) / (1.0 - SPIRAL_END_SCROLL);
    const eased = pullT * pullT * (3 - 2 * pullT);
    const lastAngle = getSpiralAngle(SPIRAL_END_SCROLL);
    const pullAngle = lastAngle + eased * Math.PI * 0.3;
    const groundTrunkR = getTrunkRadius(-300);
    const pullDist = THREE.MathUtils.lerp(3000, groundTrunkR + 2000, eased);
    const pullY = THREE.MathUtils.lerp(END_Y, -200, eased);
    _targetPos.set(Math.cos(pullAngle) * pullDist, pullY, Math.sin(pullAngle) * pullDist);
    _targetLook.set(0, THREE.MathUtils.lerp(END_Y, 4500, eased), 0);
    return { pos: _targetPos, lookAt: _targetLook };
  }

  // 螺旋の基本位置
  const angle = getSpiralAngle(scroll);
  const y = getY(scroll);
  const trunkR = getTrunkRadius(y);
  const orbitR = trunkR + SURFACE_MARGIN;

  _spiralPos.set(Math.cos(angle) * orbitR, y, Math.sin(angle) * orbitR);

  // フォーカスブレンド
  const { blend, idx } = getFocusBlend(scroll);

  if (blend > 0 && idx >= 0) {
    _targetPos.lerpVectors(_spiralPos, focusCamPositions[idx], blend);
    _targetLook.set(0, y - 50, 0);
    _targetLook.lerp(jewelryPositions[idx], blend);
  } else {
    _targetPos.copy(_spiralPos);
    _targetLook.set(0, y - 50, 0);
  }

  return { pos: _targetPos, lookAt: _targetLook };
};

// ===== 外部API: 現在フォーカス中のライン名 =====
export const getActiveLineName = (scroll: number): string | null => {
  for (let i = 0; i < FOCUS_CENTERS.length; i++) {
    const dist = Math.abs(scroll - FOCUS_CENTERS[i]);
    if (dist < FOCUS_HALF * 0.7) return LINE_NAMES[SORTED_ORDER[i]];
  }
  return null;
};

interface CameraRigProps { scrollProgress: number; mouseNX: number; mouseNY: number; }

export const CameraRig = ({ scrollProgress, mouseNX, mouseNY }: CameraRigProps) => {
  const smoothPos = useRef(new THREE.Vector3(
    Math.cos(getSpiralAngle(0)) * (getTrunkRadius(START_Y) + SURFACE_MARGIN),
    START_Y,
    Math.sin(getSpiralAngle(0)) * (getTrunkRadius(START_Y) + SURFACE_MARGIN)
  ));
  const smoothLook = useRef(new THREE.Vector3(0, START_Y - 50, 0));

  useFrame(({ camera }) => {
    const scroll = THREE.MathUtils.clamp(scrollProgress, 0, 0.999);
    const { pos, lookAt: look } = computeCamera(scroll);

    // マウス微調整
    pos.x += mouseNX * 5.0;
    pos.y += mouseNY * 2.0;

    // 幹・枝の貫通防止（常に適用）
    if (scroll <= SPIRAL_END_SCROLL) {
      const xzDist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
      const trunkR = getTrunkRadius(pos.y);
      const minDist = trunkR + 50;
      if (xzDist < minDist && xzDist > 0) {
        const sc = minDist / xzDist;
        pos.x *= sc;
        pos.z *= sc;
      }
      pushAwayFromBranches(pos);
    }

    smoothPos.current.lerp(pos, 0.05);
    smoothLook.current.lerp(look, 0.05);

    // lerp後も幹・枝チェック
    if (scroll <= SPIRAL_END_SCROLL) {
      const xzDist = Math.sqrt(smoothPos.current.x * smoothPos.current.x + smoothPos.current.z * smoothPos.current.z);
      const trunkR = getTrunkRadius(smoothPos.current.y);
      const minDist = trunkR + 50;
      if (xzDist < minDist && xzDist > 0) {
        const sc = minDist / xzDist;
        smoothPos.current.x *= sc;
        smoothPos.current.z *= sc;
      }
      pushAwayFromBranches(smoothPos.current);
    }

    camera.position.copy(smoothPos.current);
    camera.lookAt(smoothLook.current);
  });

  return null;
};
