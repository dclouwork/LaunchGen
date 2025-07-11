# LaunchGen - Business Launch Plan Generator

A powerful single-page web application that generates detailed 30-day launch plans for businesses using OpenAI's GPT-4. Designed for solo founders, side hustlers, and aspiring entrepreneurs who need structured, actionable strategies to launch their business ideas.

🌐 **Live Demo**: [https://launchgen.dev](https://launchgen.dev)

## 🚀 Features

- **AI-Powered Launch Plans**: Generates comprehensive 30-day business launch strategies using OpenAI GPT-4
- **Multiple Input Methods**: 
  - Text form with detailed business information fields
  - PDF upload for business plan analysis (up to 10MB)
- **Structured Framework**: Follows the "Zero to Launch" methodology with:
  - Speed & Simplicity
  - Reddit-First Marketing
  - Zero-Budget Growth
  - Solo Operation Efficiency
- **Social Media Post Drafts**: Automatically generates Reddit posts, Twitter threads, and other social content
- **Shareable Plans**: Generate unique share links for your launch plans
- **PDF Export**: Download your complete launch plan as a professionally formatted PDF
- **Community Feedback**: Built-in feedback system with upvoting/downvoting
- **Edit Capabilities**: Modify plan titles, tasks, and social media drafts
- **Progress Tracking**: Visual stepper showing AI generation progress

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Shadcn/ui** components (built on Radix UI)
- **TanStack Query** for server state management
- **React Hook Form** with Zod validation
- **Wouter** for routing
- **jsPDF** for PDF generation

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **PostgreSQL** database (Neon Database)
- **Drizzle ORM** for database operations
- **OpenAI API** integration
- **Multer** for file uploads
- **Helmet.js** for security
- **Express Rate Limiting** for API protection

## 📋 Prerequisites

- Node.js 18+ (or Node.js 20 recommended)
- PostgreSQL database (Neon Database recommended)
- OpenAI API key
- npm or yarn package manager

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/launchgen.git
cd launchgen
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create a .env file in the root directory
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]
OPENAI_API_KEY=sk-your-openai-api-key
SESSION_SECRET=your-secure-session-secret
NODE_ENV=development
PORT=5000
```

4. Push database schema:
```bash
npm run db:push
```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```
This starts both the Express server and Vite dev server with hot reload.

### Production Build
```bash
# Build the application
npm run build

# Start production server
npm run start
```

## 📁 Project Structure

```
├── client/                 # Frontend React application
│   ├── public/            # Static assets and SEO files
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── ui/       # Shadcn UI components
│   │   │   └── *.tsx     # Custom components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions and query client
│   │   ├── pages/        # Page components
│   │   └── App.tsx       # Main app component
├── server/                # Backend Express application
│   ├── index.ts          # Express server setup
│   ├── routes.ts         # API route definitions
│   ├── storage.ts        # Database storage interface
│   ├── services/         # Business logic
│   │   └── openai.ts     # OpenAI integration
│   └── db.ts            # Database connection
├── shared/               # Shared types and schemas
│   └── schema.ts        # Drizzle ORM schemas and Zod types
├── drizzle.config.ts    # Drizzle ORM configuration
├── vite.config.ts       # Vite configuration
├── tailwind.config.ts   # Tailwind CSS configuration
└── package.json         # Project dependencies
```

## 🔌 API Endpoints

### Generate Launch Plan
```
POST /api/generate-plan
Content-Type: application/json

{
  "businessIdea": "Your business idea",
  "industry": "Technology",
  "targetMarket": "B2B SaaS",
  "timeCommitment": "20-40",
  "budget": "0-500",
  "additionalDetails": "Optional details"
}
```

### Generate Plan from PDF
```
POST /api/generate-plan-pdf
Content-Type: multipart/form-data

file: [PDF file]
industry: "Technology"
targetMarket: "B2B SaaS"
timeCommitment: "20-40"
budget: "0-500"
```

### Get Shared Plan
```
GET /api/plans/share/:shareToken
```

### Update Plan
```
PATCH /api/plans/:id
Content-Type: application/json

{
  "title": "Updated title",
  "plan": { ...updated plan object }
}
```

### Community Feedback
```
GET /api/feedback                    # Get all feedback
POST /api/feedback                   # Submit feedback
POST /api/feedback/:id/vote         # Vote on feedback
```

## 🚀 Deployment

The application is configured for deployment on Replit with automatic scaling.

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API key for GPT-4 access
- `SESSION_SECRET`: Secure session secret for production
- `NODE_ENV`: Set to "production" for production deployment

### Build and Deploy
```bash
# Build for production
npm run build

# The build outputs:
# - Frontend: dist/public/
# - Backend: dist/index.js

# Start production server
npm run start
```

### Domain Configuration
The application is configured to use `launchgen.dev` as the primary domain with automatic redirects from:
- `www.launchgen.dev` → `launchgen.dev`
- `launch-gen.replit.app` → `launchgen.dev`

## 🔒 Security Features

- **Helmet.js** for security headers
- **Rate limiting** on API endpoints (100 req/15min general, 5 req/15min for auth)
- **Input validation** using express-validator
- **Session security** with PostgreSQL session store
- **HTTPS enforcement** in production
- **XSS and CSRF protection**

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with ❤️ using [Replit](https://replit.com)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- AI powered by [OpenAI GPT-4](https://openai.com)
- Database hosting by [Neon](https://neon.tech)

## 📧 Support

For support, email support@launchgen.dev or open an issue in the GitHub repository.

---

Made with 🚀 by LaunchGen - Turn your business ideas into actionable 30-day launch plans.