import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DualPosition, COLORS } from '../types';
import { getRandomSpherePoint, getTreePoint, getSurfaceTreePoint, getExplosionPoint } from '../utils/math';

export type OrnamentType = 'bauble' | 'gift' | 'light' | 'ribbon' | 'star' | 'candyCane';

interface OrnamentsProps {
  type: OrnamentType;
  data?: DualPosition[];
  count?: number; 
  easedProgress: React.MutableRefObject<number>;
  velocityRef: React.MutableRefObject<number>;
  variant?: 'body' | 'decoration' | 'default'; 
}

export const generateOrnamentData = (count: number, type: OrnamentType): DualPosition[] => {
  const items: DualPosition[] = [];
  const TREE_HEIGHT = 14;
  const TREE_RADIUS = 5;
  const SCATTER_RADIUS = 25;

  for (let i = 0; i < count; i++) {
    let tPos = new THREE.Vector3();
    let scale = 1;
    let color = new THREE.Color();
    let rotation = new THREE.Vector3();

    if (type === 'gift') {
      const r = Math.random() * 4;
      const angle = Math.random() * Math.PI * 2;
      tPos.set(r * Math.cos(angle), -7 + Math.random() * 2, r * Math.sin(angle));
      scale = 0.4 + Math.random() * 0.4;
      
      const roll = Math.random();
      if (roll > 0.66) color.set(COLORS.RED_VELVET);
      else if (roll > 0.33) color.set(COLORS.GOLD_METALLIC);
      else color.set(COLORS.EMERALD_DEEP); 

    } else if (type === 'bauble') {
      tPos = getTreePoint(TREE_HEIGHT - 2, TREE_RADIUS - 0.5);
      tPos.y += 1;
      scale = 0.2 + Math.random() * 0.2;
      const roll = Math.random();
      if (roll > 0.6) color.set(COLORS.RED_VELVET);
      else if (roll > 0.3) color.set(COLORS.GOLD_BRIGHT);
      else color.set(COLORS.SILVER_MIST);

    } else if (type === 'candyCane') {
      tPos = getSurfaceTreePoint(TREE_HEIGHT - 1, TREE_RADIUS);
      tPos.y += 0.5;
      scale = 0.6; 
      color.set(COLORS.CANDY_WHITE);
      
      const dummy = new THREE.Object3D();
      dummy.position.copy(tPos);
      dummy.lookAt(0, tPos.y, 0);
      
      const tiltX = (Math.random() - 0.5) * 1.5;
      const tiltZ = (Math.random() - 0.5) * 0.5;
      
      rotation.set(tiltX, dummy.rotation.y, tiltZ);

    } else if (type === 'ribbon') {
      // Surface placement for Bows
      tPos = getSurfaceTreePoint(TREE_HEIGHT - 2, TREE_RADIUS);
      tPos.multiplyScalar(1.05); // Push slightly out
      
      scale = 0.8 + Math.random() * 0.4;
      color.set(COLORS.RIBBON_RED);
      
      // Calculate rotation to face outward
      const dummy = new THREE.Object3D();
      dummy.position.copy(tPos);
      dummy.lookAt(0, tPos.y, 0); 
      dummy.rotateY(Math.PI);

      // Add a little random wiggle
      const wiggleZ = (Math.random() - 0.5) * 0.3;
      dummy.rotateZ(wiggleZ);

      rotation.copy(dummy.rotation);
      rotation.order = 'XYZ'; 

    } else if (type === 'star') {
      // Tree Pos: Top of tree
      tPos.set(0, (TREE_HEIGHT / 2) + 0.5, 0);
      scale = 1.8;
      color.set(COLORS.GOLD_BRIGHT);
      rotation.set(0, 0, 0); 
    } else {
      tPos = getTreePoint(TREE_HEIGHT, TREE_RADIUS);
      scale = 0.08;
      color.set(COLORS.WHITE_GLOW);
    }

    // Determine Scatter Position
    let sPos: THREE.Vector3;
    if (type === 'star') {
      // STAR LOGIC:
      // Start at Center of tree (0,0,0) so it can rise up from within
      sPos = new THREE.Vector3(0, 0, 0);
    } else {
      // For everything else, explode towards camera
      sPos = getExplosionPoint(SCATTER_RADIUS);
    }

    items.push({
      scatterPos: sPos,
      treePos: tPos,
      rotation: rotation,
      scale,
      color,
      speed: 0.5 + Math.random(),
      phase: Math.random() * Math.PI * 2
    });
  }
  return items;
};

export const Ornaments: React.FC<OrnamentsProps> = ({ count = 0, type, data, easedProgress, velocityRef, variant = 'default' }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  
  // Store cumulative rotation for each instance to allow physics-based spin
  const rotationOffsets = useMemo(() => new Float32Array((data?.length || count) * 3), [count, data]);

  const items = useMemo(() => {
    return data || generateOrnamentData(count, type);
  }, [count, type, data]);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    items.forEach((item, i) => {
      let finalColor = item.color;
      
      if (type === 'candyCane' && variant === 'decoration') {
        finalColor = new THREE.Color(COLORS.RED_VELVET);
      }
      if (type === 'candyCane' && variant === 'body') {
        finalColor = new THREE.Color(0xffffff);
      }

      meshRef.current!.setColorAt(i, finalColor);
    });
    meshRef.current.instanceColor!.needsUpdate = true;
  }, [items, type, variant]);

  useFrame(({ clock }, delta) => {
    if (!meshRef.current) return;
    
    const time = clock.getElapsedTime();
    const t = easedProgress.current;
    
    // Physics Rotation Logic:
    // When velocity is high (explosion), spin fast. 
    // When velocity is low (settled), float gently.
    const velocity = velocityRef.current;
    
    // If it's the star, strict logic. If other items, physics logic.
    const isStar = type === 'star';

    items.forEach((item, i) => {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      // --- POSITION ---
      let currentPos = new THREE.Vector3().lerpVectors(item.scatterPos, item.treePos, t);
      
      // STAR RISING LOGIC
      // If t is > 0.8 (nearly assembled), interpolate form (0,0,0) to Top.
      // If t is < 0.8, keep it at (0,0,0) (hidden inside)
      if (isStar) {
        if (t < 0.7) {
            // Hidden in center or scatter position
            currentPos.set(0, 0, 0);
            // Maybe scale it down? handled in scale section
        } else {
            // Smoothly rise: Map t 0.7->1.0 to 0->1
            const riseT = THREE.MathUtils.smoothstep(t, 0.7, 1.0);
            // Rise from 0 to target Y
            const y = THREE.MathUtils.lerp(0, item.treePos.y, riseT);
            currentPos.set(0, y, 0);
        }
      }

      // Floating Effect (only when settled or scattering, not during tight tree formation)
      // We dampen float when t -> 1 to keep tree sharp? 
      // User asked for "Initial state: breathing/floating". So we keep float at t=1.
      const floatAmp = 0.5; 
      const yOffset = Math.sin(time * item.speed + item.phase) * floatAmp;
      
      if (!isStar) {
         currentPos.y += yOffset;
      } else if (t > 0.99) {
         // Star hovers only when fully set
         currentPos.y += Math.sin(time * 2) * 0.1;
      }
      
      tempObject.position.copy(currentPos);
      
      // --- ROTATION ---
      
      // Update cumulative rotation based on velocity
      // Spin Factor: High during explosion
      const spinFactor = 15.0; 
      const baseFloatSpeed = 0.5;
      
      if (!isStar) {
          rotationOffsets[ix] += (baseFloatSpeed + velocity * spinFactor) * delta;
          rotationOffsets[iy] += (baseFloatSpeed + velocity * spinFactor) * delta;
          rotationOffsets[iz] += (baseFloatSpeed * 0.5 + velocity * spinFactor * 0.5) * delta;
          
          // Apply rotation: Start with target tree rotation, add offset
          // But when scattered, we want chaotic rotation.
          // When tree (t=1), we want specific item.rotation.
          // So we mix:
          
          const chaosRotX = rotationOffsets[ix];
          const chaosRotY = rotationOffsets[iy];
          const chaosRotZ = rotationOffsets[iz];
          
          // Mix factor: at t=0 (scatter), use pure chaos. At t=1, use item.rotation.
          // BUT user wants "Simulate rotation after explosion until normal floating".
          // This implies chaos persists in scattered state.
          // And "Assembling" implies aligning back.
          
          // We assume 'item.rotation' is the correct orientation for the Tree.
          // We treat rotationOffsets as the 'deviation'.
          // As t -> 1, deviation should fade to 0? Or just be ignored?
          // If we ignore it, the spin stops instantly.
          // Better: Dampen the offset contribution as t->1.
          
          const alignStrength = Math.pow(t, 4); // Strong pull to alignment only at very end
          
          tempObject.rotation.x = THREE.MathUtils.lerp(chaosRotX, item.rotation.x, alignStrength);
          tempObject.rotation.y = THREE.MathUtils.lerp(chaosRotY, item.rotation.y, alignStrength);
          tempObject.rotation.z = THREE.MathUtils.lerp(chaosRotZ, item.rotation.z, alignStrength);
      } else {
          // Star Rotation
          if (t > 0.8) {
              tempObject.rotation.y += delta * 0.5; // Slow spin when visible
              tempObject.rotation.x = 0;
              tempObject.rotation.z = 0;
          } else {
              tempObject.rotation.set(0,0,0);
          }
      }

      // --- SCALE ---
      let s = item.scale;
      if (isStar) {
          // Scale up as it rises
          s = item.scale * THREE.MathUtils.smoothstep(t, 0.7, 0.9);
      }
      
      tempObject.scale.setScalar(s);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const geometry = useMemo(() => {
    if (type === 'gift') return new THREE.BoxGeometry(1, 1, 1);
    if (type === 'bauble') return new THREE.SphereGeometry(1, 32, 32);
    if (type === 'light') return new THREE.DodecahedronGeometry(1, 0);
    
    if (type === 'ribbon') {
      const points = [
        new THREE.Vector3(-0.4, -1.2, 0.1),  // Tail Left Bottom
        new THREE.Vector3(-0.15, -0.2, 0.05), // Tail Left Top
        new THREE.Vector3(0, 0, 0),          // Knot
        new THREE.Vector3(-0.4, 0.3, -0.05), // Left Loop Top
        new THREE.Vector3(-0.45, -0.2, 0),    // Left Loop Bottom
        new THREE.Vector3(0, 0, 0),          // Knot
        new THREE.Vector3(0.45, -0.2, 0),     // Right Loop Bottom
        new THREE.Vector3(0.4, 0.3, -0.05),  // Right Loop Top
        new THREE.Vector3(0, 0, 0),          // Knot
        new THREE.Vector3(0.15, -0.2, 0.05),  // Tail Right Top
        new THREE.Vector3(0.4, -1.2, 0.1)    // Tail Right Bottom
      ];

      const curve = new THREE.CatmullRomCurve3(points);
      curve.tension = 0.5;

      const shape = new THREE.Shape();
      const w = 0.15;
      const th = 0.02;
      shape.moveTo(-w/2, -th/2);
      shape.lineTo(w/2, -th/2);
      shape.lineTo(w/2, th/2);
      shape.lineTo(-w/2, th/2);

      return new THREE.ExtrudeGeometry(shape, {
        extrudePath: curve,
        steps: 64,
        bevelEnabled: false
      });
    }
    
    const createBowGeometry = () => {
        const bowShape = new THREE.Shape();
        bowShape.moveTo(0,0);
        bowShape.bezierCurveTo(0.5, 0.5, 0.5, -0.5, 0, 0);
        bowShape.bezierCurveTo(-0.5, -0.5, -0.5, 0.5, 0, 0);
        const geo = new THREE.ExtrudeGeometry(bowShape, { depth: 0.2, bevelEnabled: false });
        geo.center();
        return geo;
    };

    if (type === 'candyCane') {
      if (variant === 'decoration') {
        const geo = createBowGeometry();
        geo.translate(0, 0.3, 0.1);
        geo.scale(0.8, 0.8, 0.8);
        geo.rotateX(-0.2);
        return geo;
      }

      const path = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -1, 0),
        new THREE.Vector3(0, 0.5, 0),
        new THREE.Vector3(0.3, 0.8, 0),
        new THREE.Vector3(0.5, 0.5, 0)
      ]);
      const geo = new THREE.TubeGeometry(path, 32, 0.12, 8, false);
      
      const count = geo.attributes.position.count;
      const colors = new Float32Array(count * 3);
      const c1 = new THREE.Color(COLORS.CANDY_RED);
      const c2 = new THREE.Color(COLORS.CANDY_WHITE);

      for (let i = 0; i < count; i++) {
        const ringIndex = Math.floor(i / 9); 
        const stripe = ringIndex % 2 === 0;
        if (stripe) {
          colors[i*3] = c1.r; colors[i*3+1] = c1.g; colors[i*3+2] = c1.b;
        } else {
          colors[i*3] = c2.r; colors[i*3+1] = c2.g; colors[i*3+2] = c2.b;
        }
      }
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      return geo;
    }

    if (type === 'star') {
        const starShape = new THREE.Shape();
        const points = 5;
        const outerRadius = 1;
        const innerRadius = 0.45;
        for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? outerRadius : innerRadius;
            const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2; 
            const x = Math.cos(a) * r;
            const y = Math.sin(a) * r;
            if (i === 0) starShape.moveTo(x, y);
            else starShape.lineTo(x, y);
        }
        const geo = new THREE.ExtrudeGeometry(starShape, { 
            depth: 0.3, 
            bevelEnabled: true, 
            bevelThickness: 0.1, 
            bevelSize: 0.05, 
            bevelSegments: 2 
        });
        geo.center();
        return geo;
    }
    return new THREE.BoxGeometry();
  }, [type, variant]);

  const material = useMemo(() => {
    if (type === 'light' || type === 'star') {
        return <meshStandardMaterial 
            toneMapped={false} 
            emissive={type === 'star' ? COLORS.GOLD_BRIGHT : COLORS.WHITE_GLOW}
            emissiveIntensity={type === 'star' ? 2 : 4}
            color={type === 'star' ? COLORS.GOLD_METALLIC : COLORS.WHITE_GLOW}
        />;
    }
    if (type === 'candyCane' && variant === 'body') {
      return <meshStandardMaterial 
        vertexColors 
        roughness={0.2} 
        metalness={0.3} 
      />;
    }
    if (type === 'ribbon') {
      return <meshStandardMaterial 
        color={COLORS.RIBBON_RED}
        roughness={0.5} 
        metalness={0.1}
        side={THREE.DoubleSide}
      />;
    }
    return <meshStandardMaterial 
        roughness={0.2} 
        metalness={0.8} 
        envMapIntensity={1.5} 
    />;
  }, [type, variant]);

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, items.length]} frustumCulled={false}>
      {material}
    </instancedMesh>
  );
};