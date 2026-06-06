# CIMS Backend (Phase 3)

## Folder Structure

```text
backend/
  .env.example
  package.json
  README.md
  docs/
    api-examples.md
  src/
    app.js
    server.js
    config/
      db.js
    controllers/
      authController.js
      incidentController.js
      assetController.js
      remediationController.js
      reportController.js
    middleware/
      auth.js
      authorize.js
      validate.js
      errorHandler.js
    routes/
      authRoutes.js
      incidentRoutes.js
      assetRoutes.js
      remediationRoutes.js
      reportRoutes.js
    utils/
      ApiError.js
      asyncHandler.js
      constants.js
      incidentWorkflow.js
  tests/
    authMiddleware.test.js
    incidentWorkflow.test.js
```

## Express Route Definitions

- Auth: `POST /api/auth/login`, `POST /api/auth/logout`
- Incidents: `GET /api/incidents`, `GET /api/incidents/:id`, `POST /api/incidents`, `PATCH /api/incidents/:id/status`, `PATCH /api/incidents/:id/escalate`
- Assets/Vulnerabilities: `POST /api/assets`, `PUT /api/assets/:id`, `DELETE /api/assets/:id`, `PATCH /api/assets/:id/organization`, `POST /api/assets/:id/vulnerabilities`, `PATCH /api/assets/:id/vulnerabilities/:vulnerabilityId/patch`, `GET /api/assets/vulnerabilities/unpatched-critical`
- Remediation: `POST /api/remediation/incidents/:incidentId/actions`, `GET /api/remediation/incidents/:incidentId/actions`
- Reports: `GET /api/reports/open-incidents-by-severity`, `GET /api/reports/analyst-workload`, `GET /api/reports/unpatched-vulnerabilities-by-asset`, `GET /api/reports/incidents/:incidentId/timeline`

## Parameterized PostgreSQL Queries

All data access uses `$1`, `$2`, ... placeholders via `db.query(text, params)` or `client.query(text, params)`.
Examples:

- Login:
  - `SELECT id, name, email, role, password_hash FROM analysts WHERE email = $1 LIMIT 1`
- Incident creation:
  - `INSERT INTO incidents (...) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING ...`
- Incident filters:
  - Dynamic clauses append placeholders and values array (`status`, `severity`, `startDate`, `endDate`, analyst assignment constraint)
- Asset vulnerability upsert:
  - `INSERT INTO vulnerabilities (...) VALUES ($1,$2,$3) ON CONFLICT (cve_id) DO UPDATE ...`
  - `INSERT INTO asset_vulnerabilities (...) VALUES ($1,$2,$3) ON CONFLICT (asset_id,vulnerability_id) DO UPDATE ...`
- Dashboard queries:
  - Aggregations all use placeholders (`status IN ($1,$2)`, `patch_status = $1`, critical threshold `$2`)

See `docs/api-examples.md` for request/response payload samples for every endpoint.
