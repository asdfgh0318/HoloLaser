import { useMemo } from 'react';
import * as THREE from 'three';
import type { ProjectionMask } from '../../types';

interface MaskDisplayProps {
  masks: ProjectionMask[];
  radius: number;
}

interface MaskPlaneData {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  texture: THREE.DataTexture;
}

function createMaskTexture(mask: ProjectionMask): THREE.DataTexture {
  const { data, width, height } = mask;
  const rgba = new Uint8Array(width * height * 4);

  for (let i = 0; i < width * height; i++) {
    const value = Math.min(255, Math.max(0, Math.round(data[i] * 255)));
    rgba[i * 4] = value;
    rgba[i * 4 + 1] = value;
    rgba[i * 4 + 2] = value;
    rgba[i * 4 + 3] = 255;
  }

  const texture = new THREE.DataTexture(rgba, width, height, THREE.RGBAFormat);
  texture.needsUpdate = true;
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;

  return texture;
}

export function MaskDisplay({ masks, radius }: MaskDisplayProps) {
  const planes = useMemo<MaskPlaneData[]>(() => {
    if (!masks || masks.length === 0) return [];

    const displayRadius = radius + 0.3;

    return masks.map((mask) => {
      const angle = mask.angle;
      const x = Math.cos(angle) * displayRadius;
      const z = Math.sin(angle) * displayRadius;

      const position = new THREE.Vector3(x, 0, z);

      // Face outward from center: rotate around Y so the plane normal points away
      const rotation = new THREE.Euler(0, -angle + Math.PI / 2, 0);

      const texture = createMaskTexture(mask);

      return { position, rotation, texture };
    });
  }, [masks, radius]);

  if (!masks || masks.length === 0) {
    return null;
  }

  return (
    <group aria-label="Projection masks">
      {planes.map((plane, i) => (
        <mesh
          key={i}
          position={plane.position}
          rotation={plane.rotation}
        >
          <planeGeometry args={[0.4, 0.4]} />
          <meshBasicMaterial
            map={plane.texture}
            side={THREE.DoubleSide}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}
