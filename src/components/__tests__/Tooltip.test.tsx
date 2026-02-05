import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { Tooltip, TooltipWithShortcut } from '../Tooltip';

describe('Tooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('renders children', () => {
    render(
      <Tooltip content="Help text">
        <button>Hover me</button>
      </Tooltip>
    );

    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('does not show tooltip initially', () => {
    render(
      <Tooltip content="Help text">
        <button>Hover me</button>
      </Tooltip>
    );

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows tooltip after hover with delay', async () => {
    render(
      <Tooltip content="Help text" delay={300}>
        <button>Hover me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me').parentElement;
    fireEvent.mouseEnter(trigger!);

    // Tooltip not visible yet
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    // Advance time past delay
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText('Help text')).toBeInTheDocument();
  });

  it('hides tooltip on mouse leave', async () => {
    render(
      <Tooltip content="Help text" delay={0}>
        <button>Hover me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me').parentElement;

    // Show tooltip
    fireEvent.mouseEnter(trigger!);
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    // Hide tooltip
    fireEvent.mouseLeave(trigger!);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('does not show tooltip when disabled', () => {
    render(
      <Tooltip content="Help text" disabled delay={0}>
        <button>Hover me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me').parentElement;
    fireEvent.mouseEnter(trigger!);
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows tooltip on focus', () => {
    render(
      <Tooltip content="Help text" delay={0}>
        <button>Focus me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Focus me').parentElement;
    fireEvent.focus(trigger!);
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('hides tooltip on blur', () => {
    render(
      <Tooltip content="Help text" delay={0}>
        <button>Focus me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Focus me').parentElement;

    // Show tooltip
    fireEvent.focus(trigger!);
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    // Hide tooltip
    fireEvent.blur(trigger!);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('applies top position by default', () => {
    render(
      <Tooltip content="Help text" delay={0}>
        <button>Hover me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me').parentElement;
    fireEvent.mouseEnter(trigger!);
    act(() => {
      vi.advanceTimersByTime(0);
    });

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.className).toContain('bottom-full');
  });

  it('applies bottom position', () => {
    render(
      <Tooltip content="Help text" position="bottom" delay={0}>
        <button>Hover me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me').parentElement;
    fireEvent.mouseEnter(trigger!);
    act(() => {
      vi.advanceTimersByTime(0);
    });

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.className).toContain('top-full');
  });

  it('applies left position', () => {
    render(
      <Tooltip content="Help text" position="left" delay={0}>
        <button>Hover me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me').parentElement;
    fireEvent.mouseEnter(trigger!);
    act(() => {
      vi.advanceTimersByTime(0);
    });

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.className).toContain('right-full');
  });

  it('applies right position', () => {
    render(
      <Tooltip content="Help text" position="right" delay={0}>
        <button>Hover me</button>
      </Tooltip>
    );

    const trigger = screen.getByText('Hover me').parentElement;
    fireEvent.mouseEnter(trigger!);
    act(() => {
      vi.advanceTimersByTime(0);
    });

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.className).toContain('left-full');
  });
});

describe('TooltipWithShortcut', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('renders content with shortcut', () => {
    render(
      <TooltipWithShortcut content="Save" shortcut="⌘S" delay={0}>
        <button>Save button</button>
      </TooltipWithShortcut>
    );

    const trigger = screen.getByText('Save button').parentElement;
    fireEvent.mouseEnter(trigger!);
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByText('Save (⌘S)')).toBeInTheDocument();
  });

  it('passes through position prop', () => {
    render(
      <TooltipWithShortcut content="Save" shortcut="⌘S" position="bottom" delay={0}>
        <button>Save button</button>
      </TooltipWithShortcut>
    );

    const trigger = screen.getByText('Save button').parentElement;
    fireEvent.mouseEnter(trigger!);
    act(() => {
      vi.advanceTimersByTime(0);
    });

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.className).toContain('top-full');
  });
});
