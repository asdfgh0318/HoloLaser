import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <section className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          HoloLaser
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          3D Volumetric Projection Simulator. Compute optimal laser masks
          using inverse Radon transform mathematics to project 3D shapes
          into a mist volume.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/simulator"
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            Launch Simulator
          </Link>
          <Link
            to="/about"
            className="px-6 py-3 border border-gray-700 hover:border-gray-500 text-gray-300 font-semibold rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            Read the Math
          </Link>
        </div>
      </section>

      <section aria-labelledby="features-heading" className="grid md:grid-cols-3 gap-8">
        <h2 id="features-heading" className="sr-only">Features</h2>
        <FeatureCard
          title="N-Laser System"
          description="Configure any number of lasers arranged in a circle, each with conical sweep geometry."
        />
        <FeatureCard
          title="Inverse Radon Transform"
          description="Compute optimal 2D projection masks using filtered back-projection and iterative refinement."
        />
        <FeatureCard
          title="STL Import"
          description="Load any 3D model as an STL file and voxelize it as the target shape for projection."
        />
      </section>

      <section aria-labelledby="how-heading" className="mt-16">
        <h2
          id="how-heading"
          className="text-2xl font-bold text-center mb-8"
        >
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <StepCard
            step={1}
            title="Load a 3D Model"
            description="Upload an STL file or pick a built-in shape (cube, sphere, torus) to use as the projection target."
          />
          <StepCard
            step={2}
            title="Configure Parameters"
            description="Set the number of lasers, grid resolution, circle radius, cone angle, and iteration count."
          />
          <StepCard
            step={3}
            title="Compute & Visualize"
            description="Run the inverse Radon transform to generate masks and view the reconstructed 3D volume in real time."
          />
        </div>
      </section>
    </div>
  );
}

function StepCard({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <article className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 relative">
      <span className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-sm font-bold text-gray-950">
        {step}
      </span>
      <h3 className="text-lg font-semibold text-gray-100 mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </article>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <article className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
      <h3 className="text-lg font-semibold text-cyan-300 mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </article>
  );
}
