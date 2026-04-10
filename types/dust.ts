import type * as THREE from 'three';

export interface DustParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  alpha: number;
  size: number;
  active: boolean;
}

export interface DustParticlesProps {
  mousePosition: { x: number; y: number };
  onClearProgress: (progress: number) => void;
}
