import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS } from '../types';

interface WrappingRibbonProps {
  easedProgress: React.MutableRefObject<number>;
}

export const WrappingRibbon: React.FC<WrappingRibbonProps> = ({ easedProgress }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Generate a spiral curve
  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const TURNS = 3.5; // Reduced turns
    const HEIGHT = 14;
    const RADIUS_BASE = 6.0; // Slightly outside the tree

    // Generate points from bottom to top
    // Higher density for smoother curve
    for (let i = 0; i <= 200; i++) {
      const t = i / 200; // 0 to 1
      const angle = t * Math.PI * 2 * TURNS;
      const y = -HEIGHT / 2 + t * HEIGHT; 
      const r = RADIUS_BASE * (1 - t) + 0.5; // Taper with height

      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      points.push(new THREE.Vector3(x, y, z));
    }

    const curve = new THREE.CatmullRomCurve3(points);

    // Create a flat ribbon shape
    const shape = new THREE.Shape();
    const w = 0.15; // Thinner width
    const th = 0.02;
    shape.moveTo(-w/2, -th/2);
    shape.lineTo(w/2, -th/2);
    shape.lineTo(w/2, th/2);
    shape.lineTo(-w/2, th/2);

    return new THREE.ExtrudeGeometry(shape, {
      extrudePath: curve,
      steps: 400,
      bevelEnabled: false,
    });
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();

    // Use eased progress directly. 
    // It can overshoot < 0 or > 1.
    const t = easedProgress.current;

    // FLY IN EFFECT:
    // Scattered: 
    // - Scale is relatively large
    // - Position Z is VERY CLOSE to camera (Z ~ 35-40), creating a "through the screen" feel.
    // - Y is lifted up.
    
    // Camera is at Z=35.
    // We want the ribbon to fly past or near the camera.
    const scatterScale = 4.0;
    const scatterY = 10.0;
    const scatterZ = 25.0; // Close to camera

    const treeScale = 1.0;
    const treeY = 0;
    const treeZ = 0;

    // Clamp t for linear interpolation if we don't want overshoot on position/scale specifically,
    // or let it overshoot for dramatic effect. Let's let it overshoot slightly but clamp extreme values
    // to prevent it hitting the camera near clip plane.
    const safeT = t; 

    const scale = THREE.MathUtils.lerp(scatterScale, treeScale, safeT);
    meshRef.current.scale.setScalar(scale);

    meshRef.current.position.y = THREE.MathUtils.lerp(scatterY, treeY, safeT);
    meshRef.current.position.z = THREE.MathUtils.lerp(scatterZ, treeZ, safeT);

    // Rotation: Spin as it comes in
    // Fast spin when scattered/flying in, precise orientation when landed
    const rotationOffset = (1 - safeT) * Math.PI * 2; 
    meshRef.current.rotation.y = rotationOffset + (time * 0.05);

  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial 
        color={COLORS.RIBBON_RED}
        roughness={0.4}
        metalness={0.3}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};