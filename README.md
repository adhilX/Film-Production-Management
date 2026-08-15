# Film Production Management Platform

A web platform for film production logistics, contractor onboarding, location scheduling, budget management, and compliance auditing. Built using **NestJS**, **MongoDB (Mongoose)**, and **Next.js**.

---

## Architecture Overview

### Modular Backend Architecture (`backend/src/`)
Each domain feature module encapsulates its own Mongoose schemas, DTOs, controllers, and services:
- **`auth/`**: Authentication service, JWT logic, **`auth/schemas/role.schema.ts`**, and the **Three-Level `AuthGuard`**:
  1. *Identity Tier:* JWT validation & account active status (`isActive`).
  2. *Capability Tier:* RBAC check matching `@Permissions(...)` against user permissions.
  3. *Resource Scope Tier:* Production-level isolation enforced via `@CheckProduction()` and `CastCrew` mapping (bypassed for Super Admins).
- **`users/`**: Onboarding state machine (`Draft` ➔ `Pending` ➔ `UnderReview` ➔ `Approved` / `Rejected` / `Changes Requested`) with **`users/schemas/user.schema.ts`**.
- **`productions/`**: Production management & script character assignments with **`productions/schemas/`** (`production.schema.ts`, `cast-crew.schema.ts`, `character.schema.ts`).
- **`locations/`**: Conflict-free location booking with overlap queries (`startDate < newEnd` AND `endDate > newStart`) returning `422 Unprocessable Entity` on double-bookings with **`locations/schemas/location.schema.ts`**.
- **`funds/`**: Budget & fund requests with gatekeeper approval controls with **`funds/schemas/fund-request.schema.ts`**.
- **`audit-logs/`**: Transactional compliance logging capturing user action, state transitions, and timestamps with **`audit-logs/schemas/audit-log.schema.ts`**.
- **`filters/`**: `AllExceptionsFilter` providing unified JSON error response signatures.

---

## OpenAPI Swagger Documentation
Interactive Swagger API documentation is available at:
👉 **[http://localhost:3001/api/docs](http://localhost:3001/api/docs)**

Features:
- Complete list of endpoints tagged by feature domain (`Authentication`, `Users & Onboarding`, `Productions Core`, `Location Bookings`, `Budget & Funds`, `Audit Logs`).
- Full request/response payload examples with `class-validator` rules.
- Built-in Bearer JWT Authentication header testing (`JWT-auth`).

---

## Quick Start Guide

### Prerequisites
- Node.js (v18+)
- MongoDB instance (Local or Atlas MongoDB Uri)

### 1. Backend Setup
```bash
cd backend
npm install
```
Configure `.env`:
```env
PORT=3001
MONGO_URI=mongodb://localhost:27017/film-production
JWT_SECRET=production_super_secret_key_2026
JWT_EXPIRES_IN=24h
```
Start backend:
```bash
npm run start:dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```
Configure `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```
Start frontend:
```bash
npm run dev
```

---

## Default Super Admin Account
On startup, the system seeds default roles and an active Super Admin account:
- **Email:** `admin@production.com`
- **Password:** `AdminPassword123!`
