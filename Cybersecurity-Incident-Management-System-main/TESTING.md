# Testing Guide — Cybersecurity Incident Management System

This document explains how to run, interpret, and extend the test suite for
the Cybersecurity Incident Management System (CIMS).

---

## Table of Contents

1. [Test Architecture Overview](#1-test-architecture-overview)
2. [Backend Unit Tests](#2-backend-unit-tests)
3. [Frontend Unit Tests](#3-frontend-unit-tests)
4. [Integration & E2E Tests](#4-integration--e2e-tests)
5. [Security Tests](#5-security-tests)
6. [Load Tests](#6-load-tests)
7. [CI/CD Pipeline](#7-cicd-pipeline)
8. [Coverage Targets](#8-coverage-targets)
9. [Troubleshooting](#9-troubleshooting)
10. [Security Findings & Remediation Log](#10-security-findings--remediation-log)

---

## 1. Test Architecture Overview

```
Cybersecurity-Incident-Management-System/
├── backend/
│   └── tests/                        ← Backend unit & security tests
│       ├── apiError.test.js
│       ├── asyncHandler.test.js
│       ├── authController.test.js
│       ├── authMiddleware.test.js
│       ├── authorize.test.js
│       ├── assetController.test.js
│       ├── errorHandler.test.js
│       ├── incidentController.test.js
│       ├── incidentWorkflow.test.js
│       ├── remediationController.test.js
│       ├── reportController.test.js
│       ├── security.test.js
│       └── validate.test.js
├── frontend/
│   └── src/pages/__tests__/          ← Frontend unit tests
│       └── IncidentsPage.test.jsx
├── tests/
│   ├── e2e/                          ← End-to-end / integration tests
│   │   ├── auth.spec.js
│   │   └── incidents.spec.js
│   ├── fixtures/
│   │   └── seed.js                   ← Test database seeder
│   └── load/                         ← Load test scripts
│       ├── concurrent-incidents.js
│       ├── concurrent-resolution.js
│       └── README.md
├── playwright.config.js
└── .github/workflows/ci.yml          ← CI/CD pipeline
```

### Tools Used

| Layer | Tool | Why |
|-------|------|-----|
| Backend unit tests | `node:test` (built-in) | Zero extra dependencies, matches Node ≥18 |
| Frontend unit tests | Vitest + React Testing Library | First-class Vite/React support |
| E2E / integration | Playwright | Reliable HTTP & browser testing |
| Load testing | k6 | Lightweight, JS scripting, great metrics |
| CI/CD | GitHub Actions | Already part of the repository workflow |

---

## 2. Backend Unit Tests

### Run

```bash
cd backend
npm install
npm test
```

### What Is Tested

| File | Coverage |
|------|----------|
| `apiError.test.js` | ApiError class — statusCode, message, instanceof |
| `asyncHandler.test.js` | Async and sync error propagation to Express `next` |
| `authController.test.js` | Login (valid/invalid creds, JWT claims, no user enum), Logout |
| `authMiddleware.test.js` | JWT verification, blacklist check, missing header |
| `authorize.test.js` | `authorize()` role guard, `canAccessAllIncidents()` |
| `assetController.test.js` | CRUD, vulnerability upsert, patch-status, unpatched query |
| `errorHandler.test.js` | `notFoundHandler` (404), `errorHandler` (custom + default codes) |
| `incidentController.test.js` | List (RBAC filter), CRUD, status transitions, transaction rollback |
| `incidentWorkflow.test.js` | Allowed status state machine |
| `remediationController.test.js` | Log action, retrieve trail, 404 when empty |
| `reportController.test.js` | Severity counts, workload, unpatched vulns, timeline |
| `security.test.js` | RBAC rules, SQL injection parameterization, JWT edge cases, input validation |
| `validate.test.js` | `requireFields`, `validateEnum` — all branches |

### Database Mocking Strategy

Controllers are tested by patching the shared `db` module object:

```js
const db = require('../src/config/db');
db.query = async (text, params) => { /* mock */ };
// For createIncident which uses pool.connect():
db.pool = { connect: async () => mockClient };
```

This works because Node.js module caching means both the test file and the
controller hold a reference to the same exported object.

---

## 3. Frontend Unit Tests

### Setup

```bash
cd frontend
npm install
npm test
```

### What Is Tested (`IncidentsPage`)

- Component renders correctly (title, inputs, button, output area)
- API is called on mount with empty params
- Loaded incidents are displayed as JSON
- Status/severity filter inputs update state
- Filter button sends correct query params
- Both filters combined send correct combined params
- Incident list updates after filter is applied

### Coverage

```bash
npm run test:coverage
```

Coverage report is written to `frontend/coverage/`.

---

## 4. Integration & E2E Tests

### Prerequisites

1. PostgreSQL 16+ running and accessible.
2. Test database seeded:

```bash
DATABASE_URL=postgres://cims:cims_test@localhost:5432/cims_test \
  node tests/fixtures/seed.js
```

3. Backend running:

```bash
cd backend
DATABASE_URL=postgres://... JWT_SECRET=... npm run dev
```

4. Playwright browsers installed:

```bash
npx playwright install --with-deps chromium
```

### Run

```bash
# All E2E specs
BASE_URL=http://localhost:3000 npx playwright test

# Single spec
npx playwright test tests/e2e/auth.spec.js

# With browser UI (headed mode)
npx playwright test --headed

# Generate & open HTML report
npx playwright test --reporter=html
npx playwright show-report
```

### E2E Scenarios

**`auth.spec.js`**
- Health check endpoint
- Login success/failure (missing fields, wrong password, unknown user)
- Authenticated requests
- Revoked token rejection after logout
- RBAC: Analyst cannot create incidents or delete assets
- RBAC: Analyst cannot access admin-only report endpoints

**`incidents.spec.js`**
- Admin creates incident (201)
- Admin lists all incidents (200)
- Status and severity filters
- Full lifecycle: Open → In Progress → Resolved → Closed
- Invalid status transition rejected (400)
- Severity escalation
- Remediation action logging and trail retrieval
- Analyst only sees their assigned incidents
- Invalid enum / missing required fields (400)
- 404 for non-existent incident / unknown route

---

## 5. Security Tests

Security tests live in `backend/tests/security.test.js` and run as part of the
normal `npm test` suite.

### Run Security Tests Only

```bash
cd backend
node --test tests/security.test.js
```

### What Is Verified

#### RBAC Enforcement
- Admin-only routes reject Manager and Analyst roles (403)
- Admin + Manager routes reject Analyst (403)
- Unauthenticated requests (no user) are rejected (401)
- Analyst `listIncidents` query is filtered by `incident_analysts` table

#### SQL Injection Prevention
All user-supplied inputs are verified to be passed as **bound parameters** (`$1`,
`$2`, …), never interpolated into query strings. Tests cover:

- `listIncidents` — `status` and `severity` query parameters
- `incidentTimeline` — `incidentId` route parameter
- `createAsset` — `ip_address` body field

Proof of parameterization:
```js
assert.ok(call.params.includes(maliciousInput));   // bound
assert.ok(!call.text.includes(maliciousInput));     // not in SQL text
```

#### JWT Security
- Expired tokens rejected (401)
- Tokens signed with wrong secret rejected (401)
- Malformed tokens rejected (401)
- Missing `Bearer` prefix rejected (401)
- Blacklisted (revoked) tokens rejected (401)

#### Input Validation
- Invalid enum values (e.g. `severity: "MEGA_CRITICAL"`) return 400
- XSS payloads in enum fields are rejected before reaching controllers
- Missing required fields return 400, not 500

### Vulnerability Assessment

| Check | Status | Notes |
|-------|--------|-------|
| SQL Injection |  PASS | All queries use `pg` parameterized API (`$1`, `$2`, …) |
| RBAC |  PASS | `authorize()` middleware enforced on all mutation routes |
| JWT Validation |  PASS | `jsonwebtoken.verify()` on every authenticated request |
| Token Revocation |  PASS | In-memory blacklist; consider Redis for multi-instance |
| Password Hashing |  PASS | `bcrypt` with cost factor 10 |
| Rate Limiting |  PASS | `express-rate-limit` on auth (20/min) and API (240/min) |
| XSS |  PASS | Enum validation + React's built-in DOM escaping |
| CSRF |  INFO | API is token-based (JWT in `Authorization` header), not cookie-based; CSRF not applicable |

---

## 6. Load Tests

See [`tests/load/README.md`](tests/load/README.md) for full k6 setup and usage.

### Quick Reference

```bash
# Install k6 (macOS)
brew install k6

# Run concurrent incident submissions (50 VUs)
k6 run tests/load/concurrent-incidents.js \
  --env BASE_URL=http://localhost:3000 \
  --env ADMIN_EMAIL=admin@cims.test \
  --env ADMIN_PASSWORD=Admin@12345

# Run concurrent resolution (30 VUs, 10-minute sustained)
k6 run tests/load/concurrent-resolution.js \
  --env BASE_URL=http://localhost:3000 \
  --env ADMIN_EMAIL=admin@cims.test \
  --env ADMIN_PASSWORD=Admin@12345
```

### Performance Targets

| Metric | Target |
|--------|--------|
| p95 API response time | < 200 ms |
| Error rate | < 1% |
| Concurrent users | ≥ 50 |
| Sustained load | ≥ 10 min at peak (concurrent-resolution.js) |

---

## 7. CI/CD Pipeline

The pipeline (`.github/workflows/ci.yml`) runs on every push and pull request.

### Jobs

| Job | Trigger | What It Does |
|-----|---------|--------------|
| `backend-unit` | Every push/PR | Runs all 98 backend tests via `npm test` |
| `frontend-unit` | Every push/PR | Runs 16 Vitest tests |
| `integration` | After `backend-unit` | Spins up Postgres, seeds DB, starts API, runs Playwright E2E |
| `security` | After `backend-unit` | Runs `security.test.js` + `npm audit` on both packages |
| `all-tests-pass` | After all jobs | Summary badge — fails if any required job failed |

### Secrets Required for E2E

Set these as GitHub Actions secrets when running against a real environment:

| Secret | Description |
|--------|-------------|
| `DATABASE_URL` | PostgreSQL connection string for the test database |
| `JWT_SECRET` | Secret for signing JWTs |

---

## 8. Coverage Targets

| Scope | Target | How to Measure |
|-------|--------|----------------|
| Backend critical modules | ≥ 80% | `node --test --experimental-test-coverage` (Node 20+) |
| Frontend UI components | ≥ 75% | `npm run test:coverage` in `frontend/` |

### Backend Coverage (Node 20)

```bash
cd backend
node --test --experimental-test-coverage
```

### Frontend Coverage

```bash
cd frontend
npm run test:coverage
# HTML report: frontend/coverage/index.html
```

---

## 9. Troubleshooting

### Backend tests fail with `ECONNREFUSED`

The tests mock the database (`db.query`). If you see connection errors, check
that `DATABASE_URL` is **not** set to a real database that's unavailable. The
tests set their own `process.env.DATABASE_URL` at the top of each test file.

### Playwright tests fail with `ERR_CONNECTION_REFUSED`

The backend server must be running before E2E tests start. Confirm with:
```bash
curl http://localhost:3000/health
```

### Frontend `act(...)` warnings

These are cosmetic React Testing Library warnings triggered by the
`useEffect`-based API call in `IncidentsPage`. All tests pass correctly despite
the warnings.

### k6 `threshold breached` exit code 99

One or more performance targets were not met. Common causes:
- Database not warmed up (run a brief smoke test first)
- Insufficient database connection pool size (increase `max` in `pg.Pool`)
- Missing indexes on `incidents` table

### `npm audit` warnings

Run `npm audit fix` to apply non-breaking updates. For breaking changes, review
the advisory before applying `npm audit fix --force`.

---

## 10. Security Findings & Remediation Log

| # | Finding | Severity | Status | Fix Applied |
|---|---------|----------|--------|-------------|
| 1 | `asyncHandler` did not catch synchronous throws | Medium | ✅ Fixed | Wrapped handler call in `try/catch` before `Promise.resolve()` (see `src/utils/asyncHandler.js`) |

No critical or high-severity vulnerabilities were identified during Phase 4
security testing.


KAN-4
