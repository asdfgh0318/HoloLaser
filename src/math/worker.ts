/**
 * Web Worker for heavy computation (voxelization, mask computation, reconstruction).
 *
 * Runs off the main thread and communicates via postMessage.
 * Uses the real math engine from src/math/.
 */

import { voxelizeMesh, voxelizeSphere, voxelizeCube, voxelizeTorus } from './voxelize';
import { computeMasks, reconstructVolume, computeError } from './reconstruct';
import type { VoxelGrid } from '../types';

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

// ─── Worker Message Handler ─────────────────────────────────────────────────

self.onmessage = (event: MessageEvent<WorkerInput>) => {
  const msg = event.data;

  try {
    switch (msg.type) {
      case 'voxelize': {
        send({ type: 'progress', stage: 'voxelizing', percent: 0 });
        const grid = voxelizeMesh(msg.vertices, msg.indices, msg.gridSize);
        send({ type: 'progress', stage: 'voxelizing', percent: 100 });
        send(
          { type: 'voxels', data: grid.data, size: grid.size },
          [grid.data.buffer]
        );
        break;
      }

      case 'voxelize-shape': {
        send({ type: 'progress', stage: 'voxelizing', percent: 0 });
        let grid: VoxelGrid;
        if (msg.shape === 'sphere') {
          grid = voxelizeSphere(msg.gridSize);
        } else if (msg.shape === 'cube') {
          grid = voxelizeCube(msg.gridSize);
        } else {
          grid = voxelizeTorus(msg.gridSize);
        }
        send({ type: 'progress', stage: 'voxelizing', percent: 100 });
        send(
          { type: 'voxels', data: grid.data, size: grid.size },
          [grid.data.buffer]
        );
        break;
      }

      case 'compute-masks': {
        send({ type: 'progress', stage: 'computing', percent: 0 });

        const targetGrid: VoxelGrid = {
          data: msg.voxelData,
          size: msg.gridSize,
          resolution: 2 / msg.gridSize,
        };

        // Compute projection masks using the real Radon transform
        const masks = computeMasks(targetGrid, msg.laserCount);

        send({ type: 'progress', stage: 'computing', percent: 50 });

        // Immediately reconstruct to show result quality
        const reconstructed = reconstructVolume(masks, msg.gridSize);
        const error = computeError(targetGrid, reconstructed);

        send({ type: 'progress', stage: 'computing', percent: 90 });

        // Normalize reconstruction for display (threshold at 50% of max)
        let maxVal = 0;
        for (let i = 0; i < reconstructed.data.length; i++) {
          if (reconstructed.data[i] > maxVal) maxVal = reconstructed.data[i];
        }
        if (maxVal > 0) {
          const threshold = maxVal * 0.5;
          for (let i = 0; i < reconstructed.data.length; i++) {
            reconstructed.data[i] = reconstructed.data[i] >= threshold ? 1.0 : 0.0;
          }
        }

        // Send masks
        send({
          type: 'masks',
          masks: masks.map((m) => ({
            data: m.data,
            width: m.width,
            height: m.height,
            laserIndex: m.laserIndex,
            angle: m.angle,
          })),
        });

        // Send reconstruction
        send(
          {
            type: 'reconstruction',
            data: reconstructed.data,
            size: reconstructed.size,
            error,
          },
          [reconstructed.data.buffer]
        );
        break;
      }

      case 'reconstruct': {
        send({ type: 'progress', stage: 'reconstructing', percent: 0 });
        const reconstructed = reconstructVolume(
          msg.masks.map((m, i) => ({
            data: m.data,
            width: m.width,
            height: m.height,
            laserIndex: i,
            angle: m.angle,
          })),
          msg.gridSize,
        );

        // Normalize for display
        let maxVal = 0;
        for (let i = 0; i < reconstructed.data.length; i++) {
          if (reconstructed.data[i] > maxVal) maxVal = reconstructed.data[i];
        }
        if (maxVal > 0) {
          const threshold = maxVal * 0.5;
          for (let i = 0; i < reconstructed.data.length; i++) {
            reconstructed.data[i] = reconstructed.data[i] >= threshold ? 1.0 : 0.0;
          }
        }

        send(
          { type: 'reconstruction', data: reconstructed.data, size: msg.gridSize, error: 0 },
          [reconstructed.data.buffer]
        );
        break;
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    send({ type: 'error', message });
  }
};
