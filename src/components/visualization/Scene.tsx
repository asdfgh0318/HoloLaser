import { Suspense, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';

interface SceneProps {
  children?: ReactNode;
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center w-full h-full text-gray-400 text-sm">
      Loading 3D scene...
    </div>
  );
}

function SceneContent({ children }: SceneProps) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} />

      <OrbitControls
        enableDamping
        dampingFactor={0.12}
        minDistance={1}
        maxDistance={10}
      />

      <Grid
        args={[10, 10]}
        position={[0, -0.01, 0]}
        cellSize={0.25}
        cellThickness={0.5}
        cellColor="#1e293b"
        sectionSize={1}
        sectionThickness={1}
        sectionColor="#334155"
        fadeDistance={8}
        infiniteGrid
      />

      <axesHelper args={[0.5]} />

      {children}
    </>
  );
}

export function Scene({ children }: SceneProps) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Canvas
        camera={{ position: [2.5, 2, 2.5], fov: 50, near: 0.1, far: 100 }}
        aria-label="3D visualization viewport"
        style={{ background: '#0a0a0f' }}
      >
        <SceneContent>{children}</SceneContent>
      </Canvas>
    </Suspense>
  );
}
