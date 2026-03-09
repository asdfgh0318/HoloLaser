export interface VoxelGrid {
  data: Float32Array;
  size: number; // N for NxNxN grid
  resolution: number; // physical size of each voxel
}

export interface LaserConfig {
  count: number; // number of lasers
  radius: number; // radius of the circle on which lasers are placed
  coneAngle: number; // half-angle of the cone in radians
  position: [number, number, number]; // position in world space
  direction: [number, number, number]; // direction vector toward center
}

export interface ProjectionMask {
  data: Float32Array; // 2D mask (width x height)
  width: number;
  height: number;
  laserIndex: number;
  angle: number; // angle of this laser around the circle (radians)
}

export interface SimulationParams {
  gridSize: number; // N for NxNxN voxel grid
  laserCount: number; // number of lasers
  circleRadius: number; // radius of laser circle
  coneHalfAngle: number; // cone half-angle in radians
  iterations: number; // for iterative reconstruction
}

export interface SimulationResult {
  targetVoxels: VoxelGrid;
  reconstructedVoxels: VoxelGrid;
  masks: ProjectionMask[];
  error: number; // reconstruction error metric
}

export type SimulationStatus = 'idle' | 'loading' | 'voxelizing' | 'computing' | 'done' | 'error';
