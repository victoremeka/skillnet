# Testing Guide

This document provides comprehensive testing credentials and scenarios for the SkillNet platform.

## Test Accounts

All accounts use the password: **`password123`**

### Students (Freelancers)

| Name | Email | Specialization | Rate |
|------|-------|----------------|------|
| Alex Chen | `alex@student.edu` | Full-Stack Development | $45/hr |
| Sarah Johnson | `sarah@student.edu` | UI/UX Design | $40/hr |
| Marcus Williams | `marcus@student.edu` | Mobile Development | $50/hr |
| Emily Park | `emily@student.edu` | Data Science & ML | $55/hr |
| Jordan Rivera | `jordan@student.edu` | Content Writing | $30/hr |

**Note:** All students have verified university emails and can offer services.

### Clients

| Name | Email | Type |
|------|-------|------|
| TechStart Inc. | `hiring@techstart.io` | Company |
| Green Gardens Co. | `projects@greengardens.com` | Company |
| David Mitchell | `david.m@gmail.com` | Individual |
| Luna Creative Agency | `work@lunacreative.co` | Agency |
| FitLife App | `dev@fitlifeapp.com` | Startup |

**Note:** Clients can post projects and hire students.

---

## Testing Scenarios

### 1. Service Marketplace

**As a Visitor/Client:**
1. Browse services at `/marketplace`
2. Filter by category (Web Development, Design, Mobile, Data Science, Writing)
3. Search for specific services
4. View service details with **three pricing tiers**:
   - **Basic**: Entry-level package
   - **Standard**: Mid-tier with more features
   - **Premium**: Full-featured package

**Test Service Tier Descriptions:**
- Navigate to any service detail page
- Switch between Basic/Standard/Premium tabs
- Each tier shows:
  - Price
  - Delivery time (Basic: 1x, Standard: 1.5x, Premium: 2x)
  - **Detailed description of what's included**

**Example Services to Test:**
- "Full-Stack Web Application Development" (Alex Chen)
- "Complete UI/UX Design Package" (Sarah Johnson)
- "Cross-Platform Mobile App" (Marcus Williams)
- "Machine Learning Model Development" (Emily Park)
- "SEO Blog Content Writing" (Jordan Rivera)

### 2. Request a Service (Payment Flow)

**Login as:** Any client (e.g., `david.m@gmail.com`)

1. Go to `/marketplace` and select a service
2. Choose a pricing tier (Basic/Standard/Premium)
3. Click "Request This Service"
4. Fill in project requirements (minimum 20 characters)
5. Optionally provide custom budget
6. Submit request

**Expected Result:**
- Project is created with status "open"
- Auto-proposal is generated from the service provider
- You're redirected to project detail page

### 3. Platform Fee Display

**Test Escrow Card:**
1. Login as a client who has accepted a proposal
2. View any project with escrow amount
3. In the Payment sidebar card, verify:
   - Total Escrow: $XXX
   - Platform Fee (10%): -$XX
   - **Provider Receives: $XXX (90% of total)**

**Test Release Payment:**
1. Login as client `dev@fitlifeapp.com`
2. View the completed project "App Store Screenshots & Graphics"
3. Observe the payment breakdown showing:
   - Provider received net amount (after 10% fee)

### 4. Accept Proposal & Escrow

**Login as:** `hiring@techstart.io`

1. Navigate to "My Projects"
2. Open "E-commerce Platform MVP" (or any open project with proposals)
3. Review proposals from students
4. Click "Accept Proposal" on a proposal
5. Confirm acceptance

**Expected Result:**
- Project status changes to "in_progress"
- Escrow amount is set to proposal price
- Deposit transaction created (from client to escrow)
- Payment card shows fee breakdown

### 5. Complete Project & Release Payment

**Scenario Setup:**
- Create or use existing project in "delivered" status
- Login as the client

**Test Payment Release:**
1. View project detail page
2. Yellow alert shows: "Work has been delivered!"
3. Alert displays:
   - Provider will receive: $XXX (net after 10% fee)
   - Platform fee (10%): $XX
4. Click "Approve & Release Payment"
5. Confirm payment release

**Expected Database Transaction:**
- Release transaction created
- `amount`: Net to provider (90% of escrow)
- `platformFee`: 10% of escrow amount
- Project status: "completed"

### 6. Browse Projects (Student View)

**Login as:** Any student (e.g., `alex@student.edu`)

1. Navigate to `/projects`
2. Browse open projects posted by clients
3. View project details
4. Submit a proposal with:
   - Cover letter
   - Price
   - Delivery days

### 7. Student Profile & Services

**Login as:** `sarah@student.edu`

1. Go to "My Dashboard" (`/dashboard`)
2. View your services
3. Click "Create Service" to add new service
4. Fill in all three tier descriptions:
   - Basic description
   - Standard description
   - Premium description
5. Set prices and delivery times for each tier
6. View your profile at `/profile/edit`

### 8. Messaging System

**Prerequisites:** Project must be in "in_progress" status

**Login as:** Client or accepted provider

1. Navigate to project detail page
2. Scroll to "Messages" section
3. Send a message
4. Switch accounts and verify message appears
5. Test attachments (if implemented)

### 9. Reviews System

**Prerequisites:** Project must be "completed"

**Test Completed Project:**
- Login as `dev@fitlifeapp.com` (client)
- View "App Store Screenshots & Graphics" project
- See existing reviews between client and provider

**Submit New Review:**
1. Complete a project
2. Navigate to `/submit-review?projectId=<id>`
3. Rate 1-5 stars
4. Add comment (minimum 10 characters)
5. Submit review

**Expected Result:**
- Review appears on provider's profile
- Provider's rating is recalculated

---

## Payment & Fee Testing Summary

### Platform Fee: 10%

**Example Calculations:**

| Escrow Amount | Platform Fee (10%) | Provider Receives (90%) |
|---------------|-------------------|------------------------|
| $500 | $50 | $450 |
| $1,000 | $100 | $900 |
| $2,000 | $200 | $1,800 |

### Transaction Flow

1. **Deposit** (Accept Proposal)
   - From: Client
   - To: Escrow (null)
   - Amount: Full proposal price
   - Platform Fee: 0

2. **Release** (Approve Delivery)
   - From: Escrow (null)
   - To: Provider
   - Amount: 90% of escrow
   - Platform Fee: 10% of escrow

### Where to See Fees

✅ **Service Detail Page** - Tier descriptions show what's included
✅ **Project Detail (Sidebar)** - Escrow card shows fee breakdown
✅ **Release Payment Alert** - Shows net amount provider receives
✅ **Transactions** (in database) - `platform_fee` column stores fee amount

---

## Sample User Journeys

### Journey 1: Complete Service Request Flow

1. **Client** (`david.m@gmail.com`) browses marketplace
2. Finds "Website Redesign" by Sarah Johnson
3. Reviews tier descriptions, selects **Standard** ($700)
4. Requests service with project requirements
5. **Student** (Sarah) receives auto-proposal
6. **Client** reviews and accepts proposal
7. Escrow shows: $700 total, $70 fee, **Sarah receives $630**
8. Sarah delivers work, marks project as "delivered"
9. David reviews work and clicks "Approve & Release Payment"
10. System creates release transaction: $630 to Sarah, $70 platform fee
11. Both submit reviews
12. Sarah's rating updates on her profile

### Journey 2: Browse & Compare Services

1. Login as any client
2. Navigate to `/marketplace`
3. Filter by "Design" category
4. Compare Sarah's two services:
   - "Complete UI/UX Design Package" - see 3 tiers
   - "Website Redesign" - see 3 tiers
5. Notice tier descriptions explain exactly what's included
6. Make informed decision based on needs and budget

### Journey 3: Student Profile & Earnings

1. Login as `alex@student.edu`
2. View dashboard showing:
   - Active projects
   - Total earnings (shows net after platform fees)
   - Services offered
3. Navigate to profile to see:
   - Rating (calculated from reviews)
   - Review count
   - Skills and portfolio

---

## API Endpoints for Testing

### Authentication
- `POST /api/register` - Create new account
- `POST /api/login` - Login
- `GET /api/me` - Get current user

### Services
- `GET /api/services` - List all services
- `GET /api/services/:id` - Get service with tier descriptions
- `POST /api/services/:id/request` - Request service (creates project)

### Projects
- `GET /api/projects` - List projects (filtered by user role)
- `GET /api/projects/:id` - Get project details
- `POST /api/proposals/:id/accept` - Accept proposal (creates escrow)
- `PATCH /api/projects/:id/status` - Update status to "delivered"

### Payments
- `POST /api/payments/release` - Release escrow payment with fee deduction

---

## Database Verification

### Check Platform Fees

```sql
-- View all release transactions with fees
SELECT 
  t.id,
  t.amount as provider_receives,
  t.platform_fee,
  (t.amount + t.platform_fee) as original_escrow,
  p.title as project
FROM transactions t
JOIN projects p ON t.project_id = p.id
WHERE t.type = 'release';
```

### Check Service Tier Descriptions

```sql
-- View services with all tier info
SELECT 
  title,
  price_basic,
  description_basic,
  price_standard,
  description_standard,
  price_premium,
  description_premium
FROM services
LIMIT 3;
```

---

## Known Test Data

### Completed Project for Testing Reviews
- **Project**: "App Store Screenshots & Graphics"
- **Client**: FitLife App (`dev@fitlifeapp.com`)
- **Provider**: Sarah Johnson (`sarah@student.edu`)
- **Status**: Completed
- **Reviews**: Mutual 5-star reviews exist

### Open Projects with Proposals
1. "E-commerce Platform MVP" - 1 proposal from Alex Chen
2. "Personal Portfolio Website" - 2 proposals (Alex & Sarah)
3. "Fitness App Data Dashboard" - 2 proposals (Emily & Alex)
4. "Landing Page for Product Launch" - 2 proposals (Alex & Sarah)

---

## Tips for Testing

1. **Clear browser cache** if you experience auth issues
2. **Use different browsers** or incognito mode to test multiple accounts simultaneously
3. **Check browser console** for any client-side errors
4. **Monitor terminal output** for server-side logs
5. **Verify database state** after critical operations (accept proposal, release payment)

## Expected Behavior

✅ All service tiers show detailed descriptions
✅ Escrow card displays 10% platform fee breakdown
✅ Release payment shows net amount to provider
✅ Transactions table records platform_fee accurately
✅ Mock payment system (no actual money transfer)
✅ All calculations use client-side and server-side constants (0.10)

---

## Troubleshooting

**Issue:** Tier descriptions not showing
- **Fix:** Ensure database was reseeded after schema changes

**Issue:** Platform fee not calculating
- **Fix:** Check PLATFORM_FEE_PERCENTAGE constant matches (0.10) in both client and server

**Issue:** Can't release payment
- **Fix:** Ensure project status is "delivered" and you're logged in as the client

**Issue:** Services have no tier descriptions in old data
- **Fix:** Run `npm run db:init` and `npm run db:seed` to recreate database

---

**Last Updated:** November 26, 2025
**Schema Version:** v2 (with tier descriptions and platform fees)
