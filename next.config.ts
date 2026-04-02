import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // morphhb는 타입 선언이 없는 CJS 패키지 — 트랜스파일 필요
  transpilePackages: ['morphhb'],
}

export default nextConfig
