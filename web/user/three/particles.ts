"use client";

import * as THREE from "three";

export interface ParticleGridParams {
  separation: number;
  amountX: number;
  amountY: number;
  color: [number, number, number]; // RGB 0-255
}

export interface ParticleGrid {
  geometry: THREE.BufferGeometry;
  material: THREE.PointsMaterial;
  points: THREE.Points;
  step: (count: number) => void;
}

export function createParticleGrid(params: ParticleGridParams): ParticleGrid {
  const { separation, amountX, amountY, color } = params;
  const positions: number[] = [];
  const colors: number[] = [];

  for (let ix = 0; ix < amountX; ix++) {
    for (let iy = 0; iy < amountY; iy++) {
      const x = ix * separation - (amountX * separation) / 2;
      const y = 0;
      const z = iy * separation - (amountY * separation) / 2;
      positions.push(x, y, z);
      colors.push(...color);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 8,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geometry, material);

  const step = (count: number) => {
    const arr = geometry.attributes.position.array as Float32Array;
    let i = 0;
    for (let ix = 0; ix < amountX; ix++) {
      for (let iy = 0; iy < amountY; iy++) {
        arr[i * 3 + 1] =
          Math.sin((ix + count) * 0.3) * 50 + Math.sin((iy + count) * 0.5) * 50;
        i++;
      }
    }
    geometry.attributes.position.needsUpdate = true;
  };

  return { geometry, material, points, step };
}
