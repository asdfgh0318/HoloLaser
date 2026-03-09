import { create } from 'zustand';
import type { SimulationParams, SimulationResult, SimulationStatus, ProjectionMask, VoxelGrid } from '../types';

interface SimulationState {
  params: SimulationParams;
  status: SimulationStatus;
  progress: number; // 0-100 percent for current stage
  result: SimulationResult | null;
  stlFile: File | null;
  errorMessage: string | null;
  voxelData: VoxelGrid | null;
  masks: ProjectionMask[] | null;
  setParams: (params: Partial<SimulationParams>) => void;
  setStatus: (status: SimulationStatus) => void;
  setProgress: (progress: number) => void;
  setResult: (result: SimulationResult | null) => void;
  setStlFile: (file: File | null) => void;
  setErrorMessage: (message: string | null) => void;
  setVoxelData: (voxelData: VoxelGrid | null) => void;
  setMasks: (masks: ProjectionMask[] | null) => void;
  reset: () => void;
}

const defaultParams: SimulationParams = {
  gridSize: 64,
  laserCount: 8,
  circleRadius: 1.5,
  coneHalfAngle: Math.PI / 6,
  iterations: 20,
};

export const useSimulationStore = create<SimulationState>((set) => ({
  params: defaultParams,
  status: 'idle',
  progress: 0,
  result: null,
  stlFile: null,
  errorMessage: null,
  voxelData: null,
  masks: null,
  setParams: (params) =>
    set((state) => ({ params: { ...state.params, ...params } })),
  setStatus: (status) => set({ status }),
  setProgress: (progress) => set({ progress }),
  setResult: (result) => set({ result }),
  setStlFile: (file) => set({ stlFile: file }),
  setErrorMessage: (message) => set({ errorMessage: message }),
  setVoxelData: (voxelData) => set({ voxelData }),
  setMasks: (masks) => set({ masks }),
  reset: () => set({
    params: defaultParams,
    status: 'idle',
    progress: 0,
    result: null,
    stlFile: null,
    errorMessage: null,
    voxelData: null,
    masks: null,
  }),
}));
