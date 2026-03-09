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

export function SimulatorPage() {
  const params = useSimulationStore((s) => s.params);
  const status = useSimulationStore((s) => s.status);
  const progress = useSimulationStore((s) => s.progress);
  const result = useSimulationStore((s) => s.result);
  const errorMessage = useSimulationStore((s) => s.errorMessage);

  const { loadSTL, loadShape, computeMasks, reset } = useSimulation();

  const [selectedShape, setSelectedShape] = useState<string | undefined>();

  const displayVoxels = result?.reconstructedVoxels ?? result?.targetVoxels ?? null;
  const stlGeometry = null; // Will be set when STL geometry preview is implemented
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
              <VoxelCloud voxels={displayVoxels} />
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

          <aside className="space-y-6" aria-label="Simulation controls">
            {/* Parameters */}
            <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/50">
              <h2 className="text-sm font-semibold text-gray-300 mb-3">Parameters</h2>
              <ParameterPanel
                onCompute={computeMasks}
                onReset={handleReset}
                computing={computing}
              />
            </div>

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
