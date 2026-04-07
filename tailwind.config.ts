import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        quicksand: ["Quicksand", "system-ui", "sans-serif"],
        nunito: ["Nunito", "system-ui", "sans-serif"],
        // DS aliases
        heading: ["Quicksand", "system-ui", "sans-serif"],
        body:    ["Nunito", "system-ui", "sans-serif"],
      },
      fontSize: {
        "text-xs":     ["var(--font-size-text-xs)",     { lineHeight: "1.5" }],
        "text-sm":     ["var(--font-size-text-sm)",     { lineHeight: "1.5" }],
        "text-md":     ["var(--font-size-text-md)",     { lineHeight: "1.5" }],
        "text-lg":     ["var(--font-size-text-lg)",     { lineHeight: "1.5" }],
        "text-xl":     ["var(--font-size-text-xl)",     { lineHeight: "1.5" }],
        "heading-xxs": ["var(--font-size-heading-xxs)", { lineHeight: "1.2" }],
        "heading-xs":  ["var(--font-size-heading-xs)",  { lineHeight: "1.2" }],
        "heading-sm":  ["var(--font-size-heading-sm)",  { lineHeight: "1.2" }],
        "heading-md":  ["var(--font-size-heading-md)",  { lineHeight: "1.2" }],
      },
      fontWeight: {
        regular:  "400",
        medium:   "500",
        semibold: "600",
        bold:     "700",
      },
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Ninho brand tokens available as Tailwind classes
        ninho: {
          sand: "hsl(var(--ninho-sand))",
          brown: "hsl(var(--ninho-brown))",
          sage: "hsl(var(--ninho-sage))",
          mauve: "hsl(var(--ninho-mauve))",
        },
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
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
