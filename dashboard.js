// ===== INIT =====
const user = JSON.parse(sessionStorage.getItem('sail_user') || 'null');
if (!user) window.location.href = 'index.html';

const PAGE_SIZE = 20;
let assetPage = 1, empPage = 1;
let filteredAssets = [], filteredEmps = [];
let charts = {};

// ===== SETUP =====
window.onload = () => {
  setupUser();
  setupNav();
  populateDeptFilters();
  renderKPIs();
  renderCharts();
  showPage('overview', document.querySelector('.nav-item.active'));
};

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

  // Role-based nav
  if (user.role === 'staff') {
    document.getElementById('nav-employees').style.display = 'none';
    document.getElementById('nav-departments').style.display = 'none';
  }
}

function roleLabel(r) {
  return r === 'hr' ? 'HR / Admin' : r === 'dept_head' ? 'Dept. Head' : 'Staff';
}

function setupNav() {
  if (user.role === 'staff') {
    showPage('myasset', document.querySelector('[data-page="myasset"]'));
  }
}

// ===== NAVIGATION =====
function showPage(name, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  if (el) el.classList.add('active');
  document.getElementById('page-title').textContent = el?.querySelector('span')?.textContent || name;

  if (name === 'overview') renderCharts();
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

function logout() {
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

// ===== KPIs =====
function renderKPIs() {
  const total = EMPLOYEES.length;
  const withPrinter = EMPLOYEES.filter(e => e['Printer Make']).length;
  const withScanner = EMPLOYEES.filter(e => e['Scanner  Make']).length;
  const withUPS = EMPLOYEES.filter(e => e['UPS MAKE']).length;
  const depts = new Set(EMPLOYEES.map(e => e['Deptt.']).filter(Boolean)).size;
  const onDomain = EMPLOYEES.filter(e => e['DOMAIN'] === 'YES').length;

  const kpis = [
    { icon: 'fa-desktop', color: 'blue', num: total, label: 'Total Assets' },
    { icon: 'fa-building', color: 'purple', num: depts, label: 'Departments' },
    { icon: 'fa-print', color: 'amber', num: withPrinter, label: 'With Printer' },
    { icon: 'fa-barcode', color: 'cyan', num: withScanner, label: 'With Scanner' },
    { icon: 'fa-bolt', color: 'green', num: withUPS, label: 'With UPS' },
    { icon: 'fa-network-wired', color: 'red', num: onDomain, label: 'On Domain' },
  ];

  document.getElementById('kpi-grid').innerHTML = kpis.map(k => `
    <div class="kpi-card">
      <div class="kpi-icon ${k.color}"><i class="fas ${k.icon}"></i></div>
      <div><div class="kpi-num">${k.num}</div><div class="kpi-label">${k.label}</div></div>
    </div>`).join('');
}

// ===== CHARTS =====
function renderCharts() {
  // Dept chart
  const deptCount = {};
  EMPLOYEES.forEach(e => { if (e['Deptt.']) deptCount[e['Deptt.']] = (deptCount[e['Deptt.']] || 0) + 1; });
  const top15 = Object.entries(deptCount).sort((a,b) => b[1]-a[1]).slice(0,15);
  makeChartWithLabels('deptChart', 'bar', top15.map(d=>d[0]), top15.map(d=>d[1]), 'rgba(26,86,219,0.8)');

  // PC Make
  const pcCount = {};
  EMPLOYEES.forEach(e => { if (e['PC Make']) pcCount[e['PC Make']] = (pcCount[e['PC Make']] || 0) + 1; });
  const pcEntries = Object.entries(pcCount).sort((a,b)=>b[1]-a[1]);
  makeChart('pcMakeChart', 'doughnut', pcEntries.map(d => `${d[0]} (${d[1]})`), pcEntries.map(d=>d[1]),
    ['#1a56db','#10b981','#f59e0b','#ef4444','#7c3aed','#06b6d4']);

  // RAM
  const ramCount = {};
  EMPLOYEES.forEach(e => { if (e['RAM']) { const r = e['RAM']+'GB'; ramCount[r] = (ramCount[r]||0)+1; }});
  const ramE = Object.entries(ramCount).sort((a,b)=>parseFloat(a[0])-parseFloat(b[0]));
  makeChartWithLabels('ramChart', 'bar', ramE.map(d=>d[0]), ramE.map(d=>d[1]), 'rgba(16,185,129,0.8)');

  // OS
  const osCount = {};
  EMPLOYEES.forEach(e => { if (e['OS']) { const o = 'Win '+e['OS']; osCount[o]=(osCount[o]||0)+1; }});
  const osE = Object.entries(osCount);
  makeChart('osChart', 'pie', osE.map(d=>d[0]), osE.map(d=>d[1]),
    ['#1a56db','#10b981','#f59e0b','#ef4444','#7c3aed']);

  // Printer
  const prCount = {};
  EMPLOYEES.forEach(e => { if (e['Printer Make']) prCount[e['Printer Make']]=(prCount[e['Printer Make']]||0)+1; });
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
  if (user.role === 'dept_head') src = EMPLOYEES.filter(e => e['Deptt.'] === user.dept);

  filteredAssets = src.filter(e => {
    const matchSearch = !search || Object.values(e).some(v => String(v).toLowerCase().includes(search));
    const matchDept = !dept || e['Deptt.'] === dept;
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

  let src = EMPLOYEES;
  if (user.role === 'dept_head') src = EMPLOYEES.filter(e => e['Deptt.'] === user.dept);

  filteredEmps = src.filter(e => {
    const matchSearch = !search || [e['Name'],e['Staff No.'],e['P. No.'],e['Deptt.'],e['Section']].some(v => String(v||'').toLowerCase().includes(search));
    const matchDept = !dept || e['Deptt.'] === dept;
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
      <td>${e['P. No.'] || '-'}</td>
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
  const deptMap = {};
  EMPLOYEES.forEach(e => {
    const d = e['Deptt.']; if (!d) return;
    if (!deptMap[d]) deptMap[d] = { count: 0, acer: 0, hp: 0, hlbs: 0, acerAio: 0, other: 0, printers: 0, scanners: 0, ups: 0, crossDept: 0 };
    deptMap[d].count++;
    const pc = e['PC Make'] || '';
    if (pc === 'ACER') deptMap[d].acer++;
    else if (pc === 'HP') deptMap[d].hp++;
    else if (pc === 'HLBS AIO') deptMap[d].hlbs++;
    else if (pc === 'ACER AIO') deptMap[d].acerAio++;
    else if (pc) deptMap[d].other++;
    if (e['Printer Make']) deptMap[d].printers++;
    if (e['Scanner  Make']) deptMap[d].scanners++;
    if (e['UPS MAKE']) deptMap[d].ups++;
    // cross-dept: location dept name differs from assigned dept
    const loc = (e['Location'] || '').trim().toUpperCase();
    const dep = d.trim().toUpperCase();
    if (loc && loc !== dep && !loc.includes(dep) && !dep.includes(loc)) deptMap[d].crossDept++;
  });

  document.getElementById('dept-grid').innerHTML = Object.entries(deptMap)
    .sort((a,b) => b[1].count - a[1].count)
    .map(([name, s]) => {
      const makes = [
        { label: 'ACER', val: s.acer, color: '#1a56db' },
        { label: 'HP', val: s.hp, color: '#10b981' },
        { label: 'HLBS AIO', val: s.hlbs, color: '#f59e0b' },
        { label: 'ACER AIO', val: s.acerAio, color: '#7c3aed' },
        { label: 'Other', val: s.other, color: '#94a3b8' },
      ].filter(m => m.val > 0);

      const bars = makes.map(m => `
        <div style="margin-bottom:6px">
          <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px">
            <span style="color:var(--muted)">${m.label}</span>
            <span style="color:var(--text);font-weight:700">${m.val} <span style="color:var(--muted);font-weight:400">(${Math.round(m.val/s.count*100)}%)</span></span>
          </div>
          <div style="height:5px;background:rgba(255,255,255,0.07);border-radius:3px;overflow:hidden">
            <div style="height:100%;width:${Math.round(m.val/s.count*100)}%;background:${m.color};border-radius:3px;transition:width 0.6s"></div>
          </div>
        </div>`).join('');

      return `
    <div class="dept-card" onclick="filterByDept('${name}')">
      <div class="dc-header">
        <div class="dc-name">${name}</div>
        <div class="dc-count">${s.count}</div>
      </div>
      <div style="margin:12px 0 10px">${bars}</div>
      <div class="dc-stats">
        <div class="dc-stat"><div class="dc-stat-label">Printers</div><div class="dc-stat-val">${s.printers}</div></div>
        <div class="dc-stat"><div class="dc-stat-label">Scanners</div><div class="dc-stat-val">${s.scanners}</div></div>
        <div class="dc-stat"><div class="dc-stat-label">UPS</div><div class="dc-stat-val">${s.ups}</div></div>
        <div class="dc-stat" style="${s.crossDept>0?'background:rgba(245,158,11,0.1);border-radius:8px':''}"><div class="dc-stat-label">Cross-Dept</div><div class="dc-stat-val" style="color:${s.crossDept>0?'#fbbf24':'var(--text)'}">${s.crossDept}</div></div>
      </div>
    </div>`;
    }).join('');
}

function filterByDept(dept) {
  showPage('assets', document.querySelector('[data-page="assets"]'));
  document.getElementById('asset-dept-filter').value = dept;
  filterAssets('');
}

// ===== REPORTS =====
function renderReports() {
  // PC Summary
  const pcCount = {};
  EMPLOYEES.forEach(e => { if (e['PC Make']) pcCount[e['PC Make']] = (pcCount[e['PC Make']]||0)+1; });
  const reportRow = (k,v) => `<div class="rrow"><span class="rrow-label">${k}</span><span class="rrow-val">${v}</span></div>`;

  document.getElementById('pc-summary').innerHTML = Object.entries(pcCount).sort((a,b)=>b[1]-a[1]).map(([k,v])=>reportRow(k,v)).join('');

  // Printer Summary
  const prCount = {};
  EMPLOYEES.forEach(e => { if (e['Printer Make']) prCount[e['Printer Make']] = (prCount[e['Printer Make']]||0)+1; });
  document.getElementById('printer-summary').innerHTML = Object.entries(prCount).sort((a,b)=>b[1]-a[1]).map(([k,v])=>reportRow(k,v)).join('');

  // UPS Summary
  const upsCount = {};
  EMPLOYEES.forEach(e => { if (e['UPS MAKE']) upsCount[e['UPS MAKE']] = (upsCount[e['UPS MAKE']]||0)+1; });
  document.getElementById('ups-summary').innerHTML = Object.entries(upsCount).sort((a,b)=>b[1]-a[1]).map(([k,v])=>reportRow(k,v)).join('');

  // Domain
  const yes = EMPLOYEES.filter(e=>e['DOMAIN']==='YES').length;
  const no = EMPLOYEES.filter(e=>e['DOMAIN']==='NO').length;
  const na = EMPLOYEES.length - yes - no;
  document.getElementById('domain-summary').innerHTML = [['On Domain',yes],['Not on Domain',no],['Unknown',na]].map(([k,v])=>reportRow(k,v)).join('');

  // Scanner Summary
  const scCount = {};
  EMPLOYEES.forEach(e => { if (e['Scanner  Make']) scCount[e['Scanner  Make']] = (scCount[e['Scanner  Make']]||0)+1; });
  document.getElementById('scanner-summary').innerHTML = Object.entries(scCount).sort((a,b)=>b[1]-a[1]).map(([k,v])=>reportRow(k,v)).join('') || reportRow('No scanners','0');

  // TRINETRA Summary
  const tYes = EMPLOYEES.filter(e=>e['TRINETRA']==='YES').length;
  const tNo = EMPLOYEES.filter(e=>e['TRINETRA']==='NO').length;
  const tNa = EMPLOYEES.length - tYes - tNo;
  document.getElementById('trinetra-summary').innerHTML = [['Active',tYes],['Inactive',tNo],['Unknown',tNa]].map(([k,v])=>reportRow(k,v)).join('');

  // Full dept chart
  const deptCount = {};
  EMPLOYEES.forEach(e => { if (e['Deptt.']) deptCount[e['Deptt.']] = (deptCount[e['Deptt.']]||0)+1; });
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
    const withScanner = deptEmps.filter(e => e['Scanner  Make']).length;
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
          'Make': emp['Scanner  Make'], 'Model': emp['Scanner Model'],
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
      ${modalSection('fa-user','Employee',{'Name':e['Name'],'Staff No.':cleanNum(e['Staff No.']),'P. No.':e['P. No.'],'Department':e['Deptt.'],'Section':e['Section'],'Location':e['Location'],'Tagging No.':e['TAGGING NO.']})}
      ${modalSection('fa-desktop','Computer',{'PC Make':e['PC Make'],'PC Model':e['PC Model'],'Serial No.':e['PC Sl. No.'],'LOT ID':e['LOT ID'],'OS':e['OS']?'Win '+e['OS']:'','RAM':e['RAM']?e['RAM']+'GB':''})}
      ${modalSection('fa-display','Monitor',{'Make':e['Monitor Make'],'Model':e['Monitor Model'],'Serial No.':e['Monitor Sl. No.']})}
      ${modalSection('fa-print','Printer',{'Make':e['Printer Make'],'Model':e['Printer Model'],'Serial No.':e['Printer Sl. No.']})}
      ${modalSection('fa-barcode','Scanner',{'Make':e['Scanner  Make'],'Model':e['Scanner Model'],'Serial No.':e['Scanner Sl.No.']})}
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

function saveEdit(idx) {
  const fields = ['PC Make','PC Model','PC Sl. No.','Monitor Make','Monitor Model','Printer Make','Printer Model','UPS MAKE','UPS MODEL','HOST NAME','MAC ADDRESS','OS','RAM','DOMAIN'];
  fields.forEach(f => {
    const el = document.getElementById('edit_'+f.replace(/[^a-z0-9]/gi,'_'));
    if (el && Object.prototype.hasOwnProperty.call(EMPLOYEES[idx], f)) EMPLOYEES[idx][f] = el.value.trim();
  });
  closeModal();
  renderAssetsTable();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

// ===== GLOBAL SEARCH =====
function globalSearch(val) {
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
  { key: 'no_serial',   label: 'Missing Serial No.',  severity: 'high',   check: e => !e['PC Sl. No.'] },
  { key: 'no_os',       label: 'Missing OS',           severity: 'high',   check: e => !e['OS'] },
  { key: 'no_ram',      label: 'Missing RAM',          severity: 'medium', check: e => !e['RAM'] },
  { key: 'no_hostname', label: 'Missing Hostname',     severity: 'medium', check: e => !e['HOST NAME'] },
  { key: 'no_mac',      label: 'Missing MAC Address',  severity: 'medium', check: e => !e['MAC ADDRESS'] },
  { key: 'not_domain',  label: 'Not on Domain',        severity: 'high',   check: e => e['DOMAIN'] && e['DOMAIN'] !== 'YES' },
  { key: 'not_trinetra',label: 'TRINETRA Inactive',    severity: 'low',    check: e => e['TRINETRA'] && e['TRINETRA'] !== 'YES' },
  { key: 'no_monitor',  label: 'No Monitor',           severity: 'low',    check: e => !e['Monitor Make'] },
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
  if (user.role === 'dept_head') src = EMPLOYEES.filter(e => e['Deptt.'] === user.dept);
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

  const isStaff = user.role === 'staff';

  if (isStaff) {
    // Personal issue view for staff
    const emp = EMPLOYEES.find(e => cleanNum(e['Staff No.']) === user.staffNo);
    const issues = emp ? getIssuesFor(emp) : [];
    document.getElementById('issue-summary-grid').style.display = 'none';
    document.getElementById('issue-dept-filter').style.display = 'none';
    document.querySelector('[onclick="exportIssuesCSV()"]').style.display = 'none';
    document.getElementById('issue-type-filter').style.display = 'none';

    if (!emp) {
      document.getElementById('issue-count').textContent = 'No asset record found';
      document.getElementById('issues-tbody').innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--muted)">No asset record found for your account.</td></tr>`;
      return;
    }

    if (issues.length === 0) {
      document.getElementById('issue-count').textContent = '✅ No issues found';
      document.getElementById('issues-tbody').innerHTML = `
        <tr><td colspan="6" style="text-align:center;padding:48px;color:var(--muted)">
          <i class="fas fa-circle-check" style="font-size:40px;color:#10b981;display:block;margin-bottom:12px"></i>
          <div style="font-size:15px;font-weight:600;color:#10b981;margin-bottom:6px">All Good!</div>
          <div style="font-size:13px">No issues found on your asset record.</div>
        </td></tr>`;
      document.getElementById('issue-pagination').innerHTML = '';
      return;
    }

    document.getElementById('issue-count').textContent = `⚠ ${issues.length} issue${issues.length > 1 ? 's' : ''} found on your asset`;
    document.getElementById('issues-tbody').innerHTML = issues.map(i => `
      <tr>
        <td>${emp['TAGGING NO.'] || '-'}</td>
        <td>${cleanNum(emp['Staff No.'])}</td>
        <td>${emp['Name'] || '-'}</td>
        <td><span class="badge badge-dept">${emp['Deptt.'] || '-'}</span></td>
        <td>
          <span style="display:inline-flex;align-items:center;gap:4px;background:${SEV_BG[i.severity]};color:${SEV_COLOR[i.severity]};border:1px solid ${SEV_COLOR[i.severity]}44;border-radius:20px;padding:3px 9px;font-size:11px;font-weight:600;margin:2px">
            <i class="fas fa-circle-exclamation" style="font-size:9px"></i>${i.label}
          </span>
        </td>
        <td><button class="btn-view" onclick="openModal(${EMPLOYEES.indexOf(emp)})">View</button></td>
      </tr>`).join('');
    document.getElementById('issue-pagination').innerHTML = '';
    return;
  }

  // HR / Dept Head full view
  const counts = {};
  ISSUE_CHECKS.forEach(c => counts[c.key] = 0);
  filteredIssues.forEach(r => r.issues.forEach(i => counts[i.key]++));
  document.getElementById('issue-summary-grid').style.display = '';
  document.getElementById('issue-summary-grid').innerHTML = ISSUE_CHECKS.map(c => `
    <div style="background:${SEV_BG[c.severity]};border:1px solid ${SEV_COLOR[c.severity]}33;border-radius:14px;padding:14px 16px;cursor:pointer" onclick="document.getElementById('issue-type-filter').value='${c.key}';filterIssues()">
      <div style="font-size:22px;font-weight:900;color:${SEV_COLOR[c.severity]}">${counts[c.key]}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:4px">${c.label}</div>
    </div>`).join('');

  document.getElementById('issue-count').textContent = `${filteredIssues.length} affected records`;
  renderIssuesTable();
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
