import { loginUser, onAuth, db } from './firebase.js';
import { collection, query, where, getDocs }
  from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ── If already logged in, redirect ──
onAuth(async user => {
  if (user) await loadProfileAndRedirect(user.uid);
});

async function loadProfileAndRedirect(uid) {
  const snap = await getDocs(query(collection(db, 'users'), where('uid', '==', uid)));
  if (!snap.empty) {
    const profile = snap.docs[0].data();
    // validate selected role matches actual role
    const selected = window.selectedRole || 'staff';
    const actual   = profile.role || 'staff';
    // admin can login from any tab
    if (actual !== 'admin' && selected !== actual) {
      showErr(`This account is registered as "${roleLabel(actual)}". Please select the correct role.`);
      resetBtn();
      return;
    }
    sessionStorage.setItem('sail_user', JSON.stringify({
      uid,
      name:    profile.name,
      role:    actual,
      dept:    profile.dept    || '',
      staffNo: profile.staffNo || '',
    }));
  }
  window.location.href = 'dashboard.html';
}

function roleLabel(r) {
  return r === 'admin' ? 'IT Admin' : r === 'hr' ? 'Dept. Admin' : 'Staff';
}

function resetBtn() {
  const btn = document.getElementById('submit-btn');
  document.getElementById('btn-label').style.display = 'flex';
  document.getElementById('btn-loading').style.display = 'none';
  btn.disabled = false;
}

// ── Error handling ──
function showErr(msg) {
  const box = document.getElementById('err-box');
  document.getElementById('err-text').textContent = msg;
  box.classList.remove('hidden');
}
function hideErr() {
  document.getElementById('err-box').classList.add('hidden');
}

// ── Password toggle ──
window.togglePw = function(id, btn) {
  const inp  = document.getElementById(id);
  const icon = btn.querySelector('i');
  if (inp.type === 'password') {
    inp.type = 'text';
    icon.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    inp.type = 'password';
    icon.classList.replace('fa-eye-slash', 'fa-eye');
  }
};

// ── Login handler ──
window.handleLogin = async function(e) {
  e.preventDefault();
  hideErr();

  const staffNo  = document.getElementById('login-email').value.trim().replace(/\.0$/, '');
  const password = document.getElementById('login-password').value.trim();

  if (!staffNo || !password) return showErr('Please enter Staff No. and password.');

  const email = `${staffNo}@sail.bsl`;

  const btn     = document.getElementById('submit-btn');
  const label   = document.getElementById('btn-label');
  const loading = document.getElementById('btn-loading');

  btn.disabled = true;
  label.style.display = 'none';
  loading.style.display = 'flex';

  try {
    await loginUser(email, password);
    // onAuth listener above will handle redirect
  } catch(err) {
    btn.disabled = false;
    label.style.display = 'flex';
    loading.style.display = 'none';

    if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      showErr('Invalid Staff No. or password.');
    } else if (err.code === 'auth/too-many-requests') {
      showErr('Too many failed attempts. Please try again later.');
    } else {
      showErr('Login failed. Please try again.');
    }
  }
};
