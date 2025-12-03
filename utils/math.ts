import { Vector3, MathUtils } from 'three';

// Helper to get a point on a sphere surface (randomly distributed)
export const getRandomSpherePoint = (radius: number): Vector3 => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);
  return new Vector3(x, y, z);
};

// Helper to get a point biased towards the camera (Z+) to simulate explosion out of screen
export const getExplosionPoint = (radius: number): Vector3 => {
  // Camera is roughly at Z=35.
  // We want points to scatter towards Z=10 to Z=50 (past camera)
  // X and Y should spread out to fill screen.
  
  const spreadXY = radius * 1.5;
  const x = (Math.random() - 0.5) * 2 * spreadXY;
  const y = (Math.random() - 0.5) * 2 * spreadXY;
  
  // Z bias: mostly positive
  // Random range from 5 to 45
  const z = 5 + Math.random() * 40;
  
  return new Vector3(x, y, z);
};

// Helper to get a point in a cone volume (The Tree)
// Height 15, Radius bottom 6
export const getTreePoint = (height: number, maxRadius: number, verticalBias: number = 0.5): Vector3 => {
  const y = Math.random() * height; // 0 to height
  const normalizedY = y / height;
  
  // Tree tapers as it goes up. Radius at y.
  // Using a power curve for vertical bias to put more leaves at bottom or top if needed
  const rAtY = maxRadius * (1 - normalizedY);
  
  // Random point within circle at height y
  const angle = Math.random() * Math.PI * 2;
  const rRandom = Math.sqrt(Math.random()) * rAtY; // Sqrt for uniform distribution in circle
  
  const x = rRandom * Math.cos(angle);
  const z = rRandom * Math.sin(angle);
  
  return new Vector3(x, y - height / 2, z); // Center y vertically
};

// Helper to get a point near the surface of the tree (for Wreaths etc)
export const getSurfaceTreePoint = (height: number, maxRadius: number): Vector3 => {
  const y = Math.random() * height;
  const normalizedY = y / height;
  const rAtY = maxRadius * (1 - normalizedY);
  
  // Surface means r is close to rAtY. 
  // We keep it slightly inside (0.85-1.0) so it nests in the foliage
  const r = rAtY * (0.85 + Math.random() * 0.15); 
  
  const angle = Math.random() * Math.PI * 2;
  const x = r * Math.cos(angle);
  const z = r * Math.sin(angle);
  
  return new Vector3(x, y - height / 2, z);
};

// Generate spiral points for better "styled" tree look for ornaments
export const getSpiralTreePoint = (t: number, height: number, maxRadius: number, offset: number): Vector3 => {
  const y = t * height - (height / 2);
  const r = maxRadius * (1 - t);
  const angle = t * 20 + offset; // Spiral
  const x = r * Math.cos(angle);
  const z = r * Math.sin(angle);
  // Add some jitter
  return new Vector3(
    x + (Math.random() - 0.5), 
    y, 
    z + (Math.random() - 0.5)
  );
};

export const pickRandom = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

export const easeInOutBack = (x: number): number => {
  const c1 = 1.70158;
  const c2 = c1 * 1.525;
  return x < 0.5
    ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
    : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
};

export const easeInOutCubic = (x: number): number => {
  return x < 0.5 ? 4.0 * x * x * x : 1.0 - Math.pow(-2.0 * x + 2.0, 3.0) / 2.0;
};