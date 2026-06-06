# Phase 3 API - Sample Requests/Responses

Base URL: `/api`

## 1) Authentication & Authorization

### POST `/auth/login`
Request:
```json
{ "email": "analyst1@org.com", "password": "StrongPassword123" }
```
Response (200):
```json
{
  "message": "Login successful",
  "token": "<jwt>",
  "user": { "id": 4, "name": "Ana Analyst", "email": "analyst1@org.com", "role": "Analyst" }
}
```

### POST `/auth/logout`
Headers: `Authorization: Bearer <jwt>`
Response (200):
```json
{ "message": "Logout successful" }
```

## 2) Incident Management API

### POST `/incidents`
```json
{
  "organization_id": 1,
  "title": "Suspicious phishing campaign",
  "description": "Multiple users reported phishing emails",
  "type": "Phishing",
  "severity": "High",
  "affected_asset_ids": [11, 12],
  "assigned_analyst_ids": [4, 6]
}
```
Response (201):
```json
{ "message": "Incident created", "incident": { "id": 101, "status": "Open", "severity": "High" } }
```

### PATCH `/incidents/:id/status`
```json
{ "status": "In Progress" }
```
Response (200):
```json
{ "message": "Incident status updated", "incident": { "id": 101, "status": "In Progress" } }
```

### PATCH `/incidents/:id/escalate`
```json
{ "severity": "Critical" }
```
Response (200):
```json
{
  "message": "Incident escalated and analysts notified",
  "incident": { "id": 101, "severity": "Critical" },
  "notified_analysts": [{ "id": 4, "email": "analyst1@org.com" }]
}
```

### GET `/incidents/:id`
Response (200):
```json
{
  "id": 101,
  "status": "In Progress",
  "assets": [{ "id": 11, "type": "Server" }],
  "analysts": [{ "id": 4, "name": "Ana Analyst" }],
  "remediation_actions": [{ "id": 900, "result": "Pending" }]
}
```

### GET `/incidents?status=Open&severity=High&startDate=2026-01-01&endDate=2026-12-31`
Response (200):
```json
[{ "id": 101, "status": "Open", "severity": "High" }]
```

## 3) Asset & Vulnerability Tracking API

### POST `/assets`
```json
{ "organization_id": 1, "type": "Server", "os": "Ubuntu 22.04", "ip_address": "10.0.1.14", "location": "DC-1", "criticality": "Critical" }
```
Response (201):
```json
{ "message": "Asset created", "asset": { "id": 11, "type": "Server" } }
```

### PUT `/assets/:id`
```json
{ "type": "Server", "os": "Ubuntu 24.04", "ip_address": "10.0.1.14", "location": "DC-2", "criticality": "High" }
```

### DELETE `/assets/:id`
Response (200):
```json
{ "message": "Asset deleted" }
```

### PATCH `/assets/:id/organization`
```json
{ "organization_id": 2 }
```

### POST `/assets/:id/vulnerabilities`
```json
{ "cve_id": "CVE-2026-1000", "description": "RCE vulnerability", "cvss_score": 9.8, "patch_status": "unpatched" }
```

### PATCH `/assets/:id/vulnerabilities/:vulnerabilityId/patch`
```json
{ "patch_status": "patched" }
```

### GET `/assets/vulnerabilities/unpatched-critical`
Response (200):
```json
[{ "asset_id": 11, "cve_id": "CVE-2026-1000", "cvss_score": 9.8, "patch_status": "unpatched" }]
```

## 4) Remediation Action Logging API

### POST `/remediation/incidents/:incidentId/actions`
```json
{ "action_taken": "Blocked sender domain at secure gateway", "result": "Successful" }
```
Response (201):
```json
{ "message": "Remediation action logged", "remediation_action": { "id": 901, "result": "Successful" } }
```

### GET `/remediation/incidents/:incidentId/actions`
Response (200):
```json
[{ "id": 901, "action_taken": "Blocked sender domain at secure gateway", "result": "Successful" }]
```

## 5) Dashboard & Reporting API

### GET `/reports/open-incidents-by-severity`
```json
[{ "severity": "Critical", "open_count": 3 }]
```

### GET `/reports/analyst-workload`
```json
[{ "analyst_id": 4, "analyst_name": "Ana Analyst", "active_incidents": 6 }]
```

### GET `/reports/unpatched-vulnerabilities-by-asset`
```json
[{ "asset_id": 11, "unpatched_vulnerability_count": 2 }]
```

### GET `/reports/incidents/:incidentId/timeline`
```json
[
  { "event_type": "incident_created", "event_time": "2026-04-23T10:00:00.000Z", "details": "Incident created with status Open" },
  { "event_type": "remediation_action", "event_time": "2026-04-23T10:10:00.000Z", "details": "Status changed from Open to In Progress" }
]
```
