/**
 * Full 3D reconstruction pipeline.
 *
 * Decomposes the 3D problem into horizontal 2D slices (y = constant).
 * For each slice, the forward Radon transform produces the laser masks,
 * and filtered back-projection simulates what volume the lasers produce.
 *
 * Indexing: voxel data[x + z*size + y*size*size]
 * Mask: data stored as width (= projection bins) x height (= y slices),
 *       indexed as data[t + iy * width]
 */

import type { VoxelGrid, ProjectionMask } from '../types';
import { radonTransform, filteredBackProjection } from './radon';

/**
 * Compute the 2D projection masks for each laser.
 *
 * For each horizontal slice (y = const) we extract the 2D cross-section,
 * compute the forward Radon transform at N equally-spaced angles, and
 * assemble the resulting 1D projections into 2D masks (one per laser).
 *
 * @param target      The target voxel grid to project
 * @param laserCount  Number of lasers (= number of projection angles)
 * @returns           Array of ProjectionMask, one per laser
 */
export function computeMasks(
  target: VoxelGrid,
  laserCount: number,
): ProjectionMask[] {
  const { size } = target;

  // Equally spaced angles in [0, pi)
  const angles: number[] = [];
  for (let i = 0; i < laserCount; i++) {
    angles.push((i * Math.PI) / laserCount);
  }

  // Initialize masks: one per laser, width = size (projection bins), height = size (y slices)
  const masks: ProjectionMask[] = angles.map((angle, idx) => ({
    data: new Float32Array(size * size),
    width: size,
    height: size,
    laserIndex: idx,
    angle,
  }));

  // Process each horizontal slice
  for (let iy = 0; iy < size; iy++) {
    // Extract 2D slice at this y level: slice[x + z*size]
    const slice = extractSlice(target, iy);

    // Forward Radon transform: one 1D projection per angle
    const projections = radonTransform(slice, size, angles);

    // Store each projection as a row in the corresponding mask
    for (let li = 0; li < laserCount; li++) {
      const mask = masks[li];
      const proj = projections[li];
      for (let t = 0; t < size; t++) {
        mask.data[t + iy * size] = proj[t];
      }
    }
  }

  return masks;
}

/**
 * Reconstruct a voxel volume from projection masks using filtered back-projection.
 *
 * For each horizontal slice, extract the corresponding row from each mask,
 * apply FBP, and store the result in the output voxel grid.
 *
 * @param masks     Array of ProjectionMask (one per laser)
 * @param gridSize  Output grid dimension N
 * @returns         Reconstructed voxel grid
 */
export function reconstructVolume(
  masks: ProjectionMask[],
  gridSize: number,
): VoxelGrid {
  const resolution = 2 / gridSize;
  const data = new Float32Array(gridSize * gridSize * gridSize);

  const laserCount = masks.length;
  const angles = masks.map((m) => m.angle);

  // Process each horizontal slice
  for (let iy = 0; iy < gridSize; iy++) {
    // Extract 1D projections from each mask at height iy
    const projections: Float32Array[] = [];
    for (let li = 0; li < laserCount; li++) {
      const mask = masks[li];
      const proj = new Float32Array(gridSize);
      for (let t = 0; t < gridSize; t++) {
        proj[t] = mask.data[t + iy * mask.width];
      }
      projections.push(proj);
    }

    // Filtered back-projection
    const reconstructed = filteredBackProjection(projections, gridSize, angles);

    // Store into 3D volume
    for (let iz = 0; iz < gridSize; iz++) {
      for (let ix = 0; ix < gridSize; ix++) {
        data[ix + iz * gridSize + iy * gridSize * gridSize] =
          reconstructed[ix + iz * gridSize];
      }
    }
  }

  return { data, size: gridSize, resolution };
}

/**
 * Compute the normalized mean squared error between target and reconstructed volumes.
 *
 * The reconstructed volume is first thresholded (values > 0.5 of max become 1,
 * rest become 0) before comparison, so we compare binary volumes.
 *
 * @returns NMSE in [0, 1], where 0 = perfect reconstruction
 */
export function computeError(
  target: VoxelGrid,
  reconstructed: VoxelGrid,
): number {
  const n = target.data.length;
  if (n !== reconstructed.data.length) {
    throw new Error('Grids must have the same size');
  }

  // Find max value in reconstructed for thresholding
  let maxVal = 0;
  for (let i = 0; i < n; i++) {
    if (reconstructed.data[i] > maxVal) {
      maxVal = reconstructed.data[i];
    }
  }

  if (maxVal === 0) {
    // If reconstruction is all zeros, error depends on target
    let targetSum = 0;
    for (let i = 0; i < n; i++) targetSum += target.data[i];
    return targetSum > 0 ? 1 : 0;
  }

  const threshold = maxVal * 0.5;
  let sumSqDiff = 0;
  let sumSqTarget = 0;

  for (let i = 0; i < n; i++) {
    const tgt = target.data[i] > 0.5 ? 1 : 0;
    const rec = reconstructed.data[i] > threshold ? 1 : 0;
    const diff = tgt - rec;
    sumSqDiff += diff * diff;
    sumSqTarget += tgt * tgt;
  }

  if (sumSqTarget === 0) return 0;
  return sumSqDiff / sumSqTarget;
}

/**
 * Extract a 2D horizontal slice from the voxel grid at index iy.
 * Returns Float32Array of length size*size, indexed as [x + z*size].
 */
function extractSlice(grid: VoxelGrid, iy: number): Float32Array {
  const { size, data } = grid;
  const slice = new Float32Array(size * size);
  const offset = iy * size * size;

  for (let iz = 0; iz < size; iz++) {
    for (let ix = 0; ix < size; ix++) {
      slice[ix + iz * size] = data[offset + ix + iz * size];
    }
  }

  return slice;
}
