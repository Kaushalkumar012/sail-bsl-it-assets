// ===== INIT =====
import { onAuth, logoutUser, db } from './firebase.js';
import { collection, getDocs, updateDoc, doc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const user = JSON.parse(sessionStorage.getItem('sail_user') || 'null');
if (!user) window.location.href = 'index.html';

const PAGE_SIZE = 20;
let assetPage = 1, empPage = 1;
let filteredAssets = [], filteredEmps = [];
let charts = {};
let EMPLOYEES = [];

// ===== SETUP =====
window.onload = async () => {
  await loadEmployees();
  setupUser();
  setupNav();
  populateDeptFilters();
  renderKPIs();
  renderCharts();
  showPage('overview', document.querySelector('.nav-item.active'));
};

async function loadEmployees() {
  const snap = await getDocs(collection(db, 'employees'));
  EMPLOYEES = snap.docs.map(d => ({ _id: d.id, ...d.data() }));
  // mark duplicate serial numbers
  const serialCount = {};
  EMPLOYEES.forEach(e => { if (e['PC Sl. No.']) serialCount[e['PC Sl. No.']] = (serialCount[e['PC Sl. No.']] || 0) + 1; });
  EMPLOYEES.forEach(e => { e['_dupSerial'] = !!(e['PC Sl. No.'] && serialCount[e['PC Sl. No.']] > 1); });
}

function setupUser() {
  const initials = user.name ? user.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() : 'U';
  document.getElementById('sb-uname').textContent = user.name || 'User';
  document.getElementById('sb-urole').textContent = roleLabel(user.role);
  document.getElementById('tb-uname').textContent = user.name?.split(' ')[0] || 'User';
  document.getElementById('tb-urole').textContent = roleLabel(user.role);
  document.getElementById('sb-avatar').textContent = initials;
  document.getElementById('tb-avatar').textContent = initials;
  document.getElementById('wc-title').textContent = `Welcome, ${user.name?.split(' ')[0] || 'User'}!`;
  document.getElementById('wc-sub').textContent = `Role: ${roleLabel(user.role)} | ${new Date().toDateString()}`;

  if (user.role === 'staff') {
    ['nav-employees','nav-departments','nav-assets','nav-reports'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }
  if (user.role === 'hr') {
    ['asset-dept-filter','emp-dept-filter','issue-dept-filter'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }
}

function roleLabel(r) {
  return r === 'admin' ? 'IT Admin' : r === 'hr' ? 'Dept. Admin' : 'Staff';
}

function setupNav() {
  if (user.role === 'staff') {
    showPage('overview', document.querySelector('[data-page="overview"]'));
  }
}

// ===== NAVIGATION =====
function showPage(name, el) {
  // Block staff from accessing restricted pages
  if (user.role === 'staff' && ['assets','employees','departments','reports'].includes(name)) {
    name = 'myasset';
    el = document.querySelector('[data-page="myasset"]');
  }
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  if (el) el.classList.add('active');
  document.getElementById('page-title').textContent = el?.querySelector('span')?.textContent || name;

  if (name === 'overview') {
    if (user.role === 'staff') renderStaffOverview();
    else renderCharts();
  }
  if (name === 'assets') renderAssetsTable();
  if (name === 'employees') renderEmployeesTable();
  if (name === 'departments') renderDeptGrid();
  if (name === 'reports') renderReports();
  if (name === 'issues') renderIssues();
  if (name === 'myasset') renderMyAsset();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

async function logout() {
  await logoutUser();
  sessionStorage.clear();
  window.location.href = 'index.html';
}

// ===== DEPT FILTERS =====
function populateDeptFilters() {
  const depts = [...new Set(EMPLOYEES.map(e => e['Deptt.']).filter(Boolean))].sort();
  ['asset-dept-filter', 'emp-dept-filter', 'issue-dept-filter'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    depts.forEach(d => {
      const o = document.createElement('option');
      o.value = d; o.textContent = d;
      sel.appendChild(o);
    });
  });
}

// ===== STAFF OVERVIEW =====
function renderStaffOverview() {
  const emp = EMPLOYEES.find(e => cleanNum(e['Staff No.']) === user.staffNo);

  // KPIs — personal asset status
  const kpis = [
    { icon: 'fa-desktop',       color: 'blue',   num: emp?.['PC Make']       || '—', label: 'PC Make' },
    { icon: 'fa-microchip',     color: 'green',  num: emp?.['RAM'] ? emp['RAM']+'GB' : '—', label: 'RAM' },
    { icon: 'fa-windows',       color: 'purple', num: emp?.['OS']  ? 'Win '+emp['OS'] : '—', label: 'OS' },
    { icon: 'fa-print',         color: 'amber',  num: emp?.['Printer Make']  || '—', label: 'Printer' },
    { icon: 'fa-bolt',          color: 'cyan',   num: emp?.['UPS MAKE']      || '—', label: 'UPS' },
    { icon: 'fa-network-wired', color: emp?.['DOMAIN']==='YES'?'green':'red',
                                                  num: emp?.['DOMAIN']        || '—', label: 'Domain' },
  ];
  document.getElementById('kpi-grid').innerHTML = kpis.map(k => `
    <div class="kpi-card">
      <div class="kpi-icon ${k.color}"><i class="fas ${k.icon}"></i></div>
      <div><div class="kpi-num" style="font-size:18px;word-break:break-all">${k.num}</div><div class="kpi-label">${k.label}</div></div>
    </div>`).join('');

  if (!emp) return;

  // Replace charts area with full asset detail table
  const chartsArea = document.querySelector('#page-overview .charts-row');
  const chartsRow2 = document.querySelector('#page-overview .charts-row.three');
  if (chartsRow2) chartsRow2.style.display = 'none';

  const fields = [
    ['Tag No.',        emp['TAGGING NO.']],
    ['Staff No.',      cleanNum(emp['Staff No.'])],
    ['Department',     emp['Deptt.']],
    ['Section',        emp['Section']],
    ['Location',       emp['Location']],
    ['LOT ID',         emp['LOT ID']],
    ['PC Make',        emp['PC Make']],
    ['PC Model',       emp['PC Model']],
    ['PC Serial No.',  emp['PC Sl. No.']],
    ['Monitor Make',   emp['Monitor Make']],
    ['Monitor Model',  emp['Monitor Model']],
    ['Monitor Serial', emp['Monitor Sl. No.']],
    ['MFD Make',       emp['MFD MAKE']],
    ['MFD Model',      emp['MFD MODEL']],
    ['MFD Serial',     emp['MFD SL. NO.']],
    ['Printer Make',   emp['Printer Make']],
    ['Printer Model',  emp['Printer Model']],
    ['Printer Serial', emp['Printer Sl. No.']],
    ['Scanner Make',   emp['Scanner Make']],
    ['Scanner Model',  emp['Scanner Model']],
    ['Scanner Serial', emp['Scanner Sl.No.']],
    ['UPS Make',       emp['UPS MAKE']],
    ['UPS Model',      emp['UPS MODEL']],
    ['Hostname',       emp['HOST NAME']],
    ['MAC Address',    emp['MAC ADDRESS']],
    ['OS',             emp['OS'] ? 'Windows ' + emp['OS'] : ''],
    ['RAM',            emp['RAM'] ? emp['RAM'] + ' GB' : ''],
    ['Domain',         emp['DOMAIN']],
    ['TRINETRA',       emp['TRINETRA']],
    ['Oracle Status',  emp['ORCL_ROLL_STAT'] === 'Y' ? 'Active' : 'Inactive'],
  ].filter(([,v]) => v);

  if (chartsArea) chartsArea.innerHTML = `
    <div class="chart-card span2" style="grid-column:1/-1">
      <div class="chart-hdr"><h3><i class="fas fa-table-list"></i> Your Complete Asset Details</h3></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:0">
        ${fields.map(([k,v], i) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-bottom:1px solid var(--border);${i%2===0?'background:rgba(255,255,255,0.02)':''}">
            <span style="font-size:12px;color:var(--muted);font-weight:500">${k}</span>
            <span style="font-size:12px;font-weight:700;color:var(--text);text-align:right;max-width:55%;word-break:break-all">${v}</span>
          </div>`).join('')}
      </div>
    </div>`;
}


function scopedData() {
  if (user.role === 'admin') return EMPLOYEES;
  if (user.role === 'hr')    return EMPLOYEES.filter(e => e['Deptt.'] === user.dept);
  return EMPLOYEES.filter(e => cleanNum(e['Staff No.']) === user.staffNo);
}

// ===== KPIs =====
function renderKPIs() {
  const src = scopedData();
  const total = src.length;
  const distributed = src.filter(e => e['PC Make']).length;
  const withIssues  = src.filter(e => getIssuesFor(e).length > 0).length;
  const withPrinter = src.filter(e => e['Printer Make']).length;
  const withScanner = src.filter(e => e['Scanner Make']).length;
  const onDomain    = src.filter(e => e['DOMAIN'] === 'YES').length;
  const dupSerials  = src.filter(e => e['_dupSerial']).length;

  const issuePct = total ? Math.round(withIssues / total * 100) : 0;
  const distPct  = total ? Math.round(distributed / total * 100) : 0;

  const kpis = [
    { icon: 'fa-desktop',              color: 'blue',   num: total,       label: 'Total Assets',       sub: null },
    { icon: 'fa-circle-check',         color: 'green',  num: distributed, label: 'PC Distributed',     sub: `${distPct}% assigned` },
    { icon: 'fa-building',             color: 'purple', num: new Set(src.map(e=>e['Deptt.']).filter(Boolean)).size, label: 'Departments', sub: null },
    { icon: 'fa-triangle-exclamation', color: 'amber',  num: withIssues,  label: 'Assets w/ Issues',   sub: `${issuePct}% of total`, click: "showPage('issues',document.querySelector('[data-page=\"issues\"]'))" },
    { icon: 'fa-clone',                color: 'red',    num: dupSerials,  label: 'Duplicate Serials',  sub: 'same serial no.', click: "filterIssuesByKey('dup_serial')" },
    { icon: 'fa-print',                color: 'cyan',   num: withPrinter, label: 'With Printer',       sub: null },
    { icon: 'fa-barcode',              color: 'purple', num: withScanner, label: 'With Scanner',       sub: null },
    { icon: 'fa-network-wired',        color: 'green',  num: onDomain,    label: 'On Domain',          sub: null },
  ];

  document.getElementById('kpi-grid').innerHTML = kpis.map(k => `
    <div class="kpi-card" ${k.click ? `onclick="${k.click}" style="cursor:pointer"` : ''}>
      <div class="kpi-icon ${k.color}"><i class="fas ${k.icon}"></i></div>
      <div>
        <div class="kpi-num">${k.num}</div>
        <div class="kpi-label">${k.label}</div>
        ${k.sub ? `<div style="font-size:10px;color:var(--muted);margin-top:2px">${k.sub}</div>` : ''}
      </div>
    </div>`).join('');

  // update nav badge
  const badge = document.getElementById('issues-badge');
  if (badge) {
    badge.textContent = withIssues;
    badge.style.display = withIssues > 0 ? 'inline-flex' : 'none';
  }
}

// ===== CHARTS =====
function renderCharts() {
  const src = scopedData();

  // Dept chart
  const deptCount = {};
  src.forEach(e => { if (e['Deptt.']) deptCount[e['Deptt.']] = (deptCount[e['Deptt.']] || 0) + 1; });
  const top15 = Object.entries(deptCount).sort((a,b) => b[1]-a[1]).slice(0,15);
  makeChartWithLabels('deptChart', 'bar', top15.map(d=>d[0]), top15.map(d=>d[1]), 'rgba(26,86,219,0.8)');

  // PC Model Distribution
  const pcModelCount = {};
  src.forEach(e => { if (e['PC Model']) pcModelCount[e['PC Model']] = (pcModelCount[e['PC Model']] || 0) + 1; });
  const pcEntries = Object.entries(pcModelCount).sort((a,b)=>b[1]-a[1]).slice(0,8);
  makeChart('pcMakeChart', 'doughnut', pcEntries.map(d => `${d[0]} (${d[1]})`), pcEntries.map(d=>d[1]),
    ['#1a56db','#10b981','#f59e0b','#ef4444','#7c3aed','#06b6d4','#f97316','#84cc16']);

  // RAM
  const ramCount = {};
  src.forEach(e => { if (e['RAM']) { const r = e['RAM']+'GB'; ramCount[r] = (ramCount[r]||0)+1; }});
  const ramE = Object.entries(ramCount).sort((a,b)=>parseFloat(a[0])-parseFloat(b[0]));
  makeChartWithLabels('ramChart', 'bar', ramE.map(d=>d[0]), ramE.map(d=>d[1]), 'rgba(16,185,129,0.8)');

  // OS
  const osCount = {};
  src.forEach(e => { if (e['OS']) { const o = 'Win '+e['OS']; osCount[o]=(osCount[o]||0)+1; }});
  const osE = Object.entries(osCount);
  makeChart('osChart', 'pie', osE.map(d=>d[0]), osE.map(d=>d[1]),
    ['#1a56db','#10b981','#f59e0b','#ef4444','#7c3aed']);

  // Printer
  const prCount = {};
  src.forEach(e => { if (e['Printer Make']) prCount[e['Printer Make']]=(prCount[e['Printer Make']]||0)+1; });
  const prE = Object.entries(prCount).sort((a,b)=>b[1]-a[1]);
  makeChart('printerChart', 'doughnut', prE.map(d=>d[0]), prE.map(d=>d[1]),
    ['#f59e0b','#1a56db','#10b981','#ef4444','#7c3aed','#06b6d4']);
}

function makeChartWithLabels(id, type, labels, data, color) {
  if (charts[id]) charts[id].destroy();
  const ctx = document.getElementById(id)?.getContext('2d');
  if (!ctx) return;
  charts[id] = new Chart(ctx, {
    type,
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: Array.isArray(color) ? color : data.map(() => color),
        borderColor: 'transparent',
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        datalabels: { display: false }
      },
      scales: {
        x: { ticks: { color: '#94a3b8', font: { size: 10 }, maxRotation: 45 }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
      },
      animation: { onComplete: function() {
        const chart = this;
        const ctx2 = chart.ctx;
        ctx2.save();
        ctx2.font = 'bold 11px Inter, sans-serif';
        ctx2.fillStyle = '#f8fafc';
        ctx2.textAlign = 'center';
        chart.data.datasets.forEach((dataset, i) => {
          chart.getDatasetMeta(i).data.forEach((bar, j) => {
            const val = dataset.data[j];
            ctx2.fillText(val, bar.x, bar.y - 5);
          });
        });
        ctx2.restore();
      }}
    }
  });
}

function makeChart(id, type, labels, data, color) {
  if (charts[id]) charts[id].destroy();
  const ctx = document.getElementById(id)?.getContext('2d');
  if (!ctx) return;
  charts[id] = new Chart(ctx, {
    type,
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: Array.isArray(color) ? color : data.map(() => color),
        borderColor: 'transparent',
        borderRadius: type === 'bar' ? 6 : 0,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: type !== 'bar', labels: { color: '#94a3b8', font: { size: 11 } } } },
      scales: type === 'bar' ? {
        x: { ticks: { color: '#94a3b8', font: { size: 10 }, maxRotation: 45 }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
      } : {}
    }
  });
}

// ===== ASSETS TABLE =====
function filterAssets(val) {
  const search = (val ?? document.getElementById('asset-search').value).toLowerCase();
  const dept = document.getElementById('asset-dept-filter').value;
  const pc = document.getElementById('asset-pc-filter').value;

  let src = EMPLOYEES;
  if (user.role === 'hr')    src = EMPLOYEES.filter(e => e['Deptt.'] === user.dept);
  if (user.role === 'staff') src = EMPLOYEES.filter(e => cleanNum(e['Staff No.']) === user.staffNo);

  filteredAssets = src.filter(e => {
    const matchSearch = !search || Object.values(e).some(v => String(v).toLowerCase().includes(search));
    const matchDept = (user.role === 'hr' || user.role === 'staff') || !dept || e['Deptt.'] === dept;
    const matchPc = !pc || e['PC Make'] === pc;
    return matchSearch && matchDept && matchPc;
  });
  assetPage = 1;
  renderAssetsTable();
}

function renderAssetsTable() {
  if (!filteredAssets.length) filterAssets('');
  const start = (assetPage - 1) * PAGE_SIZE;
  const rows = filteredAssets.slice(start, start + PAGE_SIZE);
  document.getElementById('asset-count').textContent = `${filteredAssets.length} records`;
  document.getElementById('assets-tbody').innerHTML = rows.map(e => `
    <tr>
      <td>${e['TAGGING NO.'] || '-'}</td>
      <td>${cleanNum(e['Staff No.'])}</td>
      <td>${e['Name'] || '-'}</td>
      <td><span class="badge badge-dept">${e['Deptt.'] || '-'}</span></td>
      <td>${e['Location'] || '-'}</td>
      <td>${e['PC Make'] || '-'}</td>
      <td>${e['PC Model'] || '-'}</td>
      <td class="muted">${e['PC Sl. No.'] || '-'}</td>
      <td>${e['Monitor Make'] ? e['Monitor Make']+' '+e['Monitor Model'] : '-'}</td>
      <td>${e['Printer Make'] ? e['Printer Make']+' '+e['Printer Model'] : '-'}</td>
      <td>${e['OS'] ? 'Win '+e['OS'] : '-'}</td>
      <td>${e['RAM'] ? e['RAM']+'GB' : '-'}</td>
      <td><span class="badge ${e['DOMAIN']==='YES'?'badge-yes':'badge-no'}">${e['DOMAIN']||'N/A'}</span></td>
      <td>
        <button class="btn-view" onclick="openModal(${EMPLOYEES.indexOf(e)})">View</button>
        ${user.role==='hr'?`<button class="btn-edit" onclick="openEdit(${EMPLOYEES.indexOf(e)})">Edit</button>`:''}
      </td>
    </tr>`).join('');
  renderPagination('asset-pagination', filteredAssets.length, assetPage, p => { assetPage = p; renderAssetsTable(); });
}


// ===== EMPLOYEES TABLE =====
function filterEmployees(val) {
  const search = (val ?? document.getElementById('emp-search').value).toLowerCase();
  const dept = document.getElementById('emp-dept-filter').value;

  let src = user.role === 'hr' ? EMPLOYEES.filter(e => e['Deptt.'] === user.dept) : EMPLOYEES;
  filteredEmps = src.filter(e => {
    const matchSearch = !search || [e['Name'],e['Staff No.'],e['Deptt.'],e['Section']].some(v => String(v||'').toLowerCase().includes(search));
    const matchDept = user.role === 'dept_head' || !dept || e['Deptt.'] === dept;
    return matchSearch && matchDept;
  });
  empPage = 1;
  renderEmployeesTable();
}

function renderEmployeesTable() {
  if (!filteredEmps.length) filterEmployees('');
  const start = (empPage - 1) * PAGE_SIZE;
  const rows = filteredEmps.slice(start, start + PAGE_SIZE);
  document.getElementById('emp-count').textContent = `${filteredEmps.length} records`;
  document.getElementById('emp-tbody').innerHTML = rows.map(e => `
    <tr>
      <td>${e['TAGGING NO.'] || '-'}</td>
      <td>${cleanNum(e['Staff No.'])}</td>
      <td>${e['Name'] || '-'}</td>
      <td><span class="badge badge-dept">${e['Deptt.'] || '-'}</span></td>
      <td class="muted">${e['Section'] || '-'}</td>
      <td>${e['Location'] || '-'}</td>
      <td><button class="btn-view" onclick="openModal(${EMPLOYEES.indexOf(e)})">View</button></td>
    </tr>`).join('');
  renderPagination('emp-pagination', filteredEmps.length, empPage, p => { empPage = p; renderEmployeesTable(); });
}

// ===== DEPT GRID =====
function renderDeptGrid() {
  const src = scopedData();
  const deptMap = {};
  src.forEach(e => {
    const d = e['Deptt.']; if (!d) return;
    if (!deptMap[d]) deptMap[d] = { count: 0, tagged: 0, untagged: 0, makes: {}, printers: 0, scanners: 0, ups: 0, crossDept: 0 };
    deptMap[d].count++;
    if (e['TAGGING NO.'] && String(e['TAGGING NO.']).trim()) deptMap[d].tagged++;
    else deptMap[d].untagged++;
    const pc = e['PC Make'] || '';
    if (pc) deptMap[d].makes[pc] = (deptMap[d].makes[pc] || 0) + 1;
    if (e['Printer Make']) deptMap[d].printers++;
    if (e['Scanner Make']) deptMap[d].scanners++;
    if (e['UPS MAKE']) deptMap[d].ups++;
    const loc = (e['Location'] || '').trim().toUpperCase();
    const dep = d.trim().toUpperCase();
    if (loc && loc !== dep && !loc.includes(dep) && !dep.includes(loc)) deptMap[d].crossDept++;
  });

  const MAKE_COLORS = ['#1a56db','#10b981','#f59e0b','#7c3aed','#ef4444','#06b6d4','#f97316','#84cc16'];

  document.getElementById('dept-grid').innerHTML = Object.entries(deptMap)
    .sort((a,b) => b[1].count - a[1].count)
    .map(([name, s]) => {
      const makes = Object.entries(s.makes).sort((a,b)=>b[1]-a[1]);
      const bars = makes.map((m, i) => `
        <div style="margin-bottom:6px">
          <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px">
            <span style="color:var(--muted)">${m[0]}</span>
            <span style="color:var(--text);font-weight:700">${m[1]} <span style="color:var(--muted);font-weight:400">(${Math.round(m[1]/s.count*100)}%)</span></span>
          </div>
          <div style="height:5px;background:rgba(255,255,255,0.07);border-radius:3px;overflow:hidden">
            <div style="height:100%;width:${Math.round(m[1]/s.count*100)}%;background:${MAKE_COLORS[i%MAKE_COLORS.length]};border-radius:3px;transition:width 0.6s"></div>
          </div>
        </div>`).join('');

      const tagPct = s.count ? Math.round(s.tagged / s.count * 100) : 0;

      return `
    <div class="dept-card" onclick="openDeptModal('${name.replace(/'/g,"\\'")}')"
         style="cursor:pointer">
      <div class="dc-header">
        <div class="dc-name">${name}</div>
        <div class="dc-count">${s.count}</div>
      </div>
      <div style="margin:10px 0 6px">
        <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px">
          <span style="color:#10b981"><i class="fas fa-tag"></i> Tagged: ${s.tagged}</span>
          <span style="color:#ef4444"><i class="fas fa-tag-slash"></i> Untagged: ${s.untagged}</span>
        </div>
        <div style="height:6px;background:rgba(255,255,255,0.07);border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${tagPct}%;background:linear-gradient(90deg,#10b981,#059669);border-radius:3px;transition:width 0.6s"></div>
        </div>
      </div>
      <div style="margin:8px 0 10px">${bars}</div>
      <div class="dc-stats">
        <div class="dc-stat"><div class="dc-stat-label">Printers</div><div class="dc-stat-val">${s.printers}</div></div>
        <div class="dc-stat"><div class="dc-stat-label">Scanners</div><div class="dc-stat-val">${s.scanners}</div></div>
        <div class="dc-stat"><div class="dc-stat-label">UPS</div><div class="dc-stat-val">${s.ups}</div></div>
        <div class="dc-stat" style="${s.crossDept>0?'background:rgba(245,158,11,0.1);border-radius:8px':''}"><div class="dc-stat-label">Cross-Dept</div><div class="dc-stat-val" style="color:${s.crossDept>0?'#fbbf24':'var(--text)'}">${s.crossDept}</div></div>
      </div>
    </div>`;
    }).join('');
}

function openDeptModal(deptName) {
  const src = scopedData().filter(e => e['Deptt.'] === deptName);
  const tagged   = src.filter(e => e['TAGGING NO.'] && String(e['TAGGING NO.']).trim());
  const untagged = src.filter(e => !e['TAGGING NO.'] || !String(e['TAGGING NO.']).trim());

  const tagRow = (e, isTagged) => `
    <tr>
      <td>${isTagged ? `<span style="color:#10b981;font-weight:700">${e['TAGGING NO.']}</span>` : '<span style="color:#ef4444">—</span>'}</td>
      <td>${cleanNum(e['Staff No.'])}</td>
      <td>${e['Name'] || '-'}</td>
      <td class="muted">${e['Section'] || '-'}</td>
      <td>${e['PC Make'] ? e['PC Make']+' '+e['PC Model'] : '<span style="color:var(--muted)">—</span>'}</td>
      <td><button class="btn-view" onclick="closeModal();openModal(${EMPLOYEES.indexOf(e)})">View</button></td>
    </tr>`;

  document.getElementById('modal-title').innerHTML =
    `<i class="fas fa-building" style="color:var(--blue);margin-right:8px"></i>${deptName}
     <span style="font-size:13px;color:var(--muted);font-weight:400;margin-left:8px">${src.length} total</span>`;

  document.getElementById('modal-body').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:14px;text-align:center">
        <div style="font-size:28px;font-weight:900;color:#10b981">${tagged.length}</div>
        <div style="font-size:12px;color:#34d399;font-weight:600;margin-top:4px"><i class="fas fa-tag"></i> Tagged</div>
      </div>
      <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:14px;text-align:center">
        <div style="font-size:28px;font-weight:900;color:#ef4444">${untagged.length}</div>
        <div style="font-size:12px;color:#f87171;font-weight:600;margin-top:4px"><i class="fas fa-tag"></i> Untagged</div>
      </div>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:12px">
      <button onclick="switchDeptTab('tagged')" id="tab-tagged"
        style="flex:1;padding:8px;border-radius:8px;border:1.5px solid #10b981;background:rgba(16,185,129,0.15);color:#10b981;font-weight:700;cursor:pointer;font-size:13px">
        <i class="fas fa-tag"></i> Tagged (${tagged.length})
      </button>
      <button onclick="switchDeptTab('untagged')" id="tab-untagged"
        style="flex:1;padding:8px;border-radius:8px;border:1.5px solid var(--border);background:transparent;color:var(--muted);font-weight:600;cursor:pointer;font-size:13px">
        <i class="fas fa-tag"></i> Untagged (${untagged.length})
      </button>
    </div>

    <div id="dept-tab-content">
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="border-bottom:1px solid var(--border)">
              <th style="padding:8px;color:var(--muted);text-align:left;font-weight:600">Tag No.</th>
              <th style="padding:8px;color:var(--muted);text-align:left;font-weight:600">Staff No.</th>
              <th style="padding:8px;color:var(--muted);text-align:left;font-weight:600">Name</th>
              <th style="padding:8px;color:var(--muted);text-align:left;font-weight:600">Section</th>
              <th style="padding:8px;color:var(--muted);text-align:left;font-weight:600">PC</th>
              <th style="padding:8px;color:var(--muted);text-align:left;font-weight:600"></th>
            </tr>
          </thead>
          <tbody id="dept-modal-tbody">
            ${tagged.map(e => tagRow(e, true)).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

  // store for tab switching
  window._deptModalTagged   = tagged;
  window._deptModalUntagged = untagged;
  window._tagRowFn = tagRow;

  document.getElementById('modal-foot').innerHTML =
    `<button class="btn-cancel" onclick="closeModal()">Close</button>
     <button class="btn-export" onclick="exportDeptCSV('${deptName.replace(/'/g,"\\'")}')"><i class="fas fa-download"></i> Export</button>`;
  document.getElementById('modal-overlay').classList.add('open');
}

window.switchDeptTab = function(tab) {
  const tagged   = window._deptModalTagged   || [];
  const untagged = window._deptModalUntagged || [];
  const tagRow   = window._tagRowFn;
  const isTagged = tab === 'tagged';
  const rows     = isTagged ? tagged : untagged;

  document.getElementById('dept-modal-tbody').innerHTML = rows.map(e => tagRow(e, isTagged)).join('')
    || `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--muted)">No ${tab} records</td></tr>`;

  document.getElementById('tab-tagged').style.cssText   = `flex:1;padding:8px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:${isTagged?'700':'600'};border:1.5px solid ${isTagged?'#10b981':'var(--border)'};background:${isTagged?'rgba(16,185,129,0.15)':'transparent'};color:${isTagged?'#10b981':'var(--muted)'}`;
  document.getElementById('tab-untagged').style.cssText = `flex:1;padding:8px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:${!isTagged?'700':'600'};border:1.5px solid ${!isTagged?'#ef4444':'var(--border)'};background:${!isTagged?'rgba(239,68,68,0.15)':'transparent'};color:${!isTagged?'#ef4444':'var(--muted)'}`;
};

window.exportDeptCSV = function(deptName) {
  const src = scopedData().filter(e => e['Deptt.'] === deptName);
  const headers = ['TAGGING NO.','Staff No.','Name','Section','Location','PC Make','PC Model','PC Sl. No.','DOMAIN','TRINETRA'];
  const rows = src.map(e => headers.map(h => `"${(e[h]||'').toString().replace(/"/g,'""')}"`).join(','));
  const csv  = [headers.join(','), ...rows].join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = `SAIL_${deptName.replace(/[^a-z0-9]/gi,'_')}.csv`;
  a.click();
};

function filterByDept(dept) {
  showPage('assets', document.querySelector('[data-page="assets"]'));
  document.getElementById('asset-dept-filter').value = dept;
  filterAssets('');
}
function renderReports() {
  const src = scopedData();
  const total = src.length;

  const reportRow = (k, v, max, color) => {
    const pct = max ? Math.round((v / max) * 100) : 0;
    return `
    <div class="rrow">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <span class="rrow-label">${k}</span>
        <span class="rrow-val">${v} <span style="color:var(--muted);font-size:11px;font-weight:400">${max ? '('+pct+'%)' : ''}</span></span>
      </div>
      ${max ? `<div style="height:5px;background:rgba(255,255,255,0.07);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:${color||'var(--blue)'};border-radius:3px;transition:width 0.8s ease"></div>
      </div>` : ''}
    </div>`;
  };

  // PC Summary — grouped by Model with LOT NO + dept tooltip on hover
  const pcModelMap = {};
  src.forEach(e => {
    if (!e['PC Make']) return;
    const model = e['PC Model'] || e['PC Make'];
    if (!pcModelMap[model]) pcModelMap[model] = { count: 0, lots: new Set(), depts: {} };
    pcModelMap[model].count++;
    if (e['LOT ID']) pcModelMap[model].lots.add(e['LOT ID']);
    const d = e['Deptt.'] || 'Unknown';
    pcModelMap[model].depts[d] = (pcModelMap[model].depts[d] || 0) + 1;
  });
  const pcMax = Math.max(...Object.values(pcModelMap).map(v => v.count), 1);
  const totalPCs = src.filter(e => e['PC Make']).length;

  document.getElementById('pc-summary').innerHTML = Object.entries(pcModelMap)
    .sort((a,b) => b[1].count - a[1].count)
    .map(([model, v]) => {
      const pct = Math.round(v.count / pcMax * 100);
      const distPct = Math.round(v.count / totalPCs * 100);
      const lotStr = [...v.lots].sort().join(', ') || '—';
      const deptRows = Object.entries(v.depts).sort((a,b)=>b[1]-a[1])
        .map(([d,n]) => `<div style="display:flex;justify-content:space-between;gap:16px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
          <span style="color:#94a3b8;font-size:11px">${d}</span>
          <span style="color:#f8fafc;font-weight:700;font-size:11px">${n}</span>
        </div>`).join('');

      return `
      <div class="pc-inv-row">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span style="font-size:13px;color:var(--text);font-weight:500">${model}
            <span style="font-size:10px;color:var(--muted);font-weight:400;margin-left:4px">[${lotStr}]</span>
          </span>
          <span style="font-size:13px;font-weight:700;color:var(--text)">${v.count}
            <span style="color:var(--muted);font-size:11px;font-weight:400"> (${distPct}%)</span>
          </span>
        </div>
        <div style="height:5px;background:rgba(255,255,255,0.07);border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:#2563eb;border-radius:3px;transition:width 0.8s ease"></div>
        </div>
        <div class="pc-tooltip">
          <div style="font-size:11px;font-weight:700;color:#60a5fa;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px">
            <i class="fas fa-building" style="margin-right:5px"></i>Dept Distribution
          </div>
          ${deptRows}
        </div>
      </div>`;
    }).join('');


  // Printer Summary
  const prCount = {};
  src.forEach(e => { if (e['Printer Make']) prCount[e['Printer Make']] = (prCount[e['Printer Make']]||0)+1; });
  const prMax = Math.max(...Object.values(prCount), 1);
  document.getElementById('printer-summary').innerHTML = Object.entries(prCount).sort((a,b)=>b[1]-a[1])
    .map(([k,v]) => reportRow(k, v, prMax, '#f59e0b')).join('');

  // UPS Summary — normalize brand names
  const upsNorm = v => {
    const s = v.trim().toUpperCase();
    if (/^APC/.test(s))                                    return 'APC';
    if (/EMERSON|EMERSION|ERRTION/.test(s))                return 'EMERSON';
    if (/LIEBERT|LIBERT|LIBERTIT|LIBERTUM|LIBERT I/.test(s)) return 'LIEBERT';
    if (/VERTIV|VERTIX|VERTIY|VERTIR|VERTIN|VERTIU|VECTIV|VETIR|VERTIVE/.test(s)) return 'VERTIV';
    if (/CYBER.?POWER|CBER POWER|CYBER$/.test(s))          return 'CYBERPOWER';
    if (/NUMERIC|NUMBERIC|NUMRICE|NUMRIC/.test(s))         return 'NUMERIC';
    if (/BPE|BPC|BPL/.test(s))                             return 'BPE/BPL';
    if (/FOXIN/.test(s))                                   return 'FOXIN';
    if (/MICROTEK|MCROTEK/.test(s))                        return 'MICROTEK';
    if (/INTEX/.test(s))                                   return 'INTEX';
    if (/PROTECT|ROTECT/.test(s))                          return 'PROTECT';
    if (/LAPCARE/.test(s))                                 return 'LAPCARE';
    if (/LUMINOUS/.test(s))                                return 'LUMINOUS';
    if (/FRONTECH/.test(s))                                return 'FRONTECH';
    if (/ZEBRONICS/.test(s))                               return 'ZEBRONICS';
    if (/ELNOVA|ELENT|ELENOVA/.test(s))                    return 'ELNOVA';
    if (/DIGITAL/.test(s))                                 return 'DIGITAL';
    if (/^NO$|ROOM CLOSED|^PC$|^AIO$|ALL IN ONE|UPS.?6|^UPS$/.test(s)) return null; // junk
    return s;
  };
  const upsCount = {};
  src.forEach(e => {
    if (!e['UPS MAKE']) return;
    const brand = upsNorm(e['UPS MAKE']);
    if (!brand) return;
    upsCount[brand] = (upsCount[brand] || 0) + 1;
  });
  const upsMax = Math.max(...Object.values(upsCount), 1);
  document.getElementById('ups-summary').innerHTML = Object.entries(upsCount).sort((a,b)=>b[1]-a[1])
    .map(([k,v]) => reportRow(k, v, upsMax, '#10b981')).join('');

  // Domain
  const yes = src.filter(e=>e['DOMAIN']==='YES').length;
  const no  = src.filter(e=>e['DOMAIN']==='NO').length;
  const na  = total - yes - no;
  document.getElementById('domain-summary').innerHTML = [
    ['On Domain', yes, '#10b981'], ['Not on Domain', no, '#ef4444'], ['Unknown', na, '#94a3b8']
  ].map(([k,v,c]) => reportRow(k, v, total, c)).join('');

  // Scanner Summary
  const scCount = {};
  src.forEach(e => { if (e['Scanner Make']) scCount[e['Scanner Make']] = (scCount[e['Scanner Make']]||0)+1; });
  const scMax = Math.max(...Object.values(scCount), 1);
  document.getElementById('scanner-summary').innerHTML = Object.entries(scCount).sort((a,b)=>b[1]-a[1])
    .map(([k,v]) => reportRow(k, v, scMax, '#06b6d4')).join('') || reportRow('No scanners', 0, 0, '');

  // TRINETRA Summary
  const tYes = src.filter(e=>e['TRINETRA']==='YES').length;
  const tNo  = src.filter(e=>e['TRINETRA']==='NO').length;
  const tNa  = total - tYes - tNo;
  document.getElementById('trinetra-summary').innerHTML = [
    ['Active', tYes, '#10b981'], ['Inactive', tNo, '#ef4444'], ['Unknown', tNa, '#94a3b8']
  ].map(([k,v,c]) => reportRow(k, v, total, c)).join('');

  // Full dept chart — scoped
  const deptCount = {};
  src.forEach(e => { if (e['Deptt.']) deptCount[e['Deptt.']] = (deptCount[e['Deptt.']]||0)+1; });
  const all = Object.entries(deptCount).sort((a,b)=>b[1]-a[1]);
  makeChartWithLabels('fullDeptChart', 'bar', all.map(d=>d[0]), all.map(d=>d[1]), 'rgba(26,86,219,0.8)');
}

// ===== MY ASSET =====
function renderMyAsset() {
  const container = document.getElementById('my-asset-content');
  let emp = null;
  if (user.role === 'staff') {
    emp = EMPLOYEES.find(e => cleanNum(e['Staff No.']) === user.staffNo);
  } else if (user.role === 'dept_head') {
    const deptEmps = EMPLOYEES.filter(e => e['Deptt.'] === user.dept);
    const withPC = deptEmps.filter(e => e['PC Make']).length;
    const withPrinter = deptEmps.filter(e => e['Printer Make']).length;
    const withScanner = deptEmps.filter(e => e['Scanner Make']).length;
    const withUPS = deptEmps.filter(e => e['UPS MAKE']).length;
    const onDomain = deptEmps.filter(e => e['DOMAIN'] === 'YES').length;
    container.innerHTML = `
      <div class="asset-profile">
        <div class="ap-header">
          <div class="ap-avatar" style="font-size:28px"><i class="fas fa-building"></i></div>
          <div>
            <div class="ap-name">${user.dept}</div>
            <div class="ap-meta">
              <span><i class="fas fa-users"></i>${deptEmps.length} Employees</span>
              <span><i class="fas fa-desktop"></i>${withPC} PCs</span>
              <span><i class="fas fa-print"></i>${withPrinter} Printers</span>
            </div>
          </div>
        </div>
        <div class="ap-sections">
          ${assetSection('fa-desktop','PC Assets',{'Total Employees':deptEmps.length,'With PC':withPC,'Without PC':deptEmps.length-withPC})}
          ${assetSection('fa-print','Peripherals',{'Printers':withPrinter,'Scanners':withScanner,'UPS Units':withUPS})}
          ${assetSection('fa-network-wired','Network',{'On Domain':onDomain,'Off Domain':deptEmps.filter(e=>e['DOMAIN']==='NO').length,'Unknown':deptEmps.filter(e=>!e['DOMAIN']).length})}
        </div>
      </div>`;
    return;
  }
  if (!emp) {
    container.innerHTML = `<div style="color:var(--text-muted);padding:40px;text-align:center">
      <i class="fas fa-laptop" style="font-size:48px;margin-bottom:16px;display:block;opacity:0.3"></i>
      No asset record found for your account.</div>`;
    return;
  }
  container.innerHTML = `
    <div class="asset-profile">
      <div class="ap-header">
        <div class="ap-avatar">${emp['Name'].split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}</div>
        <div>
          <div class="ap-name">${emp['Name']}</div>
          <div class="ap-meta"><span><i class="fas fa-id-badge"></i>Staff No: ${cleanNum(emp['Staff No.'])}</span><span><i class="fas fa-building"></i>${emp['Deptt.']}</span><span><i class="fas fa-layer-group"></i>${emp['Section']}</span></div>
          <div class="ap-meta" style="margin-top:4px"><span><i class="fas fa-tag"></i>Tag: ${emp['TAGGING NO.']}</span><span><i class="fas fa-location-dot"></i>${emp['Location']||'N/A'}</span></div>
        </div>
      </div>
      <div class="ap-sections">
        ${assetSection('fa-desktop','Computer',{
          'PC Make': emp['PC Make'], 'PC Model': emp['PC Model'],
          'Serial No.': emp['PC Sl. No.'], 'LOT ID': emp['LOT ID'],
          'OS': emp['OS']?'Windows '+emp['OS']:'', 'RAM': emp['RAM']?emp['RAM']+'GB':''
        })}
        ${assetSection('fa-display','Monitor',{
          'Make': emp['Monitor Make'], 'Model': emp['Monitor Model'], 'Serial No.': emp['Monitor Sl. No.']
        })}
        ${assetSection('fa-print','Printer',{
          'Make': emp['Printer Make'], 'Model': emp['Printer Model'],
          'Serial No.': emp['Printer Sl. No.'], 'LOT ID': emp['PRINTER LOT ID']
        })}
        ${assetSection('fa-barcode','Scanner',{
          'Make': emp['Scanner Make'], 'Model': emp['Scanner Model'],
          'Serial No.': emp['Scanner Sl.No.'], 'LOT ID': emp['SCANNER LOT ID']
        })}
        ${assetSection('fa-bolt','UPS',{
          'Make': emp['UPS MAKE'], 'Model': emp['UPS MODEL']
        })}
        ${assetSection('fa-network-wired','Network',{
          'Hostname': emp['HOST NAME'], 'MAC Address': emp['MAC ADDRESS'],
          'Domain': emp['DOMAIN'], 'TRINETRA': emp['TRINETRA']
        })}
      </div>
    </div>`;
}

function assetSection(icon, title, fields) {
  const rows = Object.entries(fields).filter(([,v]) => v !== '' && v !== null && v !== undefined).map(([k,v]) =>
    `<div class="ap-field"><span class="ap-key">${k}</span><span class="ap-val">${v}</span></div>`).join('');
  if (!rows) return '';
  return `<div class="ap-section">
    <div class="ap-sec-title"><i class="fas ${icon}"></i>${title}</div>
    ${rows}
  </div>`;
}

// ===== MODAL =====
function openModal(idx) {
  const e = EMPLOYEES[idx];
  document.getElementById('modal-title').textContent = e['Name'] || 'Asset Details';
  document.getElementById('modal-body').innerHTML = `
    <div class="modal-grid">
      ${modalSection('fa-user','Employee',{'Name':e['Name'],'Staff No.':cleanNum(e['Staff No.']),'Department':e['Deptt.'],'Section':e['Section'],'Location':e['Location'],'Tagging No.':e['TAGGING NO.']})}
      ${modalSection('fa-desktop','Computer',{'PC Make':e['PC Make'],'PC Model':e['PC Model'],'Serial No.':e['PC Sl. No.'],'LOT ID':e['LOT ID'],'OS':e['OS']?'Win '+e['OS']:'','RAM':e['RAM']?e['RAM']+'GB':''})}
      ${modalSection('fa-display','Monitor',{'Make':e['Monitor Make'],'Model':e['Monitor Model'],'Serial No.':e['Monitor Sl. No.']})}
      ${modalSection('fa-print','Printer',{'Make':e['Printer Make'],'Model':e['Printer Model'],'Serial No.':e['Printer Sl. No.']})}
      ${modalSection('fa-barcode','Scanner',{'Make':e['Scanner Make'],'Model':e['Scanner Model'],'Serial No.':e['Scanner Sl.No.']})}
      ${modalSection('fa-network-wired','Network',{'Hostname':e['HOST NAME'],'MAC':e['MAC ADDRESS'],'Domain':e['DOMAIN'],'TRINETRA':e['TRINETRA'],'UPS':(e['UPS MAKE']||'')+(e['UPS MODEL']?' '+e['UPS MODEL']:'')})}
    </div>`;
  document.getElementById('modal-foot').innerHTML = `<button class="btn-cancel" onclick="closeModal()">Close</button>`;
  document.getElementById('modal-overlay').classList.add('open');
}

function modalSection(icon, title, fields) {
  const rows = Object.entries(fields).filter(([,v])=>v).map(([k,v])=>
    `<div class="modal-field"><span class="modal-field-key">${k}</span><span class="modal-field-val">${v}</span></div>`).join('');
  if (!rows) return '';
  return `<div class="modal-sec">
    <div class="modal-sec-title"><i class="fas ${icon}"></i>${title}</div>${rows}</div>`;
}

function openEdit(idx) {
  const e = EMPLOYEES[idx];
  document.getElementById('modal-title').textContent = 'Edit: ' + e['Name'];
  const fields = ['PC Make','PC Model','PC Sl. No.','Monitor Make','Monitor Model','Printer Make','Printer Model','UPS MAKE','UPS MODEL','HOST NAME','MAC ADDRESS','OS','RAM','DOMAIN'];
  document.getElementById('modal-body').innerHTML = `<div class="edit-form">${
    fields.map(f => `<div class="edit-group">
      <label>${f}</label>
      <input id="edit_${f.replace(/[^a-z0-9]/gi,'_')}" value="${e[f]||''}"/>
    </div>`).join('')
  }</div>`;
  document.getElementById('modal-foot').innerHTML = `
    <button class="btn-cancel" onclick="closeModal()">Cancel</button>
    <button class="btn-save" onclick="saveEdit(${idx})">Save</button>`;
  document.getElementById('modal-overlay').classList.add('open');
}

async function saveEdit(idx) {
  const fields = ['PC Make','PC Model','PC Sl. No.','Monitor Make','Monitor Model','Printer Make','Printer Model','UPS MAKE','UPS MODEL','HOST NAME','MAC ADDRESS','OS','RAM','DOMAIN'];
  const updates = {};
  fields.forEach(f => {
    const el = document.getElementById('edit_'+f.replace(/[^a-z0-9]/gi,'_'));
    if (el) { EMPLOYEES[idx][f] = el.value.trim(); updates[f] = el.value.trim(); }
  });
  try {
    await updateDoc(doc(db, 'employees', EMPLOYEES[idx]._id), updates);
  } catch(e) {
    alert('Failed to save: ' + e.message);
  }
  closeModal();
  renderAssetsTable();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

// ===== GLOBAL SEARCH =====
function globalSearch(val) {
  if (user.role === 'staff') return;
  showPage('assets', document.querySelector('[data-page="assets"]'));
  document.getElementById('asset-search').value = val;
  filterAssets(val || '');
}

// ===== EXPORT =====
function exportCSV() {
  const headers = Object.keys(EMPLOYEES[0]);
  const rows = filteredAssets.map(e => headers.map(h => `"${(e[h]||'').replace(/"/g,'""')}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'SAIL_Assets.csv';
  a.click();
}

// ===== PAGINATION =====
function renderPagination(id, total, current, cb) {
  const pages = Math.ceil(total / PAGE_SIZE);
  const el = document.getElementById(id);
  if (pages <= 1) { el.innerHTML = ''; return; }
  const btn = (p, label, active) =>
    `<button class="page-btn${active?' active':''}" data-page="${p}" data-cb="${id}">${label}</button>`;
  let html = '';
  if (current > 1) html += btn(current-1, '<i class="fas fa-chevron-left"></i>');
  if (current > 2) html += btn(1, '1');
  if (current > 3) html += `<span style="color:var(--muted);padding:0 4px">…</span>`;
  for (let p = Math.max(1,current-1); p <= Math.min(pages,current+1); p++) html += btn(p, p, p===current);
  if (current < pages-2) html += `<span style="color:var(--muted);padding:0 4px">…</span>`;
  if (current < pages-1) html += btn(pages, pages);
  if (current < pages) html += btn(current+1, '<i class="fas fa-chevron-right"></i>');
  el.innerHTML = html;
  el.querySelectorAll('.page-btn[data-page]').forEach(b => {
    b.addEventListener('click', () => cb(parseInt(b.dataset.page)));
  });
}

// ===== ISSUES =====
const ISSUE_CHECKS = [
  { key: 'no_serial',    label: 'Missing Serial No.',  icon: 'fa-barcode',         severity: 'high',   check: e => !e['PC Sl. No.'] },
  { key: 'no_os',        label: 'Missing OS',           icon: 'fa-windows',         severity: 'high',   check: e => !e['OS'] },
  { key: 'no_ram',       label: 'Missing RAM',          icon: 'fa-memory',          severity: 'medium', check: e => !e['RAM'] },
  { key: 'no_hostname',  label: 'Missing Hostname',     icon: 'fa-server',          severity: 'medium', check: e => !e['HOST NAME'] },
  { key: 'no_mac',       label: 'Missing MAC Address',  icon: 'fa-network-wired',   severity: 'medium', check: e => !e['MAC ADDRESS'] },
  { key: 'not_domain',   label: 'Not on Domain',        icon: 'fa-shield-halved',   severity: 'high',   check: e => e['DOMAIN'] && e['DOMAIN'] !== 'YES' },
  { key: 'not_trinetra', label: 'TRINETRA Inactive',    icon: 'fa-circle-xmark',    severity: 'low',    check: e => e['TRINETRA'] && e['TRINETRA'] !== 'YES' },
  { key: 'no_monitor',   label: 'No Monitor',           icon: 'fa-display',         severity: 'low',    check: e => !e['Monitor Make'] },
  { key: 'dup_serial',   label: 'Duplicate Serial No.', icon: 'fa-clone',           severity: 'high',   check: e => e['_dupSerial'] === true },
];

const SEV_COLOR = { high: '#ef4444', medium: '#f59e0b', low: '#94a3b8' };
const SEV_BG    = { high: 'rgba(239,68,68,0.12)', medium: 'rgba(245,158,11,0.12)', low: 'rgba(148,163,184,0.1)' };

let issuePage = 1;
let filteredIssues = [];

function getIssuesFor(emp) {
  return ISSUE_CHECKS.filter(c => c.check(emp));
}

function buildAllIssues() {
  let src = EMPLOYEES;
  if (user.role === 'hr')    src = EMPLOYEES.filter(e => e['Deptt.'] === user.dept);
  if (user.role === 'staff') src = EMPLOYEES.filter(e => cleanNum(e['Staff No.']) === user.staffNo);
  const type = document.getElementById('issue-type-filter')?.value || '';
  const dept = document.getElementById('issue-dept-filter')?.value || '';
  return src
    .map(e => ({ emp: e, issues: getIssuesFor(e) }))
    .filter(r => r.issues.length > 0)
    .filter(r => !type || r.issues.some(i => i.key === type))
    .filter(r => user.role === 'staff' || !dept || r.emp['Deptt.'] === dept);
}

function renderIssues() {
  filteredIssues = buildAllIssues();

  if (user.role === 'staff') {
    const emp    = EMPLOYEES.find(e => cleanNum(e['Staff No.']) === user.staffNo);
    const issues = emp ? getIssuesFor(emp) : [];

    document.getElementById('issue-summary-grid').style.display = 'none';
    document.getElementById('issue-dept-filter').style.display  = 'none';
    document.getElementById('issue-type-filter').style.display  = 'none';
    const exportBtn = document.querySelector('[onclick="exportIssuesCSV()"]');
    if (exportBtn) exportBtn.style.display = 'none';

    if (!emp) {
      document.getElementById('issue-count').textContent = 'No asset record found';
      document.getElementById('issues-tbody').innerHTML  = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--muted)">No asset record found for your account.</td></tr>`;
      return;
    }
    if (issues.length === 0) {
      document.getElementById('issue-count').textContent = '✅ No issues found';
      document.getElementById('issues-tbody').innerHTML  = `
        <tr><td colspan="6" style="text-align:center;padding:48px">
          <i class="fas fa-circle-check" style="font-size:40px;color:#10b981;display:block;margin-bottom:12px"></i>
          <div style="font-size:15px;font-weight:600;color:#10b981;margin-bottom:6px">All Good!</div>
          <div style="font-size:13px;color:var(--muted)">No issues found on your asset record.</div>
        </td></tr>`;
      document.getElementById('issue-pagination').innerHTML = '';
      return;
    }
    document.getElementById('issue-count').textContent = `⚠ ${issues.length} issue${issues.length>1?'s':''} on your asset`;
    document.getElementById('issues-tbody').innerHTML = issues.map(i => `
      <tr>
        <td>${emp['TAGGING NO.']||'-'}</td>
        <td>${cleanNum(emp['Staff No.'])}</td>
        <td>${emp['Name']||'-'}</td>
        <td><span class="badge badge-dept">${emp['Deptt.']||'-'}</span></td>
        <td><span style="display:inline-flex;align-items:center;gap:6px;background:${SEV_BG[i.severity]};color:${SEV_COLOR[i.severity]};border:1px solid ${SEV_COLOR[i.severity]}44;border-radius:20px;padding:4px 10px;font-size:12px;font-weight:600">
          <i class="fas fa-circle-exclamation" style="font-size:10px"></i>${i.label}
        </span></td>
        <td><button class="btn-view" onclick="openModal(${EMPLOYEES.indexOf(emp)})">View</button></td>
      </tr>`).join('');
    document.getElementById('issue-pagination').innerHTML = '';
    return;
  }

  // ── HR / Dept Head: full issue view ──
  const counts = {};
  ISSUE_CHECKS.forEach(c => counts[c.key] = 0);
  filteredIssues.forEach(r => r.issues.forEach(i => counts[i.key]++));
  const totalAffected = filteredIssues.length;

  document.getElementById('issue-summary-grid').style.display = 'grid';
  document.getElementById('issue-summary-grid').innerHTML = ISSUE_CHECKS.map(c => `
    <div class="issue-card sev-${c.severity}" onclick="document.getElementById('issue-type-filter').value='${c.key}';filterIssues()" style="cursor:pointer">
      <div class="ic-top">
        <div class="ic-icon sev-${c.severity}"><i class="fas ${c.icon}"></i></div>
        <div class="ic-count" style="color:${SEV_COLOR[c.severity]}">${counts[c.key]}</div>
      </div>
      <div class="ic-label">${c.label}</div>
      <div class="ic-bar"><div class="ic-fill" style="width:${totalAffected?Math.round(counts[c.key]/totalAffected*100):0}%;background:${SEV_COLOR[c.severity]}"></div></div>
    </div>`).join('');

  document.getElementById('issue-count').textContent = `${totalAffected} affected records`;
  renderIssuesTable();
}

function filterIssuesByKey(key) {
  showPage('issues', document.querySelector('[data-page="issues"]'));
  const sel = document.getElementById('issue-type-filter');
  if (sel) sel.value = key;
  filterIssues();
}

function filterIssues() {
  filteredIssues = buildAllIssues();
  issuePage = 1;
  document.getElementById('issue-count').textContent = `${filteredIssues.length} affected records`;
  renderIssuesTable();
}

function renderIssuesTable() {
  const start = (issuePage - 1) * PAGE_SIZE;
  const rows = filteredIssues.slice(start, start + PAGE_SIZE);
  document.getElementById('issues-tbody').innerHTML = rows.map(r => {
    const e = r.emp;
    const badges = r.issues.map(i =>
      `<span style="display:inline-flex;align-items:center;gap:4px;background:${SEV_BG[i.severity]};color:${SEV_COLOR[i.severity]};border:1px solid ${SEV_COLOR[i.severity]}44;border-radius:20px;padding:3px 9px;font-size:11px;font-weight:600;margin:2px">
        <i class="fas fa-circle-exclamation" style="font-size:9px"></i>${i.label}
      </span>`).join('');
    return `<tr>
      <td>${e['TAGGING NO.'] || '-'}</td>
      <td>${cleanNum(e['Staff No.'])}</td>
      <td>${e['Name'] || '-'}</td>
      <td><span class="badge badge-dept">${e['Deptt.'] || '-'}</span></td>
      <td>${badges}</td>
      <td><button class="btn-view" onclick="openModal(${EMPLOYEES.indexOf(e)})">View</button></td>
    </tr>`;
  }).join('');
  renderPagination('issue-pagination', filteredIssues.length, issuePage, p => { issuePage = p; renderIssuesTable(); });
}

function exportIssuesCSV() {
  const rows = [['Tag No.','Staff No.','Name','Department','Issues']];
  filteredIssues.forEach(r => {
    rows.push([r.emp['TAGGING NO.'], cleanNum(r.emp['Staff No.']), r.emp['Name'], r.emp['Deptt.'], r.issues.map(i=>i.label).join(' | ')]);
  });
  const csv = rows.map(r => r.map(v => `"${(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'SAIL_Issues.csv';
  a.click();
}

// ===== UTILS =====
function cleanNum(n) { return String(n||'').replace(/\.0$/, '').trim(); }

window.showPcTooltip = function(row) {
  const tip = row.querySelector('.pc-tooltip');
  if (tip) tip.style.display = 'block';
};
window.hidePcTooltip = function(row) {
  const tip = row.querySelector('.pc-tooltip');
  if (tip) tip.style.display = 'none';
};

// ===== EXPOSE GLOBALS (needed for inline onclick handlers) =====
window.showPage = showPage;
window.toggleSidebar = toggleSidebar;
window.logout = logout;
window.filterAssets = filterAssets;
window.filterEmployees = filterEmployees;
window.filterByDept = filterByDept;
window.openDeptModal = openDeptModal;
window.filterIssues = filterIssues;
window.openModal = openModal;
window.openEdit = openEdit;
window.saveEdit = saveEdit;
window.closeModal = closeModal;
window.globalSearch = globalSearch;
window.exportCSV = exportCSV;
window.filterIssuesByKey = filterIssuesByKey;
window.exportIssuesCSV = exportIssuesCSV;
