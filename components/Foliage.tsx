import React, { useMemo, useRef } from 'react';
import { useFrame, extend, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { FoliageMaterial } from '../shaders/foliageMaterial';
import { COLORS } from '../types';
import { getTreePoint, getExplosionPoint } from '../utils/math';

// Register the custom material so R3F knows it
extend({ FoliageMaterial });

interface FoliageProps {
  count: number;
  easedProgress: React.MutableRefObject<number>; // Now accepts the computed eased value directly
}

export const Foliage: React.FC<FoliageProps> = ({ count, easedProgress }) => {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<any>(null);

  // Generate particles
  const [positions, scatterPos, treePos, randoms] = useMemo(() => {
    const pos = new Float32Array(count * 3); // Current positions (dummy)
    const scat = new Float32Array(count * 3);
    const tree = new Float32Array(count * 3);
    const rnd = new Float32Array(count);

    const TREE_HEIGHT = 14;
    const TREE_RADIUS = 5;
    const SCATTER_RADIUS = 30; // Increased scatter radius for explosion effect

    for (let i = 0; i < count; i++) {
      // Tree position
      const tPos = getTreePoint(TREE_HEIGHT, TREE_RADIUS);
      tree[i * 3] = tPos.x;
      tree[i * 3 + 1] = tPos.y;
      tree[i * 3 + 2] = tPos.z;

      // Scatter position (Explosion towards camera)
      const sPos = getExplosionPoint(SCATTER_RADIUS);
      scat[i * 3] = sPos.x;
      scat[i * 3 + 1] = sPos.y;
      scat[i * 3 + 2] = sPos.z;

      // Random attributes
      rnd[i] = Math.random();
    }

    return [pos, scat, tree, rnd];
  }, [count]);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uTime = clock.getElapsedTime();
      // Directly assign the eased progress which includes overshoots
      materialRef.current.uProgress = easedProgress.current;
      materialRef.current.uPixelRatio = Math.min(window.devicePixelRatio, 2);
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aScatterPos"
          count={scatterPos.length / 3}
          array={scatterPos}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aTreePos"
          count={treePos.length / 3}
          array={treePos}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={randoms.length}
          array={randoms}
          itemSize={1}
        />
      </bufferGeometry>
      {/* @ts-ignore */}
      <foliageMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uColorCore={new THREE.Color(COLORS.EMERALD_DEEP)}
        uColorTip={new THREE.Color(COLORS.GOLD_METALLIC)}
      />
    </points>
  );
};