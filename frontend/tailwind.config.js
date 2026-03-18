/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    // AgriTimeline theme colors - ensure these classes are always generated
    {
      pattern:
        /^(bg|text|border|from|via|to)-brand-(mist|sky|teal|gold|amber|ocean|cyan|slate|surface|deep)/,
      variants: ["hover", "active"],
    },
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        // Project brand palette — Deep Teal + Warm Amber
        brand: {
          mist:      "#bae6fd", // Sky-200 — muted elements, inactive
          sky:       "#0e7490", // Cyan-700 — primary teal interactive
          teal:      "#0c6a7c", // Cyan-800 — hover teal
          ocean:     "#0f2d40", // Custom dark teal — dark surfaces
          cyan:      "#22d3ee", // Cyan-400 — bright accents
          gold:      "#f59e0b", // Amber-400 — primary accent shimmer (replaces old gold)
          amber:     "#d97706", // Amber-600 — secondary accent
          slate:     "#475569", // Slate-600 — secondary text
          surface:   "#f0f9ff", // Sky-50 — light card surfaces
          deep:      "#0f2d40", // Ocean — deep dark background

          // Kept for backward-compatible hardcoded references in JSX
          linen:     "#f0f9ff", // Was #f3f2e9 — now maps to sky surface
          maroon:    "#0f2d40", // Was #440f0f — now maps to ocean dark
          rust:      "#0e7490", // Was #89350a — now maps to teal primary
          terracotta: "#d97706", // Was #ae5514 — now maps to amber
          olive:     "#22d3ee", // Was #929d7c — now maps to cyan accent
        },
        // Semantic aliases
        theme: {
          primary:   "#0e7490", // brand.sky (teal)
          secondary: "#475569", // brand.slate
          accent:    "#d97706", // brand.amber
          success:   "#22d3ee", // brand.cyan
          warning:   "#f59e0b", // brand.gold
          danger:    "#b45309", // amber-700
          surface:   "#f0f9ff", // brand.surface
          muted:     "#bae6fd", // brand.mist
        },
      },
      fontFamily: {
        // Fonts
        heading: ["Josefin Sans", "sans-serif"], // For headings and buttons
        body: ["Montserrat", "sans-serif"],       // For text content
        display: ["Josefin Sans", "sans-serif"],  // Alias for headings
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.6s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
}
