/**
 * Custom React hook that orchestrates the full simulation pipeline:
 * load STL -> voxelize -> compute masks -> reconstruct.
 *
 * Creates and manages a Web Worker for heavy computation, updating
 * the Zustand store with progress, results, and errors.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useSimulationStore } from '../stores/simulationStore.ts';
import { parseSTL } from '../utils/stlParser.ts';
import type { ProjectionMask, VoxelGrid } from '../types/index.ts';

/** Message types sent by the worker back to the main thread. */
interface WorkerProgressMsg {
  type: 'progress';
  stage: string;
  percent: number;
}

interface WorkerVoxelsMsg {
  type: 'voxels';
  data: Float32Array;
  size: number;
}

interface WorkerMasksMsg {
  type: 'masks';
  masks: {
    data: Float32Array;
    width: number;
    height: number;
    laserIndex: number;
    angle: number;
  }[];
}

interface WorkerReconstructionMsg {
  type: 'reconstruction';
  data: Float32Array;
  size: number;
  error: number;
}

interface WorkerErrorMsg {
  type: 'error';
  message: string;
}

type WorkerMessage =
  | WorkerProgressMsg
  | WorkerVoxelsMsg
  | WorkerMasksMsg
  | WorkerReconstructionMsg
  | WorkerErrorMsg;

type ShapeType = 'sphere' | 'cube' | 'torus';

export interface UseSimulationReturn {
  /** Load and voxelize an STL file */
  loadSTL: (file: File) => Promise<void>;
  /** Generate and voxelize a parametric shape */
  loadShape: (shape: ShapeType) => void;
  /** Compute projection masks from the current voxel data */
  computeMasks: () => void;
  /** Reconstruct voxels from the current masks */
  reconstruct: () => void;
  /** Reset all state back to idle */
  reset: () => void;
}

export function useSimulation(): UseSimulationReturn {
  const workerRef = useRef<Worker | null>(null);
  const store = useSimulationStore;

  // Create worker on mount, terminate on unmount
  useEffect(() => {
    const worker = new Worker(
      new URL('../math/worker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const msg = event.data;

      switch (msg.type) {
        case 'progress': {
          store.getState().setProgress(msg.percent);

          // Map worker stage names to SimulationStatus
          if (msg.stage === 'voxelizing') {
            store.getState().setStatus('voxelizing');
          } else if (msg.stage === 'computing' || msg.stage === 'reconstructing') {
            store.getState().setStatus('computing');
          }
          break;
        }

        case 'voxels': {
          const voxelGrid: VoxelGrid = {
            data: msg.data,
            size: msg.size,
            resolution: 2 / msg.size, // grid spans [-1,1], so voxel size = 2/N
          };
          store.getState().setVoxelData(voxelGrid);
          store.getState().setStatus('done');
          store.getState().setProgress(100);
          break;
        }

        case 'masks': {
          const projectionMasks: ProjectionMask[] = msg.masks.map((m) => ({
            data: m.data,
            width: m.width,
            height: m.height,
            laserIndex: m.laserIndex,
            angle: m.angle,
          }));
          store.getState().setMasks(projectionMasks);
          store.getState().setStatus('done');
          store.getState().setProgress(100);
          break;
        }

        case 'reconstruction': {
          const state = store.getState();
          const targetVoxels = state.voxelData;
          const masks = state.masks;

          if (targetVoxels && masks) {
            state.setResult({
              targetVoxels,
              reconstructedVoxels: {
                data: msg.data,
                size: msg.size,
                resolution: 2 / msg.size,
              },
              masks,
              error: msg.error,
            });
          }

          state.setStatus('done');
          state.setProgress(100);
          break;
        }

        case 'error': {
          store.getState().setStatus('error');
          store.getState().setErrorMessage(msg.message);
          break;
        }
      }
    };

    worker.onerror = (err: ErrorEvent) => {
      store.getState().setStatus('error');
      store.getState().setErrorMessage(err.message || 'Worker error');
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [store]);

  const loadSTL = useCallback(async (file: File): Promise<void> => {
    const worker = workerRef.current;
    if (!worker) return;

    const state = store.getState();
    state.setStatus('loading');
    state.setProgress(0);
    state.setErrorMessage(null);
    state.setStlFile(file);

    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseSTL(buffer);

      state.setStatus('voxelizing');

      const { gridSize } = state.params;

      worker.postMessage(
        {
          type: 'voxelize',
          vertices: parsed.vertices,
          indices: parsed.indices,
          gridSize,
        },
        [parsed.vertices.buffer, parsed.indices.buffer]
      );
    } catch (err: unknown) {
      state.setStatus('error');
      state.setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  }, [store]);

  const loadShape = useCallback((shape: ShapeType): void => {
    const worker = workerRef.current;
    if (!worker) return;

    const state = store.getState();
    state.setStatus('voxelizing');
    state.setProgress(0);
    state.setErrorMessage(null);
    state.setStlFile(null);

    worker.postMessage({
      type: 'voxelize-shape',
      shape,
      gridSize: state.params.gridSize,
    });
  }, [store]);

  const computeMasks = useCallback((): void => {
    const worker = workerRef.current;
    if (!worker) return;

    const state = store.getState();
    const voxelData = state.voxelData;
    if (!voxelData) {
      state.setStatus('error');
      state.setErrorMessage('No voxel data available. Load a model or shape first.');
      return;
    }

    state.setStatus('computing');
    state.setProgress(0);
    state.setErrorMessage(null);

    // Send a copy of voxel data since buffers may have been transferred
    const dataCopy = new Float32Array(voxelData.data);
    worker.postMessage({
      type: 'compute-masks',
      voxelData: dataCopy,
      gridSize: voxelData.size,
      laserCount: state.params.laserCount,
    }, [dataCopy.buffer]);
  }, [store]);

  const reconstruct = useCallback((): void => {
    const worker = workerRef.current;
    if (!worker) return;

    const state = store.getState();
    const masks = state.masks;
    if (!masks || masks.length === 0) {
      state.setStatus('error');
      state.setErrorMessage('No masks available. Compute masks first.');
      return;
    }

    state.setStatus('computing');
    state.setProgress(0);
    state.setErrorMessage(null);

    worker.postMessage({
      type: 'reconstruct',
      masks: masks.map((m) => ({
        data: m.data,
        width: m.width,
        height: m.height,
        angle: m.angle,
      })),
      gridSize: state.voxelData?.size ?? state.params.gridSize,
    });
  }, [store]);

  const reset = useCallback((): void => {
    store.getState().reset();
  }, [store]);

  return {
    loadSTL,
    loadShape,
    computeMasks,
    reconstruct,
    reset,
  };
}
