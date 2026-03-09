# HoloLaser - 3D Volumetric Projection Simulator

A web-based simulator for computing optimal 2D laser masks that, when projected by N swept lasers into a mist volume, reconstruct a desired 3D shape through volumetric intersection.

## How It Works

1. **Input**: Upload an STL 3D model or select a built-in shape
2. **Voxelize**: The model is converted to an NxNxN voxel grid
3. **Compute Masks**: Using inverse Radon transform (filtered back-projection), optimal 2D projection masks are computed for each laser
4. **Visualize**: See the laser cones, masks, and reconstructed volume in an interactive 3D viewer

## Quick Start

```bash
npm install
npm run dev
```

## Tech Stack

- React 18 + TypeScript + Vite
- Three.js via @react-three/fiber
- Tailwind CSS
- KaTeX for math rendering
- Zustand for state management

## Project Structure

See [CLAUDE.md](./CLAUDE.md) for detailed project structure and coding conventions.

See [ROADMAP.md](./ROADMAP.md) for development progress.

See [CONTRIBUTIONS_GUIDELINES.md](./CONTRIBUTIONS_GUIDELINES.md) for contribution rules.
