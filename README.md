# ⚡ SAIL BSL — IT Asset Management System

<div align="center">

<img src="https://www.uxdt.nic.in/wp-content/uploads/2020/06/Sail.jpg" width="100" alt="SAIL BSL"/>

**Centralized IT Infrastructure Tracking & Management**
*Bokaro Steel Plant — Steel Authority of India Limited*

[![Firebase](https://img.shields.io/badge/Backend-Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![JavaScript](https://img.shields.io/badge/Made_With-Vanilla_JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://github.com/Kaushalkumar012/sail-bsl-it-assets)
[![Auth](https://img.shields.io/badge/Auth-Firebase_Auth-FF6F00?style=for-the-badge&logo=firebase)](https://firebase.google.com/docs/auth)
[![License](https://img.shields.io/badge/License-Internal_Use-ef4444?style=for-the-badge)](https://github.com/Kaushalkumar012/sail-bsl-it-assets)

</div>

---

## 📸 Screenshots

### Login Page
![Login Page](https://raw.githubusercontent.com/Kaushalkumar012/sail-bsl-it-assets/main/screenshots/login.png)

### Overview Dashboard
![Dashboard Overview](https://raw.githubusercontent.com/Kaushalkumar012/sail-bsl-it-assets/main/screenshots/overview.png)

### Assets Table
![Assets Table](https://raw.githubusercontent.com/Kaushalkumar012/sail-bsl-it-assets/main/screenshots/assets.png)

### Issues Tracker
![Issues Tracker](https://raw.githubusercontent.com/Kaushalkumar012/sail-bsl-it-assets/main/screenshots/issues.png)

> 📌 Add screenshots to a `/screenshots` folder in the repo to display them here.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **Firebase Auth** | Secure login with role-based access — Staff, Dept. Admin, IT Admin |
| 🔥 **Firestore Database** | All 2030+ asset records stored and synced in real-time |
| 📊 **Overview Dashboard** | KPI cards + 5 interactive charts — dept, PC make, RAM, OS, printers |
| 🖥️ **Asset Registry** | Paginated table with search, dept & PC make filters, CSV export |
| 👥 **Employee Directory** | Staff listing with department and section filters |
| 🏢 **Department Grid** | Per-dept PC breakdown with progress bars, cross-dept detection |
| 📈 **Reports** | PC, Printer, UPS, Scanner, Domain, TRINETRA summaries + full dept chart |
| ⚠️ **Issues Tracker** | Auto-detects 8 issue types with severity levels — clean card + table UI |
| 💼 **My Asset** | Personalized asset view per staff member |
| 📱 **Fully Responsive** | Works on desktop, tablet, and mobile |
| 🌙 **Dark Theme** | Sleek dark UI built for long working sessions |

---

## 🔐 Role-Based Access

| Role | Login Tab | Who | Access |
|------|-----------|-----|--------|
| 👤 **Staff** | Staff | All employees | Own asset only |
| 🏢 **Dept. Admin** | Dept. Admin | HR & dept managers | Own department only |
| 🛡️ **IT Admin** | IT Admin | C&IT department | All departments — full access |

**Login format:**
- Staff No: your employee number (e.g. `779986`)
- Password: `SAIL@[StaffNo]` (e.g. `SAIL@779986`)

---

## 🚀 Tech Stack

```
📁 Frontend — Pure Static Site
├── HTML5          → Structure & layout
├── CSS3           → Dark theme, animations, responsive grid
├── Vanilla JS     → All logic, filtering, pagination, charts
├── Chart.js 4.4   → Interactive data visualizations
└── Font Awesome   → Icons throughout the UI

☁️ Backend — Firebase
├── Firebase Auth      → Secure email/password authentication
├── Cloud Firestore    → Real-time NoSQL database (2030+ records)
└── Role Management    → Admin SDK for bulk user creation & role assignment
```

---

## 📂 Project Structure

```
sail-bsl-it-assets/
│
├── 📄 index.html        → Login page with role selector
├── 📄 dashboard.html    → Main dashboard layout
├── 🎨 dashboard.css     → All styles (dark theme)
├── ⚙️  dashboard.js      → Dashboard logic & all features
├── 🔑 login.js          → Firebase authentication logic
├── 🔥 firebase.js       → Firebase config & helpers
└── 📦 data.js           → Local asset dataset (2030 records)
```

---

## 📊 Dashboard Pages

### 1️⃣ Overview
- 6 KPI cards — Total Assets, Departments, Printers, Scanners, UPS, Domain
- Bar chart — Top 15 departments by asset count
- Doughnut — PC make distribution
- Bar chart — RAM distribution
- Pie chart — OS distribution
- Doughnut — Printer brands

### 2️⃣ Assets Table
- Search across all fields
- Filter by Department & PC Make
- Paginated (20 per page)
- View full details in modal
- IT Admin can edit asset records inline → saves to Firestore
- Export filtered data as CSV

### 3️⃣ Employees
- Staff directory with Section, Location
- Search + Department filter
- Click to view full asset profile

### 4️⃣ Departments
- Card grid for every department
- PC make breakdown with % progress bars
- Printer / Scanner / UPS counts
- Cross-department asset detection
- Click card → jumps to filtered Assets view

### 5️⃣ Reports
- Summary tables for PC, Printer, UPS, Scanner, Domain, TRINETRA
- Full department asset count bar chart

### 6️⃣ Issues Tracker
- Auto-detects 8 issue types
- Color-coded severity (High / Medium / Low)
- Clickable summary cards filter the table
- Filter by issue type + department
- Export issues as CSV

### 7️⃣ My Asset
- **Staff** → sees their own PC, monitor, printer, scanner, UPS, network info
- **Dept. Admin** → sees department summary stats
- **IT Admin** → full access to all records

---

## ⚠️ Issue Severity Legend

| Color | Severity | Issues |
|-------|----------|--------|
| 🔴 High | Critical | Missing Serial No., Missing OS, Not on Domain |
| 🟡 Medium | Warning | Missing RAM, Missing Hostname, Missing MAC Address |
| ⚫ Low | Info | TRINETRA Inactive, No Monitor |

---

## 🛠️ Setup & Deployment

### Prerequisites
- [Node.js](https://nodejs.org) (for admin scripts)
- Firebase project with Firestore + Authentication enabled

### 1. Clone the repo
```bash
git clone https://github.com/Kaushalkumar012/sail-bsl-it-assets.git
cd sail-bsl-it-assets
```

### 2. Configure Firebase
Update `firebase.js` with your Firebase project config:
```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  ...
};
```

### 3. Run locally (required — ES modules don't work via file://)
```bash
npx serve . -p 3000
```
Then open: **http://localhost:3000**

### 4. Migrate data to Firestore
- Open `migrate.html` in browser
- Click **Start Migration** to upload all records

### 5. Create user accounts
```bash
cd admin-script
npm install
node create-users.js
```

---

## 🔒 Security Notes

- All data protected by Firebase Auth — unauthenticated users cannot access Firestore
- Role validation on both login page and dashboard
- Session stored in `sessionStorage` — clears on tab close
- Firestore rules enforce `request.auth != null` for all reads/writes
- ⚠️ Keep `serviceAccountKey.json` and `credentials.txt` out of version control

---

## 👨‍💻 Built By

**Kaushal Kumar**
IT Department — SAIL Bokaro Steel Plant

---

<div align="center">

**© 2025 Steel Authority of India Limited — Bokaro Steel Plant**
*IT Department · Internal Use Only · Confidential*

⭐ Star this repo if it helped you!

</div>
