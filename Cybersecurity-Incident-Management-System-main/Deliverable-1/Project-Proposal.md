# Deliverable 1 — Project Proposal

## Cybersecurity Incident Management System

---

### 📚 Course Information

| Field | Details |
|---|---|
| **Course** | CS-232 — Database Management System |
| **Instructor** | Sir Said Nabi |
| **Institute** | Ghulam Ishaq Khan Institute (GIK) |
| **Semester** | Spring 2026 |

---

### 👥 Student Details

| | Student Name | Student Reg # | Student Degree |
|---|---|---|---|
| Student-1 | Umer Wali | 2023736 | BS Cyber Security |
---

## 1. Project Title

**Cybersecurity Incident Management System (CIMS)**

---

## 2. Project Overview

A **Cybersecurity Incident Management System (CIMS)** is a database-driven platform that enables organizations to efficiently track, manage, and resolve cybersecurity incidents. This project aims to design and implement a fully normalized relational database using **PostgreSQL** to support security analysts, SOC managers, administrators, and organizations in managing:

- Security incidents (Phishing, Ransomware, DDoS, Data Breach, etc.)
- Affected IT assets (Servers, Workstations, Firewalls, IoT devices)
- Known vulnerabilities (CVE tracking with CVSS scores)
- Analyst assignments and remediation actions
- Full incident lifecycle from detection to closure

---

## 3. Scope

### 3.1 In Scope
- Design and implementation of a **relational database** with 8 core entities
- Full **CRUD operations** for all entities
- **Role-based access control** (Analyst, Manager, Admin)
- **Advanced PostgreSQL features**: Triggers, Views, Stored Procedures, Indexes
- **Reporting & Analytics**: Incident summaries, vulnerability reports, analyst workload
- Frontend interface using **Java with WordPress / AI-Generated UI**
- Backend API using **Node.js (Express.js) / Django**
- Deployment on **AWS / Firebase**

### 3.2 Out of Scope
- Real-time threat intelligence feed integration
- Automated patch management
- Mobile application development

---

## 4. Stakeholders

| Stakeholder | Role | Responsibility |
|---|---|---|
| **Security Analysts** | Primary Users | Report, investigate, and resolve incidents |
| **SOC Managers** | Supervisors | Assign analysts, monitor dashboards, approve closures |
| **Administrators** | System Admins | Manage users, organizations, assets, and access control |
| **Organizations** | Clients | Own the assets and incidents being tracked |
| **Sir Said Nabi** | Instructor | Project evaluation and guidance |
| **Development Team** | Developers | Design, build, test, and deploy the system |

---

## 5. Functional Requirements

### 5.1 Organization Management
- Admin can register and manage organizations
- Each organization can have multiple analysts and assets
- Organization-level incident visibility

### 5.2 Analyst (User) Management
- Admin can create/edit/delete analysts with roles (Junior, Senior, Lead, Manager)
- Role-based access: Managers see all incidents, Juniors see assigned only
- Analysts can update their assigned incident statuses

### 5.3 Asset Management
- Register IT assets: Servers, Workstations, Routers, Firewalls, Databases, IoT
- Track hostname, IP address (PostgreSQL `INET` type), OS, location, criticality
- Link assets to organizations

### 5.4 Vulnerability Management
- Track vulnerabilities by CVE ID, description, severity, and CVSS score
- Link vulnerabilities to affected assets (Many-to-Many via `Asset_Vulnerabilities`)
- Track patch status per asset (patched / unpatched)

### 5.5 Incident Management
- Report incidents with type, severity, and description
- Track full lifecycle: Open → In Progress → Resolved → Closed
- Auto-timestamp resolution using PostgreSQL Triggers

### 5.6 Incident–Asset & Incident–Analyst Assignment
- Link multiple assets to one incident (M:M via `Incident_Assets`)
- Assign multiple analysts to one incident (M:M via `Incident_Analysts`)
- Track roles and timestamps for each assignment

### 5.7 Remediation Actions
- Log step-by-step remediation actions per incident
- Track analyst, date, action taken, and result (Successful / Partial / Failed / Pending)
- Full audit trail for post-incident review

### 5.8 Reports & Analytics
- Active incidents dashboard via PostgreSQL Views
- Reports: incidents by severity, unpatched vulnerabilities, analyst workload
- Export incident timelines and activity logs

---

## 6. Non-Functional Requirements

### 6.1 Security & Compliance
- Role-based access control (RBAC) at DB and application level
- Data encryption for sensitive fields
- SQL injection prevention and input validation
- GDPR compliance for incident data handling

### 6.2 Performance & Scalability
- Indexing on high-frequency query columns (status, severity, IP address)
- Cloud deployment with auto-scaling
- API rate limiting to prevent misuse

### 6.3 Usability & Accessibility
- Responsive UI using Java + WordPress / AI-Generated UI
- Intuitive dashboards for analysts and managers
- WCAG accessibility compliance

---

## 7. Database Design Overview (8 Core Entities)

| # | Entity | Description |
|---|---|---|
| 1 | `Organizations` | Companies/institutions using the CIMS |
| 2 | `Analysts` | Security personnel (Junior, Senior, Lead, Manager) |
| 3 | `Assets` | IT assets owned by organizations |
| 4 | `Vulnerabilities` | CVE-tracked security weaknesses |
| 5 | `Incidents` | Reported cybersecurity events |
| 6 | `Asset_Vulnerabilities` | M:M — which assets have which vulnerabilities |
| 7 | `Incident_Assets` | M:M — which assets are affected per incident |
| 8 | `Remediation_Actions` | Steps taken to resolve each incident |

---

## 8. Tech Stack

| Layer | Technology |
|---|---|
| **Database** | PostgreSQL |
| **DB Admin Tool** | pgAdmin |
| **Backend** | Node.js (Express.js) / Django (Python) |
| **Frontend** | Java with WordPress / AI-Generated UI |
| **Project Management** | JIRA |
| **Cloud Hosting** | AWS / Firebase |
| **Containerization** | Docker / Kubernetes |

---

## 9. Project Management (JIRA)

### 9.1 Epics
- Database Design
- Backend API Development
- Frontend UI Development
- Testing & Debugging
- Deployment & Maintenance

### 9.2 Sprint Plan

| Sprint | Tasks | Status |
|---|---|---|
| Sprint 1 | Project Proposal, Scope Definition, Stakeholder Identification | ✅ Completed |
| Sprint 2 | ER Diagram, Normalization, Schema Design | ⌛ Pending |
| Sprint 3 | SQL Scripts, CRUD Operations, Triggers, Views | ⌛ Pending |
| Sprint 4 | Backend API, Frontend Integration | ⌛ Pending |
| Sprint 5 | Testing, Deployment, Final Documentation | ⌛ Pending |

### 9.3 JIRA Workflow
**To-Do → In Progress → Code Review → Testing → Done**

---

## 10. Conclusion

The **Cybersecurity Incident Management System** will provide a structured, scalable, and secure database solution for real-world cybersecurity operations. Using **PostgreSQL** as the core DBMS with advanced features (Triggers, Views, Stored Procedures, Indexes), and a modern frontend built with **Java + WordPress / AI-Generated UI**, this project will demonstrate mastery of relational database design and implementation as required for CS-232 at GIK Institute.

---

> *Ghulam Ishaq Khan Institute | CS-232 — Database Management System | Sir Said Nabi | Spring 2026*
