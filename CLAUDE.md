# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Koperasi Sabah Softwoods — a Laravel 9 cooperative management system with three user roles (`admin`, `staff`, `investor`) and React SPAs embedded inside Blade views.

## Common Commands

```bash
# Install dependencies
composer install && npm install

# Local development (run both together)
php artisan serve
npm run dev

# Build frontend assets
npm run build

# Run all migrations
php artisan migrate

# Run tests
php artisan test

# Run a single test
php artisan test --filter TestName

# PHP code style (Laravel Pint)
./vendor/bin/pint
```

## Architecture

### Hybrid Blade + React

The frontend is a hybrid: Blade views handle routing/page shell while React SPAs handle the interactive UI. Vite bundles three entry points:

- `resources/js/investor-dashboard.tsx` → mounts `InvestorDashboard` on `#investor-dashboard-root`
- `resources/js/staff-dashboard.tsx` → mounts `StaffDashboard` on `#staff-dashboard-root`
- `resources/js/admin-dashboard.tsx` → mounts `AdminDashboard` on `#admin-dashboard-root`

Each SPA page (`resources/js/pages/`) fetches its data from a dedicated JSON endpoint (e.g., `GET /investor/dashboard-data`, `GET /staff/dashboard-data`, `GET /admin/dashboard-data`).

### Role & Access Control

Two middleware stack on all protected routes:

1. **`approved`** (`EnsureUserIsApproved`) — blocks investors with `status=pending` (redirects to `/register/pending`) or `status=inactive` (force-logs out). Staff and admin are never blocked.
2. **`role:*`** (`RoleMiddleware`) — checks `users.role` against allowed values (e.g., `role:staff,admin`).

Route prefixes and their allowed roles:
- `/investor/*` — `investor`, `staff`, `admin`
- `/staff/*` — `staff`, `admin`
- `/admin/*` — `admin` only

The `DashboardController::redirect()` method reads the user's role after login and bounces them to the correct SPA.

### Staff → Admin Approval Workflow

Staff cannot directly modify sensitive member data. Instead, `StaffActionController` creates a `PendingApproval` record (via `/staff/submit/*` routes) that admins review and approve/reject at `/admin/approvals`. This covers: editing member info, toggling member status, adding/editing/deleting transactions, and changing Tabung Koperasi amounts.

### User Model Fields

Key `users` table columns:
- `role` — `investor` | `staff` | `admin`
- `status` — `pending` | `active` | `inactive`
- `is_approved` — boolean (legacy, used alongside `status`)
- `member_id` — cooperative member ID string (e.g., `SSB001`)
- `membership_start_date` — used for calculating membership duration

### Tabung Koperasi (`TabungKomitmen`)

Each member has an active "Tabung Koperasi" commitment amount. Only one record is active at a time; updating it deactivates prior records to maintain a full audit trail. Use `TabungKomitmen::setForUser()` to assign amounts and `TabungKomitmen::currentAmountFor($userId)` or `$user->tabung_amount` (accessor) to read the current value.

### Shared Metrics

`app/Support/DashboardMetrics.php` provides `DashboardMetrics::totals()` — a single method used by all three dashboard data controllers to compute aggregate stats (member counts, investment totals, dividend totals, etc.).

### Key Routes File

All application routes live in `routes/web.php`. The file `routes/routes_addition.php` is a reference/notes file — it is **not** loaded by the application.

The API route `GET /api/investor/dashboard` (in `routes/api.php`) is handled by `Api/InvestorDashboardApiController` and is intended for React frontend integration.

## Environment Setup

Copy `.env.example` to `.env`, set `DB_DATABASE=koperasi_db`, then:

```bash
php artisan key:generate
php artisan migrate
```

Mail sending uses `Mail::raw(...)` — delivery requires valid SMTP settings in `.env`.
