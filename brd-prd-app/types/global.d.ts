// Global type definitions for Next.js 15 and React 19 compatibility

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string
      NEXTAUTH_URL: string
      NEXTAUTH_SECRET: string
      GOOGLE_CLIENT_ID?: string
      GOOGLE_CLIENT_SECRET?: string
      LINKEDIN_CLIENT_ID?: string
      LINKEDIN_CLIENT_SECRET?: string
      OPENAI_API_KEY: string
      GEMINI_API_KEY: string
      APP_URL: string
      STRIPE_PUBLISHABLE_KEY?: string
      STRIPE_SECRET_KEY?: string
      STRIPE_WEBHOOK_SECRET?: string
    }
  }

  // Next.js Image component types for React 19
  interface StaticImageData {
    src: string
    height: number
    width: number
    blurDataURL?: string
    blurWidth?: number
    blurHeight?: number
  }

  // Extend Window interface if needed
  interface Window {
    gtag?: (...args: any[]) => void
  }
}

export {}