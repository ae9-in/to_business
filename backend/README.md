# To Businesses Backend

Production-style Express + TypeScript + native MongoDB backend for the internal B2B CRM and shop tracking workflow.

## Stack

- Node.js
- Express.js
- TypeScript
- MongoDB
- Zod validation
- JWT auth with refresh tokens
- RBAC
- node-cron jobs
- Pino logging

## Features

- Internal auth for `SUPER_ADMIN`, `ADMIN`, and `STAFF`
- Shops CRUD with assignment history and status transitions
- Delivery recording with deterministic 30-day reminder generation
- Reminder completion, snooze, reschedule, cancel
- Notes and activity logging
- Dashboard summary and reporting endpoints
- Daily reminder status and reminder integrity jobs

## Setup

1. Copy `.env.example` to `.env`
2. Install dependencies:
   `npm install`
3. Start dev server:
   `npm run dev`

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run test`

## Important Reminder Rule

When a delivery is created:

- reminder date = delivery date plus `30` days
- reminders are marked as `UPCOMING` when they are due within the next `3` days
- reminders become `OVERDUE` after the reminder date passes

Example:

- delivery: `2026-03-20`
- reminder date: `2026-04-19`

## API Prefix

All endpoints are under `/api/v1`.

## Default Local Port

The backend is configured to run on `4001` by default to avoid collisions with common frontend/dev servers on `4000`.
