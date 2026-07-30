# AI Agent Workspace Rules: Styling & Design System Specification

> **Purpose**: This document provides an exhaustive, actionable specification of the UI design system, styling architecture, and visual aesthetics used in this codebase. All AI coding agents working on this project (or derivative projects sharing this visual identity) MUST follow these rules strictly to ensure 100% visual and structural consistency across all components and pages.

---

## 1. Design Philosophy & Tech Stack

### Core Principles
- **Aesthetic**: Ultra-clean, modern minimalist monochrome glassmorphic style with high contrast, subtle translucent borders, high-precision typography, rounded surfaces, smooth transitions, and adaptive Dark/Light theme support.
- **Color Palette Strategy**: High-contrast monochrome base (`neutral-50` to `neutral-950`). Primary action fills invert based on theme (`neutral-900` in Light mode, `neutral-100` in Dark mode). Muted semantic colors (`emerald`, `rose`, `blue`) are reserved exclusively for status badges, alert states, or micro-accents.
- **Texture**: Soft glassmorphism (`backdrop-blur-md`, semi-transparent backgrounds, subtle borders `rgba(0,0,0,0.08)` / `rgba(255,255,255,0.08)`).
- **Interactions**: Touch-optimized (`touch-action: manipulation`), subtle active scale effects (`active:scale-[0.99]`), and smooth transitions (`transition-all duration-200`).

### Technology Stack
- **Framework**: React (Vite)
- **CSS Engine**: Tailwind CSS v4 (`@import "tailwindcss";`)
- **Icons**: `lucide-react` (Stroke width 2px default, sized `w-3.5 h-3.5` to `w-5 h-5`)
- **Typography**: 
  - **Headings & Brand**: `Outfit` (`sans-serif`, Google Fonts)
  - **Body & Controls**: `Inter` (`sans-serif`, Google Fonts)

---

## 2. Global CSS Architecture (`src/index.css`)

All projects implementing this design system MUST maintain the following base configuration in `src/index.css`:

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-outfit: 'Outfit', sans-serif;
}

/* Glassmorphism Utilities */
@utility glass-panel {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.08);

  .dark & {
    background: rgba(10, 10, 10, 0.65);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
}

@utility glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.08);

  .dark & {
    background: rgba(10, 10, 10, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
}

@utility glass-input {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.15);
  color: #0f172a;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  .dark & {
    background: rgba(10, 10, 10, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #f8fafc;
  }

  &:focus {
    outline: none;
    border-color: #000000;
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05);

    .dark & {
      border-color: #ffffff;
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.05);
    }
  }
}

@layer base {
  button, 
  a, 
  input, 
  select,
  textarea {
    touch-action: manipulation;
  }
}

/* Custom Scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
}
.dark ::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
}
::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 9999px;
}
.dark ::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
.dark ::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Base transitions & animations */
body {
  transition: background-color 0.3s ease, color 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* Native input fixes */
input[type="date"] {
  -webkit-appearance: none;
  appearance: none;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}
```

---

## 3. Font Imports (`index.html`)

Include Google Fonts in `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
```

---

## 4. Theme & Dark Mode Rules

- **Theme Toggle Mechanics**: The theme state (`'light'` or `'dark'`) controls the `dark` CSS class on `document.documentElement` (`<html class="dark">`).
- **Backgrounds**:
  - Root Container / Page: `bg-neutral-50 dark:bg-neutral-950`
  - Cards & Content Surfaces: `bg-white dark:bg-neutral-900/40` or `glass-card` / `glass-panel`
  - Segmented Control Bars: `bg-neutral-100 dark:bg-neutral-900/60`
- **Text Color Hierarchies**:
  - Primary Titles & Headers: `text-neutral-900 dark:text-white`
  - Body Text: `text-neutral-800 dark:text-neutral-200`
  - Secondary & Muted Labels: `text-neutral-500 dark:text-neutral-400`
- **Borders**:
  - Light mode: `border-neutral-200` or `border-neutral-300`
  - Dark mode: `border-neutral-800` or `border-neutral-900`

---

## 5. Component Construction Rules & Blueprint

### A. Root Application Shell (`App.jsx`)
```jsx
<div className="min-h-screen flex flex-col justify-between pb-12 bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 transition-colors duration-300">
  <Header />
  <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-6 md:py-8 space-y-8">
    {/* Page content */}
  </main>
  <Footer />
</div>
```

### B. Header & Navigation Bar (`Header.jsx`)
- **Sticky Glass Header**: `sticky top-0 z-40 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-900 px-4 py-3.5`
- **Brand / Logo Icon Pill**: `w-10 h-10 rounded-xl bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-white dark:text-neutral-950 shadow-md`
- **Brand Heading**: `text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight font-outfit uppercase`
- **Segmented Nav Pill Container**: `flex bg-neutral-100 dark:bg-neutral-900/60 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800/80`
- **Active Segment Button**: `bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 shadow-sm rounded-lg text-xs font-bold transition-all px-3 py-2 flex items-center gap-1.5`
- **Inactive Segment Button**: `text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg text-xs font-bold transition-all px-3 py-2 flex items-center gap-1.5`
- **Theme Toggle Button**: `p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all shadow-sm`

### C. Cards & Section Panels
```jsx
<div className="bg-white dark:bg-neutral-900/40 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-lg dark:shadow-2xl animate-fade-in transition-all space-y-5">
  <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800/80">
    <div className="flex items-center gap-2.5">
      <Icon className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
      <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 font-outfit">Section Title</h2>
    </div>
  </div>
  {/* Card Content */}
</div>
```

### D. Form Controls & Inputs
- **Labels**: `block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-2`
- **Standard Input / Select**:
  ```jsx
  <input 
    type="text"
    className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900/80 text-neutral-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 transition-all placeholder:text-neutral-400"
  />
  ```
- **Glass Input Variant**: Use class `glass-input rounded-xl px-4 py-2.5 text-sm font-medium w-full`.

### E. Buttons & Interactive Controls
- **Primary Action Button (Inverted Solid Fill)**:
  ```jsx
  <button className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-950 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99]">
    <Icon className="w-4 h-4" />
    <span>Submit Action</span>
  </button>
  ```
- **Secondary Button**:
  ```jsx
  <button className="py-2 px-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 border border-neutral-200 dark:border-neutral-700">
    <span>Secondary Action</span>
  </button>
  ```
- **Icon / Ghost Button**:
  ```jsx
  <button className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all">
    <Icon className="w-4 h-4" />
  </button>
  ```

### F. Status Badges & Pills
- **Neutral Tag**: `px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700`
- **Success / Active Badge**: `px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30`
- **Warning / Alert Badge**: `px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30`
- **Info Accent Badge**: `px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30`

---

## 6. Strict Rules for AI Coding Agents

1. **NEVER introduce uncurated vivid colors** (e.g. bright blue, red, green backgrounds or text) for primary component structures. Stick strictly to high-contrast neutral fills (`neutral-900`/`neutral-100`) and subtle glass surfaces.
2. **ALWAYS implement dual dark/light mode classes** (`dark:...`) for every background, border, text color, and state modification added to JSX elements.
3. **Use Lucide React Icons for visual cues**: Icon sizes should strictly adhere to standard proportions (`w-3.5 h-3.5` for micro buttons/tags, `w-4 h-4` for standard buttons/inputs, `w-5 h-5` for card titles and logo pills).
4. **Use font classes appropriately**: Apply `font-outfit` to headings, brand titles, numbers, and stats; use `font-sans` (`Inter`) for form inputs, descriptions, and standard labels.
5. **Rounded Radius System**:
   - Buttons, inputs, header nav pills: `rounded-xl`
   - Primary outer cards & panels: `rounded-2xl`
   - Micro badges & inner active tab items: `rounded-lg` or `rounded-md`
   - Avatar / Logo icon containers: `rounded-xl`
6. **Smooth Animation**: Apply `animate-fade-in` to dynamically mounted panels, cards, or tab content views for an immediate polished feel.
