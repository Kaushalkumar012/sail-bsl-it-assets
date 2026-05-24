# ⚡ SAIL BSL — IT Asset Management Dashboard

<div align="center">

<img src="https://www.uxdt.nic.in/wp-content/uploads/2020/06/Sail.jpg" width="120" alt="SAIL BSL"/>

**Centralized IT Infrastructure Tracking System**
*Bokaro Steel Plant — Steel Authority of India Limited*

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_Dashboard-2563eb?style=for-the-badge)](https://kaushalkumar012.github.io/sail-bsl-it-assets)
[![GitHub Stars](https://img.shields.io/github/stars/Kaushalkumar012/sail-bsl-it-assets?style=for-the-badge&color=f59e0b)](https://github.com/Kaushalkumar012/sail-bsl-it-assets/stargazers)
[![Made With](https://img.shields.io/badge/Made_With-Vanilla_JS-f7df1e?style=for-the-badge&logo=javascript)](https://github.com/Kaushalkumar012/sail-bsl-it-assets)
[![No Backend](https://img.shields.io/badge/Backend-None_Required-10b981?style=for-the-badge)](https://github.com/Kaushalkumar012/sail-bsl-it-assets)

</div>

---

## 🖥️ Preview

```
┌─────────────────────────────────────────────────────────┐
│  SAIL BSL  │  Overview  │  Assets  │  Departments  │ ... │
├────────────┼────────────────────────────────────────────┤
│            │   📊 KPI Cards  |  Charts  |  Tables       │
│  Sidebar   │                                            │
│  Nav       │   🔍 Search  |  Filter  |  Export CSV      │
│            │                                            │
│  👤 User   │   📋 Asset Details  |  Issue Tracker       │
└────────────┴────────────────────────────────────────────┘
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📊 **Overview Dashboard** | KPI cards, 5 interactive charts — dept distribution, PC make, RAM, OS, printers |
| 🖥️ **Asset Registry** | Full paginated table with search, dept & PC make filters, CSV export |
| 👥 **Employee Directory** | Staff listing with department and section filters |
| 🏢 **Department Grid** | Per-dept PC breakdown with progress bars, cross-dept detection |
| 📈 **Reports** | PC, Printer, UPS, Scanner, Domain, TRINETRA summaries + full dept chart |
| ⚠️ **Issues Tracker** | Auto-detects 8 types of data issues — missing serial, OS, RAM, hostname, MAC, domain, TRINETRA, monitor |
| 💼 **My Asset** | Personalized asset view per staff member |
| 🔐 **Role-Based Access** | 3 roles — Staff, Dept Head, HR Admin — each with scoped views |
| 📱 **Fully Responsive** | Works on desktop, tablet, and mobile |
| 🌙 **Dark Theme** | Sleek dark UI built for long working sessions |

---

## 🔐 Login Roles

```
┌──────────────┬─────────────────────┬──────────────────────────────┐
│ Role         │ Username            │ Password                     │
├──────────────┼─────────────────────┼──────────────────────────────┤
│ 👤 Staff     │ Your Staff Number   │ Your Staff Number (default)  │
│ 🏢 Dept Head │ Select Department   │ DEPTNAME@BSL (e.g. ACVS@BSL) │
│ 🛡️ HR Admin  │ HR-ADMIN            │ admin@BSL2024                │
└──────────────┴─────────────────────┴──────────────────────────────┘
```

---

## 🚀 Tech Stack

```
📁 Pure Static Site — Zero Dependencies, Zero Backend
├── HTML5          → Structure & layout
├── CSS3           → Dark theme, animations, responsive grid
├── Vanilla JS     → All logic, filtering, pagination, charts
├── Chart.js 4.4   → Interactive data visualizations
└── Font Awesome   → Icons throughout the UI
```

> **No Node.js. No React. No database. No server.**
> Just open `index.html` and it works. 🎯

---

## 📂 Project Structure

```
sail-bsl-it-assets/
│
├── 📄 index.html        → Login page with role-based auth
├── 📄 dashboard.html    → Main dashboard layout
├── 🎨 dashboard.css     → All styles (dark theme)
├── ⚙️  dashboard.js      → Dashboard logic & features
├── 🔑 login.js          → Authentication logic
└── 📦 data.js           → Asset & employee dataset
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
- HR can edit asset records inline
- Export filtered data as CSV

### 3️⃣ Employees
- Staff directory with P.No., Section, Location
- Search + Department filter
- Click to view full asset profile

### 4️⃣ Departments
- Card grid for every department
- PC make breakdown with % bars
- Printer / Scanner / UPS counts
- Cross-department asset detection
- Click card → jumps to filtered Assets view

### 5️⃣ Reports
- Summary tables for PC, Printer, UPS, Scanner, Domain, TRINETRA
- Full department asset count bar chart

### 6️⃣ Issues Tracker
- Auto-detects 8 issue types
- Color-coded severity (High / Medium / Low)
- Filter by issue type + department
- Export issues as CSV

### 7️⃣ My Asset
- Staff → sees their own PC, monitor, printer, scanner, UPS, network info
- Dept Head → sees department summary stats
- HR → full access to everything

---

## ⚙️ Setup & Deploy

### Run Locally
```bash
# Just open in browser — no install needed!
open index.html
```

### Deploy to GitHub Pages
```bash
git clone https://github.com/Kaushalkumar012/sail-bsl-it-assets.git
cd sail-bsl-it-assets
# Push your files, then enable GitHub Pages in repo Settings
```

### Deploy to Netlify
1. Go to [netlify.com](https://netlify.com)
2. Drag & drop the project folder
3. ✅ Live in 30 seconds

---

## 🛡️ Security Notes

- Role-based access with lockout after 5 failed attempts (30s cooldown)
- Session stored in `sessionStorage` — clears on tab close
- No data is sent to any server — everything runs client-side
- Recommended: Keep repo **private** if data is sensitive

---

## 📸 Issue Severity Legend

| Color | Severity | Issues |
|-------|----------|--------|
| 🔴 Red | High | Missing Serial No., Missing OS, Not on Domain |
| 🟡 Amber | Medium | Missing RAM, Missing Hostname, Missing MAC |
| ⚫ Grey | Low | TRINETRA Inactive, No Monitor |

---

## 👨‍💻 Built By

**Kaushal Kumar**
IT Department — SAIL Bokaro Steel Plant

---

<div align="center">

**© 2024 Steel Authority of India Limited — Bokaro Steel Plant**
*IT Department · Internal Use Only*

⭐ Star this repo if it helped you!

</div>
