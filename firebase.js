// ===== FIREBASE CONFIG =====
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged }
  from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy }
  from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyDQEiTlAOJSVzg2Y2vj8QS4fa4f8fn1MTQ",
  authDomain: "sail-bsl-it-assets.firebaseapp.com",
  projectId: "sail-bsl-it-assets",
  storageBucket: "sail-bsl-it-assets.firebasestorage.app",
  messagingSenderId: "289297938864",
  appId: "1:289297938864:web:4bb7fcad6b1980958b3e75"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// ===== AUTH HELPERS =====
export function loginUser(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logoutUser() {
  return signOut(auth);
}

export function onAuth(cb) {
  return onAuthStateChanged(auth, cb);
}

// ===== FIRESTORE HELPERS =====
export async function getEmployees() {
  const snap = await getDocs(collection(db, 'employees'));
  return snap.docs.map(d => ({ _id: d.id, ...d.data() }));
}

export async function addEmployee(data) {
  return addDoc(collection(db, 'employees'), data);
}

export async function updateEmployee(id, data) {
  return updateDoc(doc(db, 'employees', id), data);
}

export async function deleteEmployee(id) {
  return deleteDoc(doc(db, 'employees', id));
}

export async function getUserProfile(uid) {
  const snap = await getDocs(query(collection(db, 'users'), where('uid', '==', uid)));
  if (!snap.empty) return snap.docs[0].data();
  return null;
}
