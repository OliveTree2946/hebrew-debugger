import type { NextConfig } from 'next'
// @ts-ignore — next-pwa는 별도 타입 선언 없음
import withPWA from 'next-pwa'

const nextConfig: NextConfig = {
  // morphhb는 타입 선언이 없는 CJS 패키지 — 트랜스파일 필요
  transpilePackages: ['morphhb'],
}

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})(nextConfig)
