import { useSimulationStore } from '../../stores/simulationStore';

interface ParameterPanelProps {
  onCompute: () => void;
  onReset: () => void;
  computing: boolean;
}

const GRID_OPTIONS = [16, 32, 64, 128] as const;

export function ParameterPanel({ onCompute, onReset, computing }: ParameterPanelProps) {
  const params = useSimulationStore((s) => s.params);
  const setParams = useSimulationStore((s) => s.setParams);

  const coneHalfAngleDeg = Math.round((params.coneHalfAngle * 180) / Math.PI);

  return (
    <div className="space-y-4">
      {/* Number of lasers */}
      <label className="block">
        <span className="text-xs font-medium text-gray-400">
          Lasers: <span className="text-cyan-300">{params.laserCount}</span>
        </span>
        <input
          type="range"
          min={2}
          max={64}
          step={1}
          value={params.laserCount}
          onChange={(e) => setParams({ laserCount: Number(e.target.value) })}
          className="mt-1 w-full accent-cyan-500"
        />
      </label>

      {/* Grid resolution */}
      <label className="block">
        <span className="text-xs font-medium text-gray-400">Grid Resolution</span>
        <select
          value={params.gridSize}
          onChange={(e) => setParams({ gridSize: Number(e.target.value) })}
          className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none"
        >
          {GRID_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n} x {n} x {n}
            </option>
          ))}
        </select>
      </label>

      {/* Circle radius */}
      <label className="block">
        <span className="text-xs font-medium text-gray-400">
          Circle Radius: <span className="text-cyan-300">{params.circleRadius.toFixed(1)}</span>
        </span>
        <input
          type="range"
          min={0.5}
          max={3.0}
          step={0.1}
          value={params.circleRadius}
          onChange={(e) => setParams({ circleRadius: Number(e.target.value) })}
          className="mt-1 w-full accent-cyan-500"
        />
      </label>

      {/* Cone half-angle */}
      <label className="block">
        <span className="text-xs font-medium text-gray-400">
          Cone Half-Angle: <span className="text-cyan-300">{coneHalfAngleDeg}&deg;</span>
        </span>
        <input
          type="range"
          min={10}
          max={90}
          step={1}
          value={coneHalfAngleDeg}
          onChange={(e) =>
            setParams({ coneHalfAngle: (Number(e.target.value) * Math.PI) / 180 })
          }
          className="mt-1 w-full accent-cyan-500"
        />
      </label>

      {/* Iterations */}
      <label className="block">
        <span className="text-xs font-medium text-gray-400">
          Iterations: <span className="text-cyan-300">{params.iterations}</span>
        </span>
        <input
          type="range"
          min={1}
          max={50}
          step={1}
          value={params.iterations}
          onChange={(e) => setParams({ iterations: Number(e.target.value) })}
          className="mt-1 w-full accent-cyan-500"
        />
      </label>

      {/* Action buttons */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCompute}
          disabled={computing}
          className="flex-1 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-gray-950 transition-colors hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {computing ? 'Computing...' : 'Compute Masks'}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-gray-400 hover:text-gray-100"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
