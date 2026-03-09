/**
 * Forward and inverse 2D Radon transform.
 *
 * The Radon transform converts a 2D image slice into a set of 1D
 * projections (sinogram). The filtered back-projection (FBP)
 * algorithm reconstructs the 2D image from its projections.
 *
 * Conventions:
 * - 2D slices are stored as flat Float32Array of length size*size,
 *   indexed as slice[x + z * size] (x = column, z = row).
 * - Coordinates map to [-1, 1]^2.
 * - Angles are in radians.
 */

import { fft, ifft, nextPow2 } from './fft';

/**
 * Compute the forward Radon transform (parallel-beam projections)
 * of a 2D slice at the given angles.
 *
 * For each angle theta the projection p(t) is the line integral:
 *   p(theta, t) = integral of f(x, z) along lines
 *                 x*cos(theta) + z*sin(theta) = t
 *
 * @param slice   Flat 2D array, size*size, indexed [x + z*size]
 * @param size    Side length N of the slice
 * @param angles  Array of projection angles (radians)
 * @returns       Array of 1D projections, one Float32Array(size) per angle
 */
export function radonTransform(
  slice: Float32Array,
  size: number,
  angles: number[],
): Float32Array[] {
  const projections: Float32Array[] = [];
  const step = 2 / size; // voxel width in normalized coords

  for (const theta of angles) {
    const proj = new Float32Array(size);
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    for (let iz = 0; iz < size; iz++) {
      const z = -1 + (iz + 0.5) * step;
      for (let ix = 0; ix < size; ix++) {
        const x = -1 + (ix + 0.5) * step;
        const val = slice[ix + iz * size];
        if (val === 0) continue;

        // Compute the projection coordinate t = x*cos + z*sin
        const t = x * cosT + z * sinT;

        // Map t from [-sqrt(2), sqrt(2)] to bin index
        // We use the range [-1, 1] for the projection bins (matching the grid)
        // but the actual range of t is [-sqrt(2), sqrt(2)].
        // We scale the bins to cover [-sqrt(2), sqrt(2)].
        const tMax = Math.SQRT2;
        const bin = ((t + tMax) / (2 * tMax)) * size;
        const binIdx = Math.floor(bin);

        if (binIdx >= 0 && binIdx < size) {
          proj[binIdx] += val * step;
        }
      }
    }

    projections.push(proj);
  }

  return projections;
}

/**
 * Reconstruct a 2D slice from its projections using filtered back-projection.
 *
 * Steps for each projection:
 *   1. Apply Ram-Lak (ramp) filter in frequency domain: H(omega) = |omega|
 *   2. Back-project: smear filtered projection across the 2D slice
 *   3. Sum all contributions
 *
 * @param projections  Array of 1D projections (one per angle)
 * @param size         Side length N of the output slice
 * @param angles       Projection angles (radians), matching projections
 * @returns            Reconstructed 2D slice as Float32Array(size*size)
 */
export function filteredBackProjection(
  projections: Float32Array[],
  size: number,
  angles: number[],
): Float32Array {
  const output = new Float32Array(size * size);
  const numAngles = angles.length;
  const tMax = Math.SQRT2;

  // Pad projection length to next power of 2 for FFT
  const padLen = nextPow2(size);

  for (let ai = 0; ai < numAngles; ai++) {
    const proj = projections[ai];
    const theta = angles[ai];
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    // ---- Filter the projection in frequency domain ----
    const re = new Float64Array(padLen);
    const im = new Float64Array(padLen);

    // Copy projection into real part (zero-padded)
    for (let i = 0; i < size; i++) {
      re[i] = proj[i];
    }

    // Forward FFT
    fft(re, im);

    // Apply Ram-Lak filter: H(k) = |k| / padLen
    // Frequency index k maps to frequency k/padLen.
    // Ram-Lak: multiply by |frequency|.
    for (let k = 0; k < padLen; k++) {
      const freq =
        k <= padLen / 2 ? k : padLen - k;
      const weight = freq / padLen;
      re[k] *= weight;
      im[k] *= weight;
    }

    // Inverse FFT
    ifft(re, im);

    // Extract filtered projection
    const filtered = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      filtered[i] = re[i];
    }

    // ---- Back-project ----
    const step = 2 / size;
    for (let iz = 0; iz < size; iz++) {
      const z = -1 + (iz + 0.5) * step;
      for (let ix = 0; ix < size; ix++) {
        const x = -1 + (ix + 0.5) * step;

        // Compute t for this (x, z)
        const t = x * cosT + z * sinT;

        // Map t to bin (with linear interpolation)
        const bin = ((t + tMax) / (2 * tMax)) * size - 0.5;
        const binIdx = Math.floor(bin);
        const frac = bin - binIdx;

        let val = 0;
        if (binIdx >= 0 && binIdx < size - 1) {
          val = filtered[binIdx] * (1 - frac) + filtered[binIdx + 1] * frac;
        } else if (binIdx === size - 1) {
          val = filtered[binIdx];
        } else if (binIdx === -1) {
          val = filtered[0] * frac;
        }

        output[ix + iz * size] += val;
      }
    }
  }

  // Scale by angular step (pi / numAngles) for correct normalization
  const scale = Math.PI / numAngles;
  for (let i = 0; i < output.length; i++) {
    output[i] *= scale;
  }

  return output;
}
