import { useMemo } from 'react';
import * as THREE from 'three';

interface StlPreviewProps {
  geometry: THREE.BufferGeometry | null;
}

export function StlPreview({ geometry }: StlPreviewProps) {
  const scaledGeometry = useMemo(() => {
    if (!geometry) return null;

    const cloned = geometry.clone();
    cloned.computeBoundingBox();

    const bbox = cloned.boundingBox;
    if (!bbox) return cloned;

    // Center the geometry
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    cloned.translate(-center.x, -center.y, -center.z);

    // Scale to fit within a unit cube (matching voxel grid bounds)
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scale = 1.0 / maxDim;
      cloned.scale(scale, scale, scale);
    }

    return cloned;
  }, [geometry]);

  if (!scaledGeometry) {
    return null;
  }

  return (
    <lineSegments aria-label="STL model wireframe preview">
      <wireframeGeometry args={[scaledGeometry]} />
      <lineBasicMaterial color="#94a3b8" transparent opacity={0.3} />
    </lineSegments>
  );
}
