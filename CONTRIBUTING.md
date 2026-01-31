# Contributing to Zona21

Thank you for your interest in contributing to Zona21! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Project Structure](#project-structure)
5. [Development Workflow](#development-workflow)
6. [Coding Standards](#coding-standards)
7. [Testing](#testing)
8. [Pull Request Process](#pull-request-process)
9. [Issue Guidelines](#issue-guidelines)
10. [Community](#community)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of experience level, background, or identity.

### Expected Behavior

- Be respectful and considerate
- Welcome newcomers and help them get started
- Give and receive constructive feedback gracefully
- Focus on what is best for the community and project

### Unacceptable Behavior

- Harassment, discrimination, or trolling
- Publishing others' private information
- Deliberate disruption of discussions
- Other conduct inappropriate in a professional setting

### Enforcement

Violations may result in temporary or permanent ban from the project. Report issues to: alexia01native@gmail.com

---

## Getting Started

### Ways to Contribute

**Code Contributions:**
- Bug fixes
- New features
- Performance improvements
- Refactoring

**Non-Code Contributions:**
- Documentation improvements
- Bug reports
- Feature requests
- Translations
- User testing and feedback
- Design and UX suggestions

### Before You Start

1. **Check existing issues** - Someone may already be working on it
2. **Discuss major changes** - Open an issue first for large features
3. **Read the docs** - Familiarize yourself with the codebase
4. **Start small** - First contribution? Pick a "good first issue"

---

## Development Setup

### Prerequisites

**Required:**
- Node.js 20.x or later
- npm 10.x or later
- macOS 10.12+ (primary development platform)
- Git

**Recommended:**
- VS Code with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
- 16GB RAM minimum
- SSD with 10GB+ free space

### Installation

**1. Fork and Clone**
```bash
# Fork on GitHub first, then:
git clone https://github.com/YOUR_USERNAME/zona21.git
cd zona21
```

**2. Install Dependencies**
```bash
npm install
```

**3. Verify Setup**
```bash
# Run dev server
npm run dev

# Should open Zona21 in development mode
```

**4. Run Tests**
```bash
npm test
```

### Development Commands

```bash
# Development
npm run dev              # Start Electron + Vite dev server
npm run dev:renderer     # Only Vite dev server
npm run dev:electron     # Only Electron

# Building
npm run build            # Build for production
npm run build:renderer   # Only frontend build
npm run build:electron   # Only Electron build

# Linting & Formatting
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix lint issues
npm run format           # Run Prettier

# Testing
npm test                 # Run tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Type Checking
npm run type-check       # TypeScript compiler check
```

---

## Project Structure

### High-Level Overview

```
zona21/
├── electron/           # Electron main process
│   ├── main/          # Main process code
│   └── preload/       # Preload scripts
├── src/               # React frontend
│   ├── components/    # UI components
│   ├── contexts/      # React contexts
│   ├── hooks/         # Custom hooks
│   └── utils/         # Utilities
├── docs/              # Documentation
├── release/           # Build output (gitignored)
└── package.json       # Dependencies
```

### Key Directories

**`electron/main/`** - Electron main process
- `index.ts` - Main entry point
- `db/` - Database layer
- `indexer/` - File indexing
- `ai/` - AI features
- `ipc/` - IPC handlers

**`src/`** - React frontend
- `App.tsx` - Root component
- `components/` - Reusable UI components
- `contexts/` - Global state management
- `hooks/` - Custom React hooks

**`docs/`** - Documentation
- `getting-started/` - User onboarding
- `user-guide/` - Feature documentation
- `developer/` - Technical documentation
- `troubleshooting/` - Problem solving

**See:** [Architecture Documentation](docs/developer/architecture.md)

---

## Development Workflow

### Branch Strategy

**Main Branches:**
- `main` - Production-ready code
- `develop` - Integration branch (not currently used)

**Feature Branches:**
- `feature/short-description` - New features
- `fix/short-description` - Bug fixes
- `docs/short-description` - Documentation
- `refactor/short-description` - Code refactoring
- `perf/short-description` - Performance improvements

### Workflow Steps

**1. Create Branch**
```bash
git checkout -b feature/add-video-preview
```

**2. Make Changes**
- Write code
- Add tests
- Update documentation
- Follow coding standards

**3. Commit Changes**
```bash
git add .
git commit -m "feat: add video preview on hover

- Implement 300ms debounce
- Add video element with poster
- Handle mouse leave cleanup

Closes #123"
```

**4. Push Branch**
```bash
git push origin feature/add-video-preview
```

**5. Open Pull Request**
- Fill out PR template
- Link related issues
- Request review

**6. Address Feedback**
- Make requested changes
- Push additional commits
- Respond to comments

**7. Merge**
- Squash and merge (preferred)
- Delete feature branch

---

## Coding Standards

### TypeScript

**Use strict type checking:**
```typescript
// ✅ Good
function markAsset(assetId: string, mark: 'approved' | 'favorite' | 'rejected'): void {
  // Implementation
}

// ❌ Bad
function markAsset(assetId: any, mark: any) {
  // Implementation
}
```

**Prefer interfaces over types:**
```typescript
// ✅ Good
interface Asset {
  id: string;
  fileName: string;
  approved: boolean;
}

// ⚠️ Use types for unions/intersections
type MarkType = 'approved' | 'favorite' | 'rejected';
```

### React

**Use functional components and hooks:**
```typescript
// ✅ Good
function AssetCard({ asset, onClick }: AssetCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  return <div>...</div>;
}

// ❌ Bad (class components)
class AssetCard extends React.Component { }
```

**Memoize expensive components:**
```typescript
export default React.memo(AssetCard, (prev, next) => {
  return prev.asset.id === next.asset.id;
});
```

### Naming Conventions

**Files:**
- Components: `PascalCase.tsx` (e.g., `AssetCard.tsx`)
- Hooks: `camelCase.ts` (e.g., `useUnsavedChanges.ts`)
- Utilities: `kebab-case.ts` (e.g., `responsive.ts`)
- Types: `index.d.ts` or `types.ts`

**Variables:**
```typescript
// camelCase for variables and functions
const assetCount = 42;
function loadAssets() { }

// PascalCase for components and classes
class DatabaseService { }
function AssetCard() { }

// SCREAMING_SNAKE_CASE for constants
const MAX_UPLOAD_SIZE = 100_000_000;
```

### Styling

**Use Tailwind CSS classes:**
```tsx
<button className="
  px-3 py-2
  bg-white/5 hover:bg-white/10
  rounded-lg
  transition-colors
">
  Click me
</button>
```

**Follow design system:**
- See [Design System Documentation](docs/project-management/design-system.md)
- Use established tokens (colors, spacing, typography)
- Match existing component patterns

### Comments

**Write self-documenting code:**
```typescript
// ✅ Good (code is clear)
const approvedAssets = assets.filter(asset => asset.approved);

// ❌ Bad (unnecessary comment)
// Filter assets to get only approved ones
const approvedAssets = assets.filter(asset => asset.approved);
```

**Comment complex logic:**
```typescript
// ✅ Good (explains why, not what)
// Use spatial index for O(1) lookups instead of O(n²) DOM queries
const spatialIndex = buildSpatialIndex(assets, columns);
```

**JSDoc for public APIs:**
```typescript
/**
 * Find visually similar assets using AI embeddings.
 *
 * @param assetId - Reference asset ID
 * @param limit - Maximum number of results (default: 10)
 * @returns Array of similar assets with similarity scores
 */
async function findSimilar(assetId: string, limit = 10): Promise<SimilarResult[]> {
  // Implementation
}
```

---

## Testing

### Test Structure

```
zona21/
├── src/
│   ├── components/
│   │   ├── AssetCard.tsx
│   │   └── AssetCard.test.tsx   # Component tests
│   └── utils/
│       ├── responsive.ts
│       └── responsive.test.ts    # Unit tests
└── electron/
    └── main/
        └── db/
            └── db-service.test.ts # Integration tests
```

### Writing Tests

**Component Tests:**
```typescript
import { render, fireEvent } from '@testing-library/react';
import AssetCard from './AssetCard';

describe('AssetCard', () => {
  it('renders asset thumbnail', () => {
    const asset = { id: '1', fileName: 'photo.jpg', approved: false };
    const { getByAltText } = render(<AssetCard asset={asset} />);

    expect(getByAltText('photo.jpg')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    const asset = { id: '1', fileName: 'photo.jpg', approved: false };
    const { getByRole } = render(<AssetCard asset={asset} onClick={handleClick} />);

    fireEvent.click(getByRole('button'));
    expect(handleClick).toHaveBeenCalledWith(asset);
  });
});
```

**Unit Tests:**
```typescript
import { calculateSimilarity } from './ai-utils';

describe('calculateSimilarity', () => {
  it('returns 1.0 for identical embeddings', () => {
    const embedding = new Float32Array([0.5, 0.5, 0.5]);
    expect(calculateSimilarity(embedding, embedding)).toBe(1.0);
  });

  it('returns 0.0 for orthogonal embeddings', () => {
    const a = new Float32Array([1, 0, 0]);
    const b = new Float32Array([0, 1, 0]);
    expect(calculateSimilarity(a, b)).toBe(0.0);
  });
});
```

### Test Coverage Goals

- **Minimum:** 70% overall coverage
- **Target:** 90% for new code
- **Critical paths:** 100% (database, IPC, security)

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific file
npm test -- AssetCard.test.tsx
```

---

## Pull Request Process

### Before Submitting

**Checklist:**
- [ ] Code follows style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] No console.log() or debug code
- [ ] Lint passes (`npm run lint`)
- [ ] Type check passes (`npm run type-check`)
- [ ] Build succeeds (`npm run build`)

### PR Template

```markdown
## Description
Brief description of changes

## Related Issues
Closes #123
Fixes #456

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update

## Testing
How has this been tested?

- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added and passing
```

### Review Process

**1. Automated Checks**
- CI/CD runs tests
- Lint and type check
- Build verification

**2. Code Review**
- At least 1 approval required
- Address all feedback
- No unresolved conversations

**3. Merge**
- Squash and merge (preferred)
- Clear commit message
- Delete branch after merge

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, no code change
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(ai): add face detection support

Implement MediaPipe face detection for clustering photos by person.
Includes database schema updates and new IPC handlers.

Closes #234

---

fix(export): handle HEIC format conversion

Convert HEIC to JPEG before export to ensure compatibility.
Adds Sharp HEIC decoder configuration.

Fixes #456

---

docs: update architecture overview

Add mermaid diagrams for data flow and component interaction.
Clarify IPC communication patterns.
```

---

## Issue Guidelines

### Reporting Bugs

**Use the bug template and include:**
1. **Description** - What happened vs. what you expected
2. **Steps to Reproduce** - Exact steps to trigger the bug
3. **Environment:**
   - Zona21 version
   - macOS version
   - Hardware (Intel/Apple Silicon)
4. **Logs** - Console output, error messages
5. **Screenshots** - Visual issues

**Example:**
```markdown
## Bug Description
Export fails with "Permission denied" error when exporting to external drive.

## Steps to Reproduce
1. Connect external USB drive
2. Select 10 photos
3. Export → Choose external drive as destination
4. Click "Export"
5. Error appears

## Environment
- Zona21: v0.4.9
- macOS: 13.5 Ventura
- Hardware: MacBook Pro M1 Pro

## Logs
```
[Export] Failed to write file: EACCES: permission denied
```

## Expected
Export should succeed to external drive.

## Actual
Permission denied error.
```

### Feature Requests

**Include:**
1. **Problem** - What problem does this solve?
2. **Proposed Solution** - How should it work?
3. **Alternatives** - Other approaches considered?
4. **Use Case** - Who benefits and how?

**Example:**
```markdown
## Problem
Difficult to find photos from specific camera when managing multi-camera shoots.

## Proposed Solution
Add camera filter dropdown in toolbar:
- Filter by camera make/model
- Show count per camera
- Clear filter button

## Alternatives
- Search by camera in search bar
- Custom collection per camera

## Use Case
Wedding photographers using 2-3 cameras want to quickly review shots from each camera separately.
```

---

## Community

### Communication Channels

**GitHub:**
- [Issues](https://github.com/Almar-cyber/zona21/issues) - Bugs, features
- [Discussions](https://github.com/Almar-cyber/zona21/discussions) - Q&A, ideas
- [Pull Requests](https://github.com/Almar-cyber/zona21/pulls) - Code review

**Email:**
- alexia01native@gmail.com - Direct contact

### Response Times

- **Bug reports:** 1-3 days
- **Feature requests:** 1 week
- **Pull requests:** 3-7 days
- **Questions:** 1-2 days

### Getting Help

**Before asking:**
1. Check [Documentation](docs/)
2. Search [existing issues](https://github.com/Almar-cyber/zona21/issues)
3. Read [Troubleshooting guide](docs/troubleshooting/)

**When asking:**
- Be specific and clear
- Provide context and examples
- Include version and environment info
- Be patient and respectful

---

## Recognition

### Contributors

All contributors are recognized in:
- [README.md](README.md) contributors section
- Release notes for their contributions
- GitHub contributors graph

### Hall of Fame

Top contributors may be invited to:
- Beta testing programs
- Early access to new features
- Project decision discussions

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (see [LICENSE](LICENSE)).

---

## Questions?

- **Documentation:** [docs/](docs/)
- **Issues:** [GitHub Issues](https://github.com/Almar-cyber/zona21/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Almar-cyber/zona21/discussions)
- **Email:** alexia01native@gmail.com

**Thank you for contributing to Zona21!** 🚀

---

**Last Updated:** January 30, 2026
**Version:** 0.4.9
