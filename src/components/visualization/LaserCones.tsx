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

      // ConeGeometry tip is at +Y (local), base at -Y.
      // We want the tip at the laser position (perimeter) and the base toward center.
      // So +Y (tip) should point AWAY from center.
      const directionFromCenter = new THREE.Vector3(x, 0, z).normalize();

      const quaternion = new THREE.Quaternion();
      const defaultAxis = new THREE.Vector3(0, 1, 0);
      quaternion.setFromUnitVectors(defaultAxis, directionFromCenter);
      const euler = new THREE.Euler().setFromQuaternion(quaternion);

      // Position so the tip (+height/2 along direction) lands at the laser pos.
      const adjustedPos = position.clone().add(
        directionFromCenter.clone().multiplyScalar(-height / 2)
      );

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
