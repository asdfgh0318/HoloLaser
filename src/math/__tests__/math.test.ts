import { describe, it, expect } from 'vitest';
import { fft, ifft, nextPow2 } from '../fft';
import {
  voxelizeSphere,
  voxelizeCube,
  voxelizeTorus,
} from '../voxelize';
import { radonTransform, filteredBackProjection } from '../radon';
import { computeMasks, reconstructVolume, computeError } from '../reconstruct';

// ─── FFT Tests ──────────────────────────────────────────────────────

describe('FFT', () => {
  it('should transform a DC signal correctly', () => {
    const n = 8;
    const re = new Float64Array(n).fill(1);
    const im = new Float64Array(n).fill(0);

    fft(re, im);

    // DC component should be n, all other bins should be ~0
    expect(re[0]).toBeCloseTo(n, 5);
    for (let i = 1; i < n; i++) {
      expect(re[i]).toBeCloseTo(0, 5);
      expect(im[i]).toBeCloseTo(0, 5);
    }
  });

  it('should transform a single cosine correctly', () => {
    const n = 16;
    const re = new Float64Array(n);
    const im = new Float64Array(n).fill(0);

    // cos(2*pi*k/n) for k = 1
    for (let i = 0; i < n; i++) {
      re[i] = Math.cos((2 * Math.PI * i) / n);
    }

    fft(re, im);

    // Expect peaks at bin 1 and bin n-1 (value n/2 each)
    expect(re[1]).toBeCloseTo(n / 2, 5);
    expect(re[n - 1]).toBeCloseTo(n / 2, 5);
    // All other bins should be ~0
    for (let i = 2; i < n - 1; i++) {
      expect(Math.abs(re[i])).toBeLessThan(1e-10);
      expect(Math.abs(im[i])).toBeLessThan(1e-10);
    }
  });

  it('should roundtrip FFT -> IFFT', () => {
    const n = 32;
    const original = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      original[i] = Math.sin((2 * Math.PI * 3 * i) / n) + 0.5 * Math.cos((2 * Math.PI * 7 * i) / n);
    }

    const re = Float64Array.from(original);
    const im = new Float64Array(n).fill(0);

    fft(re, im);
    ifft(re, im);

    for (let i = 0; i < n; i++) {
      expect(re[i]).toBeCloseTo(original[i], 8);
      expect(im[i]).toBeCloseTo(0, 8);
    }
  });

  it('should throw for non-power-of-2 length', () => {
    const re = new Float64Array(6);
    const im = new Float64Array(6);
    expect(() => fft(re, im)).toThrow();
  });

  it('nextPow2 returns correct values', () => {
    expect(nextPow2(1)).toBe(1);
    expect(nextPow2(2)).toBe(2);
    expect(nextPow2(3)).toBe(4);
    expect(nextPow2(5)).toBe(8);
    expect(nextPow2(64)).toBe(64);
    expect(nextPow2(65)).toBe(128);
  });
});

// ─── Voxelization Tests ─────────────────────────────────────────────

describe('Voxelization', () => {
  describe('voxelizeSphere', () => {
    it('should fill the center voxel', () => {
      const grid = voxelizeSphere(16);
      const mid = 8; // center index for size=16
      // data[x + z*size + y*size*size]
      const idx = mid + mid * 16 + mid * 16 * 16;
      expect(grid.data[idx]).toBe(1);
    });

    it('should leave corners empty', () => {
      const grid = voxelizeSphere(16, 0.8);
      // Corner (0, 0, 0) corresponds to position (-1+0.5/8, ...) = near (-1,-1,-1)
      const idx = 0 + 0 * 16 + 0 * 16 * 16;
      expect(grid.data[idx]).toBe(0);

      // Corner (15, 15, 15)
      const idx2 = 15 + 15 * 16 + 15 * 16 * 16;
      expect(grid.data[idx2]).toBe(0);
    });

    it('should be roughly spherically symmetric', () => {
      const N = 16;
      const grid = voxelizeSphere(N, 0.5);
      const step = 2 / N;

      // Count filled voxels and compare with analytic sphere volume
      let filled = 0;
      for (let i = 0; i < grid.data.length; i++) {
        if (grid.data[i] > 0.5) filled++;
      }

      // Analytic volume = (4/3) * pi * r^3, in voxel units = volume / voxelVolume
      const r = 0.5;
      const analyticVoxels = ((4 / 3) * Math.PI * r * r * r) / (step * step * step);
      // Allow 15% error due to discretization
      expect(filled).toBeGreaterThan(analyticVoxels * 0.85);
      expect(filled).toBeLessThan(analyticVoxels * 1.15);
    });
  });

  describe('voxelizeCube', () => {
    it('should fill all interior voxels', () => {
      const N = 16;
      const halfSize = 0.5;
      const grid = voxelizeCube(N, halfSize);
      const step = 2 / N;

      let allInteriorFilled = true;
      for (let iy = 0; iy < N; iy++) {
        const y = -1 + (iy + 0.5) * step;
        for (let iz = 0; iz < N; iz++) {
          const z = -1 + (iz + 0.5) * step;
          for (let ix = 0; ix < N; ix++) {
            const x = -1 + (ix + 0.5) * step;
            const idx = ix + iz * N + iy * N * N;
            const inside =
              Math.abs(x) <= halfSize &&
              Math.abs(y) <= halfSize &&
              Math.abs(z) <= halfSize;
            if (inside && grid.data[idx] !== 1) {
              allInteriorFilled = false;
            }
          }
        }
      }

      expect(allInteriorFilled).toBe(true);
    });

    it('should leave exterior voxels empty', () => {
      const N = 16;
      const grid = voxelizeCube(N, 0.3);

      // Corner voxel is well outside
      expect(grid.data[0]).toBe(0);
    });
  });

  describe('voxelizeTorus', () => {
    it('should have a hole in the center', () => {
      const N = 32;
      const grid = voxelizeTorus(N, 0.5, 0.15);
      const mid = N / 2;
      // Center of torus (0, 0, 0) should be empty (hole)
      const idx = mid + mid * N + mid * N * N;
      expect(grid.data[idx]).toBe(0);
    });

    it('should be filled at the major radius', () => {
      const N = 32;
      const R = 0.5;
      const r = 0.15;
      const grid = voxelizeTorus(N, R, r);
      const step = 2 / N;

      // Point on the torus ring at (R, 0, 0) should be filled
      const ix = Math.floor((R + 1) / step);
      const iy = N / 2; // y = 0
      const iz = N / 2; // z = 0
      const idx = ix + iz * N + iy * N * N;
      expect(grid.data[idx]).toBe(1);
    });
  });
});

// ─── Radon Transform Tests ──────────────────────────────────────────

describe('Radon Transform', () => {
  it('forward Radon of a centered disk should give roughly uniform projections', () => {
    const N = 32;
    const step = 2 / N;

    // Create a centered disk in 2D (radius 0.4)
    const slice = new Float32Array(N * N);
    const r2 = 0.4 * 0.4;
    for (let iz = 0; iz < N; iz++) {
      const z = -1 + (iz + 0.5) * step;
      for (let ix = 0; ix < N; ix++) {
        const x = -1 + (ix + 0.5) * step;
        if (x * x + z * z <= r2) {
          slice[ix + iz * N] = 1;
        }
      }
    }

    const angles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4];
    const projections = radonTransform(slice, N, angles);

    // All projections should have similar profiles (rotational symmetry)
    // Compare sum of each projection - they should be roughly equal
    const sums = projections.map((p) => {
      let s = 0;
      for (let i = 0; i < p.length; i++) s += p[i];
      return s;
    });

    const avgSum = sums.reduce((a, b) => a + b, 0) / sums.length;
    for (const s of sums) {
      // Allow 10% deviation due to discretization
      expect(Math.abs(s - avgSum) / avgSum).toBeLessThan(0.1);
    }
  });

  it('projection of an empty slice should be all zeros', () => {
    const N = 16;
    const slice = new Float32Array(N * N);
    const angles = [0, Math.PI / 2];
    const projections = radonTransform(slice, N, angles);

    for (const proj of projections) {
      for (let i = 0; i < proj.length; i++) {
        expect(proj[i]).toBe(0);
      }
    }
  });

  it('FBP should roughly reconstruct a centered disk', () => {
    const N = 32;
    const step = 2 / N;

    // Create centered disk
    const slice = new Float32Array(N * N);
    const r = 0.3;
    for (let iz = 0; iz < N; iz++) {
      const z = -1 + (iz + 0.5) * step;
      for (let ix = 0; ix < N; ix++) {
        const x = -1 + (ix + 0.5) * step;
        if (x * x + z * z <= r * r) {
          slice[ix + iz * N] = 1;
        }
      }
    }

    // Forward Radon with many angles for better reconstruction
    const numAngles = 32;
    const angles: number[] = [];
    for (let i = 0; i < numAngles; i++) {
      angles.push((i * Math.PI) / numAngles);
    }

    const projections = radonTransform(slice, N, angles);
    const reconstructed = filteredBackProjection(projections, N, angles);

    // The reconstruction should have high values inside the disk
    // and low values outside
    const mid = N / 2;
    const centerVal = reconstructed[mid + mid * N];
    expect(centerVal).toBeGreaterThan(0);

    // Corner should be near zero or negative (outside disk)
    const cornerVal = reconstructed[0];
    expect(Math.abs(cornerVal)).toBeLessThan(Math.abs(centerVal));
  });
});

// ─── Reconstruction Pipeline Tests ──────────────────────────────────

describe('Reconstruction Pipeline', () => {
  it('should produce masks with correct dimensions', () => {
    const grid = voxelizeSphere(16, 0.5);
    const masks = computeMasks(grid, 8);

    expect(masks.length).toBe(8);
    for (const mask of masks) {
      expect(mask.width).toBe(16);
      expect(mask.height).toBe(16);
      expect(mask.data.length).toBe(16 * 16);
    }
  });

  it('masks should have correct laser angles', () => {
    const grid = voxelizeSphere(8, 0.5);
    const masks = computeMasks(grid, 4);

    expect(masks[0].angle).toBeCloseTo(0);
    expect(masks[1].angle).toBeCloseTo(Math.PI / 4);
    expect(masks[2].angle).toBeCloseTo(Math.PI / 2);
    expect(masks[3].angle).toBeCloseTo((3 * Math.PI) / 4);
  });

  it('masks of a sphere should be non-zero', () => {
    const grid = voxelizeSphere(16, 0.5);
    const masks = computeMasks(grid, 8);

    for (const mask of masks) {
      let sum = 0;
      for (let i = 0; i < mask.data.length; i++) sum += mask.data[i];
      expect(sum).toBeGreaterThan(0);
    }
  });

  it('roundtrip: target -> masks -> reconstruct should have bounded error', () => {
    const gridSize = 16;
    const target = voxelizeSphere(gridSize, 0.5);
    const laserCount = 16;

    const masks = computeMasks(target, laserCount);
    const reconstructed = reconstructVolume(masks, gridSize);
    const error = computeError(target, reconstructed);

    // With 16 projections and size 16, error should be reasonable
    // The FBP reconstruction won't be perfect but should be < 1.0
    expect(error).toBeLessThan(1.0);
    expect(error).toBeGreaterThanOrEqual(0);
  });

  it('computeError should be 0 for identical grids', () => {
    const grid = voxelizeSphere(8, 0.5);
    const error = computeError(grid, grid);
    expect(error).toBe(0);
  });

  it('computeError should be > 0 for different grids', () => {
    const sphere = voxelizeSphere(8, 0.5);
    const cube = voxelizeCube(8, 0.3);
    const error = computeError(sphere, cube);
    expect(error).toBeGreaterThan(0);
  });

  it('reconstructed volume should have correct grid properties', () => {
    const gridSize = 8;
    const target = voxelizeSphere(gridSize, 0.5);
    const masks = computeMasks(target, 4);
    const reconstructed = reconstructVolume(masks, gridSize);

    expect(reconstructed.size).toBe(gridSize);
    expect(reconstructed.data.length).toBe(gridSize ** 3);
    expect(reconstructed.resolution).toBeCloseTo(2 / gridSize);
  });
});
