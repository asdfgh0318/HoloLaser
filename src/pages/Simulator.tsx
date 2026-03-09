export function SimulatorPage() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="max-w-7xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-bold mb-4">Simulator</h1>
        <p className="text-gray-400 mb-8">
          Upload an STL model or choose a built-in shape, configure laser parameters,
          and compute projection masks.
        </p>
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          <div
            className="aspect-square max-h-[600px] rounded-xl border border-gray-800 bg-gray-900/50 flex items-center justify-center"
            role="img"
            aria-label="3D visualization viewport - will show laser cones and voxel reconstruction"
          >
            <p className="text-gray-600 text-sm">3D Viewport (Three.js) — coming soon</p>
          </div>
          <aside className="space-y-6" aria-label="Simulation controls">
            <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/50">
              <h2 className="text-sm font-semibold text-gray-300 mb-3">Parameters</h2>
              <p className="text-gray-600 text-xs">Controls will be added here</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/50">
              <h2 className="text-sm font-semibold text-gray-300 mb-3">Model Input</h2>
              <p className="text-gray-600 text-xs">STL upload will be added here</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
