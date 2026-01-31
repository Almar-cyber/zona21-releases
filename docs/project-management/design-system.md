# Design System & Growth Principles - Zona21

**Version:** 0.4.9+
**Last Updated:** January 30, 2026
**Status:** ✅ Approved (97% Compliance)

## Overview

This document consolidates Zona21's design system guidelines, UI/UX principles, cognitive load management strategies, and growth.design best practices.

## Table of Contents

1. [Design System Tokens](#design-system-tokens)
2. [Component Patterns](#component-patterns)
3. [Growth Principles](#growth-principles)
4. [Cognitive Load Management](#cognitive-load-management)
5. [Menu System Integration](#menu-system-integration)
6. [Quality Assurance](#quality-assurance)

---

## Design System Tokens

### Colors & Backgrounds

#### Base Theme (Dark)
```css
--bg-primary: #0d0d1a;           /* Main background */
--bg-primary-opacity: #0d0d1a/95; /* With transparency */
--glassmorphism: backdrop-blur-xl; /* Glass effect */
```

#### Semi-Transparent Overlays
```css
--overlay-subtle: bg-white/5;     /* Very subtle hover */
--overlay-medium: bg-white/10;    /* Selected/active states */
--overlay-visible: bg-white/20;   /* More prominent */
```

#### Hover States
```css
--hover-light: hover:bg-white/5;
--hover-medium: hover:bg-white/8;
--hover-strong: hover:bg-white/10;
```

#### Borders
```css
--border-primary: border-white/10;
--border-subtle: border-white/5;
--border-darker: border-gray-700;
```

#### Accent Colors

**Primary (Purple/Indigo):**
```css
--accent-purple: bg-purple-500;
--accent-purple-hover: bg-purple-600;
--accent-indigo: bg-indigo-600/20;
--accent-gradient: from-purple-500 to-pink-500;
--accent-gradient-hover: from-purple-600 to-pink-600;
```

**Semantic Colors:**
```css
--success: bg-green-500;        --success-light: bg-green-500/20;
--danger: bg-red-500;           --danger-light: bg-red-500/20;
--warning: bg-yellow-400;       --warning-light: bg-yellow-500/20;
--favorite: bg-yellow-400;      /* Star/favorite indicator */
--dirty: bg-orange-400;         /* Unsaved changes */
```

### Typography

#### Sizes
```css
--text-xs: 12px;      /* Extra small labels */
--text-sm: 14px;      /* Regular body text */
--text-md: 16px;      /* Emphasized text */
--text-lg: 18px;      /* Section headers */
--text-xl: 20px;      /* Tab titles */
--text-2xl: 24px;     /* Page titles */
```

#### Weights
```css
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

#### Colors
```css
--text-primary: text-white;
--text-secondary: text-gray-300;
--text-tertiary: text-gray-500;
--text-muted-90: text-white/90;
--text-muted-70: text-white/70;
--text-muted-50: text-white/50;
--text-muted-30: text-white/30;
```

### Spacing

#### Padding
```css
--padding-sm: px-2 py-1;    /* Compact elements */
--padding-md: px-3 py-2;    /* Regular buttons */
--padding-lg: px-4 py-3;    /* Prominent actions */
--padding-xl: px-6 py-4;    /* Hero elements */
```

#### Gap
```css
--gap-1: 0.25rem;  /* 4px */
--gap-2: 0.5rem;   /* 8px */
--gap-3: 0.75rem;  /* 12px */
--gap-4: 1rem;     /* 16px */
--gap-6: 1.5rem;   /* 24px */
```

### Border Radius
```css
--radius-sm: 4px;         /* rounded */
--radius-md: 6px;         /* rounded-md */
--radius-lg: 8px;         /* rounded-lg (standard) */
--radius-full: 9999px;    /* rounded-full (pills/circles) */
```

### Transitions

#### Durations
```css
--duration-fast: 150ms;
--duration-standard: 200ms;
--duration-slow: 300ms;
```

#### Timing Functions
```css
--ease-default: ease-in-out;
--ease-custom: cubic-bezier(0.4, 0, 0.2, 1);
--ease-smooth: cubic-bezier(0.25, 0.46, 0.45, 0.94);
```

#### Types
```css
--transition-colors: transition-colors;
--transition-all: transition-all;
--transition-opacity: transition-opacity;
--transition-transform: transition-transform;
```

### Z-Index Layering

```css
--z-sidebar: 60;
--z-volume-menu: 70;
--z-contextual-menu: 110;
--z-tabbar: 115;
--z-toolbar: 120;
--z-dropdown: 140;
--z-modal-overlay: 200;
```

---

## Component Patterns

### Buttons

#### Standard Button
```tsx
className="
  px-3 py-2
  bg-white/5 hover:bg-white/10
  rounded-lg
  text-white font-medium
  transition-colors
"
```

#### Gradient Button (Primary CTA)
```tsx
className="
  px-6 py-3
  bg-gradient-to-r from-purple-500 to-pink-500
  hover:from-purple-600 hover:to-pink-600
  rounded-lg
  text-white font-medium
  transition-all
  shadow-[0_4px_14px_rgba(79,70,229,0.4)]
  hover:shadow-[0_6px_20px_rgba(79,70,229,0.5)]
"
```

#### Disabled State
```tsx
className="
  disabled:opacity-50
  disabled:cursor-not-allowed
  disabled:from-gray-700 disabled:to-gray-700
"
```

### Input Fields

#### Standard Input
```tsx
className="
  px-3 py-2
  bg-white/5
  border border-white/10
  rounded-lg
  text-white
  placeholder-white/30
  focus:border-purple-500
  transition-colors
"
```

### Contextual Menu

#### Base Structure
```tsx
<div className="
  fixed top-0 bottom-0 z-[110]
  bg-[#0d0d1a]/95 backdrop-blur-xl
  border-r border-white/10
  flex flex-col
  transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)
">
  {/* Content */}
</div>
```

#### Floating Icon (Collapsed)
```tsx
<button className="
  w-10 h-10
  flex items-center justify-center
  rounded-lg
  bg-white/5 hover:bg-white/10
  transition-all duration-200
">
  <span className="material-icons text-white/70 group-hover:text-white">
    menu
  </span>
</button>
```

### Menu Section

```tsx
<div className="border-b border-white/5">
  <button className="
    w-full px-4 py-3
    flex items-center justify-between
    text-left
    hover:bg-white/5
    transition-colors
  ">
    <div className="flex items-center gap-3">
      <span className="material-icons text-white/70 text-lg">icon</span>
      <span className="text-sm font-medium text-white/90">Section Title</span>
    </div>
  </button>

  <div className="px-4 pb-4">
    {/* Section content */}
  </div>
</div>
```

---

## Growth Principles

### 1. Progressive Disclosure

**Principle:** Reveal complexity gradually, only when needed.

**Application:**
- Show essential features first (marking, navigation)
- Reveal AI features after user masters basics
- Contextual tooltips appear on first use only
- Advanced features hidden until user ready

**Example:**
```typescript
// Onboarding stages
const STAGES = {
  novice: {
    showChecklist: true,
    showTooltips: 'all',
    showMilestones: true
  },
  intermediate: {
    showChecklist: 'collapsed',
    showTooltips: 'advanced-only',
    showMilestones: 'major'
  },
  expert: {
    showChecklist: false,
    showTooltips: 'new-features-only',
    showMilestones: 'significant-only'
  }
};
```

### 2. Aha! Moment Design

**Goal:** Get users to first value recognition in < 2 minutes.

**Key Aha Moments:**
1. **First keyboard marking** (A/F/D) → "This is so much faster!"
2. **Real-time counters** → "I understand the approval system"
3. **Smart Culling saves time** → "AI actually picked the best photos!"
4. **Smart Rename organizes** → "Now I can find everything!"

**Optimization:**
- Guide to first keyboard shortcut within 30 seconds
- Show immediate visual feedback (badges, counters)
- Celebrate first completed action

### 3. Goal Gradient Effect

**Principle:** Motivation increases as users approach completion.

**Implementation:**
```tsx
// Progress visualization
<div className="mb-4">
  <div className="text-sm text-white/70 mb-2">
    First Culling: {marked} / 20 photos
  </div>
  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
    <div
      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
      style={{ width: `${(marked / 20) * 100}%` }}
    />
  </div>
</div>
```

**Milestones:**
- 5 photos: "Getting started!"
- 20 photos: "Novice Curator" badge
- 100 photos: "Quick Curator" badge
- 1000 photos: "Pro Curator" badge

### 4. One Thing at a Time

**Critical Rule:** Never show more than 1 onboarding element simultaneously.

**Priority Order:**
1. **Milestone** (highest) - Achievements and celebrations
2. **Checklist** (medium) - Progress tracking
3. **Tooltip** (low) - Contextual learning
4. **Pro Tip** (lowest) - Optimizations

**Implementation:**
```typescript
interface OnboardingQueue {
  activeElement: 'milestone' | 'checklist' | 'tooltip' | 'pro-tip' | null;
  queue: OnboardingElement[];
}

// Only show next element when user interacts with current
```

### 5. Respect User Intent

**Principle:** Never interrupt users mid-flow.

**Best Practices:**
- ✅ Milestone appears AFTER export (task complete)
- ✅ Pro tip appears when user pauses (3s no action)
- ✅ Checklist only visible during low-activity
- ❌ Never during rapid marking
- ❌ Never during scroll/navigation

**Context Detection:**
```typescript
interface UserContext {
  isActivelyWorking: boolean;  // Rapid marking
  isPaused: boolean;            // 3+ seconds idle
  isExploring: boolean;         // Browsing without action
  justFinishedTask: boolean;    // Exported, completed
}

// Only show onboarding when isPaused or justFinishedTask
```

### 6. Celebration Moments

**Principle:** Recognize achievements immediately.

**Implementation:**
```tsx
// After completing action
showCelebration({
  title: "You organized 250 photos!",
  message: "That's 2 hours saved compared to manual organization",
  confetti: true,
  sound: true
});
```

**Trigger Points:**
- First import complete
- 100 photos marked
- First collection created
- Smart culling used
- Instagram post scheduled

---

## Cognitive Load Management

### Avoiding Information Overload

**Problem:** Too many onboarding elements = overwhelmed users

**Solution:** Progressive, context-aware UI

#### Stage-Based Visibility

**Novice (0-50 photos):**
- Checklist visible
- Tooltips active
- Milestones celebrated
- Empty states educational

**Intermediate (51-500 photos):**
- Checklist auto-collapses
- Tooltips reduced (advanced features only)
- Milestones less frequent
- Empty states simplified

**Expert (500+ photos):**
- No checklist
- No tooltips (except new features)
- Milestones only major (1000, 5000)
- Empty states minimal

### Empty State Patterns

#### Good Empty State
```tsx
<div className="flex flex-col items-center justify-center py-12">
  <span className="material-icons text-white/30 text-6xl mb-4">
    photo_library
  </span>
  <h3 className="text-lg font-medium text-white/90 mb-2">
    No photos yet
  </h3>
  <p className="text-sm text-white/50 mb-6 text-center max-w-md">
    Import your first photos to start organizing
  </p>
  <button className="mh-btn mh-btn-indigo">
    <span className="material-icons mr-2">add_photo_alternate</span>
    Import Photos
  </button>
</div>
```

#### Bad Empty State (Avoid)
```tsx
// ❌ Too verbose, no clear action
<div>No content available in this section at the moment.</div>
```

### Microcopy Principles

**Be Concise:**
- ✅ "No photos yet"
- ❌ "There are currently no photos available in this collection"

**Be Actionable:**
- ✅ "Import your first photos to start organizing"
- ❌ "You can import photos if you want"

**Be Encouraging:**
- ✅ "Great! 50 photos organized 📸"
- ❌ "Task completed successfully"

---

## Menu System Integration

### Contextual Menu Architecture

Each tab type has specific menus:

#### HomeTab
- **Left:** Volumes, folders, collections navigation
- **Right:** File operations, AI tools, bulk actions

#### ViewerTab
- **Left:** File info, navigation, related files
- **Right:** Zoom, metadata, notes, marking tools

#### CompareTab
- **Left:** Asset list, decisions summary
- **Right:** Layout, zoom/pan sync, marking

#### BatchEditTab
- **Left:** Preview grid, progress, results
- **Right:** Operations, presets, actions

### Integration Steps

1. **Import Menu Component**
```typescript
import { ViewerTabMenu } from '../ViewerTabMenu';
```

2. **Add to Layout**
```tsx
<>
  <ViewerTabMenu
    asset={asset}
    zoom={zoom}
    onZoomIn={handleZoomIn}
    onZoomOut={handleZoomOut}
    // ... other props
  />

  {/* Tab content */}
</>
```

3. **Connect Handlers**
```typescript
const handleZoomIn = () => setZoom(z => Math.min(z * 1.2, 5));
const handleZoomOut = () => setZoom(z => Math.max(z / 1.2, 0.1));
```

### Mobile Responsive Behavior

```typescript
// Auto-adapt to mobile
const { isMobile } = useResponsive();

<ContextualMenu
  side="left"
  isCollapsed={isCollapsed}
  onToggleCollapse={handleToggle}
  width={isMobile ? window.innerWidth : 300}
  className={isMobile ? 'w-full' : ''}
/>
```

**Mobile Features:**
- Full-width overlay
- Swipe to close gestures
- Touch-friendly targets (48x48px min)
- Auto-collapse on small screens
- Safe area insets support

---

## Quality Assurance

### Design System Compliance: 97%

**Analysis Date:** January 30, 2026
**Components Analyzed:** 8
**Patterns Extracted:** 10 categories

### Component Compliance

| Component | Compliance | Issues |
|-----------|------------|--------|
| ContextualMenu | 98% | 1 suggestion (border conditional) |
| MenuSection | 96% | 1 fix needed (duration-250 invalid) |
| HomeTabMenu | 100% | None |
| ViewerTabMenu | 100% | None |
| CompareTabMenu | 100% | None |
| BatchEditTabMenu | 100% | None |
| InstagramTab | 100% | None |
| BatchEditTab | 100% | None |

### Required Fixes

**1. MenuSection.tsx - Invalid Tailwind Duration**
```typescript
// Line 128 - BEFORE:
transition-all duration-250 ease-in-out

// AFTER:
transition-all duration-200 ease-in-out
```

**2. ContextualMenu.tsx - Conditional Border**
```typescript
// Line 134 - BEFORE:
border-r border-white/10

// AFTER:
${side === 'left' ? 'border-r' : 'border-l'} border-white/10
```

### Category Compliance

| Category | Compliance |
|----------|------------|
| Colors & Backgrounds | 100% ✅ |
| Typography | 100% ✅ |
| Spacing | 100% ✅ |
| Buttons | 100% ✅ |
| Border Radius | 100% ✅ |
| Transitions | 98% ⚠️ (1 fix) |
| Z-Index | 100% ✅ |
| Icons | 100% ✅ |
| Input Fields | 100% ✅ |
| Shadows | 100% ✅ |

### Best Practices Applied

**1. Glassmorphism**
- Consistent use of `backdrop-blur-xl` and `bg-[#0d0d1a]/95`

**2. Purple Gradient**
- Standard `from-purple-500 to-pink-500` for all CTAs

**3. Opacity Scale**
- Clear hierarchy: `/90`, `/70`, `/50`, `/30` for text

**4. Border Hierarchy**
- `/10` for primary borders
- `/5` for subtle dividers

**5. Spacing System**
- Consistent multiples of 1-6 (Tailwind scale)

### Accessibility

**Implemented:**
- ✅ Clear labels on all buttons
- ✅ `aria-label` on icon-only buttons
- ✅ Keyboard shortcuts documented
- ✅ Focus indicators visible
- ✅ Color contrast meets WCAG AA

**Keyboard Navigation:**
- Tab through interactive elements
- Escape closes modals/menus
- Arrow keys for grid navigation
- Shortcuts for common actions

### Performance Optimizations

**Applied:**
- Transitions use GPU: `cubic-bezier`, `transform`
- `will-change` hints via transforms
- Smooth animations (200-300ms)
- Debounced resize handlers
- Memoized heavy components

---

## Checklist for New Components

### Before Implementation

- [ ] Review design tokens (colors, spacing, typography)
- [ ] Check similar components for patterns
- [ ] Plan responsive behavior
- [ ] Consider mobile interactions
- [ ] Document keyboard shortcuts

### During Implementation

- [ ] Use standard spacing (gap-2, gap-3, gap-4)
- [ ] Apply correct z-index layer
- [ ] Add smooth transitions (200ms standard)
- [ ] Include hover states (hover:bg-white/10)
- [ ] Use rounded-lg for corners
- [ ] Apply text-white/70 for secondary text
- [ ] Add material-icons for icons

### After Implementation

- [ ] Test on mobile (responsive, touch-friendly)
- [ ] Verify keyboard navigation
- [ ] Check dark theme consistency
- [ ] Validate against design system (run QA)
- [ ] Document component usage
- [ ] Add to Storybook (if applicable)

---

## Related Documentation

- [Design System QA Report](../archive/deprecated/DESIGN_SYSTEM_QA_REPORT.md) (Detailed analysis - archived)
- [Menu Integration Guide](../developer/MENU_INTEGRATION_GUIDE.md) (Step-by-step)
- [User Guide: Features](../user-guide/features-overview.md)
- [Developer Guide: Architecture](../developer/architecture.md)

---

**Last Updated:** January 30, 2026
**Version:** 0.4.9
**Compliance:** 97% ✅ Approved
