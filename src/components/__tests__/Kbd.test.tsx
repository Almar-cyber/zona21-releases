import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Kbd, KbdCombo } from '../Kbd';

describe('Kbd', () => {
  it('renders children text', () => {
    render(<Kbd>⌘</Kbd>);
    expect(screen.getByText('⌘')).toBeInTheDocument();
  });

  it('renders as kbd element', () => {
    render(<Kbd>K</Kbd>);
    const element = screen.getByText('K');
    expect(element.tagName).toBe('KBD');
  });

  it('applies custom className', () => {
    render(<Kbd className="custom-class">K</Kbd>);
    const element = screen.getByText('K');
    expect(element.classList.contains('custom-class')).toBe(true);
  });

  it('applies md size classes by default', () => {
    render(<Kbd>K</Kbd>);
    const element = screen.getByText('K');
    // Check if class string contains the expected classes
    const classStr = element.className;
    expect(classStr.includes('px-2')).toBe(true);
  });

  it('applies sm size classes', () => {
    render(<Kbd size="sm">K</Kbd>);
    const element = screen.getByText('K');
    const classStr = element.className;
    expect(classStr.includes('px-1.5')).toBe(true);
  });

  it('applies lg size classes', () => {
    render(<Kbd size="lg">K</Kbd>);
    const element = screen.getByText('K');
    const classStr = element.className;
    expect(classStr.includes('px-3')).toBe(true);
  });
});

describe('KbdCombo', () => {
  it('renders all keys', () => {
    render(<KbdCombo keys={['⌘', 'K']} />);
    expect(screen.getByText('⌘')).toBeInTheDocument();
    expect(screen.getByText('K')).toBeInTheDocument();
  });

  it('renders default + separator between keys', () => {
    render(<KbdCombo keys={['⌘', 'K']} />);
    expect(screen.getByText('+')).toBeInTheDocument();
  });

  it('renders custom separator', () => {
    render(<KbdCombo keys={['⌘', 'K']} separator="→" />);
    expect(screen.getByText('→')).toBeInTheDocument();
  });

  it('does not render separator before first key', () => {
    const { container } = render(<KbdCombo keys={['⌘', 'K', 'P']} />);
    // Separators are <span> elements between <kbd> elements
    const spans = Array.from(container.querySelectorAll('span > span'));
    const separators = spans.filter(el => el.textContent === '+');
    // Should have 2 separators (between ⌘-K and K-P), not 3
    expect(separators).toHaveLength(2);
  });

  it('applies custom className to wrapper', () => {
    const { container } = render(<KbdCombo keys={['⌘']} className="custom-class" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.classList.contains('custom-class')).toBe(true);
  });

  it('renders keys as kbd elements', () => {
    const { container } = render(<KbdCombo keys={['A', 'B', 'C']} />);
    const kbdElements = container.querySelectorAll('kbd');
    expect(kbdElements).toHaveLength(3);
  });
});
