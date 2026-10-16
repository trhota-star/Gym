/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        surface: token('surface'),
        line: token('line'),
        ink: token('ink'),
        muted: token('muted'),
        accent: token('accent'),
        lime: { DEFAULT: '#C6FF3D', 400: '#C6FF3D', 500: '#A8E61D', 600: '#65A30D' },
        cyan: { DEFAULT: '#22D3EE', 400: '#22D3EE', 500: '#06B6D4', 600: '#0891B2' },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(198,255,61,0.55)',
        'glow-cyan': '0 0 40px -8px rgba(34,211,238,0.55)',
        soft: '0 10px 40px -12px rgba(0,0,0,0.35)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(120deg, #C6FF3D 0%, #5CF2A0 50%, #22D3EE 100%)',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        pulseglow: { '0%,100%': { opacity: 0.55 }, '50%': { opacity: 1 } },
        shimmer: { '0%': { backgroundPosition: '0% 50%' }, '100%': { backgroundPosition: '200% 50%' } },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        pulseglow: 'pulseglow 3s ease-in-out infinite',
        shimmer: 'shimmer 6s linear infinite',
      },
    },
  },
  plugins: [],
};
