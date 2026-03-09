/**
 * Geometry utility functions for mesh processing and laser configuration.
 */

/**
 * Axis-aligned bounding box with min and max corners.
 */
export interface BoundingBox {
  min: [number, number, number];
  max: [number, number, number];
}

/**
 * Compute the axis-aligned bounding box of a flat vertex array.
 * @param vertices Flat array [x1,y1,z1, x2,y2,z2, ...]
 */
export function computeBoundingBox(vertices: Float32Array): BoundingBox {
  if (vertices.length === 0 || vertices.length % 3 !== 0) {
    return { min: [0, 0, 0], max: [0, 0, 0] };
  }

  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i];
    const y = vertices[i + 1];
    const z = vertices[i + 2];

    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }

  return {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
  };
}

/**
 * Normalize a flat vertex array so the mesh fits within [-1, 1]^3, centered at the origin.
 * Applies uniform scaling to preserve aspect ratio.
 * @param vertices Flat array [x1,y1,z1, x2,y2,z2, ...]
 * @returns New Float32Array with normalized vertices
 */
export function normalizeVertices(vertices: Float32Array): Float32Array {
  if (vertices.length === 0) {
    return new Float32Array(0);
  }

  const bbox = computeBoundingBox(vertices);
  const [minX, minY, minZ] = bbox.min;
  const [maxX, maxY, maxZ] = bbox.max;

  // Center of the bounding box
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cz = (minZ + maxZ) / 2;

  // Find the largest extent so we scale uniformly
  const extentX = maxX - minX;
  const extentY = maxY - minY;
  const extentZ = maxZ - minZ;
  const maxExtent = Math.max(extentX, extentY, extentZ);

  // Avoid division by zero for degenerate meshes
  const scale = maxExtent > 0 ? 2 / maxExtent : 1;

  const result = new Float32Array(vertices.length);
  for (let i = 0; i < vertices.length; i += 3) {
    result[i] = (vertices[i] - cx) * scale;
    result[i + 1] = (vertices[i + 1] - cy) * scale;
    result[i + 2] = (vertices[i + 2] - cz) * scale;
  }

  return result;
}

/**
 * Generate equally spaced angles around a circle in [0, 2*PI).
 * These correspond to laser positions on the XZ plane.
 * @param count Number of angles to generate
 * @returns Array of angles in radians
 */
export function generateAngles(count: number): number[] {
  if (count <= 0) return [];
  const angles: number[] = [];
  const step = (2 * Math.PI) / count;
  for (let i = 0; i < count; i++) {
    angles.push(i * step);
  }
  return angles;
}
