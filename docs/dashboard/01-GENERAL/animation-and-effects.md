# Animation & Effects Guidelines

> **Purpose:** Subtle, professional animations and glassmorphism effects for B2B SaaS veterinary application  
> **Last Updated:** 2025-11-28

## 🎯 Design Philosophy

Animations and effects should be:

- **Subtle** - Not distracting from critical veterinary workflows
- **Purposeful** - Enhance usability, not just decoration
- **Professional** - Appropriate for B2B SaaS in healthcare
- **Performant** - Smooth 60fps, no jank
- **Accessible** - Respect `prefers-reduced-motion`

## 🎨 Glassmorphism Effects

### Standard Card Glassmorphism

**Base Style:**

```typescript
className =
  "rounded-xl border border-teal-200/40 bg-gradient-to-br from-white/70 via-teal-50/20 to-white/70 shadow-lg shadow-teal-500/5 backdrop-blur-md";
```

**Hover State:**

```typescript
className =
  "hover:from-white/75 hover:via-teal-50/25 hover:to-white/75 hover:shadow-xl hover:shadow-teal-500/10";
```

**Breakdown:**

- `backdrop-blur-md` - Subtle blur (8px) for glass effect
- `from-white/70` - 70% opacity white start
- `via-teal-50/20` - 20% opacity teal tint middle
- `to-white/70` - 70% opacity white end
- `shadow-teal-500/5` - Very subtle teal shadow (5% opacity)
- Hover increases opacity slightly and shadow intensity

### Warning/Attention Cards

**Amber Glassmorphism:**

```typescript
className =
  "border-amber-200/40 bg-gradient-to-br from-amber-50/20 via-white/70 to-white/70 shadow-lg shadow-amber-500/5 backdrop-blur-md";
```

### Success Cards

**Green Glassmorphism:**

```typescript
className =
  "border-emerald-200/40 bg-gradient-to-br from-emerald-50/20 via-white/70 to-white/70 shadow-lg shadow-emerald-500/5 backdrop-blur-md";
```

## ⚡ Animation Patterns

### 1. Smooth Transitions

**Standard Transition:**

```typescript
className = "transition-smooth";
```

**CSS Definition:**

```css
.transition-smooth {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Use For:**

- Hover states
- Color changes
- Size changes
- Opacity changes

### 2. Card Entry Animations

**Staggered Card Entry:**

```typescript
// First card
className = "animate-card-in";

// Second card (100ms delay)
className = "animate-card-in-delay-1";

// Third card (200ms delay)
className = "animate-card-in-delay-2";

// Fourth card (300ms delay)
className = "animate-card-in-delay-3";
```

**Card Content Entry:**

```typescript
className = "animate-card-content-in";
```

**CSS Definitions:**

```css
.animate-card-in {
  animation: cardIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  opacity: 0;
  transform: translateY(8px);
}

.animate-card-content-in {
  animation: cardContentIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.2s forwards;
  opacity: 0;
}

.animate-card-in-delay-1 {
  animation: cardIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.1s forwards;
  opacity: 0;
  transform: translateY(8px);
}

.animate-card-in-delay-2 {
  animation: cardIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.2s forwards;
  opacity: 0;
  transform: translateY(8px);
}

.animate-card-in-delay-3 {
  animation: cardIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.3s forwards;
  opacity: 0;
  transform: translateY(8px);
}

@keyframes cardIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes cardContentIn {
  to {
    opacity: 1;
  }
}
```

### 3. Hover Effects

**Card Hover:**

```typescript
className =
  "hover:scale-[1.02] hover:shadow-xl hover:shadow-teal-500/10 transition-smooth";
```

**Button Hover:**

```typescript
className = "hover:bg-[#2a9a92] hover:shadow-md transition-smooth";
```

**Icon Hover:**

```typescript
className = "hover:text-[#31aba3] transition-smooth";
```

### 4. Loading States

**Pulse Animation:**

```typescript
className = "animate-pulse";
```

**Spinner:**

```typescript
className = "animate-spin";
```

**Skeleton Loader:**

```typescript
className = "animate-pulse bg-slate-100 rounded-xl";
```

### 5. Number Ticker Animation

**Animated Number Count:**

```typescript
<NumberTicker value={count} delay={800} />
```

**Use For:**

- Stat card values
- Metrics that change
- Counters

### 6. Fade In Animations

**Simple Fade:**

```typescript
className = "animate-in fade-in-50";
```

**Fade with Slide:**

```typescript
className = "animate-in fade-in-50 slide-in-from-bottom-4";
```

## 🎭 Component-Specific Animations

### Stat Cards

**Entry:**

- Staggered entry (100ms between cards)
- Fade + slight translate up
- Number ticker animation

**Hover:**

- Subtle scale (1.02x)
- Shadow increase
- Gradient shift

### Case Cards

**Entry:**

- Staggered grid entry
- Fade + translate

**Hover:**

- Scale 1.02x
- Shadow increase
- Border glow

### Button Groups

**Active State Change:**

- Smooth color transition (200ms)
- Shadow change

**Hover:**

- Background color shift
- Subtle scale (1.01x)

### Dropdowns/Menus

**Open/Close:**

- Fade + scale (0.95 → 1.0)
- 200ms duration

### Collapsible Sections

**Expand/Collapse:**

- Height transition
- Fade content
- 200ms duration

## 📐 Animation Timing

### Duration Guidelines

- **Micro-interactions:** 150-200ms (button clicks, hover)
- **Card entry:** 400ms (with stagger delays)
- **Page transitions:** 300-400ms
- **Loading states:** Continuous (pulse, spin)
- **Number animations:** 800-1200ms (ticker)

### Easing Functions

**Standard (Most Common):**

```css
cubic-bezier(0.4, 0, 0.2, 1) /* ease-in-out */
```

**Smooth Entry:**

```css
cubic-bezier(0.16, 1, 0.3, 1) /* ease-out-expo */
```

**Snappy:**

```css
cubic-bezier(0.34, 1.56, 0.64, 1) /* bounce */
```

## ♿ Accessibility

### Respect Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Implementation:**

```typescript
// Use CSS media query, or conditionally apply classes
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
```

### Focus Indicators

**Visible Focus:**

```typescript
className =
  "focus:ring-2 focus:ring-[#31aba3] focus:ring-offset-2 transition-smooth";
```

## 🎨 Glassmorphism Variations

### Light Glass (Default)

```typescript
bg-gradient-to-br from-white/70 via-teal-50/20 to-white/70
backdrop-blur-md
```

### Medium Glass

```typescript
bg-gradient-to-br from-white/60 via-teal-50/30 to-white/60
backdrop-blur-lg
```

### Heavy Glass (Rare - for modals)

```typescript
bg-gradient-to-br from-white/50 via-teal-50/40 to-white/50
backdrop-blur-xl
```

## ✅ Animation Checklist

When implementing animations:

- [ ] Animation duration ≤ 400ms (except loading)
- [ ] Uses `transition-smooth` or appropriate easing
- [ ] Respects `prefers-reduced-motion`
- [ ] Glassmorphism uses `backdrop-blur-md` (subtle)
- [ ] Hover effects are subtle (scale ≤ 1.02x)
- [ ] Staggered entries for card grids
- [ ] Number tickers for stat values
- [ ] Loading states use pulse/spin
- [ ] Focus indicators visible
- [ ] Performance: 60fps, no jank

## 🚫 What NOT to Do

- ❌ No bouncy/playful animations (too casual for B2B)
- ❌ No excessive blur (> 12px)
- ❌ No long animations (> 500ms for interactions)
- ❌ No auto-playing animations
- ❌ No animations that block content
- ❌ No jarring transitions
- ❌ No animations on critical error states

## 📚 Examples

### Complete Card with Animations

```typescript
<Card className="group transition-smooth relative overflow-hidden rounded-xl border border-teal-200/40 bg-gradient-to-br from-white/70 via-teal-50/20 to-white/70 shadow-lg shadow-teal-500/5 backdrop-blur-md hover:scale-[1.02] hover:from-white/75 hover:via-teal-50/25 hover:to-white/75 hover:shadow-xl hover:shadow-teal-500/10">
  <CardContent className="animate-card-content-in p-6">
    {/* Content */}
  </CardContent>
</Card>
```

### Button Group with Transitions

```typescript
<div className="inline-flex rounded-lg border border-slate-200 bg-slate-50/50 p-1 backdrop-blur-sm">
  <Button
    variant={active ? "default" : "ghost"}
    className="transition-smooth hover:scale-[1.01]"
  >
    Option
  </Button>
</div>
```

---

**Remember:** Subtle, professional, purposeful. Enhance the experience without distracting from critical veterinary workflows.
