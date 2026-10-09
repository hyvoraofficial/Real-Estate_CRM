# HYVORA Real Estate CRM

A custom, high-performance, standalone Real Estate CRM built for single-company operations to act as the primary **Digital Memory, Lead Manager, Follow-up System, and Property Database**.

Designed specifically for handling 40–50 daily phone calls without forgetting client details, property requirements, budget constraints, preferred locations, or critical follow-up reminders.

---

## 🏗️ Architecture & Philosophy

- **Single Company Standalone**: No multi-tenancy overhead, no SaaS subscription billing, no tenant switching. Clean modular monolith.
- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Lucide Icons, React Hook Form, Zod, TanStack Query, Recharts.
- **Backend**: NestJS, TypeScript, REST APIs, Passport JWT Authentication, Role-based Guards (`ADMIN`, `SALES_EXECUTIVE`), Class-Validator.
- **Database**: PostgreSQL with Prisma ORM.

---

## 🔑 Demo Credentials

| Role | Name | Email | Password | Phone |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Rajesh Sharma | `admin@hyvora.com` | `password123` | `+91 9845012345` |
| **Sales Executive** | Vikram Reddy | `vikram@hyvora.com` | `password123` | `+91 9845023456` |
| **Sales Executive** | Sneha Patil | `sneha@hyvora.com` | `password123` | `+91 9845034567` |
| **Sales Executive** | Kiran Rao | `kiran@hyvora.com` | `password123` | `+91 9845045678` |

*(Instant 1-click demo login buttons are also available on the `/login` screen)*

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Install root, backend, and frontend dependencies
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 2. Configure Database (.env)
In `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hyvora_crm?schema=public"
JWT_SECRET="hyvora_super_secret_crm_jwt_key_2026_estate_pro"
PORT=4000
```

### 3. Seed Realistic Indian Real Estate Demo Data
```bash
npm run db:push
npm run seed
```

### 4. Run Both Backend & Frontend
```bash
npm run dev
```

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:4000/api`
- **Interactive Swagger Documentation**: `http://localhost:4000/api/docs`

---

## 🌟 Core Features & Workflows

### 1. ⚡ Quick Add Lead (20–30s Rapid Ingestion)
- Header & Sidebar accessible `+ New Lead` CTA.
- Capture caller name, phone number, WhatsApp number, BHK, preferred location, budget range (with quick Indian Lakh/Crore presets: 45-55L, 65-75L, 1.1-1.4Cr, 2.2-2.6Cr), possession timeline, and notes.
- Immediate scheduling of initial follow-up reminder.

### 2. 🔍 Real-Time Duplicate Phone Detection
- Instant debounced query to PostgreSQL as the salesperson types a 10-digit phone number.
- Displays existing client banner: Name, Previous Leads, Historical Requirements, and Last Interaction Date.
- 1-click to attach a new lead under the existing customer without creating duplicate profiles.

### 3. 🧠 Lead Workspace & Deterministic Property Matching Engine
- Full lead cockpit with Customer 360 overview, Requirement editor, and Pipeline stage stepper.
- **Deterministic Match Engine**: Calculates 0–100% compatibility scores based on Location, BHK, Property Type, Budget Fit, and Possession timeline.
- Displays match reason badges (e.g., `Direct Location Match`, `Exact BHK`, `Within Budget Range`).
- Instant 1-click actions: **Call**, **WhatsApp Direct**, **Log Call**, **Add Note**, **Schedule Follow-up**, **Book Site Visit**, **Close Booking**.

### 4. ⏱️ Dynamic Interaction Timeline (Digital Memory)
- Generated on-the-fly from actual database activity (Call Logs, Requirements, Notes, Follow-ups, Site Visits, and Bookings).
- No manual fake history—every event reflects real PostgreSQL records.

### 5. 📊 Real Dashboard & Action Agenda
- Real-time KPI Cards: Total Leads, New Leads Today, Calls Logged, Follow-ups Today, Overdue Warnings, Active Opportunities, Closed Deals, Conversion Rate.
- Lead Pipeline Funnel chart & Lead Ingestion Source breakdown (Recharts).
- Actionable Today's Follow-up agenda with 1-click **Call**, **WhatsApp**, and **Complete** buttons.

### 6. 📋 Kanban Pipeline Board
- 8 distinct stages: `NEW` ➔ `CONTACTED` ➔ `REQUIREMENT_COLLECTED` ➔ `PROPERTY_SHARED` ➔ `SITE_VISIT` ➔ `NEGOTIATION` ➔ `BOOKED` ➔ `LOST`.
- Total lead count and potential pipeline monetary value per stage.
- 1-click stage changer.

### 7. ⌨️ Global Search (Cmd / Ctrl + K)
- Lightning-fast debounced lookup across Client Names, Mobile Numbers, WhatsApp, Locations, and Property Titles.
- Typing `9876500001` immediately displays Rahul Kumar's profile, active requirement, and next follow-up.

### 8. 📈 Executive Analytical Reports
- Sales Executive Leaderboard: Leads Assigned, Follow-ups Completed, Site Visits Done, Deals Closed, Token Revenue, and Conversion Rate.
- Follow-up Health (Completed vs Upcoming vs Overdue).
- Top In-Demand Properties.
