# API SPEC — Permata Sakinah

> Phase: contract-first only. Backend belum dibuat pada fase frontend.

## 1. API Principles
- REST JSON.
- Frontend tidak mengetahui detail database.
- Response konsisten.
- Authentication menggunakan token pada fase backend.
- Role/permission divalidasi backend, bukan hanya frontend.

Base URL contoh:
`https://api.example.com/api/v1`

## 2. Standard Response

Success:
```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Error:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": {}
  }
}
```

## 3. Auth
### POST /auth/login
Request:
```json
{ "email": "user@example.com", "password": "secret" }
```

### GET /auth/me
Returns authenticated user and role.

### POST /auth/logout
Invalidates session/token where supported.

## 4. Projects
- GET /projects
- POST /projects
- GET /projects/:id
- PATCH /projects/:id
- DELETE /projects/:id

Project fields:
id, name, slug, location, description, status, total_lots, available_lots, cover_image, facilities.

## 5. Lots
- GET /projects/:projectId/lots
- GET /lots/:id
- POST /projects/:projectId/lots
- PATCH /lots/:id

Lot fields:
id, project_id, code, area_m2, price, status, block, notes.

Filters:
status, block, min_price, max_price, search.

## 6. Customers
- GET /customers
- POST /customers
- GET /customers/:id
- PATCH /customers/:id

Fields:
id, name, phone, email, address, source, notes, status.

## 7. Transactions
- GET /transactions
- POST /transactions
- GET /transactions/:id
- PATCH /transactions/:id

Create transaction:
```json
{
  "customer_id": "cus_001",
  "lot_id": "lot_001",
  "type": "BOOKING",
  "amount": 5000000,
  "payment_method": "TRANSFER"
}
```

## 8. Payments
- GET /transactions/:id/payments
- POST /transactions/:id/payments
- GET /payments

Payment fields:
id, transaction_id, amount, payment_date, method, status, reference, notes.

## 9. Dashboard
- GET /dashboard/summary
- GET /dashboard/sales
- GET /dashboard/lot-status
- GET /dashboard/recent-transactions

## 10. Reports
- GET /reports/sales
- GET /reports/payments
- GET /reports/lots

Export can be added later; do not require it for frontend validation.

## 11. Frontend Contract Rule
During frontend phase:
- Implement repository/service interfaces or mock API adapters.
- Mock data must follow this API shape.
- Do not couple components directly to mock objects.
- No real HTTP dependency is required before backend phase.

## 12. Security
Backend must enforce:
- authentication,
- authorization,
- ownership checks,
- validation,
- rate limiting where appropriate,
- audit for sensitive actions.

Frontend security is UX only and never a substitute for backend authorization.
