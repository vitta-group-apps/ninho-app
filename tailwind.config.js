/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Ninho DNA
        sage: {
          50:  '#f4f7f5',
          100: '#e6eeea',
          200: '#ceded6',
          300: '#aac5b5',
          400: '#80a590',
          500: '#99b4a7', // primary brand
          600: '#4d7a62',
          700: '#3d6150',
          800: '#334e41',
          900: '#2b4037',
        },
        earth: {
          50:  '#f9f5f2',
          100: '#f0e8e1',
          200: '#e1d0c3',
          300: '#ccb09a',
          400: '#b58b6e',
          500: '#906d57', // warm brown
          600: '#7a5a46',
          700: '#65493a',
          800: '#553d32',
          900: '#47342b',
        },
        stone: {
          50:  '#fafafa',
          100: '#f5f5f3',
          200: '#E8E8E2', // background
          300: '#d4d4cc',
          400: '#b5b5aa',
          500: '#8f8f85',
          600: '#737369',
          700: '#5e5e56',
          800: '#4e4e48',
          900: '#43433e',
        },
        mauve: {
          50:  '#faf8fb',
          100: '#f3eff6',
          200: '#e8e0ee',
          300: '#d4c7e0',
          400: '#baa8cc',
          500: '#9e89b8', // accent
          600: '#8a72a5',
          700: '#745d8e',
          800: '#614e76',
          900: '#504163',
        },
        // Semantic
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
