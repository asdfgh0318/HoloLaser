import { MathBlock, InlineMath } from '../components/ui/MathBlock';
import {
  SectionHeading,
  FbpSection,
  MaskSection,
  QualitySection,
  ImplementationSection,
} from '../components/ui/AboutSections';

const tocEntries = [
  { id: 'problem', label: 'Problem Statement' },
  { id: 'slices', label: 'Slice Decomposition' },
  { id: 'radon', label: 'The Radon Transform' },
  { id: 'fourier', label: 'Fourier Slice Theorem' },
  { id: 'fbp', label: 'Filtered Back-Projection' },
  { id: 'masks', label: 'Mask Computation' },
  { id: 'quality', label: 'Reconstruction Quality' },
  { id: 'implementation', label: 'Implementation Notes' },
];

function MathBox({ tex }: { tex: string }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/50 py-4 px-6 text-center" role="math" aria-label={tex}>
      <MathBlock tex={tex} />
    </div>
  );
}

export function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <article role="article">
        <h1 className="text-3xl font-bold mb-6">Mathematics of Volumetric Projection</h1>

        {/* Table of Contents */}
        <nav aria-label="Table of contents" className="mb-10 rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Contents</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            {tocEntries.map(({ id, label }) => (
              <li key={id}>
                <a href={`#${id}`} className="text-cyan-400 hover:text-cyan-300 transition-colors">{label}</a>
              </li>
            ))}
          </ol>
        </nav>

        {/* 1. Problem Statement */}
        <SectionHeading id="problem" title="1. Problem Statement" />
        <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
          <p>
            We have <InlineMath tex="N" /> lasers at angles <InlineMath tex="\theta_i" /> on a circle of
            radius <InlineMath tex="R" /> in the <InlineMath tex="XZ" />-plane. Each laser projects through
            a 2D mask <InlineMath tex="M_i" /> into a mist volume. The goal is to find masks such that the
            superposition of all back-projected beams approximates a target 3D shape <InlineMath tex="T(x,y,z)" />.
          </p>
          <MathBox tex={String.raw`\sum_{i=1}^{N} \mathcal{B}_{\theta_i}[M_i](x,y,z) \;\approx\; T(x,y,z)`} />
          <p>
            where <InlineMath tex={String.raw`\mathcal{B}_{\theta}`} /> is the back-projection operator for a
            laser at angle <InlineMath tex="\theta" />.
          </p>
        </div>

        {/* 2. Slice Decomposition */}
        <SectionHeading id="slices" title="2. Slice Decomposition" />
        <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
          <p>
            Because each laser sweeps vertically, horizontal slices of the volume are independent. We decompose
            the 3D target into a stack of 2D functions:
          </p>
          <MathBox tex={String.raw`f_y(x,z) = T(x,\, y,\, z)`} />
          <p>
            Each horizontal slice <InlineMath tex="f_y" /> becomes an independent 2D reconstruction problem.
            The mask for laser <InlineMath tex="i" /> at height <InlineMath tex="y" /> is a single
            row of <InlineMath tex="M_i" />.
          </p>
        </div>

        {/* 3. The Radon Transform */}
        <SectionHeading id="radon" title="3. The Radon Transform" />
        <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
          <p>
            The Radon transform of a 2D function <InlineMath tex="f(x,z)" /> at
            angle <InlineMath tex="\theta" /> and offset <InlineMath tex="t" /> integrates <InlineMath tex="f" /> along
            the line perpendicular to the projection direction:
          </p>
          <MathBox
            tex={String.raw`\mathcal{R}f(\theta,\, t) = \int_{-\infty}^{\infty} f(t\cos\theta - s\sin\theta,\; t\sin\theta + s\cos\theta)\, ds`}
          />
          <p>
            The collection of all projections <InlineMath tex={String.raw`\mathcal{R}f(\theta, t)`} /> for
            all angles <InlineMath tex="\theta \in [0, \pi)" /> is called the sinogram.
          </p>
        </div>

        {/* 4. Fourier Slice Theorem */}
        <SectionHeading id="fourier" title="4. Fourier Slice Theorem" />
        <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
          <p>
            The Fourier Slice Theorem states that the 1D Fourier transform of a projection at
            angle <InlineMath tex="\theta" /> equals a radial slice through the 2D Fourier transform
            of <InlineMath tex="f" />:
          </p>
          <MathBox tex={String.raw`\hat{p}_\theta(\omega) = \hat{F}(\omega\cos\theta,\, \omega\sin\theta)`} />
          <p>
            where <InlineMath tex={String.raw`\hat{p}_\theta`} /> is the 1D Fourier transform of the
            projection <InlineMath tex={String.raw`p_\theta(t) = \mathcal{R}f(\theta, t)`} /> and{' '}
            <InlineMath tex={String.raw`\hat{F}`} /> is the 2D Fourier transform of <InlineMath tex="f" />.
          </p>
        </div>

        {/* 5-8: extracted components */}
        <FbpSection />
        <MaskSection />
        <QualitySection />
        <ImplementationSection />

        <div className="mt-16 border-t border-gray-800 pt-6 text-center text-xs text-gray-400">
          HoloLaser &mdash; Volumetric Projection Simulator
        </div>
      </article>
    </div>
  );
}
