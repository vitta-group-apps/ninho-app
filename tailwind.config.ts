import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    // font-sans → Nunito a nível global (fora do extend para override total)
    fontFamily: {
      sans:     ["Nunito", "system-ui", "sans-serif"],
    },
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        quicksand: ["Quicksand", "system-ui", "sans-serif"],
        nunito:    ["Nunito", "system-ui", "sans-serif"],
        // DS aliases
        heading:   ["Quicksand", "system-ui", "sans-serif"],
        body:      ["Nunito", "system-ui", "sans-serif"],
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
        // ── shadcn/Radix — NÃO ALTERAR ─────────────────────
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT:              "hsl(var(--sidebar-background))",
          foreground:           "hsl(var(--sidebar-foreground))",
          primary:              "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent:               "hsl(var(--sidebar-accent))",
          "accent-foreground":  "hsl(var(--sidebar-accent-foreground))",
          border:               "hsl(var(--sidebar-border))",
          ring:                 "hsl(var(--sidebar-ring))",
        },
        ninho: {
          sand:  "hsl(var(--ninho-sand))",
          brown: "hsl(var(--ninho-brown))",
          sage:  "hsl(var(--ninho-sage))",
          mauve: "hsl(var(--ninho-mauve))",
        },

        // ── NINHO DESIGN SYSTEM — prefixo ds- ──────────────
        // Usa CSS variables do src/design-system/tokens/tokens.css
        // NÃO colide com shadcn acima
        "ds-accent": {
          subtle:           "var(--color-accent-background-bg-subtle-01)",
          "subtle-2":       "var(--color-accent-background-bg-subtle-02)",
          "bg-hover":       "var(--color-accent-background-bg-subtle-hover)",
          "bg-pressed":     "var(--color-accent-background-bg-subtle-pressed)",
          tint:             "var(--color-accent-background-bg-tint-01)",
          "tint-dark":      "var(--color-accent-background-bg-tint-02)",
          fg:               "var(--color-accent-foreground-fg-low-contrast)",
          "fg-strong":      "var(--color-accent-foreground-fg-high-contrast)",
          border:           "var(--color-accent-border-border-subtle-enabled)",
          "border-hover":   "var(--color-accent-border-border-subtle-hover)",
        },
        "ds-secondary": {
          subtle:      "var(--color-secundary-background-bg-subtle-01)",
          "bg-hover":  "var(--color-secundary-background-bg-subtle-hover)",
          tint:        "var(--color-secundary-background-bg-tint-01)",
          "tint-dark": "var(--color-secundary-background-bg-tint-02)",
          fg:          "var(--color-secundary-foreground-fg-low-contrast)",
          "fg-strong": "var(--color-secundary-foreground-fg-high-contrast)",
          border:      "var(--color-secundary-border-border-subtle-enabled)",
        },
        "ds-neutral": {
          subtle:         "var(--color-neutral-background-bg-subtle-01)",
          "subtle-2":     "var(--color-neutral-background-bg-subtle-02)",
          "bg-hover":     "var(--color-neutral-background-bg-subtle-hover)",
          "bg-pressed":   "var(--color-neutral-background-bg-subtle-pressed)",
          tint:           "var(--color-neutral-background-bg-tint-01)",
          "tint-dark":    "var(--color-neutral-background-bg-tint-02)",
          fg:             "var(--color-neutral-foreground-fg-low-contrast)",
          "fg-strong":    "var(--color-neutral-foreground-fg-high-contrast)",
          border:         "var(--color-neutral-border-border-subtle-enabled)",
          "border-hover": "var(--color-neutral-border-border-subtle-hover)",
        },
        "ds-success": {
          subtle:      "var(--color-success-background-bg-subtle-01)",
          "bg-hover":  "var(--color-success-background-bg-subtle-hover)",
          tint:        "var(--color-success-background-bg-tint-01)",
          "tint-dark": "var(--color-success-background-bg-tint-02)",
          fg:          "var(--color-success-foreground-fg-low-contrast)",
          "fg-strong": "var(--color-success-foreground-fg-high-contrast)",
          border:      "var(--color-success-border-border-subtle-enabled)",
        },
        "ds-warning": {
          subtle:      "var(--color-warning-background-bg-subtle-01)",
          "bg-hover":  "var(--color-warning-background-bg-subtle-hover)",
          tint:        "var(--color-warning-background-bg-tint-01)",
          fg:          "var(--color-warning-foreground-fg-low-contrast)",
          "fg-strong": "var(--color-warning-foreground-fg-high-contrast)",
          border:      "var(--color-warning-border-border-subtle-enabled)",
        },
        "ds-error": {
          subtle:      "var(--color-error-background-bg-subtle-01)",
          "bg-hover":  "var(--color-error-background-bg-subtle-hover)",
          tint:        "var(--color-error-background-bg-tint-01)",
          "tint-dark": "var(--color-error-background-bg-tint-02)",
          fg:          "var(--color-error-foreground-fg-low-contrast)",
          "fg-strong": "var(--color-error-foreground-fg-high-contrast)",
          border:      "var(--color-error-border-border-subtle-enabled)",
        },
        "ds-info": {
          subtle:      "var(--color-info-background-bg-subtle-01)",
          "bg-hover":  "var(--color-info-background-bg-subtle-hover)",
          tint:        "var(--color-info-background-bg-tint-01)",
          "tint-dark": "var(--color-info-background-bg-tint-02)",
          fg:          "var(--color-info-foreground-fg-low-contrast)",
          "fg-strong": "var(--color-info-foreground-fg-high-contrast)",
          border:      "var(--color-info-border-border-subtle-enabled)",
        },
        "ds-on-tint": {
          white: "var(--color-on-tint-white-fg-high-contrast)",
          black: "var(--color-on-tint-black-fg-high-contrast)",
        },
        "ds-pure": {
          white: "var(--color-pure-neutral-white)",
          black: "var(--color-pure-neutral-black)",
        },
      },
      borderRadius: {
        // shadcn — NÃO ALTERAR
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // DS
        "ds-xxs": "var(--radius-xxs)",
        "ds-xs":  "var(--radius-xs)",
        "ds-sm":  "var(--radius-sm)",
        "ds-lg":  "var(--radius-lg)",
        "ds-xl":  "var(--radius-xl)",
        "ds-xxl": "var(--radius-xxl)",
        "ds-pill":"var(--pill)",
      },
      boxShadow: {
        "ds-xs": "0px 1px 2px 0px var(--color-overlays-overlay-black-50)",
        "ds-sm": "0px 2px 6px 0px var(--color-overlays-overlay-black-100)",
        "ds-md": "0px 4px 16px 0px var(--color-overlays-overlay-black-100)",
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
        "accordion-up":   "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
