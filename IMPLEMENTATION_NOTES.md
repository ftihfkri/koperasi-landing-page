# Koperasi Sabah Softwoods - Completed Implementation Notes

This package extends the uploaded Laravel project to better fulfill the cooperative management requirements.

## Added modules
- Role-aware dashboard redirect and fixed `/dashboard` route
- Admin dashboard
- Staff dashboard
- Investor dashboard with statement download
- Member management
- User approval and role management
- Investment management
- Dividend rate setup and automatic dividend calculation
- Transaction ledger generation
- Announcement publishing with email attempts
- Historical CSV import
- CSV report generation
- Investor dashboard API endpoint for React frontend integration

## New database tables
Run migrations after updating `.env`:

```bash
php artisan migrate
```

Tables added:
- investments
- dividend_rates
- dividends
- transactions
- announcements

## Historical import CSV format
Required columns:

```csv
member_id,type,amount,transaction_date,description
SSB001,investment,1000.00,2020-01-15,Initial share contribution
SSB001,historical,120.00,2020-12-31,Legacy adjustment
```

Allowed `type` values:
- investment
- dividend
- adjustment
- historical

## Main admin URLs
- `/admin`
- `/admin/members`
- `/admin/users`
- `/admin/investments`
- `/admin/dividends`
- `/admin/announcements`
- `/admin/reports`
- `/admin/imports`

## Staff URLs
- `/staff`
- `/staff/members`
- `/staff/investments`

## Investor URLs
- `/investor`
- `/investor/statement/download`

## API for React dashboard
Authenticated endpoint:

```text
GET /api/investor/dashboard
```

## Important note
Email sending is implemented with `Mail::raw(...)`, but delivery depends on valid mail settings in `.env`.
