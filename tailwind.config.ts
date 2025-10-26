import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'raleway': ['var(--font-raleway)', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#4fa3a6',
          light: '#6bb4b7',
          dark: '#3d8285',
          50: '#f0f9f9',
          100: '#ccecee',
          200: '#99d9dd',
          300: '#66c6cc',
          400: '#4fa3a6',
          500: '#4fa3a6',
          600: '#3d8285',
          700: '#2b5c5e',
          800: '#1a3637',
          900: '#0d1b1c',
        },
        secondary: {
          DEFAULT: '#d25f8b',
          light: '#e07ba3',
          dark: '#b8436f',
          50: '#fdf2f6',
          100: '#f9d9e5',
          200: '#f3b3cb',
          300: '#ed8db1',
          400: '#d25f8b',
          500: '#d25f8b',
          600: '#b8436f',
          700: '#9e2753',
          800: '#7a1d40',
          900: '#3d0e20',
        },
        tertiary: {
          DEFAULT: '#f5d749',
          light: '#f7e066',
          dark: '#d4b82c',
          50: '#fefcf0',
          100: '#fdf7cc',
          200: '#fbef99',
          300: '#f9e766',
          400: '#f5d749',
          500: '#f5d749',
          600: '#d4b82c',
          700: '#b39920',
          800: '#8a7619',
          900: '#453b0c',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;