import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
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
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        thought: ['JetBrains Mono', 'monospace'],
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
        // Decay state colors — bioluminescent spectrum
        decay: {
          fresh: "hsl(var(--decay-fresh))",
          fading: "hsl(var(--decay-fading))",
          rotting: "hsl(var(--decay-rotting))",
          extinct: "hsl(var(--decay-extinct))",
        },
        // Echo — golden phosphorescence
        echo: {
          DEFAULT: "hsl(var(--echo))",
          foreground: "hsl(var(--echo-foreground))",
        },
        // Fog layers
        fog: {
          light: "hsl(var(--fog-light))",
          mid: "hsl(var(--fog-mid))",
          dark: "hsl(var(--fog-dark))",
        },
        // Rot mode accents
        rot: {
          glitch: "hsl(var(--rot-glitch))",
          accent: "hsl(var(--rot-accent))",
          mold: "hsl(var(--rot-mold))",
        },
        // Glow system
        glow: {
          primary: "hsl(var(--glow-primary))",
          accent: "hsl(var(--glow-accent))",
          warm: "hsl(var(--glow-warm))",
          danger: "hsl(var(--glow-danger))",
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
        "fog-pulse": {
          "0%, 100%": { opacity: "0.25" },
          "50%": { opacity: "0.5" },
        },
        "slow-drift": {
          "0%, 100%": { transform: "translateX(0) translateY(0)" },
          "25%": { transform: "translateX(15px) translateY(-8px)" },
          "75%": { transform: "translateX(-10px) translateY(5px)" },
        },
        "thought-appear": {
          "0%": { opacity: "0", transform: "translateY(15px) scale(0.97)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "thought-decay": {
          "0%": { opacity: "1", filter: "blur(0)" },
          "100%": { opacity: "0", filter: "blur(6px)", transform: "scale(0.97)" },
        },
        "echo-ripple": {
          "0%": { transform: "scale(1)", opacity: "0.5" },
          "100%": { transform: "scale(1.5)", opacity: "0" },
        },
        "glow-breathe": {
          "0%, 100%": { 
            boxShadow: "0 0 20px hsl(var(--glow-primary) / 0.1), 0 0 60px hsl(var(--glow-primary) / 0.05)" 
          },
          "50%": { 
            boxShadow: "0 0 40px hsl(var(--glow-primary) / 0.2), 0 0 100px hsl(var(--glow-primary) / 0.08)" 
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fog-pulse": "fog-pulse 9s ease-in-out infinite",
        "slow-drift": "slow-drift 35s ease-in-out infinite",
        "thought-appear": "thought-appear 1.2s cubic-bezier(0.23, 1, 0.32, 1) forwards",
        "thought-decay": "thought-decay 2.5s ease-in forwards",
        "echo-ripple": "echo-ripple 1.2s ease-out forwards",
        "glow-breathe": "glow-breathe 6s ease-in-out infinite",
      },
      transitionDuration: {
        "2000": "2000ms",
        "3000": "3000ms",
        "5000": "5000ms",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
