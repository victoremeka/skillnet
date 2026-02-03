# SkillNet - Technical System Design Document

**Version:** 1.0  
**Last Updated:** 2024  
**Status:** Production Ready

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Architecture](#architecture)
4. [Technology Stack](#technology-stack)
5. [Data Model](#data-model)
6. [API Design](#api-design)
7. [Authentication & Authorization](#authentication--authorization)
8. [Core Features & Workflows](#core-features--workflows)
9. [Payment System](#payment-system)
10. [Security Considerations](#security-considerations)
11. [Scalability & Performance](#scalability--performance)
12. [Deployment Architecture](#deployment-architecture)
13. [Future Enhancements](#future-enhancements)

---

## Executive Summary

SkillNet is a full-stack marketplace platform that connects university students offering freelance services with clients seeking to hire them. The platform facilitates end-to-end project workflows including service discovery, proposal submission, secure escrow-style payments, real-time messaging, and trust mechanisms through university email verification and ratings.

**Key Capabilities:**
- Dual-sided marketplace for students and clients
- Three-tier service pricing (Basic, Standard, Premium)
- Project-based and service-based workflows
- Escrow payment system with 10% platform fee (Nigerian Naira - ₦)
- University email verification for students
- Real-time messaging between project participants
- Rating and review system
- Dispute resolution framework

---

## System Overview

### Problem Statement

University students possess valuable skills but lack established platforms to monetize them in a trusted environment. Traditional freelance platforms are saturated with professional freelancers, making it difficult for students to compete. Clients seeking affordable, skilled workers struggle to verify the legitimacy of student freelancers.

### Solution

SkillNet provides a specialized marketplace where:
- **Students** can showcase skills, create service offerings with tiered pricing, and submit proposals to projects
- **Clients** can post projects, review proposals, and hire verified students
- **Platform** acts as a trusted intermediary with escrow payments, verification systems, and dispute resolution

### User Roles

1. **Student (Freelancer)**
   - Create and manage service listings
   - Submit proposals to open projects
   - Complete work and receive payments
   - Build portfolio and reputation
   - Verify university email for trust badge

2. **Client (Buyer)**
   - Post project requirements with budget ranges
   - Request services from student providers
   - Review and accept proposals
   - Release escrow payments upon completion
   - Leave ratings and reviews

3. **Admin** (Future)
   - Platform management
   - Dispute resolution
   - User moderation

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  (React 18 + TypeScript + TailwindCSS + Shadcn/ui)         │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Pages   │  │Components│  │  Hooks   │  │   Lib    │  │
│  │          │  │          │  │          │  │          │  │
│  │ Landing  │  │  Navbar  │  │useToast  │  │  Query   │  │
│  │Dashboard │  │  Forms   │  │          │  │  Client  │  │
│  │Services  │  │  Cards   │  │          │  │  Utils   │  │
│  │Projects  │  │  Modals  │  │          │  │          │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└────────────────────┬─────────────────────────────────────────┘
                     │ REST API (JSON)
                     │ JWT Authentication
┌────────────────────▼─────────────────────────────────────────┐
│                      API Layer                               │
│            (Express.js + TypeScript)                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Route Handlers                          │  │
│  │                                                       │  │
│  │  • Auth Routes      • Service Routes                │  │
│  │  • Project Routes   • Proposal Routes               │  │
│  │  • Payment Routes   • Message Routes                │  │
│  │  • Review Routes    • Dispute Routes                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Middleware Stack                        │  │
│  │                                                       │  │
│  │  • JWT Authentication                                │  │
│  │  • Request Logging                                   │  │
│  │  • Error Handling                                    │  │
│  │  • Zod Validation                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬─────────────────────────────────────────┘
                     │ Drizzle ORM
┌────────────────────▼─────────────────────────────────────────┐
│                   Data Layer                                 │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Storage Module                          │  │
│  │  (Business Logic & Data Access)                     │  │
│  │                                                       │  │
│  │  • User Management     • Service CRUD                │  │
│  │  • Project Management  • Proposal Handling           │  │
│  │  • Payment Processing  • Review System               │  │
│  │  • Messaging           • Analytics                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Database Schema                         │  │
│  │         (Drizzle ORM Schema Definition)             │  │
│  │                                                       │  │
│  │  10 Core Tables + Relations + Validation            │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬─────────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────────┐
│                  Database Layer                              │
│                                                              │
│     SQLite (Development) / Turso (Production)               │
│     • ACID Compliant                                        │
│     • Relational Integrity                                  │
│     • JSON Column Support                                   │
└──────────────────────────────────────────────────────────────┘
```

### Application Flow Patterns

#### 1. Monolithic Full-Stack Pattern
- Single repository with shared TypeScript types
- `/shared/schema.ts` defines data models used by both frontend and backend
- Eliminates API contract mismatches

#### 2. API-First Design
- RESTful API with clear resource endpoints
- Middleware-based authentication and validation
- Centralized error handling

#### 3. Client-Side State Management
- TanStack Query (React Query v5) for server state
- Local React state for UI state
- JWT stored in localStorage for persistence

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2 | UI framework with hooks and concurrent features |
| **TypeScript** | 5.3 | Type safety and developer experience |
| **Vite** | 5.1 | Fast development server and optimized builds |
| **Wouter** | 3.1 | Lightweight client-side routing |
| **TailwindCSS** | 3.4 | Utility-first styling framework |
| **Shadcn/ui** | Latest | Pre-built accessible components (Radix UI) |
| **TanStack Query** | 5.28 | Server state management, caching, refetching |
| **React Hook Form** | 7.51 | Performant form handling |
| **Zod** | 3.22 | Schema validation |
| **Lucide React** | 0.356 | Icon library |

**Frontend Architecture Patterns:**
- Component-based architecture
- Atomic design principles (atoms, molecules, organisms)
- Custom hooks for business logic
- Server state separation from UI state

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime |
| **Express.js** | 4.18 | Web server framework |
| **TypeScript** | 5.3 | Type safety |
| **Drizzle ORM** | 0.30 | Type-safe SQL query builder |
| **LibSQL Client** | 0.15 | SQLite/Turso database driver |
| **bcryptjs** | 2.4 | Password hashing |
| **jsonwebtoken** | 9.0 | JWT authentication |
| **Zod** | 3.22 | Runtime validation |
| **UUID** | 9.0 | Unique ID generation |

**Backend Architecture Patterns:**
- Layered architecture (Routes → Storage → Database)
- Repository pattern (storage module)
- Middleware pipeline for cross-cutting concerns
- Dependency injection for testability

### Database

**Development:** SQLite (file-based)
**Production:** Turso (distributed SQLite)

**Advantages:**
- Zero-configuration setup
- ACID compliance
- Relational integrity with foreign keys
- JSON column support for complex types
- Easy local development
- Turso provides global edge distribution

### Development Tools

- **tsx** - TypeScript execution for development
- **esbuild** - Fast JavaScript bundler
- **Drizzle Kit** - Database migrations and introspection
- **Vercel CLI** - Deployment tooling
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

---

## Data Model

### Entity Relationship Diagram

```
┌─────────────┐
│    users    │
│──────────────│
│ id (PK)     │◄─────┐
│ name        │      │
│ email (UK)  │      │
│ passwordHash│      │
│ role        │      │
│ university  │      │
│ verified    │      │
└─────────────┘      │
      │              │
      │1             │
      │              │
      │             1│
      ▼              │
┌─────────────┐      │
│  profiles   │      │
│──────────────│      │
│ id (PK)     │      │
│ userId (FK) │──────┘
│ bio         │
│ skills      │
│ portfolio   │
│ rate        │
│ rating      │
└─────────────┘

┌─────────────┐
│  services   │
│──────────────│
│ id (PK)     │
│ providerId  │──────┐
│ title       │      │
│ description │      │
│ priceBasic  │      │
│ priceStan..│       │
│ pricePrem.. │      │
│ descBasic   │      │
│ descStan... │      │
│ descPrem... │      │
└─────────────┘      │
                     │
                    1│
┌─────────────┐      │
│  projects   │      │
│──────────────│      │
│ id (PK)     │      │
│ clientId(FK)│──────┤
│ title       │      │
│ description │      │
│ budgetMin   │      │
│ budgetMax   │      │
│ status      │      │
│ escrowAmt   │      │
│ acceptedPro │      │
└─────────────┘      │
      │              │
      │1            1│
      │              │
      │             N│
      ▼              │
┌─────────────┐      │
│  proposals  │      │
│──────────────│      │
│ id (PK)     │      │
│ projectId   │──────┤
│ providerId  │──────┘
│ coverLetter │
│ price       │
│ deliveryDays│
└─────────────┘

┌─────────────┐
│  messages   │
│──────────────│
│ id (PK)     │
│ projectId   │──────┐
│ senderId    │──────┤
│ body        │      │
│ attachments │      │
└─────────────┘      │
                     │
┌─────────────┐      │
│transactions │      │
│──────────────│      │
│ id (PK)     │      │
│ projectId   │──────┤
│ fromUser    │──────┤
│ toUser      │──────┤
│ amount      │      │
│ platformFee │      │
│ type        │      │
│ status      │      │
└─────────────┘      │
                     │
┌─────────────┐      │
│   reviews   │      │
│──────────────│      │
│ id (PK)     │      │
│ projectId   │──────┤
│ authorId    │──────┤
│ targetUserId│──────┤
│ rating      │      │
│ comment     │      │
└─────────────┘      │
                     │
┌─────────────┐      │
│  disputes   │      │
│──────────────│      │
│ id (PK)     │      │
│ projectId   │──────┤
│ openerId    │──────┘
│ reason      │
│ status      │
│ evidence    │
└─────────────┘
```

### Core Tables

#### 1. `users`
Central authentication and user management table.

**Columns:**
- `id` (TEXT, PK) - UUID
- `name` (TEXT, NOT NULL)
- `email` (TEXT, UNIQUE, NOT NULL)
- `passwordHash` (TEXT, NOT NULL) - bcrypt hash
- `role` (TEXT, NOT NULL) - ENUM: "student", "client", "admin"
- `universityEmail` (TEXT) - For student verification
- `universityVerified` (BOOLEAN, DEFAULT false)
- `verificationCode` (TEXT) - 6-digit code for email verification
- `phone` (TEXT)
- `createdAt` (INTEGER, TIMESTAMP)

**Indices:**
- Primary key on `id`
- Unique index on `email`

#### 2. `profiles`
Extended information for students (1:1 with users where role=student).

**Columns:**
- `id` (TEXT, PK) - UUID
- `userId` (TEXT, FK → users.id, UNIQUE)
- `bio` (TEXT)
- `introVideoUrl` (TEXT)
- `skills` (JSON) - Array of {name, level}
- `portfolio` (JSON) - Array of {title, description, url}
- `rate` (REAL) - Hourly rate
- `availability` (TEXT) - ENUM: "available", "busy"
- `languages` (JSON) - Array of strings
- `rating` (REAL, DEFAULT 0) - Aggregate rating
- `reviewCount` (INTEGER, DEFAULT 0)

**Business Logic:**
- Automatically created when user registers as student
- Rating calculated from reviews table
- Skills stored as JSON for flexibility

#### 3. `services`
Predefined service offerings with three pricing tiers.

**Columns:**
- `id` (TEXT, PK) - UUID
- `providerId` (TEXT, FK → users.id)
- `title` (TEXT, NOT NULL)
- `description` (TEXT, NOT NULL)
- `category` (TEXT, NOT NULL)
- `priceBasic` (REAL)
- `priceStandard` (REAL)
- `pricePremium` (REAL)
- `descriptionBasic` (TEXT) - What's included in Basic tier
- `descriptionStandard` (TEXT) - What's included in Standard tier
- `descriptionPremium` (TEXT) - What's included in Premium tier
- `deliveryDays` (INTEGER)
- `sampleUrls` (JSON) - Array of strings
- `createdAt` (INTEGER, TIMESTAMP)

**Three-Tier Pricing Model:**
- **Basic**: Entry-level offering, lowest price
- **Standard**: Mid-tier with more features (typically 1.5x Basic)
- **Premium**: Full-featured package (typically 2x Basic)

#### 4. `projects`
Work requests posted by clients or created via service requests.

**Columns:**
- `id` (TEXT, PK) - UUID
- `clientId` (TEXT, FK → users.id)
- `title` (TEXT, NOT NULL)
- `description` (TEXT, NOT NULL)
- `budgetMin` (REAL)
- `budgetMax` (REAL)
- `status` (TEXT, NOT NULL) - ENUM: "open", "in_progress", "delivered", "completed", "disputed", "cancelled"
- `acceptedProposalId` (TEXT, FK → proposals.id)
- `escrowAmount` (REAL) - Amount held in escrow
- `createdAt` (INTEGER, TIMESTAMP)

**Status Flow:**
```
open → in_progress → delivered → completed
  ↓         ↓           ↓
cancelled  disputed   disputed
```

#### 5. `proposals`
Bids submitted by students to projects.

**Columns:**
- `id` (TEXT, PK) - UUID
- `projectId` (TEXT, FK → projects.id)
- `providerId` (TEXT, FK → users.id)
- `coverLetter` (TEXT, NOT NULL)
- `price` (REAL, NOT NULL)
- `deliveryDays` (INTEGER, NOT NULL)
- `createdAt` (INTEGER, TIMESTAMP)

**Constraints:**
- One proposal per student per project (enforced in application layer)

#### 6. `messages`
Project-scoped communication between client and accepted provider.

**Columns:**
- `id` (TEXT, PK) - UUID
- `projectId` (TEXT, FK → projects.id)
- `senderId` (TEXT, FK → users.id)
- `body` (TEXT, NOT NULL)
- `attachments` (JSON) - Array of {url, filename, size}
- `createdAt` (INTEGER, TIMESTAMP)

**Access Control:**
- Only project client and accepted provider can send/view messages
- Messages visible only after proposal acceptance

#### 7. `transactions`
Financial records for all money movement.

**Columns:**
- `id` (TEXT, PK) - UUID
- `projectId` (TEXT, FK → projects.id)
- `fromUser` (TEXT, FK → users.id)
- `toUser` (TEXT, FK → users.id)
- `amount` (REAL, NOT NULL) - Net amount (after fees for release)
- `platformFee` (REAL, DEFAULT 0) - 10% for release transactions
- `type` (TEXT, NOT NULL) - ENUM: "deposit", "release", "withdrawal"
- `status` (TEXT, NOT NULL) - ENUM: "pending", "completed", "failed"
- `gatewayTxId` (TEXT) - External payment gateway reference
- `createdAt` (INTEGER, TIMESTAMP)

**Transaction Types:**
1. **Deposit**: Client → Escrow (when accepting proposal)
2. **Release**: Escrow → Provider (when client approves work)
3. **Withdrawal**: Provider → External (future feature)

#### 8. `reviews`
Ratings and feedback after project completion.

**Columns:**
- `id` (TEXT, PK) - UUID
- `projectId` (TEXT, FK → projects.id)
- `authorId` (TEXT, FK → users.id) - Who wrote the review
- `targetUserId` (TEXT, FK → users.id) - Who is being reviewed
- `rating` (INTEGER, NOT NULL) - 1-5 stars
- `comment` (TEXT)
- `createdAt` (INTEGER, TIMESTAMP)

**Rules:**
- Each party can review the other once per project
- Reviews only allowed after project completion
- Affects provider's aggregate rating in profiles table

#### 9. `disputes`
Conflict resolution mechanism.

**Columns:**
- `id` (TEXT, PK) - UUID
- `projectId` (TEXT, FK → projects.id)
- `openerId` (TEXT, FK → users.id)
- `reason` (TEXT, NOT NULL)
- `status` (TEXT, NOT NULL) - ENUM: "open", "in_review", "resolved", "closed"
- `evidence` (JSON) - Array of {url, note}
- `createdAt` (INTEGER, TIMESTAMP)

**Future Enhancement:**
- Admin panel for dispute management
- Automated resolution rules

#### 10. `notifications`
User notification system (future feature with real-time updates).

**Columns:**
- `id` (TEXT, PK) - UUID
- `userId` (TEXT, FK → users.id)
- `type` (TEXT)
- `title` (TEXT, NOT NULL)
- `message` (TEXT, NOT NULL)
- `linkUrl` (TEXT)
- `read` (BOOLEAN, DEFAULT false)
- `createdAt` (INTEGER, TIMESTAMP)

---

## API Design

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "name": "Alex Chen",
  "email": "alex@example.com",
  "password": "securePassword123",
  "role": "student",
  "universityEmail": "alex@student.edu",
  "phone": "+1234567890"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "name": "Alex Chen",
    "email": "alex@example.com",
    "role": "student",
    "universityEmail": "alex@student.edu",
    "universityVerified": false,
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "token": "jwt-token"
}
```

**Validation:**
- Email must be unique
- Password minimum 8 characters
- Student role requires universityEmail
- Creates profile automatically for students

#### POST `/api/auth/login`
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "alex@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "user": { /* SafeUser object */ },
  "token": "jwt-token"
}
```

#### GET `/api/auth/me`
Get current authenticated user.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "user": { /* SafeUser object */ },
  "profile": { /* Profile object if student */ }
}
```

#### POST `/api/auth/verify-email`
Verify university email with 6-digit code.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "code": "123456"
}
```

**Response (200):**
```json
{
  "message": "University email verified successfully",
  "user": { /* Updated user with universityVerified: true */ }
}
```

**Development Mode:**
- Verification code logged to console instead of emailing
- Check server logs for: `[SkillNet] Verification code for user@example.com: 123456`

---

### Service Endpoints

#### GET `/api/services`
List all services with optional filtering.

**Query Parameters:**
- `category` - Filter by category (Web Development, Design, Mobile, etc.)
- `search` - Search in title and description
- `providerId` - Filter by specific provider

**Response (200):**
```json
{
  "services": [
    {
      "id": "uuid",
      "title": "Full-Stack Web Application",
      "description": "Complete web app development",
      "category": "Web Development",
      "priceBasic": 500,
      "priceStandard": 1000,
      "pricePremium": 2000,
      "descriptionBasic": "Basic landing page with 5 pages",
      "descriptionStandard": "Full website with CMS and 10 pages",
      "descriptionPremium": "Enterprise app with custom features",
      "deliveryDays": 7,
      "createdAt": "2024-01-01T00:00:00Z",
      "provider": {
        "id": "uuid",
        "name": "Alex Chen",
        "email": "alex@student.edu",
        "role": "student",
        "universityVerified": true,
        "profile": {
          "rating": 4.8,
          "reviewCount": 12,
          "skills": [
            {"name": "React", "level": "Expert"},
            {"name": "Node.js", "level": "Advanced"}
          ]
        }
      }
    }
  ]
}
```

#### GET `/api/services/:id`
Get detailed service information with provider profile.

**Response (200):**
```json
{
  "service": { /* Full service object with provider details */ }
}
```

#### POST `/api/services`
Create a new service (students only).

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "title": "Mobile App Development",
  "description": "iOS and Android app development",
  "category": "Mobile Development",
  "priceBasic": 800,
  "priceStandard": 1500,
  "pricePremium": 2500,
  "descriptionBasic": "Simple single-platform app, 5 screens",
  "descriptionStandard": "Cross-platform app with backend, 10 screens",
  "descriptionPremium": "Full featured app with real-time features, unlimited screens",
  "deliveryDays": 14,
  "sampleUrls": ["https://example.com/portfolio"]
}
```

**Response (201):**
```json
{
  "service": { /* Created service object */ }
}
```

#### POST `/api/services/:id/request`
Request a service, creating a project and auto-proposal.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "tier": "standard",
  "requirements": "Need a mobile app for fitness tracking with user authentication and workout logging",
  "customBudget": 1200
}
```

**Response (201):**
```json
{
  "project": { /* Created project */ },
  "proposal": { /* Auto-generated proposal */ }
}
```

**Workflow:**
1. Creates project with requirements
2. Auto-generates proposal from service provider
3. Client can accept proposal to start work

---

### Project Endpoints

#### GET `/api/projects`
List projects filtered by user role.

**Headers:** `Authorization: Bearer {token}`

**Response for Clients (200):**
```json
{
  "projects": [
    {
      "id": "uuid",
      "title": "E-commerce Website",
      "description": "Build a modern e-commerce platform",
      "budgetMin": 2000,
      "budgetMax": 3000,
      "status": "open",
      "createdAt": "2024-01-01T00:00:00Z",
      "proposals": [
        {
          "id": "uuid",
          "price": 2500,
          "deliveryDays": 21,
          "coverLetter": "I have 3 years experience...",
          "provider": { /* Provider details with profile */ }
        }
      ]
    }
  ]
}
```

**Response for Students (200):**
Returns open projects they haven't proposed to yet.

#### GET `/api/projects/:id`
Get detailed project information with proposals and messages.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "project": {
    "id": "uuid",
    "title": "E-commerce Website",
    "description": "Build a modern e-commerce platform",
    "budgetMin": 2000000,
    "budgetMax": 3000000,
    "status": "in_progress",
    "escrowAmount": 2500000,
    "createdAt": "2024-01-01T00:00:00Z",
    "client": { /* Client user details */ },
    "acceptedProposal": {
      "id": "uuid",
      "price": 2500000,
      "deliveryDays": 21,
      "provider": { /* Provider details */ }
    },
    "proposals": [ /* All proposals */ ],
    "canSendMessages": true,
    "hasReviewed": false
  }
}
```

#### POST `/api/projects`
Create a new project (clients only).

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "title": "Mobile App Development",
  "description": "Need a cross-platform mobile app for food delivery",
  "budgetMin": 3000000,
  "budgetMax": 5000000
}
```

**Response (201):**
```json
{
  "project": { /* Created project */ }
}
```

#### PATCH `/api/projects/:id`
Update project status.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "status": "delivered"
}
```

**Response (200):**
```json
{
  "project": { /* Updated project */ }
}
```

**Valid Status Transitions:**
- Client can: cancel (if open), mark completed (if delivered)
- Provider can: mark delivered (if in_progress)
- Either can: open dispute

---

### Proposal Endpoints

#### POST `/api/proposals`
Submit a proposal to a project (students only).

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "projectId": "uuid",
  "coverLetter": "I am excited to work on this project. I have 3 years of experience in...",
  "price": 2500000,
  "deliveryDays": 21
}
```

**Response (201):**
```json
{
  "proposal": {
    "id": "uuid",
    "projectId": "uuid",
    "providerId": "uuid",
    "coverLetter": "I am excited...",
    "price": 2500000,
    "deliveryDays": 21,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### POST `/api/proposals/:id/accept`
Accept a proposal and move project to escrow (clients only).

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "project": {
    "status": "in_progress",
    "acceptedProposalId": "uuid",
    "escrowAmount": 2500
  },
  "transaction": {
    "type": "deposit",
    "amount": 2500,
    "status": "completed"
  }
}
```

**Side Effects:**
1. Project status → "in_progress"
2. Escrow amount set to proposal price
3. Deposit transaction created
4. Other proposals become inactive

---

### Message Endpoints

#### GET `/api/projects/:projectId/messages`
Get all messages for a project.

**Headers:** `Authorization: Bearer {token}`

**Access Control:**
- Only project client and accepted provider

**Response (200):**
```json
{
  "messages": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "body": "When can you start?",
      "attachments": [],
      "createdAt": "2024-01-01T00:00:00Z",
      "sender": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

#### POST `/api/projects/:projectId/messages`
Send a message in a project.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "body": "I can start immediately!",
  "attachments": [
    {
      "url": "https://example.com/file.pdf",
      "filename": "proposal.pdf",
      "size": 102400
    }
  ]
}
```

**Response (201):**
```json
{
  "message": { /* Created message with sender */ }
}
```

---

### Payment Endpoints

#### POST `/api/payments/release`
Release escrow payment to provider (clients only).

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "projectId": "uuid"
}
```

**Response (200):**
```json
{
  "transaction": {
    "id": "uuid",
    "type": "release",
    "amount": 2250000,
    "platformFee": 250000,
    "status": "completed",
    "toUser": "provider-uuid"
  },
  "project": {
    "status": "completed"
  }
}
```

**Calculation:**
```
Escrow Amount: ₦2,500,000
Platform Fee (10%): ₦250,000
Provider Receives: ₦2,250,000
```

**Side Effects:**
1. Creates release transaction
2. Project status → "completed"
3. Provider can now be reviewed

#### GET `/api/payments/transactions`
Get transaction history for current user.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `type` - Filter by transaction type
- `status` - Filter by status

**Response (200):**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "type": "release",
      "amount": 2250,
      "platformFee": 250,
      "status": "completed",
      "createdAt": "2024-01-01T00:00:00Z",
      "project": { /* Project details */ }
    }
  ],
  "totalEarnings": 2250,
  "totalSpent": 0
}
```

---

### Review Endpoints

#### POST `/api/projects/:projectId/review`
Submit a review after project completion.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Excellent work! Delivered on time and exceeded expectations."
}
```

**Response (201):**
```json
{
  "review": {
    "id": "uuid",
    "projectId": "uuid",
    "rating": 5,
    "comment": "Excellent work!...",
    "createdAt": "2024-01-01T00:00:00Z",
    "author": { /* Author details */ },
    "target": { /* Target user details */ }
  }
}
```

**Side Effects:**
1. Updates target user's aggregate rating
2. Increments review count in profile

---

## Authentication & Authorization

### JWT-Based Authentication

**Token Structure:**
```json
{
  "userId": "uuid",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Token Lifecycle:**
- Generated on login/registration
- Expires in 7 days
- Stored in localStorage on client
- Sent in Authorization header: `Bearer {token}`

**Security Features:**
- Password hashing with bcrypt (10 rounds)
- JWT secret from environment variable
- Token verification on protected routes
- No sensitive data in JWT payload

### Authorization Middleware

**authMiddleware:**
- Verifies JWT token
- Loads user from database
- Attaches user to request object
- Returns 401 if invalid/expired

**optionalAuthMiddleware:**
- Same as authMiddleware but doesn't fail on missing token
- Used for public endpoints that behave differently for authenticated users

**adminMiddleware:**
- Checks user role === "admin"
- Returns 403 if not admin

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **Student** | Create services, submit proposals, complete work, verify university email |
| **Client** | Post projects, accept proposals, release payments, leave reviews |
| **Admin** | All permissions + user management + dispute resolution |

**Endpoint-Level Authorization:**
- Services: Only students can create
- Projects: Only clients can create
- Proposals: Only students can submit
- Accept Proposal: Only project owner (client)
- Release Payment: Only project owner (client)
- Messages: Only project participants

---

## Core Features & Workflows

### 1. User Registration & Verification

**Student Registration Flow:**
```
1. User submits registration form
   ↓
2. Backend validates input (Zod schema)
   ↓
3. Check email uniqueness
   ↓
4. Hash password with bcrypt
   ↓
5. Create user record (role: student)
   ↓
6. Create profile record
   ↓
7. Generate 6-digit verification code
   ↓
8. [Dev] Log code to console
   [Prod] Send email with code
   ↓
9. Return JWT token + user data
   ↓
10. Client stores token in localStorage
```

**Verification Flow:**
```
User → Submit Code → Backend Validates → Update universityVerified → Return Updated User
```

**Benefits:**
- Verified badge increases trust
- Potential for university-only features
- Quality control mechanism

---

### 2. Service Creation (Three-Tier Model)

**Service Creation Flow:**
```
Student → Create Service Form → Submit

Form Fields:
├── Basic Tier
│   ├── Price: ₦500,000
│   └── Description: "Basic landing page with 5 pages, responsive design"
├── Standard Tier
│   ├── Price: ₦1,000,000
│   └── Description: "Full website with CMS, 10 pages, contact forms, SEO optimization"
└── Premium Tier
    ├── Price: ₦2,000,000
    └── Description: "Enterprise app with custom features, unlimited pages, advanced integrations"

Backend:
├── Validate student role
├── Validate all three tiers have prices and descriptions
├── Create service record
└── Return service with provider details
```

**Tier Description Best Practices:**
- Be specific about deliverables
- Highlight differences between tiers
- Include revision counts
- Mention support/maintenance

---

### 3. Project Posting & Proposal System

**Project Posting (Client):**
```
1. Client navigates to /post-project
   ↓
2. Fills form:
   - Title
   - Description (minimum 50 chars)
   - Budget range (min/max)
   ↓
3. Submit → Creates project (status: open)
   ↓
4. Project appears in "Browse Projects" for students
```

**Proposal Submission (Student):**
```
1. Student views project detail
   ↓
2. Clicks "Submit Proposal"
   ↓
3. Fills form:
   - Cover letter (sell yourself)
   - Price (within budget range ideally)
   - Delivery time (days)
   ↓
4. Submit → Creates proposal
   ↓
5. Client sees proposal in project detail
```

**Proposal Acceptance (Client):**
```
1. Client reviews all proposals
   ↓
2. Compares:
   - Provider ratings
   - Price vs delivery time
   - Cover letter quality
   - Portfolio/skills
   ↓
3. Clicks "Accept Proposal" on chosen one
   ↓
4. Backend:
   - Updates project status → in_progress
   - Sets escrowAmount = proposal.price
   - Sets acceptedProposalId
   - Creates deposit transaction
   ↓
5. Project enters active phase
```

---

### 4. Service Request to Project

**Simplified Workflow:**
```
Client → Browse Services → Select Service → Choose Tier → Request

Backend automatically:
1. Creates project with service requirements
2. Creates proposal from service provider
3. Sets price = tier price
4. Client can immediately accept or negotiate
```

**Advantages:**
- Faster than traditional project posting
- Pre-defined pricing eliminates negotiation
- Students showcase packages vs hourly rates

---

### 5. Payment & Escrow System

**Platform Fee: 10%**

**Escrow Flow:**
```
Proposal Acceptance (Deposit)
─────────────────────────────
Client Account: -₦2,500,000
Escrow: +₦2,500,000
Transaction: deposit, amount=₦2,500,000, platformFee=0

Work Completion & Release
──────────────────────────
Escrow: -₦2,500,000
Provider Account: +₦2,250,000  (90%)
Platform Account: +₦250,000   (10%)
Transaction: release, amount=₦2,250,000, platformFee=₦250,000
```

**Transaction Records:**
```typescript
{
  type: "deposit",
  fromUser: "client-uuid",
  toUser: null,  // Escrow
  amount: 2500000,
  platformFee: 0,
  status: "completed"
}

{
  type: "release",
  fromUser: null,  // Escrow
  toUser: "provider-uuid",
  amount: 2250000,    // 90% of escrow
  platformFee: 250000, // 10% of escrow
  status: "completed"
}
```

**UI Display:**
```
┌─────────────────────────────┐
│   Payment Information       │
├─────────────────────────────┤
│ Escrow Amount:    ₦2,500,000│
│ Platform Fee (10%): -₦250,000│
│ Provider Receives: ₦2,250,000│
│                             │
│ [Release Payment]           │
└─────────────────────────────┘
```

**Current Implementation:**
- Mock payment system (no actual money transfer)
- Tracks balances in database
- Ready for Paystack/Flutterwave integration

**Future Integration Points:**
1. Deposit: Charge client's card/bank → Paystack/Flutterwave
2. Release: Transfer to provider's account → Payment gateway
3. Withdrawal: Provider → Nigerian bank account

---

### 6. Messaging System

**Project-Scoped Communication:**
```
Participants: Client + Accepted Provider Only
Access: After proposal acceptance
Persistence: All messages stored indefinitely
```

**Message Features:**
- Text body (required)
- File attachments (URLs + metadata)
- Sender identification
- Timestamps
- Real-time updates (future: WebSockets)

**Implementation:**
```typescript
// Get messages
GET /api/projects/:id/messages
Authorization: Bearer {token}

// Send message
POST /api/projects/:id/messages
{
  "body": "Here's the first draft",
  "attachments": [
    {
      "url": "https://storage.example.com/draft-v1.pdf",
      "filename": "draft-v1.pdf",
      "size": 204800
    }
  ]
}
```

---

### 7. Review & Rating System

**Review Rules:**
- Only after project completion
- Each party reviews the other once
- 1-5 star rating + optional comment
- Minimum 10 characters for comment

**Rating Calculation:**
```typescript
// When new review is submitted:
const allReviews = await getReviewsForUser(targetUserId);
const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
const reviewCount = allReviews.length;

await updateProfile(targetUserId, {
  rating: avgRating,
  reviewCount: reviewCount
});
```

**Display:**
- Provider profiles show aggregate rating
- Service listings show provider rating
- Individual reviews visible on profile page

---

### 8. Dispute Resolution

**Current Implementation:**
```
1. Either party opens dispute
   ↓
2. Project status → disputed
   ↓
3. Escrow frozen
   ↓
4. Admin reviews evidence
   ↓
5. Admin decides resolution
   ↓
6. Escrow released accordingly
```

**Future Enhancements:**
- Admin dashboard for dispute management
- Mediation system
- Automated resolution based on evidence
- Appeal process

---

## Payment System

**Currency:** Nigerian Naira (₦ / NGN)

### Escrow Architecture

**Purpose:**
- Protect both parties
- Ensure fair payment
- Platform fee collection
- Fraud prevention

**Escrow Lifecycle:**

```
┌─────────────────────────────────────────────────────────────┐
│                     Escrow Lifecycle                         │
└─────────────────────────────────────────────────────────────┘

1. PROPOSAL ACCEPTED
   ├─ Client charged: ₦2,500,000
   ├─ Escrow holds: ₦2,500,000
   └─ Project status: in_progress

2. WORK DELIVERED
   ├─ Provider marks: delivered
   ├─ Escrow status: held (waiting approval)
   └─ Project status: delivered

3. CLIENT APPROVES
   ├─ Platform calculates:
   │  ├─ Provider amount: ₦2,500,000 * 0.90 = ₦2,250,000
   │  └─ Platform fee: ₦2,500,000 * 0.10 = ₦250,000
   ├─ Provider receives: ₦2,250,000
   ├─ Platform receives: ₦250,000
   └─ Project status: completed

4. ALTERNATIVE: DISPUTE
   ├─ Either party disputes
   ├─ Escrow frozen
   ├─ Admin reviews
   └─ Escrow split per admin decision
```

### Platform Fee Structure

**Current: 10% on completion**

**Rationale:**
- Competitive with industry (Upwork: 10-20%, Fiverr: 20%)
- Covers platform costs
- Incentivizes quality (fee only on completion)
- Sustainable business model

**Future Considerations:**
- Tiered fees based on volume
- Subscription model for students
- Premium features for higher tier

### Mock Payment Implementation

**Current State:**
```typescript
// No actual money transfer
// Balances tracked in database
// Transaction records created
// Ready for payment gateway integration
// Currency: Nigerian Naira (NGN)
```

**Production Integration (Paystack/Flutterwave Example):**

```typescript
// 1. Accept Proposal - Initialize Payment
const transaction = await paystack.transaction.initialize({
  amount: proposal.price * 100, // Convert to kobo
  currency: 'NGN',
  email: client.email,
  metadata: { 
    projectId: project.id,
    proposalId: proposal.id
  }
});

// 2. Release Payment - Transfer to Provider
const transfer = await paystack.transfer.initiate({
  amount: (escrowAmount * 0.90) * 100, // 90% in kobo
  currency: 'NGN',
  recipient: provider.recipientCode,
  reference: `release-${project.id}`,
  reason: `Payment for project: ${project.title}`
});

// Platform keeps 10% automatically
```

---

## Security Considerations

### Authentication Security

**Password Storage:**
- bcrypt hashing with 10 salt rounds
- Never store plain text passwords
- Passwords never returned in API responses

**JWT Security:**
- Secret key from environment variable
- 7-day expiration
- Signed with HS256
- Payload contains minimal data (just userId)

**Token Storage:**
- Client: localStorage (XSS risk mitigation via CSP)
- Alternative: httpOnly cookies (CSRF protection needed)

### Authorization Checks

**Middleware Chain:**
```
Request → CORS → Body Parser → Auth Middleware → Role Check → Route Handler
```

**Resource-Level Authorization:**
```typescript
// Example: Can only delete own services
app.delete('/api/services/:id', authMiddleware, async (req, res) => {
  const service = await storage.getService(req.params.id);
  
  if (service.providerId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // Delete allowed
});
```

### Input Validation

**Validation Stack:**
1. **Zod schemas** - Define expected structure
2. **Type checking** - TypeScript compile-time
3. **Runtime validation** - Zod parse before processing
4. **Database constraints** - Foreign keys, unique constraints

**Example:**
```typescript
const result = insertProjectSchema.safeParse(req.body);
if (!result.success) {
  return res.status(400).json({
    error: result.error.errors[0].message
  });
}
```

### SQL Injection Prevention

**Drizzle ORM:**
- Parameterized queries automatically
- No raw SQL strings
- Type-safe query builder

```typescript
// Safe - Drizzle parameterizes
await db.select().from(users).where(eq(users.email, userInput));

// Dangerous - Never do this
await db.run(`SELECT * FROM users WHERE email = '${userInput}'`);
```

### CORS Configuration

**Development:**
```typescript
app.use(cors({
  origin: 'http://localhost:5000',
  credentials: true
}));
```

**Production:**
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### Data Sanitization

**SafeUser Type:**
```typescript
// Removes sensitive fields before sending to client
type SafeUser = Omit<User, 'passwordHash' | 'verificationCode'>;

function sanitizeUser(user: User): SafeUser {
  const { passwordHash, verificationCode, ...safe } = user;
  return safe;
}
```

### Rate Limiting (Future)

**Recommended Implementation:**
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // Limit each IP to 100 requests per window
});

app.use('/api/', limiter);
```

---

## Scalability & Performance

### Database Optimization

**Indexing Strategy:**
- Primary keys on all id columns (automatic)
- Unique index on users.email
- Foreign key indices (automatic with Drizzle)
- Consider composite index on (projects.clientId, projects.status)

**Query Optimization:**
```typescript
// Good - Single query with joins
const service = await db.query.services.findFirst({
  where: eq(services.id, id),
  with: {
    provider: {
      with: { profile: true }
    }
  }
});

// Bad - N+1 queries
const service = await db.select().from(services).where(eq(services.id, id));
const provider = await db.select().from(users).where(eq(users.id, service.providerId));
const profile = await db.select().from(profiles).where(eq(profiles.userId, provider.id));
```

### Caching Strategy

**Client-Side Caching (TanStack Query):**
```typescript
// Automatic caching with stale-while-revalidate
const { data } = useQuery({
  queryKey: ['services'],
  queryFn: fetchServices,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000 // 10 minutes
});
```

**Server-Side Caching (Future):**
- Redis for session storage
- Cache frequently accessed data (service listings)
- Invalidate on mutations

### Database Scaling

**Current: SQLite**
- Single file database
- Perfect for development
- Limited concurrent writes

**Production: Turso**
- Distributed SQLite
- Edge replication
- Read scaling globally
- Handles higher concurrency

**Alternative: PostgreSQL**
- Better for high write volume
- Advanced features (full-text search, PostGIS)
- Requires schema migration

### Load Balancing (Future)

**Horizontal Scaling:**
```
                  ┌─────────────┐
Internet ────────→│Load Balancer│
                  └──────┬──────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
    │Server 1 │    │Server 2 │    │Server 3 │
    └────┬────┘    └────┬────┘    └────┬────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
                  ┌──────▼──────┐
                  │   Database  │
                  │   (Turso)   │
                  └─────────────┘
```

### Performance Metrics

**Target Latency:**
- API response: < 200ms (p95)
- Page load: < 2s (First Contentful Paint)
- Time to Interactive: < 3s

**Optimization Techniques:**
- Code splitting (Vite automatic)
- Lazy loading routes
- Image optimization
- Minification and compression
- CDN for static assets

---

## Deployment Architecture

### Development Environment

```
┌─────────────────────────────────────┐
│     Developer Machine (localhost)   │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Vite Dev Server (:5000)    │  │
│  │  • Hot Module Replacement    │  │
│  │  • Fast refresh              │  │
│  │  • Source maps               │  │
│  └──────────────┬───────────────┘  │
│                 │                   │
│  ┌──────────────▼───────────────┐  │
│  │   Express Server (:5000)     │  │
│  │  • API routes                │  │
│  │  • Request logging           │  │
│  │  • Error handling            │  │
│  └──────────────┬───────────────┘  │
│                 │                   │
│  ┌──────────────▼───────────────┐  │
│  │   SQLite (./data/skillnet.db)│  │
│  │  • Local file database       │  │
│  │  • Auto-created on init      │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘

Start: npm run dev
```

### Production Environment (Vercel)

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                   │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │            Static Assets (CDN)                    │  │
│  │  • HTML, CSS, JS bundles                         │  │
│  │  • Cached globally                               │  │
│  │  • Gzip/Brotli compression                       │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Serverless Functions (API)               │  │
│  │  • Auto-scaling                                  │  │
│  │  • Edge runtime                                  │  │
│  │  • Cold start: ~100ms                           │  │
│  └─────────────────────┬─────────────────────────────┘  │
└────────────────────────┼─────────────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │   Turso Database    │
              │  (Global SQLite)    │
              │                     │
              │  • Primary region   │
              │  • Read replicas    │
              │  • Edge sync        │
              └─────────────────────┘
```

### Build Process

```bash
npm run build

Steps:
1. vite build
   ├─ Transpile TypeScript
   ├─ Bundle React components
   ├─ Code splitting
   ├─ Minification
   └─ Output: dist/

2. esbuild server/index-prod.ts
   ├─ Bundle server code
   ├─ External packages
   ├─ ESM format
   └─ Output: dist/index-prod.js

3. npm run db:setup (optional in vercel.json)
   ├─ db:init - Create tables
   └─ db:seed - Insert test data
```

### Environment Variables

**Development (.env):**
```bash
DATABASE_URL=./data/skillnet.db
JWT_SECRET=dev-secret-change-in-production
NODE_ENV=development
```

**Production (Vercel):**
```bash
DATABASE_URL=libsql://skillnet-prod.turso.io
TURSO_AUTH_TOKEN=<secret-token>
JWT_SECRET=<cryptographically-secure-random-string>
NODE_ENV=production
```

### Database Migration Strategy

**Development:**
```bash
# Make schema changes in shared/schema.ts
npm run db:push  # Push to local SQLite
npm run db:studio  # Inspect in browser
```

**Production:**
```bash
# Option 1: Drizzle migrations
npm run db:generate  # Generate migration SQL
npm run db:migrate   # Apply to Turso

# Option 2: Recreate (only for non-production)
npm run db:init      # Drop and recreate tables
npm run db:seed      # Insert sample data
```

### Monitoring & Logging

**Current Implementation:**
```typescript
// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
});
```

**Production Recommendations:**
- **Vercel Analytics** - Built-in performance monitoring
- **Sentry** - Error tracking and reporting
- **LogRocket** - Session replay for debugging
- **Datadog** - Comprehensive observability

---

## Future Enhancements

### Phase 1: Core Improvements

**1. Real-Time Messaging**
```typescript
// WebSocket implementation
import { Server } from 'socket.io';

io.on('connection', (socket) => {
  socket.on('join-project', (projectId) => {
    socket.join(`project-${projectId}`);
  });
  
  socket.on('send-message', async (data) => {
    const message = await storage.createMessage(data);
    io.to(`project-${data.projectId}`).emit('new-message', message);
  });
});
```

**2. File Upload System**
- AWS S3 / Cloudinary integration
- Direct upload from client
- Progress tracking
- File validation and size limits

**3. Notification System**
- In-app notifications
- Email notifications (SendGrid/Postmark)
- Push notifications (web push)
- Notification preferences

**4. Search & Filters**
- Full-text search (PostgreSQL or Algolia)
- Advanced filters (price range, delivery time, rating)
- Saved searches
- Search suggestions

### Phase 2: Trust & Safety

**1. Enhanced Verification**
- Government ID verification
- Portfolio verification
- Skill tests/certifications
- LinkedIn integration

**2. Dispute Management Dashboard**
- Admin interface for dispute review
- Evidence submission system
- Automated resolution rules
- Appeal process

**3. Fraud Detection**
- Suspicious activity monitoring
- IP tracking and geolocation
- Payment fraud prevention
- User behavior analysis

### Phase 3: Marketplace Growth

**1. Categories & Specializations**
- Vertical-specific marketplaces
- Industry certifications
- Category experts/moderators

**2. Team Projects**
- Multi-student collaborations
- Project management tools
- Revenue splitting

**3. Subscription Model**
- Premium student memberships
- Featured service listings
- Priority support
- Reduced platform fees

**4. Mobile Applications**
- React Native iOS/Android apps
- Push notifications
- Offline support
- Mobile-optimized workflows

### Phase 4: Advanced Features

**1. AI/ML Integration**
- Proposal quality scoring
- Project-service matching
- Price recommendations
- Skill gap analysis

**2. Analytics Dashboard**
- Student earnings analytics
- Client spending patterns
- Market trends
- Performance insights

**3. Social Features**
- Referral program
- Student profiles with followers
- Testimonials and endorsements
- Community forums

**4. Global Expansion**
- Multi-currency support
- Localization (i18n)
- Regional payment gateways
- Compliance with local regulations

---

## Technical Debt & Known Limitations

### Current Limitations

1. **No Real Payment Processing**
   - Mock escrow system
   - Ready for Paystack/Flutterwave integration
   - Needs payment gateway setup for Nigerian Naira (NGN)

2. **Limited Scalability Testing**
   - Not load tested
   - Unknown concurrent user limit
   - SQLite write bottleneck

3. **Basic Security**
   - No rate limiting
   - No CSRF protection
   - Simple JWT (consider refresh tokens)

4. **No Email Service**
   - Verification codes logged to console
   - Needs SendGrid/Postmark integration

5. **Client-Side State**
   - No global state management (consider Zustand/Redux)
   - User data in localStorage (security concern)

6. **Limited Error Handling**
   - Basic error messages
   - No retry logic
   - No offline support

### Recommended Improvements

**Priority 1 (Security):**
- Implement rate limiting
- Add CSRF tokens
- Migrate to httpOnly cookies
- Add refresh token rotation

**Priority 2 (UX):**
- Loading states and skeletons
- Optimistic UI updates
- Better error messages
- Form validation feedback

**Priority 3 (Performance):**
- Image lazy loading
- Route-based code splitting
- Service worker for offline
- Database query optimization

---

## Appendix

### Technology Decisions

**Why React?**
- Component reusability
- Large ecosystem
- Great developer tools
- Concurrent features for UX

**Why TypeScript?**
- Type safety reduces bugs
- Better IDE support
- Self-documenting code
- Refactoring confidence

**Why SQLite/Turso?**
- Zero-config development
- Relational integrity
- Easy deployment
- Edge distribution with Turso

**Why Drizzle ORM?**
- Type-safe queries
- Lightweight
- Better TypeScript support than Prisma
- SQL-like syntax

**Why TailwindCSS?**
- Rapid prototyping
- Consistent design system
- Smaller bundle than component libraries
- Easy customization

**Why Shadcn/ui?**
- Copy-paste components (no dependency)
- Built on Radix (accessibility)
- Customizable
- Consistent design

### Development Workflow

```bash
# Initial setup
git clone <repo>
cd skillnet
npm install
npm run db:push
npm run db:seed

# Development
npm run dev  # Starts Vite + Express

# Database management
npm run db:studio  # GUI for database
npm run db:push    # Sync schema changes

# Build for production
npm run build

# Deploy
vercel --prod
```

### Testing Strategy (To Implement)

**Unit Tests:**
- Storage functions
- Utility functions
- API endpoint logic

**Integration Tests:**
- Full API workflows
- Database operations
- Authentication flows

**E2E Tests:**
- User registration
- Service creation
- Project workflow
- Payment flow

**Recommended Tools:**
- **Vitest** - Fast unit tests
- **Playwright** - E2E testing
- **MSW** - API mocking
- **Testing Library** - Component tests

---

##
