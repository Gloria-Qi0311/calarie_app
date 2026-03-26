import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brandNavy: '#071e42',
        bodyMuted: '#38506d',
        appBg: '#f7f3ee',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.06), 0 4px 14px rgba(15, 23, 42, 0.04)',
      },
      borderRadius: {
        xxl: '1.25rem',
      },
      backgroundImage: {
        warm: 'linear-gradient(90deg, #ff7300 0%, #ff1f73 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
