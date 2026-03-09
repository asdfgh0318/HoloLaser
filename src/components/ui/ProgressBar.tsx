interface ProgressBarProps {
  progress: number;
  stage: string;
  visible: boolean;
}

export function ProgressBar({ progress, stage, visible }: ProgressBarProps) {
  if (!visible) return null;

  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className="w-full" role="progressbar" aria-valuenow={clampedProgress} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
        <div
          className="h-full bg-cyan-500 rounded-full transition-[width] duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">{stage}</p>
    </div>
  );
}
