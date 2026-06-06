#  Cybersecurity Incident Management System

### Semester Project — DBMS (Relational Databases using PostgreSQL)

---

##  Student Details

| | Student Name | Student Reg # | Student Degree |
|---|---|---|---|
| Student-1 | | | |
| Student-2 | | | |
| Student-3 | | | |
| Student-4 | | | |

---

## 1. Introduction

### 1.1 Project Overview
A **Cybersecurity Incident Management System (CIMS)** is a database-driven platform that enables organizations to track, manage, and resolve cybersecurity incidents efficiently. This project aims to design and implement a relational database using **PostgreSQL** to support security analysts, administrators, and organizations in managing incidents, vulnerabilities, affected assets, and remediation actions in real time.

### 1.2 Objectives
- To design a fully normalized relational database with **8 core entities** for cybersecurity operations.
- To implement role-based access control for Analysts, Managers, and Administrators.
- To track security incidents from detection to resolution with full audit trails.
- To integrate **JIRA** as a project management tool for agile development.
- To ensure data security, integrity, and scalability using PostgreSQL features.
- To develop a user-friendly frontend interface using **Java with WordPress / AI-generated UI**.

---

## 2. Roadmap (Project Lifecycle)

### 2.1 Phase 1: Planning & Requirements Gathering
- Define the scope of the Cybersecurity Incident Management System.
- Gather functional & non-functional requirements.
- Identify stakeholders (Security Analysts, SOC Managers, Admins, Organizations).
- Choose DBMS, frameworks, and tools.
- Set up **JIRA** for task tracking and sprint planning.

### 2.2 Phase 2: Database Design
- **ER Model Creation:** Identify 8 entities, their attributes, and relationships.
- **Normalization:** Apply 1NF, 2NF, 3NF to avoid redundancy and ensure efficient storage.
- **Schema Design:**
  - Tables: `Organizations`, `Analysts`, `Assets`, `Vulnerabilities`, `Asset_Vulnerabilities`, `Incidents`, `Incident_Assets`, `Incident_Analysts`, `Remediation_Actions`
  - Relationships: Organization → Assets/Analysts/Incidents, Incidents ↔ Assets (M:M), Incidents ↔ Analysts (M:M)
- **SQL Query Design:** CRUD operations, role-based queries, aggregate reports.

### 2.3 Phase 3: System Design & Development
- **Tech Stack:**
  -  **Database:** PostgreSQL
  -  **Backend:** Node.js (Express.js) / Django (Python)
  -  **Frontend:** Java with WordPress / AI-Generated UI
  -  **Project Management:** JIRA
  -  **Hosting:** AWS / Firebase
- Develop **Authentication & Authorization** (Analyst, Manager, Admin roles).
- Implement **Incident Management** (Create, Assign, Escalate, Resolve incidents).
- Implement **Asset & Vulnerability Tracking** (CVE tracking, patch status).
- Enable **Remediation Action Logging** (step-by-step fix tracking).
- Integrate **Dashboard & Reporting** (live incident stats, analyst workload).

### 2.4 Phase 4: Testing & Debugging
- Unit Testing (Backend & Frontend separately).
- Integration Testing (Database + Backend + Frontend).
- Security Testing (Role-based access, SQL injection prevention).
- Load Testing (Concurrent incident reporting & resolution).

### 2.5 Phase 5: Deployment & Maintenance
- Deploy on **AWS / Firebase**.
- Implement **Database Backup Strategies**.
- Conduct User Training & Documentation.
- Monitor and update the system for enhancements & bug fixes.

---

## 3. Functional Requirements

### 3.1 Organization Management
- Admin can register and manage organizations.
- Each organization can have multiple analysts and assets.
- Organization-level incident reporting and visibility.

### 3.2 Analyst (User) Management
- Admin can create/edit/delete analysts (Junior, Senior, Lead, Manager roles).
- Analysts can log in and manage their assigned incidents.
- Role-based access control: Managers see all, Juniors see assigned only.

### 3.3 Asset Management
- Register assets (Servers, Workstations, Routers, Firewalls, IoT devices).
- Track asset type, OS, IP address, location, and criticality.
- Link assets to organizations and incidents.

### 3.4 Vulnerability Management
- Track CVE IDs, severity scores (CVSS), and descriptions.
- Link vulnerabilities to affected assets.
- Track patch status (patched / unpatched) per asset.

### 3.5 Incident Management
- Report incidents with type (Phishing, Ransomware, DDoS, Data Breach, etc.).
- Assign severity levels (Low, Medium, High, Critical).
- Track incident lifecycle: Open → In Progress → Resolved → Closed.

### 3.6 Incident–Asset & Incident–Analyst Assignment
- Link multiple assets to a single incident (Many-to-Many).
- Assign multiple analysts to an incident with defined roles.
- Track assignment timestamps and analyst roles in each incident.

### 3.7 Remediation Actions
- Log step-by-step actions taken to resolve each incident.
- Track analyst responsible, action date, and result (Successful, Partial, Failed, Pending).
- Full audit trail for post-incident review.

### 3.8 Reports & Analytics
- Generate reports: open incidents by severity, unpatched vulnerabilities, analyst workload.
- View active incidents dashboard (via PostgreSQL Views).
- Export logs and incident timelines.

---

## 4. Non-Functional Requirements

### 4.1 Security & Compliance
- Role-based access control (RBAC) at database and application level.
- Data encryption for sensitive information (passwords, IP addresses).
- SQL injection prevention and input validation.
- GDPR & Data Privacy Compliance for incident data.

### 4.2 Performance & Scalability
- Database indexing on frequently queried columns (incident status, severity, asset IP).
- API rate limiting to prevent misuse.
- Cloud deployment for auto-scaling during high incident volumes.

### 4.3 Usability & Accessibility
- Responsive UI built with **Java + WordPress / AI-Generated UI**.
- User-friendly dashboards for analysts and managers.
- Accessibility compliance (WCAG guidelines).

---

## 5. Database Design (8 Core Entities)

### 5.1 Entity Overview

| # | Entity | Description |
|---|---|---|
| 1 | `Organizations` | Companies/institutions using the system |
| 2 | `Analysts` | Security personnel managing incidents |
| 3 | `Assets` | IT assets (servers, devices, firewalls, etc.) |
| 4 | `Vulnerabilities` | CVE-tracked security weaknesses |
| 5 | `Incidents` | Reported cybersecurity events |
| 6 | `Asset_Vulnerabilities` | Junction: which assets have which vulnerabilities |
| 7 | `Incident_Assets` | Junction: which assets are affected per incident |
| 8 | `Remediation_Actions` | Steps taken to resolve each incident |

### 5.2 ER Diagram Overview

```
Organizations
     │
     ├──── Assets ──────── Asset_Vulnerabilities ──── Vulnerabilities
     │         │
     │         └──────────────── Incident_Assets
     │                                  │
     ├──── Analysts                     │
     │         │               Incidents
     │         └──── Incident_Analysts ──┘
     │
     └──────────────────── Remediation_Actions
```

### 5.3 Key PostgreSQL Features Used
- `SERIAL` for auto-incrementing primary keys
- `INET` data type for IP address storage
- `CHECK` constraints for validated enums (severity, status, role)
- `FOREIGN KEY` with `ON DELETE CASCADE`
- **Triggers** for auto-timestamping resolved incidents
- **Views** for active incident dashboards
- **Stored Procedures** for analyst assignment automation
- **Indexes** for query optimization

---

## 6. Project Management (Using JIRA)

### 6.1 JIRA Setup
- **Epics:** Database Design, Backend API, Frontend UI, Testing, Deployment.
- **User Stories:**
  - *"As a security analyst, I can report a new incident and assign it to an asset."*
  - *"As a manager, I can view the active incidents dashboard."*
  - *"As an admin, I can register a new organization and its assets."*
  - *"As an analyst, I can log a remediation action for an assigned incident."*
  - *"As a manager, I can view all unpatched critical vulnerabilities."*
  - *"As an analyst, I can update the status of an incident I am assigned to."*
  - *"As an admin, I can generate a report of all incidents by severity."*
  - *"As a manager, I can assign analysts to an open incident."*
- **Task Assignments:** Assign tickets to developers, testers, and UI designers.
- **Sprints Planning:** Break down tasks into weekly iterations.

### 6.2 Workflow in JIRA
- **To-Do → In Progress → Code Review → Testing → Deployment**
- Daily Scrum Meetings for progress tracking.
- Bug Tracking & Fixes documented within JIRA.

---

## 7. Tools & Frameworks

### 7.1 Database Tools
- **PostgreSQL** (Primary Relational DBMS)
- **pgAdmin** (GUI for database management)

### 7.2 Backend Frameworks
- **Node.js (Express.js)** OR **Django (Python)**
- RESTful API Development

### 7.3 Frontend Frameworks
- **Java** with **WordPress / AI-Generated UI**
- Responsive dashboard for incident monitoring

### 7.4 Deployment & Monitoring
- **AWS / Firebase** (Cloud Hosting)
- **JIRA** (Project Management & Issue Tracking)
- **Docker / Kubernetes** (For containerization & scaling)

---

## 8. Conclusion

This DBMS-based Cybersecurity Incident Management System will provide a structured, scalable, and secure solution for organizations to track and resolve security threats. With **8 fully normalized entities**, PostgreSQL advanced features (triggers, views, stored procedures), and a modern frontend built with **Java + WordPress / AI-Generated UI**, this system mirrors real-world Security Operations Center (SOC) tools. Using **JIRA** for agile project management ensures a well-organized development lifecycle, from planning to deployment.

---

>  *Reference: See `Semester Project Example Template.txt` for the instructor-provided project template.*
