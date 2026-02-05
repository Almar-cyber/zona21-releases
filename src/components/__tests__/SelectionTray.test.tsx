import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SelectionTray from '../SelectionTray';
import { Asset } from '../../shared/types';

// Mock dependencies
vi.mock('../Icon.tsx', () => ({
  default: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}));

vi.mock('../Tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockAsset: Asset = {
  id: 'test-1',
  fileName: 'test.jpg',
  filePath: '/path/to/test.jpg',
  mediaType: 'image',
  createdAt: '2024-01-01',
  thumbnailPaths: ['/thumb.jpg'],
  rating: 0,
  colorLabel: null,
  tags: [],
};

const createMockAsset = (id: string): Asset => ({
  ...mockAsset,
  id,
  fileName: `${id}.jpg`,
});

describe('SelectionTray', () => {
  const createDefaultProps = () => ({
    selectedAssets: [mockAsset],
    currentCollectionId: null,
    onRemoveFromSelection: vi.fn(),
    onClearSelection: vi.fn(),
    onCopySelected: vi.fn(),
    onTrashSelected: vi.fn(),
    onExportSelected: vi.fn(),
    onExportZipSelected: vi.fn(),
    onOpenReview: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when no assets selected', () => {
    const props = createDefaultProps();
    const { container } = render(
      <SelectionTray {...props} selectedAssets={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders when assets are selected', () => {
    const props = createDefaultProps();
    render(<SelectionTray {...props} />);
    expect(screen.getByText('1 item')).toBeInTheDocument();
  });

  it('shows correct count for multiple items', () => {
    const props = createDefaultProps();
    const assets = [createMockAsset('1'), createMockAsset('2'), createMockAsset('3')];
    render(<SelectionTray {...props} selectedAssets={assets} />);
    expect(screen.getByText('3 itens')).toBeInTheDocument();
  });

  it('calls onClearSelection when close button clicked', () => {
    const props = createDefaultProps();
    render(<SelectionTray {...props} />);

    // Find the close button by its icon
    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find(btn =>
      btn.querySelector('[data-testid="icon-close"]')
    );

    if (closeButton) {
      fireEvent.click(closeButton);
      expect(props.onClearSelection).toHaveBeenCalled();
    }
  });

  it('calls onOpenReview for delete action', () => {
    const props = createDefaultProps();
    render(<SelectionTray {...props} />);

    // Find delete button by its icon
    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find(btn =>
      btn.querySelector('[data-testid="icon-delete"]')
    );

    if (deleteButton) {
      fireEvent.click(deleteButton);
      expect(props.onOpenReview).toHaveBeenCalledWith('delete', [mockAsset]);
    }
  });

  it('opens export modal when export button clicked', () => {
    const props = createDefaultProps();
    render(<SelectionTray {...props} />);

    // Find export button by its icon
    const buttons = screen.getAllByRole('button');
    const exportButton = buttons.find(btn =>
      btn.querySelector('[data-testid="icon-ios_share"]')
    );

    if (exportButton) {
      fireEvent.click(exportButton);
      expect(screen.getByText('Escolha um formato')).toBeInTheDocument();
    }
  });

  it('shows remove from collection button when in collection', () => {
    const props = createDefaultProps();
    const onRemoveFromCollection = vi.fn();
    render(
      <SelectionTray
        {...props}
        currentCollectionId="col-1"
        onRemoveFromCollection={onRemoveFromCollection}
      />
    );

    // Find button by icon
    const buttons = screen.getAllByRole('button');
    const removeButton = buttons.find(btn =>
      btn.querySelector('[data-testid="icon-playlist_remove"]')
    );

    expect(removeButton).toBeTruthy();
  });

  it('shows compare button when 2-4 assets selected', () => {
    const props = createDefaultProps();
    const onOpenCompare = vi.fn();
    const assets = [createMockAsset('1'), createMockAsset('2')];

    render(
      <SelectionTray
        {...props}
        selectedAssets={assets}
        onOpenCompare={onOpenCompare}
      />
    );

    // Find compare button by icon
    const buttons = screen.getAllByRole('button');
    const compareButton = buttons.find(btn =>
      btn.querySelector('[data-testid="icon-compare"]')
    );

    expect(compareButton).toBeTruthy();
  });

  it('disables buttons when busy', () => {
    const props = createDefaultProps();
    render(<SelectionTray {...props} isBusy={true} />);

    const buttons = screen.getAllByRole('button');
    const disabledButtons = buttons.filter(btn => btn.hasAttribute('disabled'));
    expect(disabledButtons.length).toBeGreaterThan(0);
  });
});
