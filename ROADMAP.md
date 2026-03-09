# HoloLaser Roadmap

## Phase 1: Foundation
- [x] Project scaffolding (Vite + React + TypeScript)
- [x] Project infrastructure (CLAUDE.md, CONTRIBUTIONS_GUIDELINES.md, ROADMAP.md)
- [x] GitHub issues created for all workstreams

## Phase 2: Core Implementation (All Merged)

### Math/Model Team (PR #6, Issue #1)
- [x] Implement voxelization of 3D models (STL -> voxel grid)
- [x] Implement forward Radon transform (voxels -> projections)
- [x] Implement inverse Radon transform (filtered back-projection)
- [x] Unit tests for all math functions (22 tests passing)

### Frontend Team (PR #7, Issue #2)
- [x] Three.js scene setup with orbit controls
- [x] 3D voxel grid visualization (instanced meshes)
- [x] Laser cone visualization (N lasers around circle)
- [x] Projection mask visualization (2D per laser)
- [x] STL wireframe preview

### Backend/State Team (PR #8, Issue #3)
- [x] Zustand store for simulation state with progress tracking
- [x] Web Worker for heavy math computation
- [x] STL file parsing pipeline (binary + ASCII)
- [x] Simulation orchestration hook

### UX Team (PR #9, Issue #4)
- [x] Parameter controls (sliders for all simulation params)
- [x] Built-in shape selector (Cube, Sphere, Torus)
- [x] STL drag-and-drop upload
- [x] Progress bar for computation
- [x] About page with full LaTeX math derivation (KaTeX)
- [x] Home page with "How it works" section

### Accessibility Team (PR #10, Issue #5)
- [x] Skip navigation link
- [x] Keyboard navigation with visible focus indicators
- [x] Screen reader support (ARIA labels, live regions)
- [x] Color contrast fixes (WCAG AA)
- [x] Semantic HTML structure

## Phase 3: Future Enhancements
- [ ] Iterative reconstruction (SIRT/ART) for better mask quality
- [ ] Performance optimization (code splitting, Web Worker pooling)
- [ ] Export masks as images
- [ ] Comparison view (target vs reconstructed)
- [ ] Animation of laser sweep
