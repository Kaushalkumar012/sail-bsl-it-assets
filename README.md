# SAIL BSL IT Asset Management System

<div align="center">

Centralized IT infrastructure tracking for Bokaro Steel Plant.

<br />

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Firebase](https://img.shields.io/badge/Backend-Firebase-ffb300?style=for-the-badge&logo=firebase&logoColor=black)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)
![Status](https://img.shields.io/badge/Use-Internal-0f766e?style=for-the-badge)

<br />
<br />

<img src="https://skillicons.dev/icons?i=html,css,js,firebase" alt="Tech stack icons" />

</div>

---

## What This Project Does

This dashboard gives the SAIL BSL IT team one place to manage PCs, printers, scanners, UPS devices, employee mappings, and data-quality issues. It is built for daily operational work: quick search, department filtering, reporting, issue review, and controlled access based on user role.

## Why It Stands Out

- Built around real plant-level IT asset operations, not a generic template
- Covers 2000+ asset records in a clean dashboard workflow
- Includes role-based access for staff, department admins, and IT admins
- Detects incomplete or inconsistent records through an issue tracker
- Supports migration, reporting, and admin-side user creation

## Preview

### Login Experience

![Login screen](screenshots/login.png)

### Overview Dashboard

![Overview dashboard](screenshots/overview.png)

### Asset Registry

![Asset registry](screenshots/assets.png)

### Issues Tracker

![Issues tracker](screenshots/issues.png)

## Feature Highlights

### Secure Access

- Firebase Authentication based login flow
- Role-aware access for `Staff`, `Dept. Admin`, and `IT Admin`
- Controlled dashboard visibility based on permissions

### Smart Asset Management

- Centralized asset registry for tagged systems and peripherals
- Search, filtering, pagination, and CSV export
- Staff-wise and department-wise hardware mapping

### Visual Reporting

- KPI cards for operational overview
- Department and device distribution insights
- Quick summaries for RAM, OS, peripherals, and domain coverage

### Issue Detection

- Flags missing serial numbers, OS, RAM, hostname, MAC address, and monitor details
- Highlights domain and TRINETRA gaps
- Helps the IT team prioritize cleanup and follow-up

## Main Modules

| Module | Purpose |
| --- | --- |
| `index.html` | Login portal with role-based entry flow |
| `dashboard.html` | Main app shell for the asset dashboard |
| `dashboard.js` | Dashboard logic, rendering, filtering, reporting, and issue detection |
| `dashboard.css` | Full UI styling and responsive layout |
| `firebase.js` | Firebase initialization and helper methods |
| `migrate.html` | Data migration utility for pushing records to Firestore |
| `create-users.html` | User creation interface for admin workflows |
| `data.js` | Asset dataset used by the dashboard |

## Tools and Technologies

<div align="center">

| Frontend | Data and Auth | Visualization | Workflow |
| --- | --- | --- | --- |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" width="48" alt="HTML5" /><br><strong>HTML5</strong> | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg" width="48" alt="Firebase" /><br><strong>Firebase Auth</strong> | <img src="https://www.chartjs.org/img/chartjs-logo.svg" width="48" alt="Chart.js" /><br><strong>Chart.js</strong> | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" width="48" alt="GitHub" /><br><strong>GitHub</strong> |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg" width="48" alt="CSS3" /><br><strong>CSS3</strong> | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg" width="48" alt="Firestore" /><br><strong>Cloud Firestore</strong> | KPI cards, asset analytics, and summary dashboards | Repository, documentation, and deployment workflow |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" width="48" alt="JavaScript" /><br><strong>Vanilla JavaScript</strong> | Real-time storage and secure sign-in | Department, RAM, OS, and issue insights | Internal-use project delivery |

</div>

### Stack Summary

- `HTML5` powers the page structure and dashboard screens
- `CSS3` drives the dark UI, responsive layout, and visual polish
- `Vanilla JavaScript` handles filtering, rendering, exports, and app logic
- `Firebase Authentication` manages secure sign-in and role-based access
- `Cloud Firestore` stores user and asset data
- `Chart.js` supports interactive reporting and analytics views

## Project Structure

```text
sail-bsl-it-assets/
|-- index.html
|-- dashboard.html
|-- dashboard.css
|-- dashboard.js
|-- login.js
|-- firebase.js
|-- data.js
|-- migrate.html
|-- create-users.html
`-- screenshots/
```

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/Kaushalkumar012/sail-bsl-it-assets.git
cd sail-bsl-it-assets
```

### 2. Configure Firebase

Add your Firebase project configuration in `firebase.js` if you are running this with your own project.

### 3. Start a local server

Because this project uses ES modules, run it through a local server:

```bash
npx serve . -p 3000
```

Then open:

```text
http://localhost:3000
```

### 4. Migrate data

Open `migrate.html` in the browser and push the asset data into Firestore.

### 5. Create users

If you want to create user accounts through the admin tools:

```bash
cd admin-script
npm install
node create-users.js
```

## Security Notes

- Keep service account keys and admin credentials out of version control
- Restrict Firestore write access to authorized roles only
- Treat employee and asset data as internal operational information

## Author

**Kaushal Kumar**  

---

<div align="center">
Built for real-world IT asset visibility inside SAIL BSL.
</div>
