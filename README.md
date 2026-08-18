# Tendagon

[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-black.svg)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/Backend-NestJS%2011-red.svg)](https://nestjs.com/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-green.svg)](https://www.mongodb.com/)
[![Node.js](https://img.shields.io/badge/Runtime-Node.js%20v18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-Proprietary-orange.svg)](#)

Tendagon is a comprehensive, production-grade web platform for film production logistics, contractor onboarding, location scheduling, budget tracking, and compliance auditing. Designed to support modern entertainment production workflows, it bridges the gap between administrative oversight and operational cast/crew tasks. Tendagon ensures robust data isolation, conflict-free resource scheduling, and role-based operational safety.

---

## 1. Overview

Tendagon manages the end-to-end logistics of film productions, solving the chaotic planning problem faced by studios and independent production managers. It handles:
- **Contractor Onboarding:** Onboards freelancers, actors, and crew via a structured profile setup, secure document storage, and digital signature signing.
- **Resource Management:** Assigns and tracks physical locations, wardrobe inventory, and film budgets.
- **Project Isolation:** Enforces strict data access rules ensuring users only see their designated productions.
- **Auditing & Compliance:** Records detailed system activities to maintain accountability.

### User Roles & Hierarchies
1. **Super Admin:** Full access to the entire Tendagon system, configuration schemas, audit trails, and administrative overrides.
2. **Production Admin:** Manages multiple projects, approves contractor onboarding, schedules locations, approves budgets, and allocates costumes.
3. **Production Manager:** Manages assigned projects, schedules local locations, requests funds, and coordinates local wardrobe assignments.
4. **Cast:** Accesses schedules, locations, assigned costumes, and submits expense/fund requests for their assigned productions.
5. **Crew:** Accesses schedules, bookable locations, costume assignments, and submits expense/fund requests for their assigned productions.

---

## 2. Core Features

### Authentication & Security
- **Three-Level AuthGuard:** Enforced on API endpoints to guarantee multi-layered access safety:
  1. *Identity Tier:* Validates JWT integrity and user active status (`isActive`).
  2. *Capability Tier:* Verifies user permissions against API permission keys (RBAC).
  3. *Resource Scope Tier:* Enforces production-level isolation (e.g., verifying a Crew member is assigned to a specific production) using the `@CheckProduction()` decorator.
- **Onboarding Gate:** Restricts users from accessing core app features until their onboarding profile receives a status of `Approved`.
- **JWT-Based Sessions:** Employs temporary Access Tokens and HttpOnly Refresh Tokens to maintain secure, persistent sessions.
- **CORS & Input Validation:** Strictly configures cross-origin resource sharing and filters payloads using NestJS class-validators.

### Contractor Onboarding & Approval
- **Step-Based Progress Flow:** Guides users through six steps of profile completeness: professional details, contact info, bank details, tax forms, identity documents, and contract signing.
- **Signature Canvas:** Features an interactive canvas signature pad in the frontend to sign NDAs and terms of service.
- **Secure File Storage:** Integrates Cloudinary storage for uploading and previewing government IDs and tax documents.
- **Approval Workflow:** Allows Admins to review details, view document previews, approve profiles, or request changes with specific feedback comments.

### Production & Resource Isolation
- **Production Management:** Supports creating, updating, and categorizing projects by title, genre, language, format, synopsis, and budget.
- **Cast & Crew Assignment:** Maps user profiles to specific productions with designated on-set roles and references to script characters.
- **Script Character Management:** Tracks characters, descriptions, and maps them directly to assigned cast members.

### Conflict-Free Location Scheduling
- **Location Registrations:** Creates indoor/outdoor location profiles containing addresses, names, type, description, and contact details.
- **Interactive Maps:** Implements coordinates (latitude/longitude) mapped on interactive Leaflet maps in the frontend for location tracking.
- **Double-Booking Collisions:** Restricts double bookings using an overlap query database validation (`startDate < newEnd` AND `endDate > newStart`) returning a `422 Unprocessable Entity` status on scheduling conflicts.

### Costume & Inventory Management
- **Wardrobe Cataloging:** Tracks names, categories, descriptions, sizes, quantity, condition (`New`, `Good`, `Fair`, `Damaged`), and status (`Available`, `Assigned`, `Damaged`, `Lost`).
- **Costume Assignments:** Registers wardrobe check-outs and check-ins to specific characters/users with quantity, dates, and condition reporting at check-out vs check-in.

### Budget & Fund Requests
- **Budget Tracking:** Monitors overall production budgets, allocated funds, and remaining amounts. Currencies are managed in the smallest units (cents/paise) to prevent floating-point calculation errors.
- **Expense Requests:** Cast and crew submit fund requests categorized by use case.
- **Self-Approval Guardrail:** Enforces strict backend constraints to prevent production managers from approving or rejecting their own fund requests.

### Transactional Compliance Audit Logs
- **System Traceability:** Records all critical modifications, state changes, and security events.
- **State Diffing:** Stores and displays `previousState` and `newState` side-by-side in JSON formats for complete compliance audits.

---

## 3. Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 16.3.1 (App Router) | Web client, SSR capability, routing structure |
| **Component Library** | React 19.2.8 | UI component composition |
| **UI Icons** | Lucide React | Visual vector icons |
| **Styling** | Tailwind CSS v4 & PostCSS | Premium modern design system, glassmorphism, responsive styles |
| **Animations** | Framer Motion | Smooth page-level and component transitions |
| **Client State** | Zustand 5.0.15 | Global client-side authentication and sidebar states |
| **Form Handling** | React Hook Form & Zod | Structured forms, input validations, schema schemas |
| **Maps Integration** | Leaflet & React-Leaflet | Location pinpointing and mapping |
| **Notifications** | React Hot Toast | Real-time user feedback popups |
| **HTTP Client** | Axios | Custom client with token injection & automated 401 token refresh |
| **Backend Runtime** | Node.js (v18+) | Application server runtime environment |
| **Backend Framework** | NestJS 11 | Modular REST API development |
| **Database** | MongoDB | Document database for storage |
| **ODM Interface** | Mongoose 9.9.2 | Schema definitions, validations, and indexes |
| **Security Hooks** | Bcryptjs v3 | Password hashing and validation |
| **API Documentation** | Swagger OpenAPIs | Auto-generated endpoint schemas and interactive tester |
| **File Storage** | Cloudinary | Document, photo, and tax form uploads |

---

## 4. Repository Architecture

### Frontend Structure (`frontend/`)
The frontend is organized around a domain-driven **Feature-Based Architecture**. Each module folder isolates its specific views, components, React hooks, APIs, and schema validations.

```text
frontend/
├── app/                        # Next.js App Router root layout & routing
│   ├── (dashboard)/            # Authenticated user pages (Protected layout)
│   │   ├── approvals/          # Onboarding request review dashboard
│   │   ├── cast-crew/          # Cast & crew listing pages
│   │   ├── costumes/           # Wardrobe & costume tracking dashboard
│   │   ├── funds/              # Budget and expense request cards
│   │   ├── locations/          # Studio / set location scheduling
│   │   ├── logs/               # Audit compliance tables
│   │   ├── projects/           # Production selection / creation pages
│   │   ├── roles/              # RBAC role & permission manager pages
│   │   └── users/              # Member directory page
│   ├── components/             # Global layout elements (Nav, Guards, Signatures)
│   ├── login/                  # Authentication entry
│   ├── onboarding/             # Step-by-step contractor registration
│   └── signup/                 # Account registration
├── components/                 # Global UI widgets & shared layouts
├── config/                     # Environment, branding, and config constants
├── constants/                  # Constant values (PERMISSIONS, etc.)
├── features/                   # Core Feature modules (Components, hooks, services)
│   ├── approvals/              # Onboarding evaluations
│   ├── cast-crew/              # Production rosters & characters
│   ├── costumes/               # Costume assignments
│   ├── funds/                  # Financial request state handlers
│   ├── locations/              # Scheduling & Leaflet wrappers
│   ├── logs/                   # Log tables & details view
│   ├── projects/               # Film production settings
│   ├── roles/                  # Role customization services
│   └── users/                  # Profile updates
├── hooks/                      # Global Custom React hooks (usePermissions)
├── lib/                        # Axios HTTP interceptors and validation schemas
├── public/                     # Static assets (logos, fallback images)
├── services/                   # General API modules
├── store/                      # Zustand state slices (useAuthStore, useHeaderStore)
├── types/                      # Shared TypeScript definitions
└── utils/                      # Shared helper functions (format-error)
```

### Backend Structure (`backend/`)
The backend is built as a modular NestJS monolith. Each domain feature encapsulates its own Mongoose schemas, controllers, DTOs, guards, and services.

```text
backend/
├── src/
│   ├── admin/                  # Applications review, manually updates, role configurations
│   ├── audit-logs/             # Compliance logging service and schemas
│   ├── auth/                   # Identity schemas, token signing, guards, & decorators
│   ├── common/                 # Global constants, decorators, utilities, and JWT services
│   ├── costumes/               # Costume inventory and assignments
│   ├── filters/                # Unified exception filters
│   ├── funds/                  # Budget configurations and requests controllers
│   ├── locations/              # Location profiles and scheduling models
│   ├── productions/            # Projects, cast/crew allocations, character schemas
│   ├── users/                  # User records and onboarding state machines
│   ├── app.module.ts           # Central NestJS registration module
│   ├── main.ts                 # Bootstrap server setup
│   └── seed.ts                 # Startup database seeding script
├── test/                       # E2E test suites
└── package.json                # Dependencies and devscripts
```

---

## 5. Development Setup

### Prerequisites
- **Node.js:** v18.0.0 or later
- **MongoDB:** Active database instance (Local, Docker container, or Atlas URI)
- **Cloudinary Account:** For profile photos and document uploads

---

### Step 1: Clone & Initialize Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment file:
   ```bash
   cp .env.example .env
   ```
4. Update the `.env` values with your MongoDB URI, JWT Secrets, and Cloudinary keys:
   ```env
   PORT=3001
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/film_production
   JWT_SECRET=production_super_secret_key_2026
   JWT_EXPIRES_IN=1d
   FRONTEND_URL=http://localhost:3000
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

5. Seed Default Roles, Permissions, and Super Admin account:
   ```bash
   npm run seed
   ```
   *Note: This creates the default super admin: `admin@production.com` / `AdminPassword123!`*

6. Start the API server in watch mode:
   ```bash
   npm run start:dev
   ```
   - **API Server URL:** [http://localhost:3001](http://localhost:3001)
   - **Swagger Docs:** [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

---

### Step 2: Initialize Frontend

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment file:
   ```bash
   cp .env.example .env
   ```
4. Verify the API connection points to your NestJS server:
   ```env
   PORT=3000
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```
5. Run the Next.js development client:
   ```bash
   npm run dev
   ```
   - **Frontend App URL:** [http://localhost:3000](http://localhost:3000)

---

## 6. Security & Permission Reference

Tendagon seeds 5 roles and 28 permissions on startup. Below is the capability matrix:

| Permission Group | Permission Name | Description |
| :--- | :--- | :--- |
| **Projects** | `productions.view`<br>`productions.create`<br>`productions.update`<br>`productions.delete` | View, create, edit, or delete film projects |
| **Users** | `users.view`<br>`users.create`<br>`users.update`<br>`users.delete`<br>`users.approve` | Manage users and approve contractor onboarding profiles |
| **Roles & RBAC** | `roles.manage`<br>`roles.view`<br>`permissions.view` | View and edit role-to-permission mappings |
| **Locations** | `locations.view`<br>`locations.create`<br>`locations.update`<br>`locations.delete`<br>`locations.book`<br>`locations.approve` | Pinpoint, edit, request, or approve schedule bookings |
| **Costumes** | `costumes.view`<br>`costumes.create`<br>`costumes.update`<br>`costumes.delete` | Manage costumes inventory and assignments |
| **Funds** | `funds.view`<br>`funds.create`<br>`funds.update`<br>`funds.approve` | Create budgets and approve/reject fund requests |
| **Logs** | `audit_logs.view`<br>`logs.view` | View detailed audit trails of state changes |

### Default Role Assignments
- **Super Admin:** Granted all 28 permissions.
- **Production Admin:** Granted 20 permissions (excluding role editing and project deletion).
- **Production Manager:** Granted 11 permissions (local scheduling, costume tracking, and submitting funds).
- **Cast / Crew:** Granted 4 view/submit permissions for assigned productions only (`productions.view`, `locations.view`, `costumes.view`, `funds.view`).
