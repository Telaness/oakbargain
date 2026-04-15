'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { getTrunkRadius, BRANCH_DEFS, buildBranchCurve } from './TreeParts';

// ジュエリーフォーカス区間（CameraRigと同じ値）
const FOCUS_CENTERS = [0.13, 0.33, 0.53, 0.73];
const FOCUS_HALF = 0.06;

// 退避方向: Entry=左, Standard=右, Premium=左, Luxury=右
const DODGE_DIRECTIONS = [-1, 1, -1, 1];

const getJewelryFocus = (scroll: number): { blend: number; direction: number } => {
  for (let i = 0; i < FOCUS_CENTERS.length; i++) {
    const dist = Math.abs(scroll - FOCUS_CENTERS[i]);
    if (dist < FOCUS_HALF) {
      const b = 1.0 - dist / FOCUS_HALF;
      return { blend: b * b * (3 - 2 * b), direction: DODGE_DIRECTIONS[i] };
    }
  }
  return { blend: 0, direction: 1 };
};

// ===== 幹・枝の衝突回避 =====
interface BranchSample { pos: THREE.Vector3; radius: number; }
const LOGO_MARGIN = 100;
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
      samples.push({ pos: pt.clone(), radius: r + LOGO_MARGIN });
    }
  });
  return samples;
};

const branchSamples = computeBranchSamples();

const _logoDiff = new THREE.Vector3();
const pushAwayFromTree = (pos: THREE.Vector3): void => {
  // 幹からの回避
  const xzDist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
  const trunkR = getTrunkRadius(pos.y);
  const minDist = trunkR + LOGO_MARGIN;
  if (xzDist < minDist && xzDist > 0.01) {
    const sc = minDist / xzDist;
    pos.x *= sc;
    pos.z *= sc;
  }

  // 枝からの回避
  for (const sample of branchSamples) {
    _logoDiff.subVectors(pos, sample.pos);
    const dist = _logoDiff.length();
    if (dist < sample.radius && dist > 0.01) {
      _logoDiff.normalize().multiplyScalar(sample.radius - dist);
      pos.add(_logoDiff);
    }
  }
};

interface LogoMeshProps {
  scrollProgress: number;
}

export const LogoMesh = ({ scrollProgress }: LogoMeshProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/3d/logo/oak_bargain_gold.glb');
  const { camera } = useThree();

  const cloned = useMemo(() => {
    const c = scene.clone();
    c.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(c);
    const center = box.getCenter(new THREE.Vector3());
    c.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.translate(-center.x, -center.y, -center.z);
      }
    });
    c.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.material) {
        const mat = (obj.material as THREE.MeshStandardMaterial).clone();
        mat.emissive = new THREE.Color('#B8964E');
        mat.emissiveIntensity = 0.3;
        mat.envMapIntensity = 2.0;
        obj.material = mat;
      }
    });
    return c;
  }, [scene]);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.traverse((obj) => { obj.frustumCulled = false; });
    }
  }, []);

  const targetPos = useRef(new THREE.Vector3());
  const currentPos = useRef(new THREE.Vector3());
  const initialized = useRef(false);
  const prevScroll = useRef(scrollProgress);
  const spinAngle = useRef(0);

  // 毎フレーム再利用するオブジェクト
  const _forward = useMemo(() => new THREE.Vector3(), []);
  const _right = useMemo(() => new THREE.Vector3(), []);
  const _up = useMemo(() => new THREE.Vector3(), []);
  const _lookObj = useMemo(() => new THREE.Object3D(), []);
  const _targetQuat = useMemo(() => new THREE.Quaternion(), []);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;

    _forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
    _right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    _up.set(0, 1, 0).applyQuaternion(camera.quaternion);

    const { blend: focusBlend, direction } = getJewelryFocus(scrollProgress);

    const dist = 150;
    const endBlendForPos = THREE.MathUtils.smoothstep(scrollProgress, 0.85, 0.95);
    const baseUp = THREE.MathUtils.lerp(10, -20, THREE.MathUtils.smoothstep(scrollProgress, 0, 0.1));
    const normalUp = THREE.MathUtils.lerp(baseUp, -50, focusBlend);
    const upOffset = THREE.MathUtils.lerp(normalUp, 5, endBlendForPos);
    const rightOffset = THREE.MathUtils.lerp(0, 60 * direction, focusBlend);
    const scaleTarget = THREE.MathUtils.lerp(1, 0.6, focusBlend);

    targetPos.current.copy(camera.position)
      .addScaledVector(_forward, dist)
      .addScaledVector(_up, upOffset)
      .addScaledVector(_right, rightOffset);

    pushAwayFromTree(targetPos.current);

    if (!initialized.current) {
      currentPos.current.copy(targetPos.current);
      initialized.current = true;
    }

    currentPos.current.lerp(targetPos.current, 0.03);
    pushAwayFromTree(currentPos.current);

    groupRef.current.position.copy(currentPos.current);

    const currentScale = groupRef.current.scale.x;
    const newScale = THREE.MathUtils.lerp(currentScale, 4 * scaleTarget, 0.05);
    groupRef.current.scale.setScalar(newScale);

    const scrollDelta = Math.abs(scrollProgress - prevScroll.current);
    prevScroll.current = scrollProgress;
    const scrollSpeed = scrollDelta / Math.max(delta, 0.001);
    const endBlend = THREE.MathUtils.smoothstep(scrollProgress, 0.85, 0.95);
    const baseSpeed = 0.6 * (1 - endBlend);
    const scrollBoost = scrollSpeed * 80 * (1 - endBlend);
    spinAngle.current += (baseSpeed + scrollBoost) * delta;

    if (endBlend > 0) {
      _lookObj.position.copy(currentPos.current);
      _lookObj.lookAt(camera.position);
      _lookObj.rotation.x = Math.PI;
      _lookObj.rotation.y = Math.PI;
      _lookObj.updateMatrix();
      groupRef.current.quaternion.slerp(_lookObj.quaternion, 0.05);
    } else {
      _targetQuat.setFromEuler(groupRef.current.rotation).slerp(
        _targetQuat.setFromAxisAngle(_up.set(0, 1, 0), spinAngle.current), 0.05
      );
      groupRef.current.quaternion.copy(_targetQuat);
    }

    const bob = Math.sin(clock.getElapsedTime() * 0.5) * 3;
    groupRef.current.position.y += bob;
  });

  return (
    <group ref={groupRef}>
      <primitive object={cloned} scale={1} />
      <pointLight color="#B8964E" intensity={5} distance={500} decay={2} />
    </group>
  );
};

useGLTF.preload('/3d/logo/oak_bargain_gold.glb');
