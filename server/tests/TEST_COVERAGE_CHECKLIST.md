# Test Coverage Checklist (Routes + Edge Cases)

Purpose: actionable list of missing tests based on current routes and existing test suites.

## P0 (Critical: security, auth, webhook correctness)

### Global auth guard tests (all protected route groups)

- [x] Missing token should return `401` for each protected group:
  - `GET /api/users/me`
  - `GET /api/buildings`
  - `GET /api/apartments`
  - `GET /api/residents`
  - `GET /api/managers`
  - `GET /api/messages`
  - `GET /api/issues`
  - `GET /api/payments`
- [x] Malformed/invalid JWT should return `401`.
- [x] Expired JWT should return `401`.

### Users routes endpoint gaps

Routes declared in `src/routes/users.routes.ts` but not covered in tests:

- [x] `POST /api/users/resident`
  - manager happy path (`201`)
  - non-manager forbidden (`403`)
  - validation failure (`400`)
  - target user/apartment not found (`404`)
  - apartment in another building forbidden (`403`)
- [x] `POST /api/users/manager`
  - admin happy path (`201`)
  - non-admin forbidden (`403`)
  - validation failure (`400`)
  - user/building not found (`404`)

### Payments webhook robustness (`POST /api/payments/webhook`)

- [x] Invalid or missing Stripe signature returns failure (`400`/`401`, depending on implementation).
- [x] Unknown `stripeSessionId` does not mark unrelated assignments.
- [x] Duplicate webhook delivery is idempotent (status remains valid, no double side effects).
- [x] Non-`checkout.session.completed` events are ignored safely.
- [x] Malformed payload body is handled safely.

## P1 (Important: role boundaries + data isolation)

### Auth routes

- [x] `POST /api/auth/request-otp`: unknown phone behavior is explicit (create user or reject) and tested.
- [x] `POST /api/auth/verify-otp`: expired OTP path (`401`).
- [x] `POST /api/auth/verify-otp`: successful verify should invalidate OTP for replay attempts.
- [x] `POST /api/auth/refresh`: invalid refresh token returns `401`.
- [x] `POST /api/auth/complete-profile`: unauthenticated (`401`) and invalid body (`400`).
- [x] `POST /api/auth/select-context`:
  - manager selecting building they do not belong to (`403`)
  - resident selecting apartment they do not belong to (`403`)
  - invalid context type (`400`)

### Buildings

- [x] `GET /api/buildings`: manager forbidden (`403`) and resident forbidden (`403`) already partially covered; add resident explicit test if missing.
- [x] `PATCH /api/buildings/:id`: manager/resident forbidden (`403`).
- [x] `DELETE /api/buildings/:id`: manager/resident forbidden (`403`).
- [x] Not found tests for `GET/PATCH/DELETE /:id` (`404`).
- [x] Validation failures for `POST` and `PATCH` (`400`).

### Apartments

- [x] `GET /api/apartments/:id`: manager from another building forbidden (`403`) if not already explicit.
- [x] Not found tests for `GET/PATCH/DELETE /:id` (`404`).
- [x] Validation failures for `POST` and `PATCH` (`400`).
- [x] Uniqueness/conflict checks (same apartment identifier in same building) (`409`/`400`).

### Residents

- [x] `POST /api/residents`: manager cannot create resident in another building (`403`).
- [x] `GET /api/residents/:residentId`: manager cannot read resident from another building (`403`).
- [x] `DELETE /api/residents/:residentId`: manager cannot delete resident from another building (`403`).
- [x] Not found tests for `GET/PATCH/DELETE /:residentId` (`404`).
- [x] Validation failure tests for `POST` and `PATCH` (`400`).

### Managers

- [x] `POST /api/managers`: validation failure (`400`), not found (`404`), duplicate relation conflict (`409`/`400`).
- [x] `GET /api/managers/:managerId`: not found (`404`).
- [x] `DELETE /api/managers/:managerId`: not found (`404`).

### Messages

- [x] `POST /api/messages`: resident forbidden (`403`), admin behavior explicit (allowed/forbidden per rule).
- [x] `GET /api/messages`: ensure results are scoped by building for manager and resident.
- [x] `GET /api/messages/:messageId`: manager cannot access message from another building (`403`).
- [x] `DELETE /api/messages/:messageId`: resident forbidden (`403`) explicit.
- [x] Not found tests for `GET` and `DELETE` by id (`404`).
- [x] Validation failure for `POST` (`400`).

### Issues

- [x] `GET /api/issues/:issueId`: resident cannot access issue from another building (`403`).
- [x] `PATCH /api/issues/:issueId`: manager cannot update issue from another building (`403`).
- [x] `DELETE /api/issues/:issueId`: resident cannot delete another user's issue (already covered for update, add delete).
- [x] Not found tests for `GET/PATCH/DELETE /:issueId` (`404`).
- [x] Validation failure tests for `POST` and `PATCH` (`400`).

### Payments (non-webhook)

- [x] `POST /api/payments`: resident forbidden (`403`).
- [x] `GET /api/payments`: resident forbidden (`403`).
- [x] `GET /api/payments/:paymentId/assignments`: resident forbidden (`403`).
- [x] `PATCH /api/payments/:paymentId`: resident forbidden (`403`).
- [x] `DELETE /api/payments/:paymentId`: resident forbidden (`403`).
- [x] `POST /api/payments/:assignmentId/checkout`: manager forbidden (`403`).
- [x] `POST /api/payments/:assignmentId/checkout`: resident cannot checkout assignment from another apartment/building (`403`).
- [x] Not found tests for `GET/PATCH/DELETE /:paymentId`, assignments, checkout (`404`).
- [x] Validation failure tests for create/update/checkout (`400`).

## P2 (Nice to have: reliability and regression hardening)

### Data integrity and conflicts

- [ ] Duplicate manager assignment conflict behavior is tested.
- [ ] Duplicate resident assignment conflict behavior is tested.
- [ ] Apartment uniqueness constraints are validated with expected status code.

### Pagination/filtering/sorting contracts (if supported by services)

- [ ] list endpoints (`messages`, `issues`, `payments`, `users`, `residents`) test deterministic ordering and filtering boundaries.

### Error-path observability

- [ ] Force service-layer failures and assert stable error payload shape from `error.middleware`.

## Suggested execution order

1. Add missing endpoint coverage for users routes (`/api/users/resident`, `/api/users/manager`).
2. Add global auth guard tests and payment webhook negative tests.
3. Add not-found + validation tests for each CRUD route group.
4. Add cross-building isolation tests for manager/resident across messages/issues/payments/residents.
5. Add conflict/integrity and reliability tests.
