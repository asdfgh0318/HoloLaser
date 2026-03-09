import { useState } from 'react';
import { useSimulationStore } from '../stores/simulationStore';
import { useSimulation } from '../hooks/useSimulation';
import { Scene } from '../components/visualization/Scene';
import { VoxelCloud } from '../components/visualization/VoxelCloud';
import { LaserCones } from '../components/visualization/LaserCones';
import { MaskDisplay } from '../components/visualization/MaskDisplay';
import { StlPreview } from '../components/visualization/StlPreview';
import { ParameterPanel } from '../components/ui/ParameterPanel';
import { ShapeSelector } from '../components/ui/ShapeSelector';
import { StlUpload } from '../components/ui/StlUpload';
import { ProgressBar } from '../components/ui/ProgressBar';

type DisplayMode = 'target' | 'reconstructed' | 'both';

export function SimulatorPage() {
  const params = useSimulationStore((s) => s.params);
  const status = useSimulationStore((s) => s.status);
  const progress = useSimulationStore((s) => s.progress);
  const result = useSimulationStore((s) => s.result);
  const errorMessage = useSimulationStore((s) => s.errorMessage);
  const voxelData = useSimulationStore((s) => s.voxelData);

  const { loadSTL, loadShape, computeMasks, reset } = useSimulation();

  const [selectedShape, setSelectedShape] = useState<string | undefined>();
  const [displayMode, setDisplayMode] = useState<DisplayMode>('both');
  const [showTarget, setShowTarget] = useState(true);

  // The target voxels (original model)
  const targetVoxels = result?.targetVoxels ?? voxelData ?? null;
  // The reconstructed voxels (from FBP)
  const reconstructedVoxels = result?.reconstructedVoxels ?? null;

  const hasReconstruction = reconstructedVoxels !== null;

  // Scale voxels to fit inside the cone intersection volume.
  // Voxels span [-1,1], cones are at circleRadius. Scale so model
  // fits ~60% of the radius (the central intersection region).
  const voxelScale = params.circleRadius * 0.4;

  const stlGeometry = null;
  const computing = status === 'computing' || status === 'voxelizing' || status === 'loading';

  const stageLabel =
    status === 'loading'
      ? 'Loading STL...'
      : status === 'voxelizing'
        ? 'Voxelizing model...'
        : status === 'computing'
          ? 'Computing masks...'
          : '';

  const handleShapeSelect = (shape: 'sphere' | 'cube' | 'torus') => {
    setSelectedShape(shape);
    loadShape(shape);
  };

  const handleFileLoad = (file: File) => {
    setSelectedShape(undefined);
    loadSTL(file);
  };

  const handleReset = () => {
    setSelectedShape(undefined);
    setDisplayMode('both');
    setShowTarget(true);
    reset();
  };

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
            className="aspect-square max-h-[600px] rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden"
            role="region"
            aria-label="3D visualization viewport - shows laser cones and voxel reconstruction"
          >
            <Scene>
              {/* Target model (original) */}
              {(displayMode === 'target' || displayMode === 'both') &&
                showTarget && targetVoxels && (
                <VoxelCloud
                  voxels={targetVoxels}
                  color={hasReconstruction ? '#8b5cf6' : '#06b6d4'}
                  opacity={hasReconstruction && displayMode === 'both' ? 0.3 : 0.8}
                  scale={voxelScale}
                />
              )}
              {/* Reconstructed model (from lasers) */}
              {(displayMode === 'reconstructed' || displayMode === 'both') &&
                reconstructedVoxels && (
                <VoxelCloud
                  voxels={reconstructedVoxels}
                  color="#06b6d4"
                  opacity={0.8}
                  scale={voxelScale}
                />
              )}
              <LaserCones
                count={params.laserCount}
                radius={params.circleRadius}
                coneAngle={params.coneHalfAngle}
              />
              {result?.masks && result.masks.length > 0 && (
                <MaskDisplay
                  masks={result.masks}
                  radius={params.circleRadius}
                />
              )}
              <StlPreview geometry={stlGeometry} />
            </Scene>
          </div>

          <aside className="space-y-6" aria-label="Simulation parameters">
            {/* Parameters */}
            <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/50">
              <h2 className="text-sm font-semibold text-gray-300 mb-3">Parameters</h2>
              <ParameterPanel
                onCompute={computeMasks}
                onReset={handleReset}
                computing={computing}
              />
            </div>

            {/* Display mode toggle - only show after reconstruction */}
            {hasReconstruction && (
              <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/50">
                <h2 className="text-sm font-semibold text-gray-300 mb-3">Display</h2>
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {(['target', 'reconstructed', 'both'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setDisplayMode(mode)}
                        className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                          displayMode === mode
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'text-gray-400 border border-gray-700 hover:border-gray-500'
                        }`}
                      >
                        {mode === 'target' ? 'Target' : mode === 'reconstructed' ? 'Recon.' : 'Both'}
                      </button>
                    ))}
                  </div>
                  <label className="flex items-center gap-2 text-xs text-gray-400">
                    <input
                      type="checkbox"
                      checked={showTarget}
                      onChange={(e) => setShowTarget(e.target.checked)}
                      className="accent-cyan-500"
                    />
                    Show original model
                  </label>
                  {result?.error !== undefined && (
                    <p className="text-xs text-gray-400">
                      Reconstruction error: <span className="text-cyan-300">{(result.error * 100).toFixed(1)}%</span>
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                    <span className="inline-block w-3 h-3 rounded-sm bg-purple-500 opacity-60" />
                    Target
                    <span className="inline-block w-3 h-3 rounded-sm bg-cyan-500 ml-2" />
                    Reconstructed
                  </div>
                </div>
              </div>
            )}

            {/* Shape selector */}
            <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/50">
              <h2 className="text-sm font-semibold text-gray-300 mb-3">Built-in Shapes</h2>
              <ShapeSelector
                onShapeSelect={handleShapeSelect}
                selected={selectedShape}
              />
            </div>

            {/* STL upload */}
            <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/50">
              <h2 className="text-sm font-semibold text-gray-300 mb-3">Upload STL</h2>
              <StlUpload onFileLoad={handleFileLoad} />
            </div>

            {/* Progress */}
            <ProgressBar
              progress={progress}
              stage={stageLabel}
              visible={computing}
            />

            {/* Error message */}
            {status === 'error' && errorMessage && (
              <div
                role="alert"
                className="rounded-lg border border-red-800 bg-red-900/30 p-3 text-sm text-red-300"
              >
                {errorMessage}
              </div>
            )}
          </aside>
        </div>
        <div aria-live="polite" className="sr-only" />
      </div>
    </div>
  );
}
