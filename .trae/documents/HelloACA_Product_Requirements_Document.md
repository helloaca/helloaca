# Helloaca – AI Contract Analyzer
## Product Requirements Document (Updated)

## 1. Product Overview
HelloACA is an AI-powered contract analysis platform that helps small law firms, real estate agents, and business owners detect contract risks, clauses, and obligations within 30 seconds. The platform leverages advanced AI technology to provide instant contract insights, risk assessment, and interactive contract consultation through an intuitive web interface.

The product addresses the critical need for fast, accurate contract analysis in professional environments where legal expertise may be limited but contract understanding is essential for business decisions.

## 2. Core Features

### 2.1 User Roles
| Role | Registration Method | Core Permissions |
|------|---------------------|------------------|
| Free User | Email registration | 1 contract analysis per month, basic clause detection |
| Pro User | Paid subscription ($49/month) | 10 contracts per month, AI chat, risk classification, PDF reports |
| Business User | Enterprise subscription ($299/month) | Unlimited contracts, team collaboration, multilingual analysis, white-label reports |

### 2.2 Feature Module
Our HelloACA platform consists of the following main pages:
1. **Landing Page**: hero section with value proposition, feature showcase, testimonials, and pricing overview
2. **Dashboard**: contract history, upload interface, usage statistics, plan management
3. **Contract Analysis Page**: file upload, AI analysis results, risk assessment display
4. **Chat Interface**: interactive contract consultation, PDF preview, message history
5. **Reports Page**: generated PDF reports, download history, export options
6. **Authentication Pages**: login, registration, password recovery
7. **Settings Page**: profile management, subscription details, team collaboration settings (owner, active members, and pending invites shown with pending status until acceptance)

### 2.3 Page Details
| Page Name | Module Name | Feature description |
|-----------|-------------|---------------------|
| Landing Page | Hero Section | Display compelling value proposition with "Try for Free" and "See Demo" CTAs |
| Landing Page | Feature Grid | Showcase three core features: Upload & Scan, Instant AI Insights, Chat with Contract |
| Landing Page | Testimonials | Display customer success stories from real estate agents and law firms |
| Landing Page | Pricing Section | Present three-tier pricing model with feature comparisons |
| Dashboard | Contract History | List previously analyzed contracts with search and filter capabilities |
| Dashboard | Upload Widget | Drag-and-drop file upload for PDF and DOCX contracts |
| Dashboard | Usage Statistics | Display current plan usage and upgrade prompts |
| Contract Analysis | File Processing | Handle PDF/DOCX upload with OCR for image-based documents |
| Contract Analysis | AI Analysis Display | Show structured clause extraction, risk levels, and recommendations |
| Contract Analysis | Risk Assessment | Categorize and highlight contract risks with severity indicators |
| Chat Interface | Contract Preview | Display uploaded contract with synchronized highlighting |
| Chat Interface | AI Chat Window | Interactive Q&A about contract details with context-aware responses |
| Chat Interface | Message History | Store and display previous chat conversations per contract |
| Reports Page | PDF Generation | Create branded PDF reports with analysis findings and recommendations |
| Reports Page | Download Management | Track and provide access to previously generated reports |
| Authentication | Login/Register | Email-based authentication with OAuth integration options |
| Settings | Profile Management | User account details, password changes, notification preferences |
| Settings | Subscription Management | Plan upgrades, billing history, payment method updates |

## 3. Core Process

**Free User Flow:**
Users register with email, upload one contract per month, receive basic clause analysis, and view results on the platform without PDF export capability.

**Pro User Flow:**
Subscribers upload contracts (up to 10/month), receive comprehensive AI analysis with risk classification, interact with contracts through AI chat, and export detailed PDF reports.

**Business User Flow:**
Enterprise users enjoy unlimited contract uploads, team collaboration features, multilingual analysis capabilities, and white-label report generation for client distribution.
Helloaca is an AI-powered contract analysis platform that helps founders, lawyers, procurement, contract managers, freelancers, vendors, buyers, and teams quickly understand contracts. Upload a contract and get instant insights into risks, obligations, protections, deadlines, and a plain‑language summary, with interactive Q&A.

## 2. Pricing & Plans
| Plan | Price | Limit | Key Capabilities |
|------|-------|-------|------------------|
| Free | $0/month | 1 analysis per month | Basic analysis summary |
| Pro | $3/month | Unlimited analyses | Full AI suite, risk detection, Chat with Contract, PDF export |
| Business (Roadmap) | TBD | Team features | Collaboration, white‑label exports |

## 3. Feature Modules
1. **Landing Page**: hero, “How helloaca works”, “Why helloaca”, “Where helloaca works best”, testimonials, pricing
2. **Dashboard**: contract history, upload widget, usage status
3. **Contract Analysis**: results overview with risks, obligations, protections, deadlines, summary
4. **Chat Interface**: interactive Q&A with citations to source sections
5. **Reports**: PDF export of findings and summaries
6. **Authentication**: login, register, forgot password
7. **Settings**: profile and plan management
8. **Documentation**: `/docs` GitBook‑like page with sticky sidebar, search, anchors

## 4. Page Details
| Page | Module | Description |
|------|--------|-------------|
| Landing | Hero | Value proposition, CTAs for Try Free and Subscribe $3/month |
| Landing | How helloaca works | Three cards: Upload & Scan, Instant AI Insights, Chat with Contract |
| Landing | Why helloaca | Four cards: Clarity without complexity, Instant risk detection, Control over decisions, Protection that’s always accessible |
| Landing | Where works best | Horizontal carousel of agreement types with scroll capture to force horizontal scrolling before page continues |
| Landing | Testimonials | Quotes with star ratings |
| Landing | Pricing | Single Pro plan at $3/month; clear feature bullets |
| Landing | Newsletter | Minimal email subscribe band before footer |
| Docs | GitBook‑like | Sticky sidebar with search, anchors, scroll‑spy; comprehensive product guide |
| Dashboard | Upload widget | Drag‑and‑drop PDF/DOCX; OCR for scanned PDFs |
| Analysis | Results | Risks, obligations, protections, deadlines, summary |
| Chat | Q&A | Ask targeted questions; answers with citations |
| Reports | Export | Download summaries and clause tables as PDF |

## 5. Core Processes
**Free Flow**
- Register → Upload one contract/month → View analysis summary.

**Pro Flow**
- Register → Subscribe → Upload unlimited contracts → View analysis → Chat → Export PDF.

```mermaid
graph TD
    A[Landing] --> B[Register/Login]
    B --> C[Dashboard]
    C --> D[Upload]
    D --> E[AI Analysis]
    E --> F[Results]
    F --> G[Chat]
    F --> H[PDF Export]
    C --> I[History]
```

## 4. User Interface Design

### 4.1 Design Style
- **Primary Color**: #4ECCA3 (vibrant teal for CTAs and highlights)
- **Secondary Color**: #000000 (black for text and contrast elements)
- **Background Color**: #FFFFFF (clean white background)
- **Button Style**: Rounded corners (12px border radius) with hover animations
- **Typography**: Inter (primary font, weights 400-700), Space Grotesk (secondary, for headings)
- **Layout Style**: Card-based design with 20px border radius and subtle shadows
- **Logo Style**: Minimal wordmark with AI-inspired letter A and integrated balance-scale icon
- **Icons**: Modern, minimal line icons with consistent stroke width

### 4.2 Page Design Overview
| Page Name | Module Name | UI Elements |
|-----------|-------------|-------------|
| Landing Page | Hero Section | Large typography (Space Grotesk 700), primary CTA button (#4ECCA3), clean white background |
| Landing Page | Feature Grid | Three-column card layout, subtle shadows (0px 6px 18px rgba(0,0,0,0.06)), 24px padding |
| Dashboard | Upload Widget | Drag-and-drop zone with dashed border, file type indicators, progress animations |
| Contract Analysis | Results Display | Structured data cards, color-coded risk levels (red/yellow/green), expandable sections |
| Chat Interface | Split Layout | Left panel for PDF preview, right panel for chat with #4ECCA3 accent colors |
| Reports Page | Report Cards | Grid layout with download buttons, file size indicators, creation timestamps |

### 4.3 Responsiveness
The platform is desktop-first with mobile-adaptive design. Touch interaction optimization is implemented for mobile users, with responsive breakpoints at 768px (tablet) and 480px (mobile). The chat interface adapts to single-column layout on mobile devices.

## 5. Recent Product Updates

- Domain references updated to `https://helloaca.xyz` for public links and exports.
- Team Members list dynamically loads owner, active members, and pending invites from Supabase.
- Email notifications endpoint includes CORS headers and OPTIONS preflight handling.
- Frontend uses `VITE_API_ORIGIN` for environment-safe routing; local dev falls back safely.
- Mixpanel identity merge (`alias` before `identify`) ensures anonymous activity is associated with signed-in users.
## 6. Supported Agreements
NDAs, MSAs, SOWs, SaaS/subscription agreements, vendor/procurement contracts, licensing & IP, employment, independent contractor, lease & rental, partnership/joint venture, loan & financing, consulting, DPA, EULA, distribution, reseller, SLA.

## 7. SEO & Indexing
- **Canonical**: Set per route dynamically to `origin + pathname`; removes static canonical from `index.html` to avoid duplicates.
- **Robots Meta**: Public routes `index, follow`; protected routes `noindex, nofollow`.
- **Sitemap**: `https://helloaca.xyz/sitemap.xml` includes primary public pages (`/`, `/pricing`, `/about`, `/contact`, `/privacy`, `/terms`, `/login`, `/register`, `/forgot-password`, `/docs`).
- **Robots.txt**: `Sitemap: https://helloaca.xyz/sitemap.xml` for crawler discovery.
- **Open Graph**: `og:url` synced to canonical per route.

## 8. Analytics
- Google Analytics 4 Measurement ID: `G-0JVYR712V0`.
- Page views tracked on route changes.
- Event scaffolding for forms, navigation, pricing selections.

## 9. Architecture & Data
- Frontend: React + Vite + Tailwind.
- Storage & Auth: Supabase (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- OCR & Parsing: PDF/DOCX supported; OCR for scanned PDFs.
- Exports: PDF reports with summaries and clause tables.

## 10. UX & Design Principles
- Typography: Inter (body), Space Grotesk (headings).
- Components: Rounded cards, light shadows, accessible contrast.
- Animations: IntersectionObserver‑based fade/slide; lightweight and performant.
- Carousel: Horizontal snap with arrow controls; scroll capture in section.

## 11. Security & Privacy
- Data encrypted in transit and at rest.
- Contracts stored in secure buckets; only owner can view.
- Permanent deletion available from dashboard.

## 12. Performance & Accessibility
- Avoid heavy libraries; use native APIs where possible.
- Keyboard and screen‑reader friendly controls.
- Responsive layout with mobile optimizations.

## 13. Roadmap
- Business plan: collaboration, white‑label exports.
- More agreement‑specific templates and checklists.
- Rich comparison view for negotiated versions.

## 14. Risks & Mitigations
- OCR quality variability → user guidance on scan quality.
- Misinterpretation risk → citations in Chat and explicit non‑legal‑advice messaging.

## 15. Glossary
- **MSA**: Master Service Agreement.
- **SOW**: Statement of Work.
- **DPA**: Data Processing Agreement.
- **SLA**: Service Level Agreement.
