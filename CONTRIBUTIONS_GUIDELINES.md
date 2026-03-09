# Contribution Guidelines - HoloLaser

## Branch Strategy
- `main` is the integration branch - never commit directly to main
- Each task gets its own branch from `main`
- Branch naming: `<team>/<issue-number>-<short-description>`
  - Examples: `math/1-radon-transform`, `frontend/3-3d-viewer`, `ux/5-ui-design`

## Teams
Each area of work belongs to a team:

### Math/Model
- Core algorithm: inverse Radon transform, filtered back-projection
- Voxelization of STL models
- Mask computation for each laser
- Numerical validation

### Frontend
- React components and pages
- Three.js 3D visualization
- STL file loading UI
- Interactive parameter controls

### Backend
- Data flow architecture
- State management (Zustand stores)
- File processing pipeline (STL -> voxels -> masks)
- Web Workers for heavy computation

### UX
- Visual design and layout
- Color scheme and theming
- Responsive design
- User flow and interaction patterns
- About page with LaTeX math

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Color contrast
- ARIA labels and roles

## Commit Rules
1. Each commit must reference a GitHub issue: `Fix #N:` or `Ref #N:`
2. Commits must be atomic - one logical change per commit
3. Write clear commit messages describing WHY, not just WHAT

## Pull Request Rules
1. PRs must reference the issue they close: `Closes #N`
2. PR title format: `[Team] Short description (#N)`
3. PRs must not break existing functionality
4. PRs must include only files relevant to the issue

## Code Quality
- No `console.log` in committed code (use proper logging)
- No commented-out code
- TypeScript strict mode - no `any` types
- Consistent formatting (Prettier defaults)

## Merge Strategy
- All merges to `main` use squash merge via PR
- PR author resolves merge conflicts
- Each PR should be self-contained and independently mergeable
