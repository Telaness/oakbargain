'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { computeFoliageTips } from './TreeParts';

interface FoliageProps {
  leafCount: number;
}

// ===== 巨大な大樹の密な樹冠: 枝先端を中心に大量のクラスターで覆い尽くす =====
const computeClusters = () => {
  const tips = computeFoliageTips();
  const clusters: { x: number; y: number; z: number; r: number }[] = [];

  tips.map((tip) => {
    // メインクラスター（巨大な半径）
    clusters.push({ x: tip.x, y: tip.y, z: tip.z, r: 600 });
    // 周辺に大量のサブクラスターを重ねて隙間なく覆う
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2 + Math.random() * 0.3;
      const dist = 100 + k * 50;
      clusters.push({
        x: tip.x + Math.cos(a) * dist,
        y: tip.y + (k - 5) * 60,
        z: tip.z + Math.sin(a) * dist,
        r: 450 - k * 20,
      });
    }
    // さらに外周にも散布して樹冠のボリュームを出す
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + Math.random() * 0.5 + 0.3;
      const dist = 300 + k * 80;
      clusters.push({
        x: tip.x + Math.cos(a) * dist,
        y: tip.y + (k - 2) * 40,
        z: tip.z + Math.sin(a) * dist,
        r: 350 - k * 30,
      });
    }
  });

  return clusters;
};

export const Foliage = ({ leafCount }: FoliageProps) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const clusters = useMemo(computeClusters, []);

  const { matrices, randoms, totalCount } = useMemo(() => {
    const dummy = new THREE.Object3D();
    const mats: THREE.Matrix4[] = [];
    const rands: number[] = [];
    const perCluster = Math.max(1, Math.floor(leafCount / clusters.length));

    clusters.map((cl) => {
      for (let i = 0; i < perCluster; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const dist = cl.r * (0.2 + Math.random() * 0.8);
        dummy.position.set(
          cl.x + Math.sin(phi) * Math.cos(theta) * dist,
          cl.y + Math.sin(phi) * Math.sin(theta) * dist * 0.6,
          cl.z + Math.cos(phi) * dist
        );
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI * 2, Math.random() * Math.PI * 0.5);
        const sz = 25.0 + Math.random() * 40.0;
        dummy.scale.set(sz, sz, sz);
        dummy.updateMatrix();
        mats.push(dummy.matrix.clone());
        rands.push(Math.random());
      }
    });
    return { matrices: mats, randoms: new Float32Array(rands), totalCount: mats.length };
  }, [leafCount, clusters]);

  useEffect(() => {
    if (!meshRef.current) return;
    matrices.map((m, i) => meshRef.current!.setMatrixAt(i, m));
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.geometry.setAttribute('aRandom', new THREE.InstancedBufferAttribute(randoms, 1));
    // frustum cullingによる葉の消失を防止
    meshRef.current.frustumCulled = false;
  }, [matrices, randoms]);

  useFrame(({ clock }) => { if (materialRef.current) materialRef.current.uniforms.uTime.value = clock.getElapsedTime(); });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const vertices = new Float32Array([0,0.5,0, -0.35,0,-0.04, 0,0.05,0.08, 0.35,0,-0.04, 0,-0.5,0]);
    const indices = new Uint16Array([0,1,2, 0,2,3, 1,4,2, 2,4,3]);
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, totalCount]} castShadow>
      <shaderMaterial ref={materialRef} side={THREE.DoubleSide} transparent
        uniforms={{ uTime: { value: 0 } }}
        vertexShader={`
          uniform float uTime;attribute float aRandom;
          varying float vRandom;varying vec3 vWorldNormal;varying vec3 vWorldPos;
          void main(){
            vRandom=aRandom;vec3 pos=position;
            vec4 wp=instanceMatrix*vec4(0,0,0,1);
            float windPhase=wp.x*0.015+wp.z*0.02+aRandom*6.28;
            float wind=sin(uTime*1.2+windPhase)*1.2+sin(uTime*0.5+windPhase*0.7)*0.6;
            float tipFactor=smoothstep(-0.3,0.5,pos.y);
            pos.x+=wind*tipFactor*0.18;pos.z+=wind*tipFactor*0.09;
            vec4 worldPos=modelMatrix*instanceMatrix*vec4(pos,1.0);
            vWorldPos=worldPos.xyz;
            vWorldNormal=normalize(mat3(modelMatrix)*mat3(instanceMatrix)*normal);
            gl_Position=projectionMatrix*viewMatrix*worldPos;
          }`}
        fragmentShader={`
          varying float vRandom;varying vec3 vWorldNormal;varying vec3 vWorldPos;
          void main(){
            vec3 baseColor;
            if(vRandom>0.9){float f=fract(vRandom*10.0);baseColor=mix(vec3(0.95,0.92,0.90),vec3(0.95,0.78,0.82),f);}
            else{float v=fract(vRandom*7.0);baseColor=mix(vec3(0.04,0.12,0.02),mix(vec3(0.08,0.24,0.04),vec3(0.16,0.36,0.07),v),v);}
            vec3 N=normalize(vWorldNormal);vec3 L=normalize(vec3(0.15,0.96,0.24));vec3 V=normalize(cameraPosition-vWorldPos);
            float diffuse=max(dot(N,L),0.0)*0.55;
            float sss=pow(max(dot(-N,L),0.0),2.0)*0.45;vec3 sssColor=baseColor*1.6+vec3(0.05,0.08,0.02);
            float upF=dot(N,vec3(0,1,0))*0.5+0.5;
            vec3 ambient=mix(vec3(0.02,0.04,0.01),vec3(0.06,0.10,0.05),upF);
            float rim=pow(1.0-max(dot(N,V),0.0),3.0)*0.12;
            vec3 color=baseColor*(ambient+diffuse)+sssColor*sss+vec3(0.15,0.25,0.08)*rim;
            if(vRandom>0.9){color=baseColor*(ambient+diffuse*0.8+0.25);}
            gl_FragColor=vec4(color,0.96);
          }`}
      />
    </instancedMesh>
  );
};
