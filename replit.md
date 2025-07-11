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