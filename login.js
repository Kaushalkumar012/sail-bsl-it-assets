// ── CONSTANTS ──
const HR_CREDENTIALS = { id: 'HR-ADMIN', pass: 'admin@BSL2024' };
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30000; // 30 seconds

// ── STATE ──
let attempts = 0;
let lockedUntil = 0;
let currentRole = 'staff';

// ── POPULATE DEPT DROPDOWN ──
const depts = [...new Set(EMPLOYEES.map(e => e['Deptt.']).filter(Boolean))].sort();
const deptSel = document.getElementById('dept_select');
depts.forEach(d => {
  const o = document.createElement('option');
  o.value = d; o.textContent = d;
  deptSel.appendChild(o);
});

// Update hint when dept changes
deptSel.addEventListener('change', () => {
  const d = deptSel.value;
  const hint = document.getElementById('dept-pass-hint');
  if (d) hint.innerHTML = `<strong>${d.replace(/\s+/g,'')}@BSL</strong>`;
  else hint.innerHTML = 'DeptName@BSL';
});

// ── ROLE SWITCH ──
function switchRole(role) {
  currentRole = role;
  document.querySelectorAll('.rtab').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-role="${role}"]`).classList.add('active');
  document.querySelectorAll('.fgroup').forEach(f => f.classList.add('hidden'));
  document.getElementById(`${role}-fields`).classList.remove('hidden');
  hideErr();
  attempts = 0;
  document.getElementById('attempts-warn').style.display = 'none';
}

// ── PASSWORD TOGGLE ──
function togglePw(id, btn) {
  const inp = document.getElementById(id);
  const icon = btn.querySelector('i');
  if (inp.type === 'password') {
    inp.type = 'text';
    icon.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    inp.type = 'password';
    icon.classList.replace('fa-eye-slash', 'fa-eye');
  }
}

// ── ERROR HANDLING ──
function showErr(msg) {
  const box = document.getElementById('err-box');
  document.getElementById('err-text').textContent = msg;
  box.classList.remove('hidden');
  box.style.animation = 'none';
  setTimeout(() => box.style.animation = '', 10);
}
function hideErr() {
  document.getElementById('err-box').classList.add('hidden');
}

// ── QUICK FILL (demo) ──
function quickFill(role) {
  switchRole(role);
  if (role === 'staff') {
    document.getElementById('staff_id').value = '726060';
    document.getElementById('staff_pass').value = '726060';
  } else if (role === 'dept') {
    deptSel.value = 'ACVS';
    deptSel.dispatchEvent(new Event('change'));
    document.getElementById('dept_pass').value = 'ACVS@BSL';
  } else {
    document.getElementById('hr_id').value = HR_CREDENTIALS.id;
    document.getElementById('hr_pass').value = HR_CREDENTIALS.pass;
  }
}

// ── LOCKOUT CHECK ──
function isLocked() {
  if (Date.now() < lockedUntil) {
    const secs = Math.ceil((lockedUntil - Date.now()) / 1000);
    showErr(`Too many failed attempts. Please wait ${secs} seconds.`);
    return true;
  }
  return false;
}

function recordFailedAttempt() {
  attempts++;
  const remaining = MAX_ATTEMPTS - attempts;
  const warn = document.getElementById('attempts-warn');
  if (remaining > 0 && remaining <= 3) {
    warn.style.display = 'block';
    warn.textContent = `⚠ ${remaining} attempt${remaining > 1 ? 's' : ''} remaining before temporary lockout`;
  }
  if (attempts >= MAX_ATTEMPTS) {
    lockedUntil = Date.now() + LOCKOUT_MS;
    attempts = 0;
    warn.style.display = 'none';
    showErr('Account temporarily locked for 30 seconds due to multiple failed attempts.');
    setTimeout(() => hideErr(), LOCKOUT_MS);
  }
}

// ── MAIN LOGIN HANDLER ──
function handleLogin(e) {
  e.preventDefault();
  hideErr();
  if (isLocked()) return;

  const btn = document.getElementById('submit-btn');
  const label = document.getElementById('btn-label');
  const loading = document.getElementById('btn-loading');

  btn.disabled = true;
  label.style.display = 'none';
  loading.style.display = 'flex';

  setTimeout(() => {
    btn.disabled = false;
    label.style.display = 'flex';
    loading.style.display = 'none';

    if (currentRole === 'staff') loginStaff();
    else if (currentRole === 'dept') loginDept();
    else loginHR();
  }, 800);
}

// ── STAFF LOGIN ──
function loginStaff() {
  const id = document.getElementById('staff_id').value.trim();
  const pass = document.getElementById('staff_pass').value.trim();

  if (!id) return showErr('Please enter your Staff Number.');
  if (!pass) return showErr('Please enter your password.');
  if (!/^\d{5,7}$/.test(id)) return showErr('Staff Number must be 5–7 digits.');

  const emp = EMPLOYEES.find(e => String(e['Staff No.']).replace('.0', '').trim() === id);
  if (!emp) {
    recordFailedAttempt();
    return showErr('Staff Number not found in records. Please verify your ID.');
  }

  // Password: Staff No. (default) OR P.No. as alternative
  const validPass = [id, emp['P. No.'] || ''].filter(Boolean);
  if (!validPass.includes(pass)) {
    recordFailedAttempt();
    return showErr('Incorrect password. Default password is your Staff Number.');
  }

  sessionStorage.setItem('sail_user', JSON.stringify({
    role: 'staff',
    staffNo: id,
    name: emp['Name'].trim(),
    dept: emp['Deptt.'],
    section: emp['Section'],
    location: emp['Location'],
    tagging: emp['TAGGING NO.'],
    pNo: emp['P. No.']
  }));
  window.location.href = 'dashboard.html';
}

// ── DEPT HEAD LOGIN ──
function loginDept() {
  const dept = deptSel.value;
  const pass = document.getElementById('dept_pass').value.trim();

  if (!dept) return showErr('Please select your department.');
  if (!pass) return showErr('Please enter the department password.');

  // Password: DeptName (no spaces) + @BSL
  const expected = dept.replace(/\s+/g, '') + '@BSL';
  // Also allow master override
  if (pass !== expected && pass !== 'DEPT@BSL2024') {
    recordFailedAttempt();
    return showErr(`Incorrect password. Use: ${expected}`);
  }

  const empCount = EMPLOYEES.filter(e => e['Deptt.'] === dept).length;
  sessionStorage.setItem('sail_user', JSON.stringify({
    role: 'dept_head',
    dept,
    name: `${dept} — Department Head`,
    empCount
  }));
  window.location.href = 'dashboard.html';
}

// ── HR ADMIN LOGIN ──
function loginHR() {
  const id = document.getElementById('hr_id').value.trim();
  const pass = document.getElementById('hr_pass').value.trim();

  if (!id || !pass) return showErr('Please enter Admin ID and Password.');
  if (id !== HR_CREDENTIALS.id) {
    recordFailedAttempt();
    return showErr('Invalid Admin ID.');
  }
  if (pass !== HR_CREDENTIALS.pass) {
    recordFailedAttempt();
    return showErr('Incorrect admin password.');
  }

  sessionStorage.setItem('sail_user', JSON.stringify({
    role: 'hr',
    name: 'HR Administrator',
    id: HR_CREDENTIALS.id
  }));
  window.location.href = 'dashboard.html';
}
