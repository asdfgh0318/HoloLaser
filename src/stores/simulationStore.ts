import { create } from 'zustand';
import type { SimulationParams, SimulationResult, SimulationStatus } from '../types';

interface SimulationState {
  params: SimulationParams;
  status: SimulationStatus;
  result: SimulationResult | null;
  stlFile: File | null;
  setParams: (params: Partial<SimulationParams>) => void;
  setStatus: (status: SimulationStatus) => void;
  setResult: (result: SimulationResult | null) => void;
  setStlFile: (file: File | null) => void;
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
  result: null,
  stlFile: null,
  setParams: (params) =>
    set((state) => ({ params: { ...state.params, ...params } })),
  setStatus: (status) => set({ status }),
  setResult: (result) => set({ result }),
  setStlFile: (file) => set({ stlFile: file }),
  reset: () => set({ params: defaultParams, status: 'idle', result: null, stlFile: null }),
}));
