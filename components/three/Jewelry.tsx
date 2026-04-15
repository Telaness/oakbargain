'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface JewelryProps {
  position: [number, number, number];
  onClick: () => void;
}

// ===== 共通: GLBモデルを浮遊・回転させるラッパー =====
const FloatingGLB = ({
  position,
  onClick,
  modelPath,
  lightColor,
  lightIntensity = 15,
  rotationSpeed = 0.3,
  scale = 8,
  initialRotation,
}: JewelryProps & {
  modelPath: string;
  lightColor: string;
  lightIntensity?: number;
  rotationSpeed?: number;
  bobSpeed?: number;
  bobAmount?: number;
  scale?: number;
  initialRotation?: [number, number, number];
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(modelPath);
  const cloned = useMemo(() => scene.clone(), [scene]);

  useEffect(() => {
    if (groupRef.current) groupRef.current.traverse((obj) => { obj.frustumCulled = false; });
  }, []);

  useFrame(({ clock }) => {
    if (!innerRef.current) return;
    innerRef.current.rotation.y = clock.getElapsedTime() * rotationSpeed;
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={onClick}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      <group ref={innerRef}>
        <primitive object={cloned} scale={scale} rotation={initialRotation} />
      </group>
      <pointLight color={lightColor} intensity={lightIntensity} distance={1500} decay={2} />
    </group>
  );
};

// ===== LUXURY: silver.glb（高所配置のため自発光+強照明） =====
export const LuxuryJewelry = ({ position, onClick }: JewelryProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/3d/juwely/luxury.glb', '/draco/');
  const cloned = useMemo(() => {
    const c = scene.clone();
    // 元のマテリアル色を保ちつつ、自発光で暗所でも見えるようにする
    c.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.material) {
        const mat = (obj.material as THREE.MeshStandardMaterial).clone();
        const base = mat.color.clone();
        base.lerp(new THREE.Color('#D4AF37'), 0.25);
        mat.emissive = base;
        mat.emissiveIntensity = 0.5;
        mat.envMapIntensity = 2.5;
        obj.material = mat;
      }
    });
    return c;
  }, [scene]);

  useEffect(() => {
    if (groupRef.current) groupRef.current.traverse((obj) => { obj.frustumCulled = false; });
  }, []);

  useFrame(({ clock }) => {
    if (!innerRef.current) return;
    innerRef.current.rotation.y = clock.getElapsedTime() * 0.4;
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={onClick}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      <group ref={innerRef}>
        <primitive object={cloned} scale={80} rotation={[Math.PI / 2, 0, 0]} />
      </group>
      <pointLight color="#FFD700" intensity={15} distance={2000} decay={2} />
    </group>
  );
};

// ===== PREMIUM: premium.glb =====
export const PremiumJewelry = ({ position, onClick }: JewelryProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/3d/juwely/premium.glb');
  const cloned = useMemo(() => {
    const c = scene.clone();
    // モデルの中心を原点に合わせる（公転防止）
    c.position.set(0, 0, 0);
    c.rotation.set(0, 0, 0);
    c.scale.set(1, 1, 1);
    c.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(c);
    const center = box.getCenter(new THREE.Vector3());
    c.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.translate(-center.x, -center.y, -center.z);
      }
    });
    return c;
  }, [scene]);

  useEffect(() => {
    if (groupRef.current) groupRef.current.traverse((obj) => { obj.frustumCulled = false; });
  }, []);

  useFrame(({ clock }) => {
    if (!spinRef.current) return;
    spinRef.current.rotation.y = clock.getElapsedTime() * 0.1;
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      {/* クリック判定用の透明メッシュ */}
      <mesh>
        <sphereGeometry args={[300, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <group ref={spinRef}>
        <primitive object={cloned} scale={8} rotation={[Math.PI / 2, 0, 0]} />
      </group>
      <pointLight color="#88CCAA" intensity={18} distance={1500} decay={2} />
    </group>
  );
};

// ===== STANDARD: standard.glb =====
export const StandardJewelry = ({ position, onClick }: JewelryProps) => (
  <FloatingGLB
    position={position}
    onClick={onClick}
    modelPath="/3d/juwely/standard.glb"
    lightColor="#DDBB88"
    lightIntensity={15}
    rotationSpeed={0.35}
    bobSpeed={0.6}
    bobAmount={12}
    scale={75}
  />
);

// ===== ENTRY: entry.glb =====
export const EntryJewelry = ({ position, onClick }: JewelryProps) => (
  <FloatingGLB
    position={position}
    onClick={onClick}
    modelPath="/3d/juwely/entry.glb"
    lightColor="#DDCCBB"
    lightIntensity={12}
    rotationSpeed={0.25}
    bobSpeed={0.5}
    bobAmount={10}
    scale={75}
  />
);

// GLBのプリロード
useGLTF.preload('/3d/juwely/luxury.glb', '/draco/');
useGLTF.preload('/3d/juwely/premium.glb');
useGLTF.preload('/3d/juwely/standard.glb');
useGLTF.preload('/3d/juwely/entry.glb');
