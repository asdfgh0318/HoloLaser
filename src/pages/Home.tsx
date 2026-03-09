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
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold rounded-lg transition-colors"
          >
            Launch Simulator
          </Link>
          <Link
            to="/about"
            className="px-6 py-3 border border-gray-700 hover:border-gray-500 text-gray-300 font-semibold rounded-lg transition-colors"
          >
            Read the Math
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-8">
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
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
      <h3 className="text-lg font-semibold text-cyan-300 mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}
