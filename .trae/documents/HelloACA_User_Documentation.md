# HelloACA User Documentation
## AI-Powered Contract Analysis Platform

---

## Table of Contents
1. [Getting Started](#getting-started)
2. [Setup Guides](#setup-guides)
3. [Feature Explanations](#feature-explanations)
4. [Use Cases](#use-cases)
5. [Frequently Asked Questions](#frequently-asked-questions)
6. [Troubleshooting](#troubleshooting)

---

## Getting Started

### What is HelloACA?
HelloACA is an AI-powered contract analysis platform that helps legal professionals, real estate agents, and business owners analyze contracts quickly and accurately. Using advanced Claude AI technology, HelloACA can detect risks, extract key clauses, and provide instant insights within 30 seconds.

### Quick Start Guide
1. **Sign Up**: Create your free account at `https://preview.helloaca.xyz`
2. **Upload Contract**: Drag and drop your PDF or DOCX contract file
3. **Get Analysis**: Receive instant AI-powered contract insights
4. **Chat & Explore**: Ask questions about your contract using our AI chat
5. **Export Reports**: Download professional PDF reports (Pro users)

---

## Setup Guides

### Account Registration

#### Creating Your Account
1. Visit the HelloACA homepage
2. Click "Get Started Free" or "Sign Up"
3. Enter your email address and create a secure password
4. Verify your email address through the confirmation link
5. Complete your profile setup

#### Subscription Plans
- **Free Plan**: 1 contract analysis per month, basic clause detection
- **Pro Plan ($49/month)**: 10 contracts per month, AI chat, risk classification, PDF reports
- **Business Plan ($299/month)**: Unlimited contracts, team collaboration, multilingual analysis

### Environment Setup for Developers

#### Prerequisites
- Node.js 18+ installed
- Git for version control
- Modern web browser (Chrome, Firefox, Safari, Edge)

#### Installation Steps
```bash
# Clone the repository
git clone https://github.com/your-org/helloaca.git
cd helloaca

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase and Claude API credentials

# Start development server
npm run dev
```

#### Environment Variables
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Claude AI Configuration
VITE_CLAUDE_API_KEY=your_claude_api_key
```

### Deployment Guide

#### Vercel Deployment (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure client (`VITE_*`) and server-only (`RESEND_API_KEY`, `EMAIL_FROM`, `SUPABASE_SERVICE_ROLE_KEY`, `API_ORIGIN`) environment variables in Vercel dashboard
3. Deploy with automatic builds on push to main branch

#### Manual Deployment
```bash
# Build for production
npm run build

# Deploy dist folder to your hosting provider
```

---

## Feature Explanations

### Contract Upload & Processing

#### Supported File Types
- **PDF Files**: Native PDF documents and scanned PDFs (with OCR)
- **DOCX Files**: Microsoft Word documents
- **File Size Limit**: Up to 10MB per file

#### Upload Process
1. **Drag & Drop**: Simply drag your contract file into the upload zone
2. **Browse Files**: Click "Browse" to select files from your computer
3. **Processing**: AI automatically extracts and analyzes contract text
4. **Results**: View comprehensive analysis within 30 seconds

### AI Analysis Engine

#### What Gets Analyzed
- **Key Clauses**: Payment terms, termination clauses, liability provisions
- **Risk Assessment**: High, medium, and low-risk elements identification
- **Obligations**: Party responsibilities and requirements
- **Dates & Deadlines**: Important timeline extraction
- **Financial Terms**: Pricing, penalties, and payment schedules

#### Analysis Output
- **Structured Summary**: Organized breakdown of contract elements
- **Risk Indicators**: Color-coded risk levels with explanations
- **Recommendations**: AI-suggested actions and considerations
- **Clause Extraction**: Specific text highlighting with context

### Dashboard Features

#### Contract History
- View all previously analyzed contracts
- Search contracts by name, date, or content
- Filter by risk level, contract type, or analysis date
- Quick re-analysis and report generation

#### Usage Statistics
- Track monthly contract analysis usage
- Monitor plan limits and upgrade notifications
- View analysis history and trends
- Export usage reports for billing purposes

### Team Collaboration

#### Invites and Member Management
- Owners can invite team members via email
- Invited users appear in the Team Members list with status `pending` until they accept
- Accepted invites show members as active with assigned roles

#### Notifications
- Email notifications (credits, analysis complete, weekly digest) are sent via Resend when configured
### System Notes
- All public links and footers reference `https://preview.helloaca.xyz`
- The notify API implements CORS headers and handles OPTIONS preflight requests
- Mixpanel identity is merged on sign-in to unify anonymous and user activity
### Interactive Chat Interface

#### Chat with Your Contract
- **Natural Language Queries**: Ask questions in plain English
- **Context-Aware Responses**: AI understands contract context
- **Clause References**: Direct links to relevant contract sections
- **Follow-up Questions**: Drill down into specific details

#### Example Queries
- "What are the payment terms?"
- "When does this contract expire?"
- "What happens if either party wants to terminate?"
- "Are there any penalty clauses?"
- "What are my obligations under this agreement?"

### Report Generation

#### PDF Report Features (Pro & Business Plans)
- **Professional Formatting**: Branded, client-ready reports
- **Executive Summary**: High-level contract overview
- **Detailed Analysis**: Comprehensive clause breakdown
- **Risk Assessment**: Visual risk indicators and recommendations
- **Action Items**: Suggested next steps and considerations

#### Report Customization (Business Plan)
- **White-label Options**: Add your company branding
- **Custom Templates**: Tailored report formats
- **Multi-language Support**: Reports in multiple languages
- **Team Collaboration**: Share reports with team members

---

## Use Cases

### Legal Professionals

#### Small Law Firms
**Challenge**: Limited time for thorough contract review
**Solution**: HelloACA provides instant contract analysis, allowing lawyers to focus on high-value legal strategy while ensuring comprehensive contract review.

**Workflow**:
1. Upload client contracts for preliminary analysis
2. Review AI-generated risk assessment
3. Use chat interface to explore specific clauses
4. Generate professional reports for client meetings
5. Focus legal expertise on identified high-risk areas

#### Solo Practitioners
**Challenge**: Need for efficient contract review without large legal team
**Solution**: AI-powered analysis acts as a virtual legal assistant, providing thorough contract review capabilities.

### Real Estate Professionals

#### Real Estate Agents
**Challenge**: Understanding complex purchase agreements and lease terms
**Solution**: Quick contract analysis helps agents better serve clients and identify potential issues before closing.

**Typical Use Cases**:
- Purchase agreement review for buyers
- Lease agreement analysis for renters
- Commercial property contract evaluation
- Identifying unusual or risky clauses for client discussion

#### Property Managers
**Challenge**: Managing multiple lease agreements and vendor contracts
**Solution**: Streamlined contract analysis for portfolio management and risk mitigation.

### Business Owners

#### Small to Medium Businesses
**Challenge**: Contract review without in-house legal counsel
**Solution**: Cost-effective contract analysis for vendor agreements, employment contracts, and partnership deals.

**Common Scenarios**:
- Vendor and supplier agreement review
- Employment contract analysis
- Partnership and joint venture agreements
- Service provider contract evaluation
- Licensing and intellectual property agreements

#### Startups
**Challenge**: Limited legal budget but high contract volume
**Solution**: Affordable contract analysis for rapid business growth and deal-making.

---

## Frequently Asked Questions

### General Questions

**Q: How accurate is the AI analysis?**
A: HelloACA uses Claude AI, one of the most advanced language models available. While highly accurate for clause identification and risk assessment, we always recommend final review by qualified legal professionals for critical decisions.

**Q: What file formats are supported?**
A: We support PDF and DOCX files up to 10MB. Our OCR technology can process scanned PDFs and image-based documents.

**Q: Is my contract data secure?**
A: Yes. All contracts are encrypted in transit and at rest. We use enterprise-grade security with Supabase and follow SOC 2 compliance standards. Contracts are not used to train AI models.

**Q: Can I delete my contracts?**
A: Absolutely. You have full control over your data and can delete contracts at any time from your dashboard.

### Subscription & Billing

**Q: Can I upgrade or downgrade my plan?**
A: Yes, you can change your subscription plan at any time. Changes take effect at the next billing cycle.

**Q: What happens if I exceed my monthly limit?**
A: Free users will be prompted to upgrade. Pro users can purchase additional analyses or upgrade to Business plan.

**Q: Do you offer refunds?**
A: We offer a 30-day money-back guarantee for new subscribers. Contact support for refund requests.

**Q: Is there a free trial for paid plans?**
A: Yes, we offer a 7-day free trial for Pro and Business plans. No credit card required.

### Technical Questions

**Q: Do I need to install any software?**
A: No, HelloACA is a web-based platform accessible through any modern browser. No downloads or installations required.

**Q: Can I use HelloACA on mobile devices?**
A: Yes, our platform is fully responsive and optimized for mobile and tablet use.

**Q: What browsers are supported?**
A: We support Chrome, Firefox, Safari, and Edge. We recommend using the latest browser versions for optimal performance.

**Q: Can I integrate HelloACA with other tools?**
A: API integration is available for Business plan subscribers. Contact our team for integration support.

### Analysis & Features

**Q: How long does analysis take?**
A: Most contracts are analyzed within 30 seconds. Complex or very long contracts may take up to 2 minutes.

**Q: Can HelloACA analyze contracts in other languages?**
A: Currently, we support English contracts. Multi-language support is available for Business plan subscribers.

**Q: What types of contracts work best?**
A: HelloACA works with all contract types including employment agreements, vendor contracts, leases, purchase agreements, service contracts, and more.

**Q: Can I re-analyze the same contract?**
A: Yes, you can re-analyze contracts at any time. This is useful when contracts are updated or when you want fresh insights.

---

## Troubleshooting

### Upload Issues

**Problem**: File won't upload
**Solutions**:
- Check file size (must be under 10MB)
- Ensure file format is PDF or DOCX
- Try refreshing the page and uploading again
- Check your internet connection

**Problem**: Upload stuck at processing
**Solutions**:
- Wait up to 2 minutes for complex documents
- Refresh the page and try again
- Check if the document is password-protected (not supported)
- Contact support if issue persists

### Analysis Problems

**Problem**: Analysis results seem incomplete
**Solutions**:
- Ensure the document contains readable text (not just images)
- Try re-uploading if the document was scanned
- Check if the contract is in a supported language
- Verify the document is actually a contract (not a cover letter or other document type)

**Problem**: Can't find specific clauses
**Solutions**:
- Use the chat interface to ask specific questions
- Try different search terms or phrases
- Check if the clause might be worded differently than expected
- Review the full contract text for manual verification

### Account & Billing Issues

**Problem**: Can't log in
**Solutions**:
- Check email and password spelling
- Use "Forgot Password" to reset your password
- Clear browser cache and cookies
- Try logging in from an incognito/private browser window

**Problem**: Billing or subscription issues
**Solutions**:
- Check your email for billing notifications
- Verify payment method is current and valid
- Contact support for billing disputes or questions
- Review subscription details in your account settings

### Performance Issues

**Problem**: Platform running slowly
**Solutions**:
- Check your internet connection speed
- Close other browser tabs to free up memory
- Try using a different browser
- Clear browser cache and cookies
- Disable browser extensions that might interfere

### Getting Help

**Need Additional Support?**
- Email: support@helloaca.xyz
- Live Chat: Available during business hours (9 AM - 6 PM EST)
- Help Center: Comprehensive guides and tutorials
- Community Forum: Connect with other users and share tips

**Response Times**:
- Free Plan: 48-72 hours
- Pro Plan: 24 hours
- Business Plan: 4 hours (priority support)

---

*Last Updated: December 2024*
*Version: 1.0*
