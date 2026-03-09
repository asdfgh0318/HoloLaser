type Shape = 'sphere' | 'cube' | 'torus';

interface ShapeSelectorProps {
  onShapeSelect: (shape: Shape) => void;
  selected?: string;
}

const shapes: { id: Shape; label: string; icon: string }[] = [
  { id: 'cube', label: 'Cube', icon: '\u25A3' },
  { id: 'sphere', label: 'Sphere', icon: '\u25CF' },
  { id: 'torus', label: 'Torus', icon: '\u25CE' },
];

export function ShapeSelector({ onShapeSelect, selected }: ShapeSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {shapes.map(({ id, label, icon }) => {
        const isActive = selected === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onShapeSelect(id)}
            aria-pressed={isActive}
            className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-sm font-medium transition-colors ${
              isActive
                ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300'
                : 'border-gray-700 bg-gray-900/30 text-gray-400 hover:border-gray-500 hover:text-gray-200'
            }`}
          >
            <span className="text-xl leading-none">{icon}</span>
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
