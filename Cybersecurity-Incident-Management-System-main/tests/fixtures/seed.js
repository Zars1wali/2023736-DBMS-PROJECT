/**
 * Test Database Seed Script
 *
 * Creates the full schema and populates test data for:
 *   - E2E / integration tests
 *   - CI/CD pipeline
 *
 * Usage:
 *   DATABASE_URL=postgres://... node tests/fixtures/seed.js
 *
 * Test users created:
 *   Admin:   admin@cims.test   / Admin@12345
 *   Manager: manager@cims.test / Manager@12345
 *   Analyst: analyst@cims.test / Test@12345
 */

'use strict';

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Schema ────────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(255) NOT NULL UNIQUE,
        industry   VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS analysts (
        id            SERIAL PRIMARY KEY,
        organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
        name          VARCHAR(255)        NOT NULL,
        email         VARCHAR(255)        NOT NULL UNIQUE,
        role          VARCHAR(50)         NOT NULL CHECK (role IN ('Admin','Manager','Analyst')),
        password_hash TEXT                NOT NULL,
        created_at    TIMESTAMPTZ         DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS assets (
        id              SERIAL PRIMARY KEY,
        organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
        type            VARCHAR(100) NOT NULL,
        os              VARCHAR(100),
        ip_address      VARCHAR(45)  NOT NULL,
        location        VARCHAR(255),
        criticality     VARCHAR(50),
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS vulnerabilities (
        id          SERIAL PRIMARY KEY,
        cve_id      VARCHAR(50) UNIQUE,
        description TEXT,
        cvss_score  DECIMAL(4,1),
        severity    VARCHAR(50),
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS asset_vulnerabilities (
        asset_id         INTEGER REFERENCES assets(id) ON DELETE CASCADE,
        vulnerability_id INTEGER REFERENCES vulnerabilities(id) ON DELETE CASCADE,
        patch_status     VARCHAR(20) DEFAULT 'unpatched' CHECK (patch_status IN ('patched','unpatched')),
        updated_at       TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (asset_id, vulnerability_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS incidents (
        id              SERIAL PRIMARY KEY,
        organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
        title           VARCHAR(255) NOT NULL,
        description     TEXT,
        type            VARCHAR(100) NOT NULL,
        severity        VARCHAR(50)  NOT NULL CHECK (severity IN ('Low','Medium','High','Critical')),
        status          VARCHAR(50)  NOT NULL DEFAULT 'Open'
                          CHECK (status IN ('Open','In Progress','Resolved','Closed')),
        created_by      INTEGER REFERENCES analysts(id) ON DELETE SET NULL,
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS incident_assets (
        incident_id INTEGER REFERENCES incidents(id) ON DELETE CASCADE,
        asset_id    INTEGER REFERENCES assets(id)    ON DELETE CASCADE,
        PRIMARY KEY (incident_id, asset_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS incident_analysts (
        incident_id INTEGER REFERENCES incidents(id) ON DELETE CASCADE,
        analyst_id  INTEGER REFERENCES analysts(id)  ON DELETE CASCADE,
        assigned_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (incident_id, analyst_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS remediation_actions (
        id           SERIAL PRIMARY KEY,
        incident_id  INTEGER REFERENCES incidents(id) ON DELETE CASCADE,
        analyst_id   INTEGER REFERENCES analysts(id)  ON DELETE SET NULL,
        action_taken TEXT,
        result       VARCHAR(50) DEFAULT 'Pending'
                       CHECK (result IN ('Successful','Partial','Failed','Pending')),
        created_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // ── Seed Data ─────────────────────────────────────────────────────────────

    // Organization
    const orgResult = await client.query(`
      INSERT INTO organizations (name, industry)
      VALUES ('CIMS Test Org', 'Technology')
      ON CONFLICT (name) DO UPDATE SET industry = EXCLUDED.industry
      RETURNING id
    `);
    const orgId = orgResult.rows[0].id;

    // Users
    const adminHash   = await bcrypt.hash('Admin@12345',    10);
    const managerHash = await bcrypt.hash('Manager@12345',  10);
    const analystHash = await bcrypt.hash('Test@12345',     10);

    await client.query(`
      INSERT INTO analysts (organization_id, name, email, role, password_hash)
      VALUES
        ($1, 'Test Admin',   'admin@cims.test',   'Admin',   $2),
        ($1, 'Test Manager', 'manager@cims.test', 'Manager', $3),
        ($1, 'Test Analyst', 'analyst@cims.test', 'Analyst', $4)
      ON CONFLICT (email) DO UPDATE
        SET password_hash = EXCLUDED.password_hash,
            role          = EXCLUDED.role
    `, [orgId, adminHash, managerHash, analystHash]);

    // Asset
    await client.query(`
      INSERT INTO assets (organization_id, type, os, ip_address, location, criticality)
      VALUES ($1, 'Server', 'Ubuntu 22.04', '10.0.0.1', 'DC1', 'High')
      ON CONFLICT DO NOTHING
    `, [orgId]);

    // Sample incidents for E2E testing
    const adminResult = await client.query(
      `SELECT id FROM analysts WHERE email = 'admin@cims.test' LIMIT 1`
    );
    const adminId = adminResult.rows[0].id;

    for (let i = 0; i < 5; i++) {
      const severities = ['Low', 'Medium', 'High', 'Critical'];
      const severity   = severities[i % severities.length];
      await client.query(`
        INSERT INTO incidents (organization_id, title, description, type, severity, status, created_by)
        VALUES ($1, $2, 'Seed incident for E2E testing', 'Malware', $3, 'Open', $4)
      `, [orgId, `Seed Incident ${i + 1}`, severity, adminId]);
    }

    await client.query('COMMIT');
    console.log('✅ Test database seeded successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
