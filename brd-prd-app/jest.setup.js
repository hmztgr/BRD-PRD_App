require('@testing-library/jest-dom')

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      replace: jest.fn(),
      pathname: '/',
      query: {},
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated'
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
}))

// Global fetch mock
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
)

// Global test utilities
global.mockFetch = (data, ok = true) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(data),
    })
  )
}

// Mock environment variables
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key'
process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_mock_key'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'

// Mock Prisma Client
const mockPrismaFunctions = {
  create: jest.fn(),
  findMany: jest.fn(),
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  update: jest.fn(),
  upsert: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
  count: jest.fn(),
  aggregate: jest.fn(),
  groupBy: jest.fn(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn(),
}

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { ...mockPrismaFunctions },
    emailToken: { ...mockPrismaFunctions },
    subscription: { ...mockPrismaFunctions },
    document: { ...mockPrismaFunctions },
    usage: { ...mockPrismaFunctions },
  }
}))

// Mock Next.js Request/Response
Object.defineProperty(global, 'Request', {
  value: class Request {
    constructor(input, init) {
      this.url = input
      this.method = init?.method || 'GET'
      this.headers = new Map(Object.entries(init?.headers || {}))
      this._body = init?.body
    }
    async json() {
      return JSON.parse(this._body || '{}')
    }
    async text() {
      return this._body || ''
    }
  }
})

Object.defineProperty(global, 'Response', {
  value: class Response {
    constructor(body, init) {
      this.body = body
      this.status = init?.status || 200
      this.headers = new Map(Object.entries(init?.headers || {}))
    }
    static json(data, init) {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: { 'Content-Type': 'application/json', ...init?.headers }
      })
    }
    static redirect(url, status = 302) {
      const response = new Response(null, { status })
      response.headers.set('location', url)
      return response
    }
    async json() {
      return JSON.parse(this.body)
    }
  }
})

// Mock NextResponse.redirect
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data, init) => {
      const response = new Response(JSON.stringify(data), {
        ...init,
        headers: { 'Content-Type': 'application/json', ...init?.headers }
      })
      return response
    },
    redirect: (url) => {
      const response = new Response(null, { status: 307 })
      response.headers.set('location', url.toString())
      return response
    }
  },
  NextRequest: class NextRequest {
    constructor(url, init) {
      this.url = url
      this.method = init?.method || 'GET'
    }
    async json() {
      return {}
    }
  }
}))