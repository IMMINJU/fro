import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint 9 Flat Config 사용
    ignoreDuringBuilds: false,
  },
}

export default withNextIntl(nextConfig)