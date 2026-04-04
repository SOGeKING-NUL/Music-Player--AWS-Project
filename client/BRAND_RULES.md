 Brand & Design Rules

## Color System

### Core Colors
- **Background**: Pure White (`#FFFFFF`)
- **Text Primary**: Pure Black (`#000000`)
- **Text Secondary**: Gray-700 (`#374151`)

### Accent Gradients
- **Primary Gradient**: 
  - `rgb(255, 100, 150)` → `rgb(100, 150, 255)` → `rgb(255, 200, 100)`
  - Used for: Primary buttons, active states, highlights

### Neutral Palette
- **White**: `#FFFFFF`
- **Gray-50**: `#F9FAFB`
- **Gray-100**: `#F3F4F6`
- **Gray-200**: `#E5E7EB`
- **Gray-400**: `#9CA3AF`
- **Black**: `#000000`

---

## Typography

### Font Family
**Primary Font**: `Geist Sans` (Vercel's modern font)
- Ultra-modern, clean, geometric
- Optimized for digital interfaces
- Used by: Vercel, Next.js documentation
- Fallback: `'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

**Alternative**: `Satoshi` - Modern, geometric, excellent for music apps

### Installation
```bash
npm install geist
```

```css
import 'geist/font/sans'
```

### Font Weights
- **Regular**: 400 (body text)
- **Medium**: 500 (labels, secondary headings)
- **Semibold**: 600 (primary headings, buttons)
- **Bold**: 700 (emphasis, large headings)

### Font Sizes
- **Heading 1**: 2.5rem (40px) - Page titles
- **Heading 2**: 2rem (32px) - Section titles
- **Heading 3**: 1.5rem (24px) - Card titles
- **Body Large**: 1.125rem (18px) - Important text
- **Body**: 1rem (16px) - Default text
- **Body Small**: 0.875rem (14px) - Captions, metadata
- **Caption**: 0.75rem (12px) - Timestamps, labels

---

## Button System

### Primary Button
**Component**: `NoiseBackground` wrapper with gradient

```tsx
<NoiseBackground
  containerClassName="w-fit p-2 rounded-full"
  gradientColors={[
    "rgb(255, 100, 150)",
    "rgb(100, 150, 255)",
    "rgb(255, 200, 100)"
  ]}
>
  <button className="rounded-full bg-white px-6 py-3 text-black font-semibold">
    Button Text
  </button>
</NoiseBackground>
```

**Usage**: Main actions (Add Artist, Save, Submit, Play)

### Secondary Button
**Component**: `HoverBorderGradient`

```tsx
<HoverBorderGradient
  containerClassName="rounded-full"
  as="button"
  className="bg-white text-black px-6 py-3 font-medium"
>
  Button Text
</HoverBorderGradient>
```

**Usage**: Secondary actions (Cancel, Edit, View More)

### Text Button
**Style**: Plain text with hover underline

```tsx
<button className="text-black hover:underline font-medium">
  Button Text
</button>
```

**Usage**: Tertiary actions (Skip, Learn More)

---

## Spacing System

### Scale (Tailwind)
- **xs**: 0.5rem (8px)
- **sm**: 0.75rem (12px)
- **md**: 1rem (16px)
- **lg**: 1.5rem (24px)
- **xl**: 2rem (32px)
- **2xl**: 3rem (48px)
- **3xl**: 4rem (64px)

### Component Spacing
- **Card Padding**: `p-6` (24px)
- **Section Margin**: `my-12` (48px)
- **Element Gap**: `gap-4` (16px)
- **Button Padding**: `px-6 py-3` (24px horizontal, 12px vertical)

---

## Shadows

### Elevation Levels
- **Level 1** (Cards): `shadow-sm` - `0 1px 2px 0 rgb(0 0 0 / 0.05)`
- **Level 2** (Modals): `shadow-md` - `0 4px 6px -1px rgb(0 0 0 / 0.1)`
- **Level 3** (Dropdowns): `shadow-lg` - `0 10px 15px -3px rgb(0 0 0 / 0.1)`
- **Level 4** (Overlays): `shadow-2xl` - `0 25px 50px -12px rgb(0 0 0 / 0.25)`

---

## Border Radius

### Scale
- **Small**: `rounded-md` (6px) - Input fields
- **Medium**: `rounded-lg` (8px) - Cards
- **Large**: `rounded-xl` (12px) - Modals
- **Full**: `rounded-full` - Buttons, avatars

---

## Component Rules

### Cards
```tsx
<div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
  {/* Content */}
</div>
```

### Forms
- **Input Fields**: White background, gray border, rounded-md
- **Labels**: Font-medium, text-sm, text-gray-700
- **Error Text**: text-red-600, text-sm
- **Helper Text**: text-gray-500, text-sm

### Modals
- **Overlay**: `bg-black/20` (20% opacity black)
- **Container**: White, rounded-xl, shadow-2xl, max-w-lg
- **Close Button**: Top-right, text button with X icon

- **Artist Pool Node**: Square hub (520x520) with interactive bubble scatter
- **Album Node**: Square, 160px, rounded-lg, shadow-md
- **Song Node**: Pill shape, rounded-full, 200px width, 48px height
- **Connection Lines**: 2px width, gray-300, curved

### Infinite Canvas Interactions
- **Center-Biased Scatter**: Bubbles cluster toward the center using a Gaussian-biased random distribution.
- **Spotlight Effect**: Bubbles grow by ~1.2x (SPOTLIGHT_SCALE) when hovered.
- **Push-Away Physics**: Nearby bubbles are displaced away from the cursor using vector math to create an organic, fluid feel.
- **Dynamic Sizing**: Bubbles automatically resize based on artist density to maintain a perfect non-overlapping layout.
- **Visual Padding**: Every bubble is wrapped in a 3px white ring + subtle shadow to ensure a clean, high-contrast look and feel.

---

## Animation Guidelines

### Transitions
- **Default**: `transition-all duration-200 ease-in-out`
- **Fast**: `duration-100` - Button clicks
- **Normal**: `duration-200` - Hover states
- **Slow**: `duration-300` - Modal open/close

### Hover States
- **Buttons**: `hover:scale-105` + shadow increase
- **Cards**: `hover:shadow-lg`
- **Links**: `hover:underline`

### Active States
- **Buttons**: `active:scale-98`
- **Inputs**: `focus:ring-2 ring-gray-300`

---

## Icon System

### Library
**Lucide React** - Consistent, minimal, open-source

### Sizes
- **Small**: 16px - Inline with text
- **Medium**: 20px - Buttons, labels
- **Large**: 24px - Headings, standalone
- **XL**: 32px - Feature icons

### Style
- **Stroke Width**: 2px (default)
- **Color**: Inherit from parent text color

---

## Accessibility Rules

### Contrast
- **Text on White**: Must be black or gray-700+
- **Minimum Ratio**: 4.5:1 for normal text, 3:1 for large text

### Focus States
- All interactive elements must have visible focus ring
- Use `focus:ring-2 focus:ring-gray-400 focus:outline-none`

### Alt Text
- All images must have descriptive alt text
- Decorative images: `alt=""`

### Keyboard Navigation
- All actions accessible via keyboard
- Tab order must be logical
- Escape closes modals

---

## Responsive Breakpoints

### Tailwind Defaults
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

### Mobile-First Approach
- Design for mobile first
- Enhance for larger screens
- Canvas: Disable on mobile, show list view

---

## Do's and Don'ts

### ✅ Do
- Use pure black and white
### 3. Glassmorphism & Blurs
*   Use `backdrop-blur-md` or `backdrop-blur-sm` for overlay elements.
*   Backgrounds should generally be semi-transparent when floating over the canvas (e.g. `bg-black/40`).

### 4. Node Headers & Structure
*   **No Navbars**: Nodes should not have distinct, separated navbars or divided headers (e.g., no `border-b` separating the header from the content). 
*   The content should flow seamlessly from the top of the node downwards to maintain a clean, flat aesthetic.

### 5. Button Shapes
*   **Pill-Shaped Buttons**: All action buttons must be fully rounded (`rounded-full` in Tailwind) to maintain uniformity across the app, replacing standard square or `rounded-md` buttons.
- Use gradient only for primary buttons and accents
- Keep generous white space
- Use Inter font consistently
- Round all corners
- Add subtle shadows for depth
- Animate interactions smoothly

### ❌ Don't
- Use dark mode (black and white only)
- Use colors outside the defined palette
- Use multiple font families
- Create sharp corners (except where specified)
- Overuse gradients
- Add heavy shadows
- Use slow animations (>300ms)

---

## Inspiration References

### Design Philosophy
- **Spotify**: Clean, content-first, bold typography
- **Apple Music**: Minimal, elegant, generous spacing
- **Linear**: Sharp, precise, modern

### Key Takeaways
- Content is king - let music be the focus
- White space creates breathing room
- Consistency builds trust
- Subtle animations delight users
