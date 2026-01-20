import type { Config } from 'tailwindcss'

const config: Config = {
    darkMode: 'class', // Enable dark mode with class strategy
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
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
                    light: '#A78BFA',
                    dark: '#7C3AED',
                },
                secondary: {
                    DEFAULT: '#6366F1',
                    light: '#818CF8',
                    dark: '#4F46E5',
                },
                accent: '#06B6D4',
            },
            fontFamily: {
                sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
                heading: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
            },
            backdropBlur: {
                xs: '2px',
                glass: '12px',
                'glass-lg': '24px',
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-primary': 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                'gradient-secondary': 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
                'glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(139, 92, 246, 0.1)',
                'glass-lg': '0 16px 48px 0 rgba(139, 92, 246, 0.15)',
                'glow': '0 0 20px rgba(139, 92, 246, 0.4)',
                'glow-lg': '0 0 40px rgba(139, 92, 246, 0.6)',
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'shimmer': 'shimmer 2s linear infinite',
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                glow: {
                    '0%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)' },
                    '100%': { boxShadow: '0 0 40px rgba(139, 92, 246, 0.8)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-1000px 0' },
                    '100%': { backgroundPosition: '1000px 0' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(30px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
export default config
