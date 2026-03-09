/**
 * Radix-2 Cooley-Tukey FFT implementation.
 *
 * All transforms operate on interleaved complex arrays where
 * element 2k is the real part and 2k+1 is the imaginary part.
 * Length of the input must be 2 * (power-of-two).
 */

/**
 * Compute the discrete Fourier transform of a complex signal in-place.
 * @param re Real parts (modified in place)
 * @param im Imaginary parts (modified in place)
 */
export function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  if (n <= 1) return;
  if ((n & (n - 1)) !== 0) {
    throw new Error(`FFT length must be a power of 2, got ${n}`);
  }

  // Bit-reversal permutation
  bitReverse(re, im, n);

  // Cooley-Tukey iterative radix-2 DIT
  for (let size = 2; size <= n; size *= 2) {
    const halfSize = size / 2;
    const angleStep = (-2 * Math.PI) / size;
    const wRe = Math.cos(angleStep);
    const wIm = Math.sin(angleStep);

    for (let i = 0; i < n; i += size) {
      let curRe = 1;
      let curIm = 0;

      for (let j = 0; j < halfSize; j++) {
        const evenIdx = i + j;
        const oddIdx = i + j + halfSize;

        const tRe = curRe * re[oddIdx] - curIm * im[oddIdx];
        const tIm = curRe * im[oddIdx] + curIm * re[oddIdx];

        re[oddIdx] = re[evenIdx] - tRe;
        im[oddIdx] = im[evenIdx] - tIm;
        re[evenIdx] = re[evenIdx] + tRe;
        im[evenIdx] = im[evenIdx] + tIm;

        const newCurRe = curRe * wRe - curIm * wIm;
        const newCurIm = curRe * wIm + curIm * wRe;
        curRe = newCurRe;
        curIm = newCurIm;
      }
    }
  }
}

/**
 * Compute the inverse discrete Fourier transform in-place.
 * @param re Real parts (modified in place)
 * @param im Imaginary parts (modified in place)
 */
export function ifft(re: Float64Array, im: Float64Array): void {
  const n = re.length;

  // Conjugate
  for (let i = 0; i < n; i++) {
    im[i] = -im[i];
  }

  // Forward FFT
  fft(re, im);

  // Conjugate and scale
  const invN = 1 / n;
  for (let i = 0; i < n; i++) {
    re[i] *= invN;
    im[i] = -im[i] * invN;
  }
}

/**
 * Bit-reversal permutation of arrays in-place.
 */
function bitReverse(re: Float64Array, im: Float64Array, n: number): void {
  let j = 0;
  for (let i = 0; i < n - 1; i++) {
    if (i < j) {
      // Swap re
      const tmpRe = re[i];
      re[i] = re[j];
      re[j] = tmpRe;
      // Swap im
      const tmpIm = im[i];
      im[i] = im[j];
      im[j] = tmpIm;
    }
    let k = n >> 1;
    while (k <= j) {
      j -= k;
      k >>= 1;
    }
    j += k;
  }
}

/**
 * Return the smallest power of 2 >= n.
 */
export function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}
