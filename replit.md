# Business Launch Plan Generator

## Overview

This is a single-page web application that generates detailed 30-day launch plans for businesses using OpenAI API integration. Users can input comprehensive business information through text fields or upload PDF files, and the application generates structured launch plans with weekly breakdowns, daily tasks, tools, and KPIs.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: React Hook Form for form handling, TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **API Design**: RESTful API with JSON responses
- **File Processing**: Multer for PDF file uploads with memory storage
- **External Integration**: OpenAI API for generating launch plans

### Data Storage Solutions
- **Database**: PostgreSQL with Neon Database serverless connection
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Simple schema with users and launch_plans tables
- **Storage**: In-memory storage fallback for development/testing

## Key Components

### Input Methods
1. **Text Input Form**: Comprehensive form with fields for business idea, industry, target market, time commitment, budget, and additional details
2. **PDF Upload**: Drag-and-drop file upload functionality with 10MB size limit and PDF-only filtering

### AI Integration
- **OpenAI GPT-4o Model**: Uses the latest model for generating detailed launch plans
- **Structured Prompts**: Implements specific prompt templates focusing on Reddit-first marketing, zero-budget growth, and solo operation efficiency
- **JSON Response Format**: Returns structured weekly plans with daily tasks, tools, time estimates, and KPIs

### UI/UX Design
- **Design System**: Inspired by Notion's clean forms and Linear's project planning interface
- **Color Scheme**: Primary indigo (#6366F1), secondary purple (#8B5CF6), off-white background (#FAFAFA)
- **Layout**: Single-column centered layout with generous white space and card-based sections
- **Responsive**: Mobile-first responsive design

## Data Flow

1. **User Input**: User fills out business information form or uploads PDF
2. **Validation**: Frontend validates input using Zod schemas before submission
3. **API Request**: Data sent to backend API endpoint (/api/generate-plan or /api/generate-plan-pdf)
4. **PDF Processing**: If PDF uploaded, text is extracted using pdf-parse library, then summarized using OpenAI
5. **AI Generation**: OpenAI API called with structured prompt to generate launch plan
6. **Storage**: Generated plan stored in database with unique ID
7. **Response**: Structured JSON response returned to frontend
8. **Display**: Launch plan displayed in collapsible weekly format with daily task breakdowns

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling and validation
- **zod**: Runtime type validation
- **openai**: Official OpenAI API client
- **pdf-parse**: PDF text extraction library
- **multer**: File upload handling middleware

### UI Dependencies
- **@radix-ui/***: Comprehensive set of headless UI components
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **class-variance-authority**: Component variant management
- **date-fns**: Date utility library

### Development Dependencies
- **vite**: Fast build tool and dev server
- **typescript**: Type safety
- **esbuild**: Fast bundling for production
- **tsx**: TypeScript execution for development

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite builds React app to `dist/public` directory
2. **Backend Build**: ESBuild bundles server code to `dist/index.js`
3. **Environment Variables**: Requires `DATABASE_URL` and `OPENAI_API_KEY`

### Scripts
- `npm run dev`: Development server with hot reload
- `npm run build`: Production build for both frontend and backend
- `npm run start`: Production server startup
- `npm run db:push`: Database schema migration

### Infrastructure Requirements
- **Database**: PostgreSQL database (Neon Database recommended)
- **API Keys**: OpenAI API key for AI generation
- **File Storage**: Memory storage for temporary PDF processing (no persistent file storage needed)
- **Session Storage**: PostgreSQL-based session storage using connect-pg-simple

### Key Architectural Decisions

1. **Serverless Database Choice**: Chose Neon Database for PostgreSQL to enable easy scaling and reduce infrastructure management overhead

2. **Memory-based File Processing**: PDF files are processed in memory rather than stored persistently, reducing storage costs and complexity while maintaining security

3. **Structured AI Prompts**: Implemented highly specific prompt templates to ensure consistent, actionable launch plan output focused on practical solo founder needs

4. **Component-based UI**: Used Shadcn/ui for consistent, accessible components that can be easily customized while maintaining design system coherence

5. **Type Safety**: Comprehensive TypeScript usage with Zod validation ensures data integrity from frontend forms through database storage

6. **Smart Business Name Extraction**: Automatically extracts business names from executive summaries and uses them in plan titles for better personalization

### Recent Changes (January 11, 2025)

1. **Enhanced Share Functionality**: Added share dialog functionality to the "Ready to Launch?" section share button, matching the behavior of the toolbar share button

2. **Editable Plan Titles**: Users can now edit plan titles by clicking the Edit button and modifying the title field directly

3. **Custom PDF Filenames**: PDF downloads now use the custom plan title and current date (format: BusinessName_2025-01-11.pdf)

4. **Automatic Business Name Detection**: When a plan is generated, the system automatically extracts the business name from the executive summary and sets it as the plan title

5. **Security Enhancements**: Implemented comprehensive security improvements:
   - **Session Security**: Required SESSION_SECRET in production, removed hardcoded fallback, added validation
   - **PostgreSQL Session Store**: Sessions now stored in PostgreSQL with automatic pruning instead of in-memory
   - **Enhanced Cookie Security**: Added sameSite protection, rolling sessions, custom session names
   - **Helmet.js Integration**: Added security headers for XSS, clickjacking, and other attack prevention
   - **Rate Limiting**: Implemented general rate limiting (100 req/15min) and stricter limits for auth endpoints
   - **Input Validation**: Added express-validator for all user inputs with proper sanitization
   - **Payload Limits**: Set 10MB limits on request bodies to prevent DoS attacks

6. **Comprehensive SEO Optimization**: Implemented full SEO strategy:
   - **Meta Tags**: Added title, description, keywords, author tags to all pages
   - **Open Graph Tags**: Full OG tags for Facebook/LinkedIn sharing with custom OG image
   - **Twitter Cards**: Complete Twitter card meta tags for better social media presence
   - **Structured Data**: Added Schema.org JSON-LD markup for WebApplication type
   - **Dynamic SEO Component**: Created reusable SEO component for page-specific meta tags
   - **Share Page SEO**: Dynamic meta tags based on shared plan content
   - **SEO Files**: Added robots.txt, sitemap.xml, and .htaccess for crawlers and caching
   - **Canonical URLs**: Proper canonical links to avoid duplicate content issues
   - **No-index Support**: 404 and error pages marked with noindex directive

7. **Multi-Stage AI Pipeline Implementation**: Enhanced launch plan generation with three-stage AI processing:
   - **Stage 1 (GPT-4o)**: Generates initial launch plan following the 30-day framework
   - **Stage 2 (GPT-4 Turbo)**: Proofreads the plan and generates social media post drafts for all tasks mentioning Reddit posts, Twitter threads, or social content
   - **Stage 3 (GPT-4o as O3)**: Final quality assurance, schema validation, and embedding of post drafts into daily tasks
   - **Schema Updates**: Extended launchPlanResponse schema to support postDraft objects with title, body, and thread fields
   - **UI Enhancements**: Added social media post draft display in both home and share pages with blue-themed cards showing formatted post content
   - **Framework Compliance**: Ensures all plans follow the 30-day solopreneur launch framework with Speed & Simplicity, Reddit-First Marketing, Zero-Budget Growth, and Solo Operation Efficiency principles

8. **Enhanced Content Framework** (January 11, 2025): Updated blog and social post drafting to follow engaging human content framework:
   - **Four-Part Structure**: 
     1. Relatable Struggle (Hook) - Start with problem/frustration, not product
     2. Quiet Build-up (Context) - Share why/how with specific details
     3. Turning Point (Emotional Tension) - Include shift moment where things got real
     4. Breakthrough (The Reveal) - Introduce solution as survival tactic with alternatives
   - **Key Principles**: 
     - Mention 2-3 alternatives and complementary tools in each post
     - CTA woven naturally into body content, not at the end
     - Focus on providing value first, product second
     - Write conversationally with specific numbers and emotions
   - **Implementation**: Modified Stage 2 of AI pipeline to generate authentic, human-centered content that builds trust and engagement

9. **Enhanced Draft Post Editing & Share Page PDF Download** (January 11, 2025):
   - **Draft Post Editing**: Users can now edit social media post drafts when editing a plan:
     - Edit existing post titles, body content, and Twitter threads
     - Add new post drafts to tasks that don't have them
     - Add or remove individual tweets from Twitter threads
     - All changes are saved when clicking "Save Changes"
   - **Share Page PDF Download**: Added PDF download functionality to shared plan pages:
     - Download PDF button added next to Copy Plan button
     - Uses same PDF generation logic as home page
     - Automatically extracts plan title from overview
     - Includes all plan details, social media drafts, tools, and KPIs
   - **Implementation**: Extended edit mode functionality in home.tsx and added jsPDF integration to share.tsx

10. **AI Pipeline Progress Stepper** (January 11, 2025): Added visual progress tracking for launch plan generation:
   - **Stepper Component**: Created a reusable stepper component (`client/src/components/ui/stepper.tsx`) with:
     - Four phases: Core Plan Generation, Proofread & Draft Posts, QA & Completion, Delivered
     - Visual states: completed (filled circles with checkmarks), active (outlined circle), pending (gray)
     - Smooth 300ms animations for state transitions and progress line fill
     - Mobile responsive: horizontal on desktop, vertical on mobile (<640px)
   - **Progress Integration**: Added step tracking to generation mutations with simulated timing:
     - Stage 1 (0-8s): Core Plan Generation
     - Stage 2 (8-20s): Proofreading & Creating Post Drafts
     - Stage 3 (20s-completion): QA & Final Validation
     - Stage 4: Delivered (shown for 1s after completion)
   - **UI Placement**: Fixed above plan details during generation and briefly after completion
   - **Progress Percentage**: Shows completion percentage (0-100%) below stepper
   - **Mobile Optimizations**: Smaller circles, vertical layout, hidden connector lines on mobile
   - **Implementation**: Added state management for currentGenerationStep and isGenerating in home.tsx

11. **Primary Domain Configuration** (January 11, 2025): Established launchgen.dev as the primary domain with comprehensive redirect setup:
   - **Domain Redirects**: Configured automatic redirects:
     - www.launchgen.dev → launchgen.dev (301 permanent redirect)
     - launch-gen.replit.app → launchgen.dev (301 permanent redirect)
     - Force HTTPS on all requests in production
   - **Server-Side Redirects**: Implemented Express middleware to handle domain redirects at the server level
   - **Client-Side Redirects**: Added .htaccess rules for Apache-based hosting environments
   - **SEO Updates**: Updated all SEO-related configurations to use the new primary domain:
     - Meta tags: Updated og:url, twitter:url to use full launchgen.dev URLs
     - Canonical URLs: Changed from relative to absolute URLs with launchgen.dev
     - Structured Data: Updated schema.org WebApplication URL to launchgen.dev
     - Sitemap: Changed all URLs from relative paths to full launchgen.dev URLs
     - Robots.txt: Updated sitemap location to full URL
     - SEO Component: Modified to use launchgen.dev for production, localhost for development
   - **Implementation Details**:
     - Modified `server/index.ts` to add domain redirect middleware
     - Updated `client/public/.htaccess` with RewriteRules
     - Updated `client/src/components/SEO.tsx` to handle domain-specific URLs
     - Modified `client/index.html` with new domain in all meta tags
     - Updated `client/public/sitemap.xml` and `client/public/robots.txt`

12. **PostHog Analytics Integration** (January 11, 2025): Added comprehensive analytics tracking with custom events:
   - **Configuration Updates**: 
     - Modified PostHog initialization to disable tracking in development environment
     - Only provides API key in production mode
     - Uses opt_out_capturing() in development to prevent any data collection
     - Disabled pageview, pageleave, autocapture, and session recording in dev
   - **Custom Event Tracking**:
     - Plan Generation: Tracks method (text_input/pdf_upload), plan_id, business_name, has_post_drafts
     - PDF Downloads: Tracks from_page, plan details, file_name, and page_count
     - Plan Sharing: Tracks when users generate share links with plan_id and share_token
     - Shared Plan Views: Tracks when someone accesses a shared plan via share link
   - **Implementation**: 
     - Added usePostHog hook to home.tsx and share.tsx components
     - Added posthog.capture() calls in mutation success handlers and key functions
     - Included relevant metadata with each event for better analytics insights

13. **Server-Sent Events (SSE) Implementation** (January 11, 2025): Resolved production timeout issues by implementing real-time streaming for launch plan generation:
   - **Problem Diagnosis**: 524 timeout errors in production due to 4+ minute AI pipeline exceeding proxy timeout limits
   - **SSE Solution**: Added new streaming endpoints that prevent timeouts and provide real-time progress updates:
     - `/api/generate-plan-sse`: Streams text-based plan generation with progress updates
     - `/api/generate-plan-pdf-sse`: Streams PDF-based plan generation with progress updates
   - **Backend Changes**: 
     - Modified OpenAI service to support progress callbacks throughout 3-stage pipeline
     - Added keep-alive functionality (30-second intervals) to maintain connection
     - Implemented proper SSE headers and streaming response handling
   - **Frontend Changes**:
     - Updated client mutations to use fetch with streaming response instead of EventSource
     - Added proper stream parsing and progress step updates
     - Maintained existing stepper UI integration for visual progress tracking
   - **Benefits**: 
     - Eliminates production timeout issues entirely
     - Provides real-time progress feedback to users
     - Maintains connection stability during long-running AI operations
     - Backward compatible with existing UI components

14. **Production Security Fixes** (January 11, 2025): Resolved critical Content Security Policy issues affecting PostHog analytics and Replit development features:
   - **CSP Configuration**: Fixed overly restrictive CSP policy that was blocking all external scripts and connections:
     - Added specific PostHog domains to scriptSrc and connectSrc directives
     - Maintained security while allowing PostHog analytics to function in production
     - Configured proper CSP directives including unsafe-inline for necessary inline scripts
   - **Development vs Production Scripts**: Made Replit dev banner conditional to prevent CSP violations:
     - Banner script now only loads on localhost and .replit.dev domains
     - Eliminates "Refused to load script" errors in production
     - Reduces unnecessary external script loading in production environment
   - **Analytics Restoration**: PostHog analytics now fully functional in production with proper CSP permissions
   - **Implementation Details**:
     - Modified `server/index.ts` Helmet CSP configuration with specific domain allowlists
     - Updated `client/index.html` to conditionally load Replit banner based on hostname
     - Resolved all "Refused to connect" and "Refused to load script" console errors