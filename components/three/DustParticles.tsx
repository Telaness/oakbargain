'use client';

import { useRef, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { DUST_CONFIG } from '@/lib/constants';

interface DustParticlesProps {
  mousePosition: { x: number; y: number };
  onClearProgress: (progress: number) => void;
  particleCount: number;
}

export const DustParticles = ({
  mousePosition,
  onClearProgress,
  particleCount,
}: DustParticlesProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const { camera } = useThree();

  // パーティクルを3D空間全体に散らす（大樹の周囲に存在する）
  const { positions, alphas, velocities, activeFlags, sizes } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const alp = new Float32Array(particleCount);
    const vel = new Float32Array(particleCount * 3);
    const active = new Uint8Array(particleCount);
    const sz = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // 木の周囲に3Dで散らばる（Z軸方向にも奥行きを持たせる）
      pos[i * 3] = (Math.random() - 0.5) * 120;
      pos[i * 3 + 1] = -40 + Math.random() * 120;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
      alp[i] = 0.15 + Math.random() * 0.35; // 薄め: 0.15〜0.5
      vel[i * 3] = 0;
      vel[i * 3 + 1] = 0;
      vel[i * 3 + 2] = 0;
      active[i] = 1;
      sz[i] =
        DUST_CONFIG.sizeRange.min +
        Math.random() * (DUST_CONFIG.sizeRange.max - DUST_CONFIG.sizeRange.min);
    }
    return { positions: pos, alphas: alp, velocities: vel, activeFlags: active, sizes: sz };
  }, [particleCount]);

  const mouseWorld = useRef(new THREE.Vector3());
  const raycaster = useRef(new THREE.Raycaster());
  const mouseNDC = useRef(new THREE.Vector2());
  const autoFading = useRef(false);
  const autoFadeStart = useRef(0);

  const updateMouseWorld = useCallback(
    (mx: number, my: number) => {
      mouseNDC.current.set(
        (mx / window.innerWidth) * 2 - 1,
        -(my / window.innerHeight) * 2 + 1
      );
      raycaster.current.setFromCamera(mouseNDC.current, camera);
      // カメラから50ユニット先の点をマウスワールド座標とする
      const dir = raycaster.current.ray.direction;
      mouseWorld.current.copy(camera.position).addScaledVector(dir, 50);
    },
    [camera]
  );

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;

    updateMouseWorld(mousePosition.x, mousePosition.y);

    const geometry = pointsRef.current.geometry;
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const alphaAttr = geometry.getAttribute('alpha') as THREE.BufferAttribute;
    const sizeAttr = geometry.getAttribute('size') as THREE.BufferAttribute;

    const mx = mouseWorld.current.x;
    const my = mouseWorld.current.y;
    const mz = mouseWorld.current.z;
    const radius = 15; // 3D空間でのマウス影響半径

    let activeCount = 0;

    for (let i = 0; i < particleCount; i++) {
      if (activeFlags[i] === 0) continue;

      const ix = i * 3;
      const px = positions[ix];
      const py = positions[ix + 1];
      const pz = positions[ix + 2];

      const dx = px - mx;
      const dy = py - my;
      const dz = pz - mz;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < radius && !autoFading.current) {
        const force = (1 - dist / radius) * 0.4;
        const len = dist || 1;
        velocities[ix] += (dx / len) * force;
        velocities[ix + 1] += (dy / len) * force;
        velocities[ix + 2] += (dz / len) * force;
        alphas[i] -= 0.015;
      }

      velocities[ix] *= DUST_CONFIG.friction;
      velocities[ix + 1] *= DUST_CONFIG.friction;
      velocities[ix + 2] *= DUST_CONFIG.friction;

      positions[ix] += velocities[ix];
      positions[ix + 1] += velocities[ix + 1];
      positions[ix + 2] += velocities[ix + 2];

      if (autoFading.current) {
        const elapsed = clock.getElapsedTime() - autoFadeStart.current;
        const fadeProgress = Math.min(elapsed / DUST_CONFIG.autoFadeDuration, 1);
        alphas[i] = Math.max(alphas[i] - fadeProgress * 0.03, 0);
      }

      if (alphas[i] <= 0.01) {
        activeFlags[i] = 0;
        alphas[i] = 0;
      }

      if (activeFlags[i] === 1) activeCount++;

      posAttr.setXYZ(i, positions[ix], positions[ix + 1], positions[ix + 2]);
      alphaAttr.setX(i, alphas[i]);
      sizeAttr.setX(i, sizes[i]);
    }

    posAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;

    const clearProgress = 1 - activeCount / particleCount;
    onClearProgress(clearProgress);

    if (clearProgress >= DUST_CONFIG.autoFadeThreshold && !autoFading.current) {
      autoFading.current = true;
      autoFadeStart.current = clock.getElapsedTime();
    }
  });

  const colorArray = useMemo(() => {
    const colors = new Float32Array(particleCount * 3);
    const colorOptions = DUST_CONFIG.colors.map((c) => new THREE.Color(c));
    for (let i = 0; i < particleCount; i++) {
      const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return colors;
  }, [particleCount]);

  return (
    <points ref={pointsRef} renderOrder={10}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={particleCount} />
        <bufferAttribute attach="attributes-alpha" args={[alphas, 1]} count={particleCount} />
        <bufferAttribute attach="attributes-color" args={[colorArray, 3]} count={particleCount} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} count={particleCount} />
      </bufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        vertexColors
        vertexShader={`
          attribute float alpha;
          attribute float size;
          varying float vAlpha;
          varying vec3 vColor;
          void main() {
            vAlpha = alpha;
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (200.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying float vAlpha;
          varying vec3 vColor;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float fade = 1.0 - smoothstep(0.2, 0.5, d);
            gl_FragColor = vec4(vColor, vAlpha * fade);
          }
        `}
      />
    </points>
  );
};
