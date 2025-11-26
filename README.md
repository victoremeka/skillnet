# SkillNet - Student Freelancer Marketplace

SkillNet is a full-stack marketplace platform that connects university students offering services with clients seeking to hire them. The platform facilitates complete project workflows from discovery through completion, with built-in escrow-style payments, real-time messaging, and trust mechanisms like university email verification and ratings.

## Features

### For Students
- **Create Services**: List your skills with 3-tier pricing (Basic, Standard, Premium)
- **Submit Proposals**: Browse open projects and submit compelling proposals
- **University Verification**: Verify your student status with your university email
- **Build Your Portfolio**: Showcase your work and build your professional profile
- **Earn Money**: Receive secure payments for completed work

### For Clients
- **Post Projects**: Describe your project and set your budget
- **Review Proposals**: Compare proposals from talented students
- **Secure Payments**: Escrow-style payments protect both parties
- **Direct Communication**: Built-in messaging with project participants
- **Leave Reviews**: Rate and review freelancers after project completion

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Shadcn/ui
- **Backend**: Express.js, Node.js, TypeScript
- **Database**: SQLite with Drizzle ORM
- **Authentication**: JWT with bcrypt password hashing
- **State Management**: TanStack Query v5
- **Forms**: React Hook Form + Zod validation
- **Routing**: Wouter

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

No external database needed - SQLite stores data in a local file!

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd skillnet
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and set your JWT secret:
```
# SQLite database (created automatically)
DATABASE_URL=./data/skillnet.db

# Generate a secure secret: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

4. Push the database schema:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5000`

## Project Structure

```
skillnet/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   └── ui/        # Shadcn/ui component library
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and API client
│   │   ├── pages/         # Page components
│   │   ├── App.tsx        # Main app with routing
│   │   └── main.tsx       # Entry point
│   └── index.html
├── server/                 # Backend Express application
│   ├── db.ts              # Database connection
│   ├── routes.ts          # API endpoints
│   ├── storage.ts         # Database operations
│   ├── index-dev.ts       # Development server
│   └── index-prod.ts      # Production server
├── shared/                 # Shared code between frontend and backend
│   └── schema.ts          # Database schema & Zod types
└── package.json
```

## Available Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run start` - Run production build
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio database browser

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/verify-email` - Verify university email
- `GET /api/auth/me` - Get current user

### Services
- `GET /api/services` - List services (with filters)
- `GET /api/services/:id` - Get service details
- `POST /api/services` - Create service (students only)
- `PATCH /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

### Projects
- `GET /api/projects` - List projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create project (clients only)
- `PATCH /api/projects/:id` - Update project
- `POST /api/projects/:id/accept` - Accept proposal
- `GET /api/projects/:id/messages` - Get messages
- `POST /api/projects/:id/messages` - Send message
- `POST /api/projects/:id/review` - Submit review

### Proposals
- `GET /api/proposals` - List proposals
- `POST /api/proposals` - Submit proposal (students only)
- `PATCH /api/proposals/:id` - Update proposal
- `DELETE /api/proposals/:id` - Delete proposal

### Payments
- `POST /api/payments/release` - Release payment
- `GET /api/payments/transactions` - Get transactions

## User Roles

### Student
- Create and manage services
- Submit proposals to projects
- Complete work and receive payments
- Verify university email for trust badge

### Client
- Post projects with budget ranges
- Accept proposals from students
- Approve work and release payments
- Leave reviews for freelancers

## Development Notes

### University Verification
In development mode, verification codes are logged to the console instead of being sent via email. Look for messages like:
```
[SkillNet] Verification code for user@example.com: 123456
```

### Mock Payments
The payment system uses mock escrow - funds are tracked but not actually processed. Ready for Stripe integration.

## License

MIT License - See LICENSE file for details
