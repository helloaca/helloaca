# HelloACA - AI Contract Analyzer

[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0.8-646CFF.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green.svg)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3.6-38B2AC.svg)](https://tailwindcss.com/)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](#license)

> **AI-powered contract analysis platform that helps small law firms, real estate agents, and business owners detect contract risks, clauses, and obligations within 30 seconds.**

HelloACA leverages advanced AI technology to provide instant contract insights, risk assessment, and interactive contract consultation through an intuitive web interface. Transform complex legal documents into actionable insights with the power of artificial intelligence.

## 🚀 Features

### Core Capabilities
- **⚡ Instant Analysis**: Upload and analyze contracts in under 30 seconds
- **🤖 AI-Powered Insights**: Advanced clause detection and risk assessment using Claude AI
- **💬 Interactive Chat**: Ask questions about your contracts with context-aware AI responses
- **📊 Risk Classification**: Automated categorization of contract risks with severity indicators
- **📄 PDF Reports**: Generate professional, branded analysis reports
- **👥 Team Collaboration**: Dynamic team list with owner, members, and pending invites until accepted
- **🔒 Secure Storage**: Enterprise-grade security with Supabase backend

### User Tiers

| Feature | Free | Pro ($49/month) | Business ($299/month) |
|---------|------|-----------------|----------------------|
| Contract Analysis | 1/month | 10/month | Unlimited |
| AI Chat | ❌ | ✅ | ✅ |
| PDF Reports | ❌ | ✅ | ✅ |
| Risk Classification | Basic | Advanced | Advanced |
| Team Collaboration | ❌ | ❌ | ✅ |
| White-label Reports | ❌ | ❌ | ✅ |
| Multilingual Analysis | ❌ | ❌ | ✅ |

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI library with hooks and concurrent features
- **TypeScript 5** - Type-safe development with enhanced developer experience
- **Vite** - Lightning-fast build tool and development server
- **TailwindCSS 3** - Utility-first CSS framework for rapid styling
- **React Router 6** - Declarative routing for single-page applications

### Backend & Services
- **Supabase** - Backend-as-a-Service with PostgreSQL database
- **Supabase Auth** - Authentication with email/password and social login
- **Supabase Storage** - Secure file storage for contract documents
- **Claude AI (Anthropic)** - Advanced AI for contract analysis and chat
- **Stripe** - Payment processing for subscription management

### Development & Deployment
- **ESLint** - Code linting and quality assurance
- **PostCSS** - CSS processing and optimization
- **Vercel** - Frontend deployment and hosting
- **Git** - Version control with comprehensive .gitignore

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Git for version control
- Supabase account for backend services
- Claude AI API key for AI functionality
- Stripe account for payment processing

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/helloaca.git
   cd helloaca
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in your API keys and configuration (see Environment Variables section below)

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173` to see the application

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration (client)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Claude AI Configuration (client)
VITE_CLAUDE_API_KEY=your_claude_api_key

# Stripe Configuration (client)
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Application Configuration (client)
VITE_APP_URL=http://localhost:5173
VITE_API_ORIGIN=https://helloaca.xyz

# Email Notifications (server-only; set in hosting env, not client)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM="helloaca <noreply@helloaca.xyz>"
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
API_ORIGIN=https://helloaca.xyz
```

Notes:
- Server-only variables (`RESEND_API_KEY`, `EMAIL_FROM`, `SUPABASE_SERVICE_ROLE_KEY`, `API_ORIGIN`) must be set in the serverless runtime environment (e.g., Vercel Project Settings) and should NOT be included in client bundles.
- `VITE_API_ORIGIN` is consumed by the frontend for constructing public links and API routes.

### Getting API Keys

1. **Supabase**: Create a project at [supabase.com](https://supabase.com) and get your URL and anon key
2. **Claude AI**: Get your API key from [console.anthropic.com](https://console.anthropic.com)
3. **Stripe**: Create an account at [stripe.com](https://stripe.com) and get your publishable key

## 🏗️ Project Structure

```
helloaca/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components (buttons, inputs, etc.)
│   │   └── layout/         # Layout components (header, footer, etc.)
│   ├── pages/              # Page components
│   │   ├── LandingPage.tsx # Marketing homepage
│   │   ├── Dashboard.tsx   # User dashboard
│   │   ├── ContractAnalysis.tsx # Analysis results
│   │   └── ChatInterface.tsx # AI chat interface
│   ├── lib/                # Utility libraries
│   │   ├── supabase.ts     # Supabase client configuration
│   │   ├── claude.ts       # Claude AI API integration
│   │   └── utils.ts        # Helper functions
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx # Authentication state management
│   └── services/           # API service layers
├── supabase/
│   └── migrations/         # Database migration files
├── public/                 # Static assets
└── docs/                   # Project documentation
```

## 🚀 Usage Guide

### For Users

1. **Sign Up**: Create an account with email and password
2. **Upload Contract**: Drag and drop PDF or DOCX files
3. **View Analysis**: Get instant AI-powered insights and risk assessment
4. **Chat with Contract**: Ask specific questions about contract terms
5. **Generate Reports**: Export professional PDF reports (Pro/Business plans)
6. **Invite Team Members**: Send team invites; pending invites appear until accepted

## 📣 Recent Product Updates

- Domain references updated to `https://helloaca.xyz` across app, emails, and exports.
- Team Members list now loads owner, active members, and pending invites from Supabase.
- Email notify endpoint includes CORS headers and handles OPTIONS preflight.
- Frontend uses `VITE_API_ORIGIN` for environment-safe API routing.
- Mixpanel identity merge on sign-in associates anonymous activity with user profiles.

### For Developers

1. **Development**: Run `npm run dev` for hot-reload development
2. **Type Checking**: Run `npm run check` to verify TypeScript types
3. **Linting**: Run `npm run lint` to check code quality
4. **Building**: Run `npm run build` to create production build
5. **Preview**: Run `npm run preview` to test production build locally

## 🔌 API Integrations

### Supabase Setup

1. Create tables using the migration files in `supabase/migrations/`
2. Set up Row Level Security (RLS) policies
3. Configure storage buckets for file uploads
4. Enable authentication providers as needed

### Claude AI Integration

The application uses Claude AI for:
- Contract clause extraction
- Risk assessment and classification
- Interactive chat responses
- Content summarization

### Stripe Integration

Payment processing includes:
- Subscription plan management
- Usage tracking and billing
- Webhook handling for payment events
- Customer portal integration

## 🌐 Deployment

### Vercel Deployment (Recommended)

1. **Connect Repository**
   - Import your GitHub repository to Vercel
   - Vercel will auto-detect the Vite configuration

2. **Configure Environment Variables**
   - Add all client variables in Vercel dashboard (`VITE_*`)
   - Add server-only variables (`RESEND_API_KEY`, `EMAIL_FROM`, `SUPABASE_SERVICE_ROLE_KEY`, `API_ORIGIN`)
   - Use `https://helloaca.xyz` for public links and API origin

3. **Deploy**
   ```bash
   npm run build  # Test build locally first
   git push       # Deploy automatically via Vercel
   ```

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder** to your hosting provider

### Environment-Specific Configuration

- **Development**: Uses local environment variables
- **Production**: Configure environment variables in your hosting platform
- **Staging**: Use separate Supabase project for testing

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. **Fork the repository** and create a feature branch
2. **Install dependencies** and set up your development environment
3. **Make your changes** following our coding standards
4. **Test thoroughly** including edge cases
5. **Submit a pull request** with a clear description

### Coding Standards

- Use TypeScript for all new code
- Follow existing code style and formatting
- Add JSDoc comments for complex functions
- Write meaningful commit messages
- Update documentation for new features

### Pull Request Process

1. Ensure your code passes all linting checks
2. Update README.md if you change functionality
3. Add tests for new features when applicable
4. Request review from maintainers

## 📄 License

**Copyright © 2025. All rights reserved.**

This software is proprietary and confidential. This code is made available for viewing and reference purposes only.

**You may NOT:**
- Use this code in your own projects
- Copy, modify, or distribute this code
- Use this code for commercial purposes
- Create derivative works based on this code
- Reverse engineer or decompile this software
- Share this code with third parties

**Written permission must be obtained from the copyright holder for any use.**

For licensing inquiries, contact: [afrotechboss@yahoo.com](mailto:afrotechboss@yahoo.com)

See the [LICENSE](LICENSE) file for complete terms and conditions.

## 🆘 Support

- **Documentation**: Check our [docs](./docs) folder for detailed guides
- **Issues**: Report bugs and request features via GitHub Issues
- **Community**: Join our discussions for help and collaboration

## 🙏 Acknowledgments

- Anthropic for providing powerful Claude AI capabilities
- Supabase for excellent backend-as-a-service platform
- Vercel for seamless deployment experience
- The open-source community for amazing tools and libraries

---

**Built with ❤️ for legal professionals and business owners who need fast, accurate contract analysis.**
