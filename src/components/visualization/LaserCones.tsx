import { useMemo } from 'react';
import * as THREE from 'three';

interface LaserConesProps {
  count: number;
  radius: number;
  coneAngle: number;
  height?: number;
}

interface ConeData {
  position: THREE.Vector3;
  rotation: THREE.Euler;
}

export function LaserCones({ count, radius, coneAngle, height = 1.5 }: LaserConesProps) {
  const cones = useMemo<ConeData[]>(() => {
    const result: ConeData[] = [];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const position = new THREE.Vector3(x, 0, z);

      // The cone geometry points along +Y by default with tip at top.
      // We need to rotate it so the tip is at the laser position
      // and the base points toward center (0,0,0).
      const directionToCenter = new THREE.Vector3(-x, 0, -z).normalize();

      // Build a quaternion that rotates from default cone axis (+Y) to our desired direction
      const quaternion = new THREE.Quaternion();
      const defaultAxis = new THREE.Vector3(0, 1, 0);
      quaternion.setFromUnitVectors(defaultAxis, directionToCenter);
      const euler = new THREE.Euler().setFromQuaternion(quaternion);

      // Offset position: move tip to laser pos, cone extends toward center
      // The cone geometry center is at origin, tip is at +height/2
      // After rotation, we need the tip at (x, 0, z) so shift by half height along direction
      const tipOffset = directionToCenter.clone().multiplyScalar(-height / 2);
      const adjustedPos = position.clone().add(tipOffset);

      result.push({
        position: adjustedPos,
        rotation: euler,
      });
    }

    return result;
  }, [count, radius, coneAngle, height]);

  const coneRadius = Math.tan(coneAngle) * height;

  return (
    <group aria-label="Laser cones">
      {cones.map((cone, i) => (
        <mesh
          key={i}
          position={cone.position}
          rotation={cone.rotation}
        >
          <coneGeometry args={[coneRadius, height, 16, 1, true]} />
          <meshStandardMaterial
            color="#06b6d4"
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
