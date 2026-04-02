import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // 디자인 토큰 (UI_DESIGN_SYSTEM.md 기준, 변경 금지)
      colors: {
        bg:          '#12100D',
        gold:        '#C4A46A',
        verb:        '#F67280',
        noun:        '#85CDCA',
        prep:        '#E8A87C',
        particle:    '#FFD93D',
      },
      fontFamily: {
        hebrew: ['Noto Serif Hebrew', 'serif'],
        korean: ['Noto Sans KR', 'sans-serif'],
        display: ['Cormorant Garamond', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
