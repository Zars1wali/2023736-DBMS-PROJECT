-- ============================================================================
-- TABLE 1: Organizations
-- ============================================================================
CREATE TABLE Organizations (
    org_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    country VARCHAR(100),
    website VARCHAR(255),
    location VARCHAR(255),
    contact_email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE 2: Analysts
-- ============================================================================
CREATE TABLE Analysts (
    analyst_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Junior', 'Senior', 'Lead', 'Manager', 'Admin')),
    password_hash VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES Organizations(org_id) ON DELETE CASCADE
);

-- ============================================================================
-- TABLE 3: Assets
-- ============================================================================
CREATE TABLE Assets (
    asset_id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL,
    type VARCHAR(100) CHECK (type IN ('Server', 'Workstation', 'Router', 'Firewall', 'Switch', 'IoT Device', 'Database', 'Web Server')),
    os VARCHAR(100),
    ip_address INET NOT NULL UNIQUE,
    location VARCHAR(255),
    criticality VARCHAR(50) CHECK (criticality IN ('Low', 'Medium', 'High', 'Critical')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES Organizations(org_id) ON DELETE CASCADE
);

-- ============================================================================
-- TABLE 4: Vulnerabilities
-- ============================================================================
CREATE TABLE Vulnerabilities (
    id SERIAL PRIMARY KEY,
    cve_id VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    cvss_score DECIMAL(3, 1) CHECK (cvss_score BETWEEN 0.0 AND 10.0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE 5: Asset_Vulnerabilities
-- ============================================================================
CREATE TABLE Asset_Vulnerabilities (
    asset_id INT NOT NULL,
    vulnerability_id INT NOT NULL,
    patch_status VARCHAR(50) CHECK (patch_status IN ('Patched', 'Unpatched', 'Excluded', 'In Progress')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES Assets(asset_id) ON DELETE CASCADE,
    FOREIGN KEY (vulnerability_id) REFERENCES Vulnerabilities(id) ON DELETE CASCADE,
    PRIMARY KEY(asset_id, vulnerability_id)
);

-- ============================================================================
-- TABLE 6: Incidents
-- ============================================================================
CREATE TABLE Incidents (
    id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    type VARCHAR(100),
    severity VARCHAR(50) CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')) NOT NULL,
    status VARCHAR(50) CHECK (status IN ('Open', 'In Progress', 'On Hold', 'Resolved', 'Closed')) DEFAULT 'Open',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES Organizations(org_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES Analysts(analyst_id) ON DELETE SET NULL
);

-- ============================================================================
-- TABLE 7: Incident_Assets
-- ============================================================================
CREATE TABLE Incident_Assets (
    incident_id INT NOT NULL,
    asset_id INT NOT NULL,
    FOREIGN KEY (incident_id) REFERENCES Incidents(id) ON DELETE CASCADE,
    FOREIGN KEY (asset_id) REFERENCES Assets(asset_id) ON DELETE CASCADE,
    PRIMARY KEY(incident_id, asset_id)
);

-- ============================================================================
-- TABLE 8: Incident_Analysts
-- ============================================================================
CREATE TABLE Incident_Analysts (
    incident_id INT NOT NULL,
    analyst_id INT NOT NULL,
    FOREIGN KEY (incident_id) REFERENCES Incidents(id) ON DELETE CASCADE,
    FOREIGN KEY (analyst_id) REFERENCES Analysts(analyst_id) ON DELETE CASCADE,
    PRIMARY KEY(incident_id, analyst_id)
);

-- ============================================================================
-- TABLE 9: Remediation_Actions
-- ============================================================================
CREATE TABLE Remediation_Actions (
    id SERIAL PRIMARY KEY,
    incident_id INT NOT NULL,
    analyst_id INT NOT NULL,
    action_taken TEXT NOT NULL,
    result VARCHAR(50) CHECK (result IN ('Pending', 'In Progress', 'Successful', 'Partial', 'Failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (incident_id) REFERENCES Incidents(id) ON DELETE CASCADE,
    FOREIGN KEY (analyst_id) REFERENCES Analysts(analyst_id) ON DELETE SET NULL
);

-- ============================================================================
-- ADVANCED FEATURES: TRIGGERS & VIEWS
-- ============================================================================

-- Function to auto-timestamp resolved incidents
CREATE OR REPLACE FUNCTION set_resolved_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Resolved' AND OLD.status != 'Resolved' THEN
        NEW.resolved_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-timestamping
CREATE TRIGGER trigger_set_resolved_timestamp
BEFORE UPDATE ON Incidents
FOR EACH ROW
EXECUTE FUNCTION set_resolved_timestamp();

-- View for Active Incidents Dashboard
CREATE OR REPLACE VIEW Active_Incidents_Dashboard AS
SELECT 
    i.id AS incident_id,
    o.name AS organization_name,
    i.title,
    i.type,
    i.severity,
    i.status,
    i.created_at,
    COUNT(ia.asset_id) AS affected_assets_count
FROM Incidents i
JOIN Organizations o ON i.organization_id = o.org_id
LEFT JOIN Incident_Assets ia ON i.id = ia.incident_id
WHERE i.status IN ('Open', 'In Progress')
GROUP BY i.id, o.name;

-- ======================================================== ===
--     SEED DATA 


-- =========================================================================

-- 1. Organizations
INSERT INTO Organizations (name, industry, country, website, location, contact_email, phone) VALUES
('Habib Bank Limited', 'Finance', 'Pakistan', 'https://www.hbl.com', 'Karachi', 'security@hbl.com', '+92-21-111-111-425'),
('Systems Limited', 'IT Services', 'Pakistan', 'https://www.systemsltd.com', 'Lahore', 'soc@systemsltd.com', '+92-42-111-797-836'),
('Pakistan Telecommunication Company', 'Telecommunications', 'Pakistan', 'https://www.ptcl.com.pk', 'Islamabad', 'cyber@ptcl.com.pk', '+92-51-111-20-20-20'),
('Google Cloud', 'Technology', 'USA', 'https://cloud.google.com', 'Mountain View', 'cloud-security@google.com', '+1-800-419-0157'),
('Amazon Web Services', 'Cloud Computing', 'USA', 'https://aws.amazon.com', 'Seattle', 'security-ops@amazon.com', '+1-206-266-1000'),
('Microsoft Azure', 'Technology', 'USA', 'https://azure.microsoft.com', 'Redmond', 'azure-soc@microsoft.com', '+1-425-882-8080');

-- 2. Analysts (Password for all is 'abc123')
INSERT INTO Analysts (org_id, name, email, role, password_hash, department, phone) VALUES
(1, 'Ahmed Khan', 'ahmed.khan@hbl.com', 'Admin', '$2b$10$wpD87KIw1LcKfmFafXiq9eed8ix06TvUdP3blWHHrC3Wrnh0IilL2', 'Cyber Security', '+92-300-1234567'),
(1, 'Fatima Ali', 'fatima.ali@hbl.com', 'Senior', '$2b$10$wpD87KIw1LcKfmFafXiq9eed8ix06TvUdP3blWHHrC3Wrnh0IilL2', 'Threat Intel', '+92-300-7654321'),
(2, 'Zeeshan Ahmed', 'zeeshan.ahmed@systemsltd.com', 'Lead', '$2b$10$wpD87KIw1LcKfmFafXiq9eed8ix06TvUdP3blWHHrC3Wrnh0IilL2', 'SOC', '+92-321-1122334'),
(2, 'Sana Malik', 'sana.malik@systemsltd.com', 'Junior', '$2b$10$wpD87KIw1LcKfmFafXiq9eed8ix06TvUdP3blWHHrC3Wrnh0IilL2', 'SOC', '+92-333-4455667'),
(3, 'Bilal Shah', 'bilal.shah@ptcl.com.pk', 'Manager', '$2b$10$wpD87KIw1LcKfmFafXiq9eed8ix06TvUdP3blWHHrC3Wrnh0IilL2', 'IT Infrastructure', '+92-345-9988776'),
(4, 'John Doe', 'john.doe@google.com', 'Admin', '$2b$10$wpD87KIw1LcKfmFafXiq9eed8ix06TvUdP3blWHHrC3Wrnh0IilL2', 'Cloud Ops', '+1-555-0199');


-- 3. Assets
INSERT INTO Assets (organization_id, type, os, ip_address, location, criticality) VALUES
(1, 'Database', 'RHEL 8', '192.168.1.10', 'Primary DC Karachi', 'Critical'),
(1, 'Web Server', 'Ubuntu 22.04', '192.168.1.20', 'Cloud Region West', 'High'),
(2, 'Router', 'Cisco IOS', '10.0.0.1', 'Main Office Lahore', 'Medium'),
(3, 'Firewall', 'FortiOS', '172.16.0.1', 'NOC Islamabad', 'Critical'),
(4, 'Server', 'Windows Server 2022', '34.56.78.90', 'GCP US-Central1', 'High'),
(5, 'Workstation', 'macOS Sonoma', '10.50.1.45', 'Seattle Office', 'Low');

-- 4. Vulnerabilities
INSERT INTO Vulnerabilities (cve_id, description, cvss_score) VALUES
('CVE-2023-1234', 'Critical remote code execution in OpenSSL', 9.8),
('CVE-2024-5678', 'Information disclosure in Linux Kernel', 7.5),
('CVE-2021-9999', 'Legacy Buffer Overflow in Web Server', 8.2),
('CVE-2022-1111', 'Authentication bypass in Fortinet products', 9.1),
('CVE-2023-4444', 'Denial of Service in HTTP/2 protocol', 6.5);

-- 5. Asset_Vulnerabilities
INSERT INTO Asset_Vulnerabilities (asset_id, vulnerability_id, patch_status) VALUES
(1, 1, 'Unpatched'),
(1, 2, 'In Progress'),
(2, 3, 'Unpatched'),
(4, 4, 'Patched'),
(5, 1, 'Unpatched'),
(6, 5, 'Excluded');

-- 6. Incidents
INSERT INTO Incidents (organization_id, title, description, type, severity, status, created_by) VALUES
(1, 'Suspicious Login Activity', 'Multiple failed login attempts detected on Core DB', 'Brute Force', 'High', 'Open', 1),
(2, 'Potential Data Exfiltration', 'Large data transfer detected to unauthorized IP', 'Data Breach', 'Critical', 'In Progress', 3),
(3, 'DDoS Attack Target', 'Traffic spike detected on NOC Gateway', 'DDoS', 'High', 'Open', 5),
(1, 'Phishing Campaign', 'Employees reporting suspicious emails with malicious links', 'Social Engineering', 'Medium', 'Open', 2),
(4, 'Unpatched RCE Vulnerability', 'Scanning identified critical CVE on GCP instance', 'Vulnerability', 'Critical', 'Resolved', 6);

-- 7. Incident_Assets
INSERT INTO Incident_Assets (incident_id, asset_id) VALUES
(1, 1),
(2, 3),
(3, 4),
(4, 2),
(5, 5);

-- 8. Incident_Analysts
INSERT INTO Incident_Analysts (incident_id, analyst_id) VALUES
(1, 1),
(1, 2),
(2, 3),
(2, 4),
(3, 5),
(5, 6);

-- 9. Remediation_Actions
INSERT INTO Remediation_Actions (incident_id, analyst_id, action_taken, result) VALUES
(1, 1, 'Blocked source IP and forced password reset', 'Successful'),
(2, 3, 'Isolating affected network segment', 'In Progress'),
(5, 6, 'Patched vulnerability and rebooted instance', 'Successful');


