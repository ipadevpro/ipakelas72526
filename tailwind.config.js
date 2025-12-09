/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Neo-Brutalism + Industrial Minimalism Color Palette
        industrial: {
          dark: "#1A1A1A",      // Dark Charcoal - for sidebar, dark backgrounds
          gray: "#2D2D2D",      // Medium Gray - for secondary backgrounds
          light: "#F5F5F5",     // Light Gray - for card backgrounds
          white: "#FFFFFF",     // Pure White - for cards
          black: "#000000",     // Pure Black - for borders, text
          steel: "#3B82F6",     // Steel Blue - for accent
          red: "#EF4444",       // Industrial Red - for errors, destructive
          border: "#CCCCCC",    // Light Gray - for borders
          "text-primary": "#000000",    // Black - primary text
          "text-secondary": "#6B7280",  // Gray - secondary text
          "text-muted": "#9CA3AF",      // Light Gray - muted text
          // Neo-Brutalism Colors
          yellow: "#FFE66D",    // Bright Yellow
          pink: "#FF6B9D",      // Bright Pink
          blue: "#4ECDC4",     // Bright Cyan Blue
          green: "#95E1D3",    // Bright Green
          orange: "#FFA07A",   // Bright Orange
          purple: "#C44569",   // Bright Purple
          "bright-red": "#FF6B6B", // Bright Red
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Roboto Mono', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      boxShadow: {
        'brutal-sm': '2px 2px 0px 0px rgba(0, 0, 0, 1)',
        'brutal': '4px 4px 0px 0px rgba(0, 0, 0, 1)',
        'brutal-md': '6px 6px 0px 0px rgba(0, 0, 0, 1)',
        'brutal-lg': '8px 8px 0px 0px rgba(0, 0, 0, 1)',
        'brutal-xl': '12px 12px 0px 0px rgba(0, 0, 0, 1)',
        'brutal-hover': '6px 6px 0px 0px rgba(0, 0, 0, 1)',
        'brutal-active': '2px 2px 0px 0px rgba(0, 0, 0, 1)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} 