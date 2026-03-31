import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-inter)', 'sans-serif'],
                heading: ['var(--font-space-grotesk)', 'var(--font-inter)', 'sans-serif'],
            },
            boxShadow: {
                card: "var(--card-shadow)",
                "card-hover": "var(--card-shadow-hover)",
            },
            colors: {
                background: "var(--bg-page)",
                foreground: "var(--text-primary)",
                card: "var(--card-bg)",
                "card-solid": "var(--card-bg-solid)",
                border: "var(--card-border)",
                primary: "var(--accent-primary)",
                secondary: "var(--accent-secondary)",
                success: "var(--tag-green-text)",
                warning: "var(--tag-yellow-text)",
                danger: "var(--tag-red-text)",
                muted: "var(--text-muted)",
                "text-secondary": "var(--text-secondary)",
                "benefit-border": "var(--benefit-border)",
                "button-secondary": "var(--button-secondary-bg)",
                "button-secondary-text": "var(--button-secondary-text)",
                iw: {
                    from:    '#30AABF',
                    to:      '#00C2FF',
                    primary: '#0F172A',
                    soft:    '#E5F7FA',
                    surface: '#FFFFFF',
                    dark:    '#77DDDD',
                },
                // Legacy palette kept for backward compat
                enterprise: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#30AABF',   // remapped to iWorth teal
                    600: '#0088CC',
                    700: '#006FA3',
                    800: '#005580',
                    900: '#003D5C',
                    950: '#002B42',
                },
                cyber: {
                    neon: '#00C2FF',  // remapped to iWorth aqua
                    deep: '#0F172A',
                    accent: '#30AABF',
                    glow: 'rgba(48, 170, 191, 0.3)',
                }
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
                'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
            },
            animation: {
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow-pulse': 'glow 2s infinite alternate',
                'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
                'shimmer': 'shimmer 2s linear infinite',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(0, 247, 255, 0.2), 0 0 10px rgba(0, 247, 255, 0.2)' },
                    '100%': { boxShadow: '0 0 20px rgba(0, 247, 255, 0.6), 0 0 40px rgba(0, 247, 255, 0.4)' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                }
            },
            backdropBlur: {
                xs: '2px',
            }
        },
    },
    plugins: [],
};
export default config;
