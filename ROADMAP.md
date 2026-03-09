# HoloLaser Roadmap

## Phase 1: Foundation (Current)
- [x] Project scaffolding (Vite + React + TypeScript)
- [x] Project infrastructure (CLAUDE.md, CONTRIBUTIONS_GUIDELINES.md, ROADMAP.md)
- [ ] GitHub issues created for all workstreams

## Phase 2: Core Implementation (Parallel Workstreams)

### Math/Model Team
- [ ] Implement voxelization of 3D models (STL -> voxel grid)
- [ ] Implement forward Radon transform (voxels -> projections)
- [ ] Implement inverse Radon transform (filtered back-projection)
- [ ] Implement iterative reconstruction (SIRT/ART) for mask optimization
- [ ] Unit tests for all math functions

### Frontend Team
- [ ] Three.js scene setup with orbit controls
- [ ] 3D voxel grid visualization
- [ ] Laser cone visualization (N lasers around circle)
- [ ] Projection mask visualization (2D per laser)
- [ ] STL file upload and preview
- [ ] Interactive parameter controls (N lasers, grid size, etc.)

### Backend/State Team
- [ ] Zustand store for simulation state
- [ ] Web Worker for heavy math computation
- [ ] STL file parsing pipeline
- [ ] Simulation orchestration (load -> voxelize -> compute masks -> visualize)

### UX Team
- [ ] App layout with navigation (Home, Simulator, About)
- [ ] Home page with project overview
- [ ] About page with LaTeX math explanation
- [ ] Responsive design and theming
- [ ] Loading states and progress indicators

### Accessibility Team
- [ ] WCAG 2.1 AA audit
- [ ] Keyboard navigation for all interactive elements
- [ ] Screen reader support and ARIA labels
- [ ] Color contrast compliance
- [ ] Focus management

## Phase 3: Integration & Polish
- [ ] Merge all workstreams
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Documentation
