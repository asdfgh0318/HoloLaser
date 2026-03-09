# HoloLaser - 3D Volumetric Projection Simulator

## Project Overview
A web-based simulator for a 3D volumetric projection system using N swept lasers arranged in a circle around a mist volume. The system computes 2D masks for each laser using inverse Radon transform mathematics so their intersection produces a desired 3D shape.

## Tech Stack
- **Framework**: React 18 + TypeScript + Vite
- **3D Visualization**: Three.js via @react-three/fiber + @react-three/drei
- **Math**: Custom inverse Radon transform implementation (client-side)
- **Styling**: Tailwind CSS
- **LaTeX Rendering**: KaTeX (for the math/about page)
- **STL Parsing**: Client-side STL loader (Three.js STLLoader)
- **State Management**: Zustand

## Project Structure
```
src/
  components/       # React components
    ui/             # Reusable UI components
    visualization/  # Three.js 3D visualization components
    layout/         # Layout components (navbar, footer, etc.)
  pages/            # Page components (Home, About, Simulator)
  math/             # Core math engine (Radon transform, voxelization)
  utils/            # Utility functions
  hooks/            # Custom React hooks
  stores/           # Zustand stores
  types/            # TypeScript type definitions
  assets/           # Static assets
public/
  models/           # Sample STL files
```

## Coding Rules
- All files must use TypeScript (`.ts` / `.tsx`)
- Use functional components with hooks only
- No `any` types - use proper typing
- Use named exports (not default exports)
- Keep components under 200 lines - split if larger
- Use semantic HTML elements for accessibility
- All interactive elements must be keyboard-accessible
- All images/3D views must have aria labels
- Commit messages reference GitHub issue numbers (e.g., "Fix #3: Add STL loader")
- Branch naming: `<team>/<issue-number>-<short-description>` (e.g., `math/1-radon-transform`)
- PR descriptions must reference the issue they close

## Math Conventions
- Coordinate system: right-handed, Y-up
- Angles: radians internally, degrees in UI
- Voxel grid: NxNxN uniform grid, default N=64
- Laser positions: equally spaced on a circle in the XZ plane
- Projection axis: each laser projects along a ray toward the center

## Testing
- Unit tests for math functions using Vitest
- Visual regression tests are NOT required
