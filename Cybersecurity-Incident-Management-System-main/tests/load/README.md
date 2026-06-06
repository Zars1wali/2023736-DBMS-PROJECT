# Load Testing — k6 Scripts

This directory contains [k6](https://k6.io) load test scripts for the
Cybersecurity Incident Management System.

## Scripts

| Script | Purpose | VUs | Duration |
|--------|---------|-----|---------|
| `concurrent-incidents.js` | 50 simultaneous incident submissions | 50 | ~3 min |
| `concurrent-resolution.js` | Concurrent status updates & remediation | 30 | ~11 min |

## Quick Start

### Install k6

```bash
# macOS
brew install k6

# Ubuntu / Debian
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Windows
winget install k6
```

### Prerequisites

1. Start the backend server: `cd backend && npm run dev`
2. Ensure the test database is seeded with:
   - Organisation id=1
   - Admin user: `admin@cims.test` / `Admin@12345`
   - Analyst user: `analyst@cims.test` / `Test@12345`

### Run Tests

```bash
# Concurrent incident submissions (50 VUs)
k6 run tests/load/concurrent-incidents.js \
  --env BASE_URL=http://localhost:3000 \
  --env ADMIN_EMAIL=admin@cims.test \
  --env ADMIN_PASSWORD=Admin@12345

# Concurrent resolution operations (30 VUs, 10-minute sustained)
k6 run tests/load/concurrent-resolution.js \
  --env BASE_URL=http://localhost:3000 \
  --env ADMIN_EMAIL=admin@cims.test \
  --env ADMIN_PASSWORD=Admin@12345

# With HTML report output
k6 run tests/load/concurrent-incidents.js \
  --out html=tests/load/report-incidents.html
```

## Performance Targets

| Metric | Target |
|--------|--------|
| p95 response time | < 200 ms |
| Error rate | < 1% |
| Concurrent users | ≥ 50 simultaneous |
| Sustained load | ≥ 10 minutes at peak |

## Interpreting Results

k6 prints a summary after every run. Key metrics to watch:

```
http_req_duration............: avg=45ms min=12ms med=40ms max=312ms p(90)=89ms p(95)=110ms
http_req_failed..............: 0.00% ✓ 0
error_rate...................: 0.00%
```

- **`http_req_duration p(95)`** — must stay below 200 ms to pass the threshold.
- **`http_req_failed`** — HTTP-level failures (5xx, network timeouts).
- **`error_rate`** — custom error rate (includes assertion failures).
- **`conflict_count`** — concurrent update conflicts (expected under load; see
  `concurrent-resolution.js`).

## Thresholds

Tests are configured with hard thresholds. If any threshold is breached, k6
exits with code 99. This makes it easy to fail CI pipelines:

```yaml
- name: Load test
  run: |
    k6 run tests/load/concurrent-incidents.js \
      --env BASE_URL=${{ env.API_URL }} \
      --env ADMIN_EMAIL=${{ secrets.LOAD_TEST_EMAIL }} \
      --env ADMIN_PASSWORD=${{ secrets.LOAD_TEST_PASSWORD }}
```
