import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { VoxelGrid } from '../../types';

interface VoxelCloudProps {
  voxels: VoxelGrid | null;
  color?: string;
  opacity?: number;
}

export function VoxelCloud({ voxels, color = '#06b6d4', opacity = 0.8 }: VoxelCloudProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const activeVoxels = useMemo(() => {
    if (!voxels) return [];

    const result: { position: [number, number, number]; value: number }[] = [];
    const { data, size } = voxels;
    const halfSize = size / 2;

    for (let z = 0; z < size; z++) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const index = z * size * size + y * size + x;
          const value = data[index];
          if (value > 0.5) {
            result.push({
              position: [
                (x - halfSize + 0.5) * voxels.resolution,
                (y - halfSize + 0.5) * voxels.resolution,
                (z - halfSize + 0.5) * voxels.resolution,
              ],
              value,
            });
          }
        }
      }
    }

    return result;
  }, [voxels]);

  const baseColor = useMemo(() => new THREE.Color(color), [color]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || activeVoxels.length === 0) return;

    const matrix = new THREE.Matrix4();
    const instanceColor = new THREE.Color();

    activeVoxels.forEach((voxel, i) => {
      const [x, y, z] = voxel.position;
      matrix.setPosition(x, y, z);
      mesh.setMatrixAt(i, matrix);

      instanceColor.copy(baseColor);
      instanceColor.lerp(new THREE.Color('#ffffff'), (voxel.value - 0.5) * 0.4);
      mesh.setColorAt(i, instanceColor);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [activeVoxels, baseColor]);

  if (!voxels || activeVoxels.length === 0) {
    return null;
  }

  const voxelSize = voxels.resolution * 0.9;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, activeVoxels.length]}
      frustumCulled={false}
    >
      <boxGeometry args={[voxelSize, voxelSize, voxelSize]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={opacity}
        roughness={0.6}
        metalness={0.1}
      />
    </instancedMesh>
  );
}
