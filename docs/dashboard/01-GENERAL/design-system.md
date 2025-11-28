# Dashboard Design System

> **Complete design system** for dashboard components, colors, spacing, and patterns

## 🎨 Color Palette

### Primary Colors

```css
/* Primary Teal */
--color-primary: #31aba3;
--color-primary-hover: #2a9a92;
--color-primary-light: #31aba3 / 10%;
--color-primary-dark: #248580;

/* Background Gradients */
--gradient-card: linear-gradient(
  to bottom right,
  rgba(255, 255, 255, 0.7),
  rgba(229, 246, 253, 0.2),
  rgba(255, 255, 255, 0.7)
);

/* Card Hover Gradient */
--gradient-card-hover: linear-gradient(
  to bottom right,
  rgba(255, 255, 255, 0.75),
  rgba(229, 246, 253, 0.25),
  rgba(255, 255, 255, 0.75)
);
```

### Status Colors

```css
/* Success (Green) */
--color-success: #10b981;
--color-success-light: #d1fae5;
--color-success-dark: #059669;

/* Warning (Amber) */
--color-warning: #f59e0b;
--color-warning-light: #fef3c7;
--color-warning-dark: #d97706;

/* Error (Red) */
--color-error: #ef4444;
--color-error-light: #fee2e2;
--color-error-dark: #dc2626;

/* Info (Blue) */
--color-info: #3b82f6;
--color-info-light: #dbeafe;
--color-info-dark: #2563eb;
```

### Neutral Colors

```css
/* Text Colors */
--color-text-primary: #0f172a; /* slate-900 */
--color-text-secondary: #475569; /* slate-600 */
--color-text-tertiary: #94a3b8; /* slate-400 */

/* Background Colors */
--color-bg-primary: #ffffff;
--color-bg-secondary: #f8fafc; /* slate-50 */
--color-bg-tertiary: #f1f5f9; /* slate-100 */

/* Border Colors */
--color-border: #e2e8f0; /* slate-200 */
--color-border-light: #f1f5f9; /* slate-100 */
--color-border-dark: #cbd5e1; /* slate-300 */
```

### Section-Specific Colors (SOAP Notes)

```css
/* Subjective */
--color-subjective: #3b82f6; /* blue-500 */
--color-subjective-bg: #eff6ff; /* blue-50 */
--color-subjective-border: #bfdbfe; /* blue-200 */

/* Objective */
--color-objective: #31aba3; /* teal */
--color-objective-bg: #f0fdfa; /* teal-50 */
--color-objective-border: #5eead4; /* teal-200 */

/* Assessment */
--color-assessment: #a855f7; /* purple-500 */
--color-assessment-bg: #faf5ff; /* purple-50 */
--color-assessment-border: #c084fc; /* purple-200 */

/* Plan */
--color-plan: #10b981; /* emerald-500 */
--color-plan-bg: #ecfdf5; /* emerald-50 */
--color-plan-border: #6ee7b7; /* emerald-200 */
```

## 📏 Spacing System

### Base Unit: 4px

All spacing uses multiples of 4px:

```css
/* Spacing Scale */
--space-0: 0px;
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-6: 24px;
--space-8: 32px;
--space-12: 48px;
--space-16: 64px;
```

### Common Patterns

```css
/* Card Padding */
.card-padding: 24px (space-6);

/* Card Gap (Between Cards) */
.card-gap: 16px (space-4);

/* Section Spacing */
.section-spacing: 24px (space-6);

/* Content Padding (Page) */
.content-padding: 24px (space-6);

/* Inner Element Spacing */
.element-spacing: 8px (space-2);
```

## 🔤 Typography

### Font Families

```css
/* Primary Font (System UI) */
--font-sans:
  ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
  Roboto, "Helvetica Neue", Arial, sans-serif;

/* Monospace (Code, IDs) */
--font-mono:
  ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono",
  monospace;
```

### Type Scale

```css
/* Headings */
--text-3xl: 30px / 36px; /* 1.2 line-height */
--text-2xl: 24px / 32px; /* 1.333 line-height */
--text-xl: 20px / 28px; /* 1.4 line-height */
--text-lg: 18px / 28px; /* 1.556 line-height */

/* Body */
--text-base: 16px / 24px; /* 1.5 line-height */
--text-sm: 14px / 20px; /* 1.429 line-height */
--text-xs: 12px / 16px; /* 1.333 line-height */
```

### Font Weights

```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Usage Patterns

```css
/* Page Title */
.page-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  line-height: 32px;
  color: var(--color-text-primary);
}

/* Section Title */
.section-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  line-height: 28px;
  color: var(--color-text-primary);
}

/* Card Title */
.card-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  line-height: 28px;
  color: var(--color-text-primary);
}

/* Body Text */
.body-text {
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  line-height: 24px;
  color: var(--color-text-secondary);
}

/* Caption / Subtitles */
.caption {
  font-size: var(--text-sm);
  font-weight: var(--font-normal);
  line-height: 20px;
  color: var(--color-text-tertiary);
}
```

## 🎴 Card Components

### Standard Card

```css
.card {
  background: var(--gradient-card);
  border: 1px solid rgba(49, 171, 163, 0.2); /* teal-200/40 */
  border-radius: 12px; /* rounded-xl */
  padding: 24px; /* p-6 */
  box-shadow:
    0 10px 15px -3px rgba(16, 185, 129, 0.05),
    0 4px 6px -2px rgba(16, 185, 129, 0.05); /* shadow-lg shadow-teal-500/5 */
  backdrop-filter: blur(12px); /* backdrop-blur-md */
  transition: all 200ms ease;
}

.card:hover {
  background: var(--gradient-card-hover);
  box-shadow:
    0 20px 25px -5px rgba(16, 185, 129, 0.1),
    0 10px 10px -5px rgba(16, 185, 129, 0.04);
  transform: translateY(-1px);
}
```

### Card Header

```css
.card-header {
  padding-bottom: 16px; /* pb-4 */
  margin-bottom: 16px; /* mb-4 */
  border-bottom: 1px solid var(--color-border-light);
}
```

### Card Content

```css
.card-content {
  padding: 0; /* No padding (handled by parent) */
}
```

## 🔘 Button Styles

### Primary Button

```css
.button-primary {
  background: var(--color-primary);
  color: white;
  padding: 8px 16px; /* px-4 py-2 */
  border-radius: 6px; /* rounded-md */
  font-weight: var(--font-medium);
  transition: all 100ms ease;
}

.button-primary:hover {
  background: var(--color-primary-hover);
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
```

### Ghost Button

```css
.button-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 100ms ease;
}

.button-ghost:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}
```

### Button Group (Date Filter)

```css
.button-group {
  display: inline-flex;
  border-radius: 8px; /* rounded-lg */
  border: 1px solid var(--color-border);
  background: rgba(248, 250, 252, 0.5); /* slate-50/50 */
  padding: 4px; /* p-1 */
}

.button-group-item {
  padding: 6px 12px; /* px-3 py-1.5 */
  border-radius: 6px; /* rounded-md */
  font-weight: var(--font-medium);
  transition: all 100ms ease;
}

.button-group-item.active {
  background: var(--color-primary);
  color: white;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
```

## 📊 Stat Card

```css
.stat-card {
  /* Inherits .card styles */
}

.stat-card-value {
  font-size: 30px; /* text-3xl */
  font-weight: var(--font-bold);
  color: var(--color-text-primary);
  line-height: 36px;
}

.stat-card-title {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  margin-bottom: 8px; /* mb-2 */
}

.stat-card-subtitle {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin-top: 4px; /* mt-1 */
}

.stat-card-icon {
  width: 48px; /* w-12 */
  height: 48px; /* h-12 */
  border-radius: 50%;
  background: var(--color-primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
}
```

## 🎭 Animations

### Entrance Animations

```css
/* Fade In + Slide Up */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in-up {
  animation: fadeInUp 300ms ease-out;
}

/* Card In (with delay) */
.card-in {
  animation: fadeInUp 300ms ease-out;
}

.card-in-delay-1 {
  animation: fadeInUp 300ms ease-out 100ms both;
}

.card-in-delay-2 {
  animation: fadeInUp 300ms ease-out 200ms both;
}

.card-in-delay-3 {
  animation: fadeInUp 300ms ease-out 300ms both;
}
```

### Transitions

```css
/* Standard Transition */
.transition-smooth {
  transition: all 200ms ease;
}

/* Fast Transition */
.transition-fast {
  transition: all 100ms ease;
}
```

## 🖼️ Shadows

```css
/* Card Shadow */
--shadow-card:
  0 10px 15px -3px rgba(16, 185, 129, 0.05),
  0 4px 6px -2px rgba(16, 185, 129, 0.05);

/* Card Hover Shadow */
--shadow-card-hover:
  0 20px 25px -5px rgba(16, 185, 129, 0.1),
  0 10px 10px -5px rgba(16, 185, 129, 0.04);

/* Button Shadow */
--shadow-button: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
```

## 📐 Border Radius

```css
--radius-sm: 4px; /* rounded */
--radius-md: 6px; /* rounded-md */
--radius-lg: 8px; /* rounded-lg */
--radius-xl: 12px; /* rounded-xl */
--radius-full: 9999px; /* rounded-full */
```

## 🔄 Loading States

### Skeleton Loading

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg-secondary) 0%,
    var(--color-bg-tertiary) 50%,
    var(--color-bg-secondary) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-md);
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
```

### Spinner

```css
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

---

**Usage:** Reference this design system when creating new components. Maintain consistency with these values across all dashboard components.
