import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import LoadingSkeleton from '../LoadingSkeleton';

// Mock the useResponsiveGrid hook
vi.mock('../LibraryGrid.tsx', () => ({
  useResponsiveGrid: () => ({ colWidth: 240, gap: 12 }),
}));

describe('LoadingSkeleton', () => {
  it('renders 20 skeleton items', () => {
    const { container } = render(<LoadingSkeleton />);

    const skeletonItems = container.querySelectorAll('.animate-pulse');
    expect(skeletonItems).toHaveLength(20);
  });

  it('applies correct column styles', () => {
    const { container } = render(<LoadingSkeleton />);

    const gridContainer = container.querySelector('[style*="column-width"]');
    expect(gridContainer).toBeTruthy();
    expect(gridContainer?.getAttribute('style')).toContain('column-width: 240px');
    expect(gridContainer?.getAttribute('style')).toContain('column-gap: 12px');
  });

  it('renders skeleton boxes with correct dimensions', () => {
    const { container } = render(<LoadingSkeleton />);

    const skeletonBox = container.querySelector('.bg-white\\/\\[0\\.06\\].rounded-lg');
    expect(skeletonBox?.getAttribute('style')).toContain('width: 240px');
    expect(skeletonBox?.getAttribute('style')).toContain('height: 240px');
  });

  it('applies pulse animation class', () => {
    const { container } = render(<LoadingSkeleton />);

    const animatedElements = container.querySelectorAll('.animate-pulse');
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  it('renders skeleton items with break-inside avoid', () => {
    const { container } = render(<LoadingSkeleton />);

    const skeletonItem = container.querySelector('.animate-pulse');
    expect(skeletonItem?.getAttribute('style')).toContain('break-inside: avoid');
  });
});
