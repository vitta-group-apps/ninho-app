import type { Config } from "tailwindcss";

/**
 * Tailwind Config — Ninho v2
 *
 * Camadas de token:
 *   1. tokens.css  — define as CSS vars primitivas e semânticas
 *   2. tailwind     — expõe as vars semânticas como classes utilitárias `ds-*`
 *
 * Regra de ouro: NUNCA hardcode hex aqui. Sempre referenciar a CSS var
 * semântica que já existe em tokens.css, garantindo dark-mode automático.
 *
 * Mapeamento `ds-*` → token semântico:
 *   ds-pure-white          → --color-pure-neutral-white   (#fcfcfc)
 *   ds-neutral-subtle      → --color-neutral-bg-subtle-01 (stone-50 #f8f7f7)
 *   ds-neutral-border      → --color-neutral-border       (stone-500 #a9a5a2)
 *   ds-accent-tint         → --color-accent-bg-tint-01    (mauve-500 #8b5e96)
 *   ds-success-subtle      → --color-success-bg-subtle-01 (sage-50  #f4fbf8)
 *   ds-error-subtle        → --color-error-bg-subtle-01   (clay-50  #fcf4f3)
 *   (ver tabela completa abaixo)
 */
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
        // DS aliases usados pelos componentes (font-heading, font-body)
        heading: ["Quicksand", "system-ui", "sans-serif"],
        body:    ["Nunito", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Escala de texto — gera classes text-text-xs, text-text-sm… text-text-xl
        "text-xs":     ["var(--font-size-text-xs)",     { lineHeight: "1.5" }],
        "text-sm":     ["var(--font-size-text-sm)",     { lineHeight: "1.5" }],
        "text-md":     ["var(--font-size-text-md)",     { lineHeight: "1.5" }],
        "text-lg":     ["var(--font-size-text-lg)",     { lineHeight: "1.5" }],
        "text-xl":     ["var(--font-size-text-xl)",     { lineHeight: "1.5" }],
        // Escala de heading — gera classes text-heading-xxs… text-heading-md
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
        // ── Legado shadcn/ui — mantido para não quebrar o que está no ar ──────
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

        // ── Ninho Design System v2 — namespace `ds-*` ─────────────────────────
        // Todas as classes referenciam CSS vars semânticas de tokens.css.
        // Dark-mode funciona automaticamente via [data-theme="dark"] no tokens.css.
        ds: {
          // Puros
          "pure-white":   "var(--color-pure-neutral-white)",   // #fcfcfc
          "pure-black":   "var(--color-pure-neutral-black)",   // #0d0d0d
          "on-tint-white": "var(--color-on-tint-white-fg-high-contrast)", // texto branco sobre tints

          // Neutral (Stone) — backgrounds e bordas cinza
          "neutral-subtle":        "var(--color-neutral-background-bg-subtle-01)",  // stone-50  #f8f7f7
          "neutral-subtle-2":      "var(--color-neutral-background-bg-subtle-02)",  // stone-100 #eeedec
          "neutral-tint":          "var(--color-neutral-background-bg-tint-01)",    // stone-800 #524f4c
          "neutral-border":        "var(--color-neutral-border-border-subtle-enabled)", // stone-500 #a9a5a2
          "neutral-border-hover":  "var(--color-neutral-border-border-subtle-hover)",   // stone-600 #8a8480
          "neutral-fg":            "var(--color-neutral-foreground-fg-low-contrast)",   // stone-800 #524f4c
          "neutral-fg-strong":     "var(--color-neutral-foreground-fg-high-contrast)",  // stone-900 #3a3836

          // Accent (Mauve) — ações primárias, foco, seleção
          "accent-subtle":     "var(--color-accent-background-bg-subtle-01)",  // mauve-50  #faf3fc
          "accent-subtle-2":   "var(--color-accent-background-bg-subtle-02)",  // mauve-100 #f4e8f7
          "accent-tint":       "var(--color-accent-background-bg-tint-01)",    // mauve-500 #8b5e96
          "accent-border":     "var(--color-accent-border-border-subtle-enabled)", // mauve-300 #d8b9df
          "accent-fg":         "var(--color-accent-foreground-fg-low-contrast)",   // mauve-800 #672079
          "accent-fg-strong":  "var(--color-accent-foreground-fg-high-contrast)",  // mauve-900 #4b1958

          // Secondary (Earth) — estabilidade, terra
          "secondary-subtle":    "var(--color-secundary-background-bg-subtle-01)",  // earth-50  #fbf6f4
          "secondary-tint":      "var(--color-secundary-background-bg-tint-01)",    // earth-800 #653015
          "secondary-border":    "var(--color-secundary-border-border-subtle-enabled)", // earth-500 #a25c39
          "secondary-fg":        "var(--color-secundary-foreground-fg-low-contrast)",   // earth-800 #653015
          "secondary-fg-strong": "var(--color-secundary-foreground-fg-high-contrast)",  // earth-900 #462210

          // Success (Sage) — saúde, marcos positivos
          "success-subtle":    "var(--color-success-background-bg-subtle-01)",  // sage-50  #f4fbf8
          "success-tint":      "var(--color-success-background-bg-tint-01)",    // sage-800 #165039
          "success-border":    "var(--color-success-border-border-subtle-enabled)", // sage-500 #378163
          "success-fg":        "var(--color-success-foreground-fg-low-contrast)",   // sage-800 #165039
          "success-fg-strong": "var(--color-success-foreground-fg-high-contrast)",  // sage-900 #103728

          // Warning (Sun) — alertas calmos (não alarmistas)
          "warning-subtle":    "var(--color-warning-background-bg-subtle-01)",  // sun-50  #fefcf5
          "warning-tint":      "var(--color-warning-background-bg-tint-01)",    // sun-800 #6d5009
          "warning-border":    "var(--color-warning-border-border-subtle-enabled)", // sun-500 #c7910a
          "warning-fg":        "var(--color-warning-foreground-fg-low-contrast)",   // sun-800 #6d5009
          "warning-fg-strong": "var(--color-warning-foreground-fg-high-contrast)",  // sun-900 #493708

          // Error (Clay) — erro, perigo
          "error-subtle":    "var(--color-error-background-bg-subtle-01)",  // clay-50  #fcf4f3
          "error-tint":      "var(--color-error-background-bg-tint-01)",    // clay-800 #671d14
          "error-border":    "var(--color-error-border-border-subtle-enabled)", // clay-500 #a74235
          "error-fg":        "var(--color-error-foreground-fg-low-contrast)",   // clay-800 #671d14
          "error-fg-strong": "var(--color-error-foreground-fg-high-contrast)",  // clay-900 #43140e

          // Info (Water) — informação, contexto
          "info-subtle":    "var(--color-info-background-bg-subtle-01)",  // water-50  #f5f8fa
          "info-tint":      "var(--color-info-background-bg-tint-01)",    // water-800 #173446
          "info-border":    "var(--color-info-border-border-subtle-enabled)", // water-500 #3a6880
          "info-fg":        "var(--color-info-foreground-fg-low-contrast)",   // water-800 #173446
          "info-fg-strong": "var(--color-info-foreground-fg-high-contrast)",  // water-900 #0f2230
        },
      },
      borderRadius: {
        // Legado shadcn/ui
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // DS tokens — gera rounded-ds-pill, rounded-ds-xxl…
        "ds-pill": "var(--pill)",    // 999px — usado em Chip e Badge
        "ds-xxl":  "var(--radius-xxl)",  // 24px
        "ds-xl":   "var(--radius-xl)",   // 16px
        "ds-lg":   "var(--radius-lg)",   // 12px
        "ds-sm":   "var(--radius-sm)",   // 8px
        "ds-xs":   "var(--radius-xs)",   // 6px
        "ds-xxs":  "var(--radius-xxs)",  // 4px
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
