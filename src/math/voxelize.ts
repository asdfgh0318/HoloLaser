/**
 * Voxelization utilities.
 *
 * Converts triangle meshes and analytic shapes into NxNxN binary voxel grids.
 * Indexing convention: data[x + z * size + y * size * size]
 * Coordinate system: right-handed, Y-up. Grid maps to [-1, 1]^3.
 */

import type { VoxelGrid } from '../types';

// ─── Mesh voxelization ──────────────────────────────────────────────

/**
 * Voxelize a triangle mesh using ray casting along the X axis.
 *
 * The mesh is first normalized so its bounding box fits inside [-1, 1]^3
 * (with a small margin). For every (y, z) cell we cast a ray along +X,
 * find intersections with all triangles, sort them, and fill voxels
 * between consecutive pairs (even/odd parity rule).
 */
export function voxelizeMesh(
  vertices: Float32Array,
  indices: Uint32Array,
  gridSize: number,
): VoxelGrid {
  const resolution = 2 / gridSize;
  const data = new Float32Array(gridSize * gridSize * gridSize);

  // ---- Normalize mesh to [-0.95, 0.95]^3 ----
  const verts = normalizeVertices(vertices);
  const triCount = indices.length / 3;

  // Precompute triangle data
  const triangles: Triangle[] = [];
  for (let t = 0; t < triCount; t++) {
    const i0 = indices[t * 3] * 3;
    const i1 = indices[t * 3 + 1] * 3;
    const i2 = indices[t * 3 + 2] * 3;
    triangles.push({
      v0: [verts[i0], verts[i0 + 1], verts[i0 + 2]],
      v1: [verts[i1], verts[i1 + 1], verts[i1 + 2]],
      v2: [verts[i2], verts[i2 + 1], verts[i2 + 2]],
    });
  }

  // ---- Ray casting along X for each (y, z) cell ----
  for (let iy = 0; iy < gridSize; iy++) {
    const y = -1 + (iy + 0.5) * resolution;
    for (let iz = 0; iz < gridSize; iz++) {
      const z = -1 + (iz + 0.5) * resolution;

      // Collect X-intersections of the ray (origin=(−2,y,z), dir=(1,0,0))
      const hits: number[] = [];
      for (const tri of triangles) {
        const t = rayTriangleIntersectX(y, z, tri);
        if (t !== null) {
          hits.push(t);
        }
      }

      if (hits.length < 2) continue;
      hits.sort((a, b) => a - b);

      // Fill voxels between consecutive hit pairs (parity rule)
      for (let h = 0; h + 1 < hits.length; h += 2) {
        const xStart = hits[h];
        const xEnd = hits[h + 1];
        for (let ix = 0; ix < gridSize; ix++) {
          const x = -1 + (ix + 0.5) * resolution;
          if (x >= xStart && x <= xEnd) {
            data[ix + iz * gridSize + iy * gridSize * gridSize] = 1;
          }
        }
      }
    }
  }

  return { data, size: gridSize, resolution };
}

interface Triangle {
  v0: [number, number, number];
  v1: [number, number, number];
  v2: [number, number, number];
}

/**
 * Ray-triangle intersection for a ray along +X through (y, z).
 * Returns the X coordinate of the hit or null.
 */
function rayTriangleIntersectX(
  ry: number,
  rz: number,
  tri: Triangle,
): number | null {
  const [ax, ay, az] = tri.v0;
  const [bx, by, bz] = tri.v1;
  const [cx, cy, cz] = tri.v2;

  // Solve for barycentric coordinates in the YZ plane
  const dy1 = by - ay;
  const dz1 = bz - az;
  const dy2 = cy - ay;
  const dz2 = cz - az;

  const det = dy1 * dz2 - dy2 * dz1;
  if (Math.abs(det) < 1e-12) return null;

  const invDet = 1 / det;
  const dy = ry - ay;
  const dz = rz - az;

  const u = (dy * dz2 - dz * dy2) * invDet;
  if (u < 0 || u > 1) return null;

  const v = (dz * dy1 - dy * dz1) * invDet;
  if (v < 0 || u + v > 1) return null;

  // Compute X at the intersection
  return ax + u * (bx - ax) + v * (cx - ax);
}

/**
 * Copy and normalize vertex positions so the bounding box fits in [-0.95, 0.95]^3.
 */
function normalizeVertices(vertices: Float32Array): Float32Array {
  const out = new Float32Array(vertices.length);
  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;

  const vCount = vertices.length / 3;
  for (let i = 0; i < vCount; i++) {
    const x = vertices[i * 3];
    const y = vertices[i * 3 + 1];
    const z = vertices[i * 3 + 2];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cz = (minZ + maxZ) / 2;
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const rangeZ = maxZ - minZ || 1;
  const scale = 0.95 * 2 / Math.max(rangeX, rangeY, rangeZ);

  for (let i = 0; i < vCount; i++) {
    out[i * 3] = (vertices[i * 3] - cx) * scale;
    out[i * 3 + 1] = (vertices[i * 3 + 1] - cy) * scale;
    out[i * 3 + 2] = (vertices[i * 3 + 2] - cz) * scale;
  }

  return out;
}

// ─── Built-in shapes ────────────────────────────────────────────────

/**
 * Create a voxelized sphere centered at the origin.
 * @param gridSize  Grid dimension N (NxNxN)
 * @param radius    Radius in normalized coords (default 0.8, fits in [-1,1])
 */
export function voxelizeSphere(
  gridSize: number,
  radius: number = 0.8,
): VoxelGrid {
  const resolution = 2 / gridSize;
  const data = new Float32Array(gridSize * gridSize * gridSize);
  const r2 = radius * radius;

  for (let iy = 0; iy < gridSize; iy++) {
    const y = -1 + (iy + 0.5) * resolution;
    for (let iz = 0; iz < gridSize; iz++) {
      const z = -1 + (iz + 0.5) * resolution;
      for (let ix = 0; ix < gridSize; ix++) {
        const x = -1 + (ix + 0.5) * resolution;
        if (x * x + y * y + z * z <= r2) {
          data[ix + iz * gridSize + iy * gridSize * gridSize] = 1;
        }
      }
    }
  }

  return { data, size: gridSize, resolution };
}

/**
 * Create a voxelized axis-aligned cube centered at the origin.
 * @param gridSize  Grid dimension N (NxNxN)
 * @param size      Half-size of the cube (default 0.6)
 */
export function voxelizeCube(
  gridSize: number,
  size: number = 0.6,
): VoxelGrid {
  const resolution = 2 / gridSize;
  const data = new Float32Array(gridSize * gridSize * gridSize);

  for (let iy = 0; iy < gridSize; iy++) {
    const y = -1 + (iy + 0.5) * resolution;
    for (let iz = 0; iz < gridSize; iz++) {
      const z = -1 + (iz + 0.5) * resolution;
      for (let ix = 0; ix < gridSize; ix++) {
        const x = -1 + (ix + 0.5) * resolution;
        if (
          Math.abs(x) <= size &&
          Math.abs(y) <= size &&
          Math.abs(z) <= size
        ) {
          data[ix + iz * gridSize + iy * gridSize * gridSize] = 1;
        }
      }
    }
  }

  return { data, size: gridSize, resolution };
}

/**
 * Create a voxelized torus centered at the origin, lying in the XZ plane.
 * @param gridSize  Grid dimension N
 * @param R         Major radius (default 0.5)
 * @param r         Minor radius (default 0.2)
 */
export function voxelizeTorus(
  gridSize: number,
  R: number = 0.5,
  r: number = 0.2,
): VoxelGrid {
  const resolution = 2 / gridSize;
  const data = new Float32Array(gridSize * gridSize * gridSize);

  for (let iy = 0; iy < gridSize; iy++) {
    const y = -1 + (iy + 0.5) * resolution;
    for (let iz = 0; iz < gridSize; iz++) {
      const z = -1 + (iz + 0.5) * resolution;
      for (let ix = 0; ix < gridSize; ix++) {
        const x = -1 + (ix + 0.5) * resolution;
        // Torus equation: (sqrt(x^2 + z^2) - R)^2 + y^2 <= r^2
        const distXZ = Math.sqrt(x * x + z * z);
        const d = (distXZ - R) * (distXZ - R) + y * y;
        if (d <= r * r) {
          data[ix + iz * gridSize + iy * gridSize * gridSize] = 1;
        }
      }
    }
  }

  return { data, size: gridSize, resolution };
}
