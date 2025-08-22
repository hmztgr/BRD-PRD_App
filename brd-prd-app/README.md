# BRD/PRD Generator - AI-Powered Business Document Creation

An AI-powered web application that helps users create professional Business Requirements Documents (BRDs) and Product Requirements Documents (PRDs) with a focus on Arabic-speaking users, particularly in Saudi Arabia.

## 🚀 Features

- **AI-Powered Generation**: Create comprehensive documents using GPT-4 and Gemini
- **Arabic-First Design**: Native Arabic support with cultural awareness
- **Multiple Document Types**: BRDs, PRDs, Technical Documents, Project Management
- **Team Collaboration**: Real-time editing, comments, and approval workflows
- **Subscription Tiers**: Free, Professional, Business, and Enterprise plans
- **Referral System**: Comprehensive reward system to drive user acquisition

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **AI Integration**: OpenAI GPT-4, Google Gemini
- **Payments**: Stripe
- **Storage**: AWS S3
- **Hosting**: Vercel (Frontend), Railway (Backend)

## 📋 Current Status

### ✅ Completed (August 17, 2025)
- Project setup and configuration
- Database schema design
- Basic UI components and layout
- Landing page with pricing tiers
- Type-safe development environment
- Production build system

### 🚧 In Progress
- User authentication system
- OAuth integrations

### 📅 Next Steps
- AI document generation
- Subscription management
- Referral system implementation
- Team collaboration features

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- OpenAI API key
- Google Gemini API key

### Installation

1. Install dependencies
```bash
npm install
```

2. Set up environment variables
```bash
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

3. Set up the database
```bash
npx prisma migrate dev
npx prisma generate
```

4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
src/
├── app/                    # Next.js app directory
├── components/            # Reusable components
│   ├── ui/               # Basic UI components
│   ├── forms/            # Form components
│   └── layout/           # Layout components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
├── types/                # TypeScript type definitions
└── contexts/             # React contexts
```

## 🧪 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

## 📊 Database Schema

The application uses a comprehensive PostgreSQL schema with the following main entities:

- **Users**: User management with subscription tiers
- **Documents**: Document storage with versioning
- **Templates**: AI document templates
- **Teams**: Team collaboration
- **Referrals**: Referral tracking and rewards
- **Payments**: Stripe payment integration

## 🔐 Environment Variables

Required environment variables (see `.env.local` for full list):

```bash
# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...

# AI APIs  
OPENAI_API_KEY=...
GEMINI_API_KEY=...

# Stripe
STRIPE_SECRET_KEY=...
STRIPE_PUBLIC_KEY=...
```

## 🎯 Roadmap

### Phase 1: MVP (Sep - Dec 2025)
- User authentication and management
- AI-powered document generation
- Subscription and payment system
- Basic collaboration features

### Phase 2: Enhanced Features (Jan - Apr 2026)
- Advanced collaboration tools
- Referral system implementation
- Mobile optimization
- Analytics dashboard

### Phase 3: Scale & Expansion (May - Aug 2026)
- Enterprise features
- Multi-language support
- Advanced AI capabilities
- Market expansion

## 📄 Documentation

- [Product Requirements Document](../Project%20documents/PRD-BRD-App.md)
- [Development Roadmap](../Project%20documents/roadmap.md)
- [Implementation Changelog](../Project%20documents/changelog.md)

## 🤝 Contributing

This project is currently in development. Contribution guidelines will be added soon.

## 📞 Support

For support and questions, please refer to the project documentation or contact the development team.

## 📄 License

This project is proprietary. All rights reserved.

---

**Last Updated**: August 17, 2025
**Version**: 0.1.0 (MVP Development Phase)
