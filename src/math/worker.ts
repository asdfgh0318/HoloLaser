/**
 * Web Worker for heavy computation (voxelization, mask computation, reconstruction).
 *
 * Runs off the main thread and communicates via postMessage.
 * Uses stub math implementations that will be replaced by the math team's real code.
 */

// ─── Message Types ──────────────────────────────────────────────────────────

type WorkerInput =
  | { type: 'voxelize'; vertices: Float32Array; indices: Uint32Array; gridSize: number }
  | { type: 'voxelize-shape'; shape: 'sphere' | 'cube' | 'torus'; gridSize: number }
  | { type: 'compute-masks'; voxelData: Float32Array; gridSize: number; laserCount: number }
  | { type: 'reconstruct'; masks: { data: Float32Array; width: number; height: number; angle: number }[]; gridSize: number };

type WorkerOutput =
  | { type: 'progress'; stage: string; percent: number }
  | { type: 'voxels'; data: Float32Array; size: number }
  | { type: 'masks'; masks: { data: Float32Array; width: number; height: number; laserIndex: number; angle: number }[] }
  | { type: 'reconstruction'; data: Float32Array; size: number; error: number }
  | { type: 'error'; message: string };

function send(msg: WorkerOutput, transfer?: Transferable[]): void {
  if (transfer) {
    self.postMessage(msg, { transfer });
  } else {
    self.postMessage(msg);
  }
}

// ─── Stub Math Implementations ──────────────────────────────────────────────
// These will be replaced when the math team's real voxelization and
// Radon transform code is merged.

/**
 * Stub: voxelize a mesh by marking voxels near triangle vertices.
 * The real implementation will do proper ray-casting or scanline voxelization.
 */
function stubVoxelizeMesh(
  vertices: Float32Array,
  _indices: Uint32Array,
  gridSize: number
): Float32Array {
  const total = gridSize * gridSize * gridSize;
  const data = new Float32Array(total);
  const halfGrid = gridSize / 2;

  for (let vi = 0; vi < vertices.length; vi += 3) {
    const gx = Math.floor((vertices[vi] + 1) * halfGrid);
    const gy = Math.floor((vertices[vi + 1] + 1) * halfGrid);
    const gz = Math.floor((vertices[vi + 2] + 1) * halfGrid);

    // Fill a small region around each vertex for visibility
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const x = gx + dx;
          const y = gy + dy;
          const z = gz + dz;
          if (x >= 0 && x < gridSize && y >= 0 && y < gridSize && z >= 0 && z < gridSize) {
            data[x + y * gridSize + z * gridSize * gridSize] = 1.0;
          }
        }
      }
    }

    if (vi % 3000 === 0) {
      send({ type: 'progress', stage: 'voxelizing', percent: (vi / vertices.length) * 100 });
    }
  }

  return data;
}

/**
 * Stub: create a voxel grid for a parametric shape.
 */
function stubVoxelizeShape(shape: 'sphere' | 'cube' | 'torus', gridSize: number): Float32Array {
  const total = gridSize * gridSize * gridSize;
  const data = new Float32Array(total);
  const half = gridSize / 2;

  for (let z = 0; z < gridSize; z++) {
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const nx = (x - half + 0.5) / half;
        const ny = (y - half + 0.5) / half;
        const nz = (z - half + 0.5) / half;

        let inside = false;

        if (shape === 'sphere') {
          inside = nx * nx + ny * ny + nz * nz <= 0.8 * 0.8;
        } else if (shape === 'cube') {
          inside = Math.abs(nx) <= 0.6 && Math.abs(ny) <= 0.6 && Math.abs(nz) <= 0.6;
        } else if (shape === 'torus') {
          const R = 0.5;
          const r = 0.2;
          const distXZ = Math.sqrt(nx * nx + nz * nz) - R;
          inside = distXZ * distXZ + ny * ny <= r * r;
        }

        if (inside) {
          data[x + y * gridSize + z * gridSize * gridSize] = 1.0;
        }
      }
    }

    send({ type: 'progress', stage: 'voxelizing', percent: ((z + 1) / gridSize) * 100 });
  }

  return data;
}

/**
 * Stub: compute 2D projection masks for each laser by collapsing the voxel
 * grid along the projection direction. Real implementation will use
 * the inverse Radon transform.
 */
function stubComputeMasks(
  voxelData: Float32Array,
  gridSize: number,
  laserCount: number
): { data: Float32Array; width: number; height: number; laserIndex: number; angle: number }[] {
  const masks: { data: Float32Array; width: number; height: number; laserIndex: number; angle: number }[] = [];
  const angleStep = (2 * Math.PI) / laserCount;

  for (let li = 0; li < laserCount; li++) {
    const angle = li * angleStep;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const maskData = new Float32Array(gridSize * gridSize);

    for (let v = 0; v < gridSize; v++) {
      for (let u = 0; u < gridSize; u++) {
        let sum = 0;
        for (let t = 0; t < gridSize; t++) {
          const x = Math.round(u * cosA - t * sinA + gridSize / 2 * (1 - cosA + sinA));
          const y = v;
          const z = Math.round(u * sinA + t * cosA + gridSize / 2 * (1 - sinA - cosA));

          if (x >= 0 && x < gridSize && y >= 0 && y < gridSize && z >= 0 && z < gridSize) {
            sum += voxelData[x + y * gridSize + z * gridSize * gridSize];
          }
        }
        maskData[u + v * gridSize] = sum / gridSize;
      }
    }

    masks.push({
      data: maskData,
      width: gridSize,
      height: gridSize,
      laserIndex: li,
      angle,
    });

    send({
      type: 'progress',
      stage: 'computing',
      percent: ((li + 1) / laserCount) * 100,
    });
  }

  return masks;
}

/**
 * Stub: reconstruct a voxel grid from projection masks via simple back-projection.
 * The real implementation will use filtered back-projection / iterative methods.
 */
function stubReconstruct(
  masks: { data: Float32Array; width: number; height: number; angle: number }[],
  gridSize: number
): { data: Float32Array; error: number } {
  const total = gridSize * gridSize * gridSize;
  const data = new Float32Array(total);

  for (let mi = 0; mi < masks.length; mi++) {
    const mask = masks[mi];
    const cosA = Math.cos(mask.angle);
    const sinA = Math.sin(mask.angle);

    for (let v = 0; v < gridSize; v++) {
      for (let u = 0; u < gridSize; u++) {
        const val = mask.data[u + v * mask.width];
        if (val <= 0) continue;

        for (let t = 0; t < gridSize; t++) {
          const x = Math.round(u * cosA - t * sinA + gridSize / 2 * (1 - cosA + sinA));
          const y = v;
          const z = Math.round(u * sinA + t * cosA + gridSize / 2 * (1 - sinA - cosA));

          if (x >= 0 && x < gridSize && y >= 0 && y < gridSize && z >= 0 && z < gridSize) {
            data[x + y * gridSize + z * gridSize * gridSize] += val;
          }
        }
      }
    }

    send({
      type: 'progress',
      stage: 'reconstructing',
      percent: ((mi + 1) / masks.length) * 100,
    });
  }

  // Normalize and threshold
  let maxVal = 0;
  for (let i = 0; i < total; i++) {
    if (data[i] > maxVal) maxVal = data[i];
  }
  if (maxVal > 0) {
    const threshold = maxVal * 0.5;
    for (let i = 0; i < total; i++) {
      data[i] = data[i] >= threshold ? 1.0 : 0.0;
    }
  }

  const error = 0.0;
  return { data, error };
}

// ─── Worker Message Handler ─────────────────────────────────────────────────

self.onmessage = (event: MessageEvent<WorkerInput>) => {
  const msg = event.data;

  try {
    switch (msg.type) {
      case 'voxelize': {
        send({ type: 'progress', stage: 'voxelizing', percent: 0 });
        const data = stubVoxelizeMesh(msg.vertices, msg.indices, msg.gridSize);
        send(
          { type: 'voxels', data, size: msg.gridSize },
          [data.buffer]
        );
        break;
      }

      case 'voxelize-shape': {
        send({ type: 'progress', stage: 'voxelizing', percent: 0 });
        const data = stubVoxelizeShape(msg.shape, msg.gridSize);
        send(
          { type: 'voxels', data, size: msg.gridSize },
          [data.buffer]
        );
        break;
      }

      case 'compute-masks': {
        send({ type: 'progress', stage: 'computing', percent: 0 });
        const masks = stubComputeMasks(msg.voxelData, msg.gridSize, msg.laserCount);
        send({ type: 'masks', masks });
        break;
      }

      case 'reconstruct': {
        send({ type: 'progress', stage: 'reconstructing', percent: 0 });
        const result = stubReconstruct(msg.masks, msg.gridSize);
        send(
          { type: 'reconstruction', data: result.data, size: msg.gridSize, error: result.error },
          [result.data.buffer]
        );
        break;
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    send({ type: 'error', message });
  }
};
