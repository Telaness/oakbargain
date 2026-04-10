'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface LogoMeshProps {
  scrollProgress: number;
}

export const LogoMesh = ({ scrollProgress }: LogoMeshProps) => {
  const groupRef = useRef<THREE.Group>(null);

  // 木の天辺から幹の根元まで降下
  const startY = 2500;
  const endY = -200;
  const targetY = startY - scrollProgress * (startY - endY);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      targetY,
      0.05
    );
    groupRef.current.rotation.y += 0.015 * delta * 60;
  });

  return (
    <group ref={groupRef} position={[0, startY, 0]}>
      <Text
        fontSize={4}
        color="#B8964E"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.15}
      >
        OAK BARGAIN
        <meshStandardMaterial
          color="#B8964E"
          metalness={0.8}
          roughness={0.2}
          emissive="#B8964E"
          emissiveIntensity={scrollProgress > 0.1 ? 0.4 : 0.1}
        />
      </Text>
    </group>
  );
};
