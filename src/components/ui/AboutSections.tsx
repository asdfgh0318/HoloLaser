import { MathBlock, InlineMath } from './MathBlock';

export function SectionHeading({ id, title }: { id: string; title: string }) {
  return (
    <h2
      id={id}
      className="text-xl font-bold text-gray-100 border-l-4 border-cyan-500 pl-4 mt-12 mb-4 scroll-mt-20"
    >
      {title}
    </h2>
  );
}

function MathBox({ tex }: { tex: string }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/50 py-4 px-6 text-center">
      <MathBlock tex={tex} />
    </div>
  );
}

export function FbpSection() {
  return (
    <>
      <SectionHeading id="fbp" title="5. Filtered Back-Projection" />
      <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
        <p>
          The inverse Radon transform can be computed by filtered
          back-projection. The continuous form is:
        </p>
        <MathBox
          tex={String.raw`f(x,z) = \int_0^{\pi} \left[ p_\theta * h \right](x\cos\theta + z\sin\theta)\, d\theta`}
        />
        <p>
          where <InlineMath tex="h" /> is the Ram-Lak filter with frequency
          response:
        </p>
        <MathBox tex={String.raw`H(\omega) = |\omega|`} />
        <p>
          In practice we use a discrete approximation
          with <InlineMath tex="N" /> projection angles equally spaced
          over <InlineMath tex="[0, \pi)" />:
        </p>
        <MathBox
          tex={String.raw`f(x,z) \approx \frac{\pi}{N} \sum_{i=1}^{N} q_{\theta_i}(x\cos\theta_i + z\sin\theta_i)`}
        />
        <p>
          where{' '}
          <InlineMath tex={String.raw`q_{\theta_i} = p_{\theta_i} * h`} />{' '}
          is the filtered projection.
        </p>
      </div>
    </>
  );
}

export function MaskSection() {
  return (
    <>
      <SectionHeading id="masks" title="6. Mask Computation" />
      <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
        <p>
          Given the target slice <InlineMath tex="f_y" />, the mask for
          laser <InlineMath tex="i" /> at angle{' '}
          <InlineMath tex="\theta_i" /> is simply the Radon transform of the
          slice at that angle:
        </p>
        <MathBox
          tex={String.raw`M_i(\cdot,\, y) = \mathcal{R}f_y(\theta_i,\, \cdot)`}
        />
        <p>
          That is, each row of the mask is the line integral of the
          corresponding horizontal slice of the target volume along the
          projection direction for that laser.
        </p>
      </div>
    </>
  );
}

export function QualitySection() {
  return (
    <>
      <SectionHeading id="quality" title="7. Reconstruction Quality" />
      <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
        <p>
          The reconstruction error decreases as the number of
          projections <InlineMath tex="N" /> increases. The approximation error
          of the discrete filtered back-projection is:
        </p>
        <MathBox
          tex={String.raw`\|f - f_N\| = O\!\left(\frac{1}{N}\right)`}
        />
        <p>
          More lasers therefore yield a more faithful reproduction of the target
          shape. In practice, 8-16 lasers provide a reasonable approximation for
          simple shapes, while complex geometries may require 32 or more.
        </p>
      </div>
    </>
  );
}

export function ImplementationSection() {
  return (
    <>
      <SectionHeading id="implementation" title="8. Implementation Notes" />
      <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
        <ul className="list-disc list-inside space-y-2">
          <li>
            The target volume is discretised on
            an <InlineMath tex="N \times N \times N" /> uniform grid spanning
            the range <InlineMath tex="[-1, 1]^3" />.
          </li>
          <li>
            Projections and filtering are performed using the Fast Fourier
            Transform (FFT) for{' '}
            <InlineMath tex={String.raw`O(N \log N)`} /> per-slice complexity.
          </li>
          <li>
            The Ram-Lak filter is applied in the frequency domain by multiplying
            each projection&apos;s spectrum
            by <InlineMath tex={String.raw`|\omega|`} /> before back-projection.
          </li>
          <li>
            All heavy computation runs in a Web Worker so the UI thread remains
            responsive.
          </li>
        </ul>
      </div>
    </>
  );
}
