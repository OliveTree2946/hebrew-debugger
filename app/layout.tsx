import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '성서 히브리어 디버거',
  description: 'SEED Studio — 성서 히브리어 형태론 학습 도구',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        {/* 히브리어 + 한국어 + 디스플레이 폰트 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+Hebrew:wght@400;700&family=Noto+Sans+KR:wght@400;500;700&family=Cormorant+Garamond:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ background: '#12100D', color: '#E8DCC8' }}>
        {children}
      </body>
    </html>
  )
}
