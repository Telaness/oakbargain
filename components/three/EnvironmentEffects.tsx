'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ===== ホタル（光の粒） =====
const FIREFLY_COUNT = 100;

export const Fireflies = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { basePositions, speeds, offsets } = useMemo(() => {
    const pos = new Float32Array(FIREFLY_COUNT * 3);
    const spd = new Float32Array(FIREFLY_COUNT);
    const off = new Float32Array(FIREFLY_COUNT);

    for (let i = 0; i < FIREFLY_COUNT; i++) {
      // 木の周囲に配置
      pos[i * 3] = (Math.random() - 0.5) * 160;
      pos[i * 3 + 1] = -414 + Math.random() * 2900;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 160;
      spd[i] = 0.2 + Math.random() * 0.6;
      off[i] = Math.random() * Math.PI * 2;
    }
    return { basePositions: pos, speeds: spd, offsets: off };
  }, []);

  const positions = useMemo(() => new Float32Array(FIREFLY_COUNT * 3), []);

  useFrame(({ clock }) => {
    if (!pointsRef.current || !materialRef.current) return;
    const time = clock.getElapsedTime();

    materialRef.current.uniforms.uTime.value = time;

    const posAttr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < FIREFLY_COUNT; i++) {
      const ix = i * 3;
      const s = speeds[i];
      const o = offsets[i];
      posAttr.setXYZ(
        i,
        basePositions[ix] + Math.sin(time * s + o) * 3,
        basePositions[ix + 1] + Math.sin(time * s * 0.6 + o + 1.3) * 2,
        basePositions[ix + 2] + Math.cos(time * s * 0.4 + o) * 3
      );
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} renderOrder={5}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={FIREFLY_COUNT}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        vertexShader={`
          uniform float uTime;
          varying float vBrightness;
          void main() {
            // 個体ごとに明滅のタイミングをずらす
            vBrightness = sin(uTime * 1.8 + position.y * 0.08 + position.x * 0.04) * 0.5 + 0.5;
            vBrightness = pow(vBrightness, 1.5);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = (2.5 + vBrightness * 5.0) * (180.0 / -mvPosition.z);
            gl_PointSize = min(gl_PointSize, 20.0);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying float vBrightness;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float glow = 1.0 - smoothstep(0.0, 0.5, d);
            glow = pow(glow, 2.5);
            vec3 warmAmber = vec3(0.7, 0.45, 0.15);
            vec3 dimGold = vec3(0.5, 0.35, 0.1);
            vec3 color = mix(warmAmber, dimGold, vBrightness * 0.3);
            gl_FragColor = vec4(color, glow * vBrightness * 0.5);
          }
        `}
        uniforms={{
          uTime: { value: 0 },
        }}
      />
    </points>
  );
};

// ===== 光の筋（ゴッドレイ風） =====
export const LightShafts = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    const pulse = Math.sin(clock.getElapsedTime() * 0.3) * 0.02 + 0.06;
    mat.opacity = pulse;
  });

  return (
    <mesh ref={meshRef} position={[15, 20, -10]} rotation={[0, 0, -0.3]}>
      <planeGeometry args={[8, 120]} />
      <meshBasicMaterial
        color="#3A2A10"
        transparent
        opacity={0.06}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

// ===== 浮遊する胞子/花粉 =====
const SPORE_COUNT = 200;

export const FloatingSpores = () => {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, sizes } = useMemo(() => {
    const pos = new Float32Array(SPORE_COUNT * 3);
    const sz = new Float32Array(SPORE_COUNT);
    for (let i = 0; i < SPORE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 200;
      pos[i * 3 + 1] = -414 + Math.random() * 2900;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 200;
      sz[i] = 0.3 + Math.random() * 0.5;
    }
    return { positions: pos, sizes: sz };
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const time = clock.getElapsedTime();
    const posAttr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;

    for (let i = 0; i < SPORE_COUNT; i++) {
      const ix = i * 3;
      // ゆっくり上昇 + ふわふわ漂う
      const baseY = ((positions[ix + 1] + time * 0.5 * (0.5 + sizes[i])) % 2900) - 414;
      posAttr.setXYZ(
        i,
        positions[ix] + Math.sin(time * 0.3 + i) * 0.8,
        baseY,
        positions[ix + 2] + Math.cos(time * 0.25 + i * 0.7) * 0.8
      );
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} renderOrder={4}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={SPORE_COUNT} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} count={SPORE_COUNT} />
      </bufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        vertexShader={`
          attribute float size;
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (120.0 / -mvPosition.z);
            gl_PointSize = min(gl_PointSize, 8.0);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float alpha = (1.0 - smoothstep(0.1, 0.5, d)) * 0.15;
            gl_FragColor = vec4(0.3, 0.22, 0.12, alpha * 0.6);
          }
        `}
      />
    </points>
  );
};
