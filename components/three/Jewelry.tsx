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
}: JewelryProps & {
  modelPath: string;
  lightColor: string;
  lightIntensity?: number;
  rotationSpeed?: number;
  bobSpeed?: number;
  bobAmount?: number;
  scale?: number;
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
        <primitive object={cloned} scale={scale} />
      </group>
      <pointLight color={lightColor} intensity={lightIntensity} distance={1500} decay={2} />
    </group>
  );
};

// ===== LUXURY: K18ゴールドリング + ルビー（プリミティブ、2.5倍スケール） =====
export const LuxuryJewelry = ({ position, onClick }: JewelryProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);

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
      <group ref={innerRef} scale={25}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3.5, 0.6, 20, 48]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.95} roughness={0.04} envMapIntensity={2.0} />
        </mesh>
        <mesh position={[0, 2.8, 0]}>
          <octahedronGeometry args={[1.5]} />
          <meshStandardMaterial color="#CC1133" emissive="#FF2244" emissiveIntensity={0.8} metalness={0.15} roughness={0.02} envMapIntensity={3.0} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[Math.cos(i * Math.PI / 2) * 1.1, 1.6, Math.sin(i * Math.PI / 2) * 1.1]} scale={[0.15, 1.2, 0.15]}>
            <cylinderGeometry args={[1, 0.6, 1, 6]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.95} roughness={0.04} />
          </mesh>
        ))}
      </group>
      <pointLight color="#FFD700" intensity={20} distance={1500} decay={2} />
    </group>
  );
};

// ===== PREMIUM: standard1.glb =====
export const PremiumJewelry = ({ position, onClick }: JewelryProps) => (
  <FloatingGLB
    position={position}
    onClick={onClick}
    modelPath="/3d/juwely/standard1.glb"
    lightColor="#88CCAA"
    lightIntensity={18}
    rotationSpeed={0.3}
    bobSpeed={0.7}
    bobAmount={15}
    scale={75}
  />
);

// ===== STANDARD: entry2.glb =====
export const StandardJewelry = ({ position, onClick }: JewelryProps) => (
  <FloatingGLB
    position={position}
    onClick={onClick}
    modelPath="/3d/juwely/entry2.glb"
    lightColor="#DDBB88"
    lightIntensity={15}
    rotationSpeed={0.35}
    bobSpeed={0.6}
    bobAmount={12}
    scale={75}
  />
);

// ===== ENTRY: entry1.glb =====
export const EntryJewelry = ({ position, onClick }: JewelryProps) => (
  <FloatingGLB
    position={position}
    onClick={onClick}
    modelPath="/3d/juwely/entry1.glb"
    lightColor="#DDCCBB"
    lightIntensity={12}
    rotationSpeed={0.25}
    bobSpeed={0.5}
    bobAmount={10}
    scale={75}
  />
);

// GLBのプリロード
useGLTF.preload('/3d/juwely/standard1.glb');
useGLTF.preload('/3d/juwely/entry1.glb');
useGLTF.preload('/3d/juwely/entry2.glb');
