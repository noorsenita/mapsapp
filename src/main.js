// main.js
import './styles.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import gambar icon untuk marker
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Konfigurasi gambar marker
L.Marker.prototype.options.icon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Import fungsi IndexedDB dari file idb.js dihapus dan diganti inline
// import { simpanCeritaOffline, ambilSemuaCeritaOffline, hapusCeritaOffline, simpanFavorite, ambilSemuaFavorite, cekFavorite, hapusFavorite } from './idb.js';

/* ===================== IndexedDB Helper ===================== */
const DB_NAME = 'mapsapp-db';
const DB_VERSION = 2;
const STORE_PENDING = 'pending_posts';
const STORE_FAVORITE = 'favorite-stories';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_PENDING)) {
        db.createObjectStore(STORE_PENDING, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_FAVORITE)) {
        const store = db.createObjectStore(STORE_FAVORITE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
        store.createIndex('name', 'name');
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function simpanCeritaOffline(data) {
  const db = await openDatabase();
  const tx = db.transaction(STORE_PENDING, 'readwrite');
  const store = tx.objectStore(STORE_PENDING);
  store.put(data);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function ambilSemuaCeritaOffline() {
  const db = await openDatabase();
  const tx = db.transaction(STORE_PENDING, 'readonly');
  const store = tx.objectStore(STORE_PENDING);
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function hapusCeritaOffline(id) {
  const db = await openDatabase();
  const tx = db.transaction(STORE_PENDING, 'readwrite');
  const store = tx.objectStore(STORE_PENDING);
  store.delete(id);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function simpanFavorite(cerita) {
  const db = await openDatabase();
  const tx = db.transaction(STORE_FAVORITE, 'readwrite');
  const store = tx.objectStore(STORE_FAVORITE);
  const dataToSave = { ...cerita, savedAt: new Date().toISOString() };
  store.put(dataToSave);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function ambilSemuaFavorite() {
  const db = await openDatabase();
  const tx = db.transaction(STORE_FAVORITE, 'readonly');
  const store = tx.objectStore(STORE_FAVORITE);
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function ambilFavoriteById(id) {
  const db = await openDatabase();
  const tx = db.transaction(STORE_FAVORITE, 'readonly');
  const store = tx.objectStore(STORE_FAVORITE);
  return new Promise((resolve, reject) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function cekFavorite(id) {
  const result = await ambilFavoriteById(id);
  return !!result;
}

async function hapusFavorite(id) {
  const db = await openDatabase();
  const tx = db.transaction(STORE_FAVORITE, 'readwrite');
  const store = tx.objectStore(STORE_FAVORITE);
  store.delete(id);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ===================== PWA & Service Worker ===================== */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('./sw.js');
    } catch (err) {
      console.warn('SW gagal didaftarkan:', err);
    }
  });
}

// Logika install app
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('Event: beforeinstallprompt fired'); // Debugging
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById('btnInstall');
  if (btn) {
    btn.hidden = false;
    // btn.style.display = 'block'; // JANGAN override display, biarkan CSS .linklike handle (inline-block)
  }
});

window.addEventListener('appinstalled', () => {
  console.log('Event: appinstalled fired');
  const btn = document.getElementById('btnInstall');
  if (btn) btn.hidden = true;
  deferredPrompt = null;
});

document.addEventListener('DOMContentLoaded', () => {
  const installBtn = document.getElementById('btnInstall');
  if (installBtn) {
    if (!deferredPrompt) installBtn.hidden = true;
    if (installBtn.dataset.init === 'true') return;
    installBtn.dataset.init = 'true';

    installBtn.addEventListener('click', () => {
      console.log('Install button clicked');
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choice) => {
        console.log('User choice:', choice.outcome);
        if (choice.outcome === 'accepted') {
          installBtn.hidden = true;
        }
        deferredPrompt = null;
      });
    });
  }
});

/* ===================== Helpers ===================== */
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const html = (strings, ...values) => String.raw({ raw: strings }, ...values);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function tampilkanToast(msg, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const el = document.createElement('div');
  el.className = `toast ${type}`;

  // Icon berdasarkan tipe
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';

  el.innerHTML = `<span>${icon}</span><p style="margin:0">${msg}</p>`;
  container.appendChild(el);

  // Auto remove setelah 3 detik
  setTimeout(() => {
    el.style.animation = 'fadeOut 0.3s forwards';
    el.addEventListener('animationend', () => el.remove());
  }, 3000);
}

async function transitionTo(renderFn) {
  const app = document.getElementById('app');
  if (document.startViewTransition) {
    await document.startViewTransition(async () => {
      app.innerHTML = '';
      await renderFn();
    }).finished;
  } else {
    app.classList.add('fade-out');
    await sleep(120);
    app.innerHTML = '';
    await renderFn();
    app.classList.remove('fade-out');
  }
  app.focus();
}

document.addEventListener('DOMContentLoaded', () => {
  $('#year').textContent = new Date().getFullYear();
  const menuBtn = $('#menuBtn');
  const navlinks = $('#navlinks');
  if (menuBtn && navlinks) {
    menuBtn.addEventListener('click', () => {
      const open = navlinks.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
  }
});

/* ===================== API & Auth ===================== */
const API_BASE = 'https://story-api.dicoding.dev/v1';

class AuthModel {
  static get token() {
    return localStorage.getItem('token') || '';
  }
  static set token(v) {
    if (!v) localStorage.removeItem('token');
    else localStorage.setItem('token', v);
  }
  static isLoggedIn() {
    return !!this.token;
  }

  static async register({ name, email, password }) {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Gagal register');
    return data;
  }

  static async login({ email, password }) {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Gagal login');
    this.token = data.loginResult?.token || '';
    return data;
  }

  static logout() {
    this.token = '';
  }
}

class StoriesModel {
  static async list({ withLocation = true, page = 1, size = 30 } = {}) {
    const url = new URL(`${API_BASE}/stories`);
    url.searchParams.set('page', page);
    url.searchParams.set('size', size);
    if (withLocation) url.searchParams.set('location', 1);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${AuthModel.token}` } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Gagal memuat cerita');
    return data;
  }

  static async add({ description, photoFile, lat, lon }) {
    const form = new FormData();
    form.append('description', description);
    form.append('photo', photoFile);
    if (lat != null && lon != null) {
      form.append('lat', String(lat));
      form.append('lon', String(lon));
    }
    const res = await fetch(`${API_BASE}/stories`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${AuthModel.token}` },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Gagal menambah cerita');
    return data;
  }
}

function uuid() {
  return 'p_' + Math.random().toString(36).slice(2) + Date.now();
}

async function addPendingPost({ description, photoBlob, lat, lon }) {
  const id = uuid();
  await simpanCeritaOffline({
    id,
    description,
    lat,
    lon,
    photo: photoBlob,
    createdAt: Date.now(),
  });
  return id;
}

async function listPending() {
  return await ambilSemuaCeritaOffline();
}

async function deletePending(id) {
  await hapusCeritaOffline(id);
}

/* sync helper */
async function syncPendingNow() {
  const all = await listPending();
  if (!all.length) return;
  for (const p of all) {
    try {
      const form = new FormData();
      form.append('description', p.description);
      form.append('photo', new File([p.photoBlob], 'offline.jpg', { type: p.photoBlob?.type || 'image/jpeg' }));
      if (p.lat != null && p.lon != null) {
        form.append('lat', String(p.lat));
        form.append('lon', String(p.lon));
      }
      const resp = await fetch(`${API_BASE}/stories`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${AuthModel.token}` },
        body: form,
      });
      if (!resp.ok) throw new Error('send fail');
      await deletePending(p.id);
      console.log('synced:', p.id);
    } catch (e) {
      console.warn('sync failed for', p.id);
    }
  }
}
window.addEventListener('online', () => {
  if (AuthModel.isLoggedIn()) syncPendingNow();
});

/* ===================== Router ===================== */
class Router {
  constructor() {
    this.routes = {};
    window.addEventListener('hashchange', () => this.handle());
  }
  register(path, handler) {
    this.routes[path] = handler;
  }
  async handle() {
    const path = location.hash.replace('#', '') || '/home';
    const handler = this.routes[path] || this.routes['/404'];
    await transitionTo(() => handler());
    updateAuthLinks();
  }
}
const router = new Router();

/* ===================== Auth links ===================== */
function updateAuthLinks() {
  const authLink = $('#authLink');
  const logoutBtn = $('#logoutBtn');
  const btnNotif = $('#btnNotif');
  if (!authLink || !logoutBtn) return;

  if (AuthModel.isLoggedIn()) {
    authLink.parentElement.style.display = 'none';
    logoutBtn.parentElement.style.display = 'block';
    if (btnNotif) btnNotif.parentElement.style.display = 'block';
  } else {
    authLink.textContent = 'Login';
    authLink.href = '#/login';
    authLink.parentElement.style.display = 'block';
    logoutBtn.parentElement.style.display = 'none';
    if (btnNotif) btnNotif.parentElement.style.display = 'none';
  }
}
const logoutEl = $('#logoutBtn');
if (logoutEl && !logoutEl.dataset.logoutInit) {
  logoutEl.dataset.logoutInit = 'true';
  logoutEl.addEventListener('click', () => {
    const konfirmasi = confirm('Apakah Anda yakin ingin keluar?');
    if (!konfirmasi) return;

    AuthModel.logout();
    tampilkanToast('Berhasil logout!', 'success');
    location.hash = '#/login';
  });
}

/* ===================== 404 ===================== */
router.register('/404', async () => {
  const app = $('#app');
  app.innerHTML = `<section class="card"><h1>Halaman tidak ditemukan</h1>
    <p><a href="#/home">Kembali ke beranda</a></p></section>`;
});

/* ===================== HOME ===================== */
router.register('/home', async () => {
  const app = $('#app');
  const loggedIn = AuthModel.isLoggedIn();

  app.innerHTML = html`
    <section class="grid grid-2">
      <section class="card" aria-labelledby="mapTitle">
        ${loggedIn
          ? `
        <div class="map-toolbar">
          <h1 id="mapTitle" style="margin-right:auto">🗺️ Peta Cerita</h1>
          <label for="tileSelect" class="helper">Tampilan Peta</label>
          <select id="tileSelect" aria-label="Pilih tampilan peta">
            <option value="osm">Standar</option>
            <option value="topo">Topografi</option>
            <option value="sat">Satelit (Esri)</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div id="map" role="application" aria-label="Peta lokasi cerita"></div>
        `
          : `
        <div style="height:480px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#888; background:#f9fafb; border-radius:1rem; border:1px solid #e5e7eb;">
             <p>Silakan login untuk melihat Peta</p>
        </div>
        `}
      </section>

      <section class="card" aria-labelledby="listTitle">
        <div style="display:flex;align-items:center;gap:.5rem;justify-content:space-between">
          <h2 id="listTitle">📃 Daftar Cerita</h2>
          <label for="searchStories" class="sr-only">Cari judul atau deskripsi cerita</label>
          <input id="searchStories" placeholder="Cari nama/teks..." aria-label="Cari cerita" />
        </div>
        <div id="list" class="list" aria-live="polite"></div>
      </section>
    </section>
  `;

  const listEl = $('#list');

  if (!loggedIn) {
    listEl.innerHTML = `
      <div style="text-align:center; padding:2rem;">
        <p class="helper">Silakan <a href="#/login">login</a> untuk melihat daftar cerita.</p>
      </div>
    `;
    const warn = document.createElement('p');
    warn.className = 'helper';
    warn.textContent = 'Tips: login untuk memuat data lengkap (token diperlukan oleh API).';
    app.prepend(warn);
    return;
  }

  // Init Peta
  const m = L.map('map', { zoomControl: true }).setView([-2, 118], 4);
  const layers = {
    osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }),
    topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenTopoMap' }),
    sat: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; Esri' }),
    dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; Carto' }),
  };
  layers.osm.addTo(m);

  const group = L.layerGroup().addTo(m);
  const markerById = new Map();

  // Event Listener Select Box Peta
  const tileSelect = document.getElementById('tileSelect');
  if (tileSelect) {
    tileSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      Object.values(layers).forEach((l) => l.remove()); // remove all layers
      if (layers[val]) layers[val].addTo(m);
    });
  }

  function renderItem(s = {}, opts = {}) {
    const el = document.createElement('article');
    el.className = 'item';
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `Cerita oleh ${s.name || 'anonim'}`);
    el.innerHTML = `
      <img src="${s.photoUrl || ''}" alt="Foto cerita" loading="lazy" />
      <div>
        <strong>${s.name || 'Tanpa Nama'}</strong>
        <p class="helper">${s.createdAt ? new Date(s.createdAt).toLocaleString() : ''}</p>
        <p>${s.description ? String(s.description).replace(/</g, '&lt;') : '-'}</p>
        <div style="margin-top:.5rem; display:flex; gap:.5rem">
          ${opts.showSave ? `<button class="btn-save" data-act="save" data-id="${s.id}"> Simpan</button>` : ''}
        </div>
      </div>
    `;
    el.addEventListener('click', (ev) => {
      if (ev.target && ev.target.dataset && ev.target.dataset.act) return;
      const mk = markerById.get(s.id);
      if (mk) {
        m.setView(mk.getLatLng(), 10, { animate: true });
        mk.openPopup();
      }
    });
    el.addEventListener('mouseenter', () => {
      const mk = markerById.get(s.id);
      if (mk) mk.setZIndexOffset(9999);
    });
    el.addEventListener('mouseleave', () => {
      const mk = markerById.get(s.id);
      if (mk) mk.setZIndexOffset(0);
    });
    el.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        const mk = markerById.get(s.id);
        if (mk) {
          m.setView(mk.getLatLng(), 10, { animate: true });
          mk.openPopup();
        }
      }
    });
    return el;
  }

  async function drawList(items) {
    const safeItems = Array.isArray(items) ? items : [];
    group.clearLayers();
    markerById.clear();
    listEl.innerHTML = '';

    safeItems.forEach((s) => {
      if (typeof s.lat === 'number' && typeof s.lon === 'number') {
        const mk = L.marker([s.lat, s.lon]);
        mk.addTo(group).bindPopup(`<strong>${s.name || ''}</strong><br/>${s.description || ''}`);
        markerById.set(s.id, mk);
      }
      listEl.appendChild(renderItem(s, { showSave: true }));
    });
  }

  let items = [];
  try {
    const { listStory } = await StoriesModel.list({ withLocation: true, size: 50 });
    items = Array.isArray(listStory) ? listStory : [];
  } catch (err) {
    listEl.insertAdjacentHTML('afterbegin', `<p class="helper">Tidak dapat memuat data. Cek koneksi internet atau lihat <a href="#/stories-saved">cerita tersimpan</a>.</p>`);
    items = [];
  }
  await drawList(items);

  listEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    const act = btn.dataset.act;
    if (act === 'save') {
      const story = items.find((x) => String(x.id) === String(id));
      if (!story) {
        tampilkanToast('Cerita tidak ditemukan.', 'error');
        return;
      }
      try {
        const sudahAda = await cekFavorite(story.id);
        if (sudahAda) {
          tampilkanToast('Cerita ini sudah ada di Tersimpan.', 'info');
          return;
        }
        await simpanFavorite(story);
        tampilkanToast('Cerita disimpan ke Tersimpan!', 'success');
        btn.innerHTML = '✅ Tersimpan';
        btn.disabled = true;
      } catch (err) {
        console.error(err);
        tampilkanToast('Gagal menyimpan cerita.', 'error');
      }
    }
  });

  const searchBox = $('#searchStories');
  if (searchBox) {
    searchBox.addEventListener('input', async (e) => {
      const q = (e.target.value || '').toLowerCase();
      let filtered = items;
      if (q) {
        filtered = items.filter((it) => (it.name || '').toLowerCase().includes(q) || (it.description || '').toLowerCase().includes(q));
      }
      await drawList(filtered);
    });
  }
});

/* ===================== LOGIN ===================== */
router.register('/login', async () => {
  const app = $('#app');
  app.innerHTML = html` <section class="card" style="max-width:560px; margin: 0 auto;">
    <h1>Masuk</h1>
    <p class="helper">Belum punya akun? <a href="#/register">Daftar</a></p>
    <form id="loginForm" novalidate>
      <label for="lemail">Email</label>
      <input id="lemail" type="email" name="email" required autocomplete="username" />
      <label for="lpass">Kata sandi</label>
      <input id="lpass" type="password" name="password" required minlength="6" autocomplete="current-password" />
      <div style="display:flex; gap:.5rem; margin-top:.75rem">
        <button class="primary" type="submit">Login</button>
        <button class="secondary" type="button" id="btnBatal">Batal</button>
      </div>
      <p id="lmsg" class="helper" aria-live="polite"></p>
    </form>
  </section>`;

  // Event handler untuk tombol Batal
  $('#btnBatal').addEventListener('click', () => {
    if (history.length > 1) {
      history.back();
    } else {
      location.hash = '#/home';
    }
  });

  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#lemail').value.trim();
    const password = $('#lpass').value.trim();
    const msg = $('#lmsg');
    msg.textContent = 'Memproses...';
    try {
      await AuthModel.login({ email, password });
      msg.textContent = 'Berhasil login.';
      location.hash = '#/home';
      syncPendingNow();
    } catch (err) {
      msg.textContent = err.message;
      msg.classList.add('error');
    }
  });
});

/* ===================== REGISTER ===================== */
router.register('/register', async () => {
  const app = $('#app');
  app.innerHTML = html` <section class="card" style="max-width:560px; margin: 0 auto;">
    <h1>Daftar</h1>
    <form id="regForm" novalidate>
      <label for="rname">Nama</label>
      <input id="rname" type="text" name="name" required />
      <label for="remail">Email</label>
      <input id="remail" type="email" name="email" required autocomplete="username" />
      <label for="rpass">Kata sandi</label>
      <input id="rpass" type="password" name="password" required minlength="6" autocomplete="new-password" />
      <div style="display:flex; gap:.5rem; margin-top:.75rem">
        <button class="primary" type="submit">Buat Akun</button>
        <a class="secondary" href="#/login" role="button">Sudah punya akun</a>
      </div>
      <p id="rmsg" class="helper" aria-live="polite"></p>
    </form>
  </section>`;

  $('#regForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('#rname').value.trim();
    const email = $('#remail').value.trim();
    const password = $('#rpass').value.trim();
    const msg = $('#rmsg');
    msg.textContent = 'Mendaftarkan...';
    try {
      await AuthModel.register({ name, email, password });
      msg.textContent = 'Registrasi berhasil, silakan login.';
      location.hash = '#/login';
    } catch (err) {
      msg.textContent = err.message;
      msg.classList.add('error');
    }
  });
});

/* ===================== ADD STORY (online/offline queue) ===================== */
router.register('/add', async () => {
  if (!AuthModel.isLoggedIn()) {
    location.hash = '#/login';
    return;
  }

  const app = $('#app');
  app.innerHTML = html`
    <section class="grid grid-2">
      <section class="card">
        <h1>📍 Pilih Lokasi</h1>
        <p class="helper">Klik pada peta untuk memilih latitude/longitude.</p>
        <div id="map" aria-label="Peta pemilihan lokasi"></div>
      </section>

      <section class="card">
        <h2>📝 Tambah Cerita</h2>
        <form id="addForm" novalidate>
          <label for="desc">Deskripsi</label>
          <textarea id="desc" name="description" rows="4" required placeholder="Tulis deskripsi singkat..."></textarea>

          <fieldset style="border:1px solid #263042; border-radius:.75rem; padding: .75rem; margin-top:.75rem;">
            <legend>Gambar</legend>
            <div style="display:flex; gap:1rem; flex-wrap:wrap">
              <div style="display:flex; align-items:center; gap:0.25rem">
                <input type="radio" id="sourceFile" name="imgsrc" value="file" checked />
                <label for="sourceFile">Upload File</label>
              </div>
              <div style="display:flex; align-items:center; gap:0.25rem">
                <input type="radio" id="sourceCam" name="imgsrc" value="camera" />
                <label for="sourceCam">Kamera</label>
              </div>
            </div>
            <div id="fileWrap">
              <label for="photo">Pilih Berkas</label>
              <input id="photo" type="file" accept="image/*" required />
            </div>
            <div id="camWrap" hidden>
              <video id="cam" autoplay playsinline width="100%" aria-label="Pratinjau kamera"></video>
              <div style="display:flex; gap:.5rem; margin-top:.5rem">
                <button class="secondary" id="snapBtn" type="button">Ambil Foto</button>
                <button class="danger" id="stopCamBtn" type="button">Matikan Kamera</button>
              </div>
              <canvas id="frame" hidden></canvas>
              <p id="camMsg" class="helper"></p>
            </div>
          </fieldset>

          <div class="grid" style="grid-template-columns: 1fr 1fr; margin-top:.75rem">
            <div>
              <label for="lat">Latitude</label>
              <input id="lat" type="text" inputmode="decimal" aria-describedby="latHelp" required />
              <p id="latHelp" class="helper">Diisi otomatis saat klik peta.</p>
            </div>
            <div>
              <label for="lon">Longitude</label>
              <input id="lon" type="text" inputmode="decimal" aria-describedby="lonHelp" required />
              <p id="lonHelp" class="helper">Diisi otomatis saat klik peta.</p>
            </div>
          </div>

          <div style="display:flex; gap:.5rem; margin-top:.75rem">
            <button class="primary" type="submit">Kirim</button>
            <button class="secondary" id="btnCancelAdd" type="button">Batal</button>
          </div>
          <p id="msg" class="helper" aria-live="polite"></p>
        </form>
      </section>
    </section>
  `;

  // Map picker
  const m = L.map('map').setView([-2, 118], 4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(m);
  let pickMarker;
  m.on('click', (ev) => {
    const { lat, lng } = ev.latlng;
    $('#lat').value = lat.toFixed(6);
    $('#lon').value = lng.toFixed(6);
    if (!pickMarker) pickMarker = L.marker([lat, lng]).addTo(m);
    else pickMarker.setLatLng([lat, lng]);
  });

  // Camera
  let stream = null;
  const fileWrap = $('#fileWrap');
  const camWrap = $('#camWrap');
  const cam = $('#cam');
  const frame = $('#frame');
  const camMsg = $('#camMsg');
  const snapBtn = $('#snapBtn');
  const stopCamBtn = $('#stopCamBtn');

  async function startCamera() {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    cam.srcObject = stream;
    camMsg.textContent = 'Kamera aktif. Tekan "Ambil Foto" untuk mengambil gambar.';
  }
  function stopCamera() {
    if (stream) {
      for (const t of stream.getTracks()) t.stop();
      stream = null;
      cam.srcObject = null;
    }
    camMsg.textContent = 'Kamera dimatikan.';
  }

  $$('input[name="imgsrc"]').forEach((r) =>
    r.addEventListener('change', async (e) => {
      if (e.target.value === 'camera') {
        fileWrap.hidden = true;
        $('#photo').required = false;
        camWrap.hidden = false;
        try {
          await startCamera();
        } catch {
          camMsg.textContent = 'Gagal mengakses kamera.';
        }
      } else {
        camWrap.hidden = true;
        fileWrap.hidden = false;
        $('#photo').required = true;
        stopCamera();
      }
    })
  );

  snapBtn.addEventListener('click', () => {
    if (!stream) return;
    const w = cam.videoWidth,
      h = cam.videoHeight;
    frame.width = w;
    frame.height = h;
    frame.getContext('2d').drawImage(cam, 0, 0, w, h);
    frame.hidden = false;
    camMsg.textContent = 'Foto diambil. Form akan mengirim hasil tangkapan ini.';
  });
  stopCamBtn.addEventListener('click', stopCamera);
  window.addEventListener('hashchange', stopCamera, { once: true }); // stop saat pindah halaman

  // ===== helper untuk ambil foto sebagai Blob =====
  async function getPhotoBlob() {
    const mode = $$('input[name="imgsrc"]').find((r) => r.checked).value;
    if (mode === 'camera' && !frame.hidden) {
      return await new Promise((res) => frame.toBlob(res, 'image/jpeg', 0.9));
    }
    const f = $('#photo').files[0];
    if (!f) return null;
    return f instanceof Blob ? f : new Blob([await f.arrayBuffer()], { type: f.type || 'image/jpeg' });
  }

  // Tombol Batal logic
  $('#btnCancelAdd').addEventListener('click', () => {
    // Jika ada history kembali, jika tidak ke home
    if (window.history.length > 1) {
      window.history.back();
    } else {
      location.hash = '#/home';
    }
  });

  // ===== Submit: Online dulu, gagal -> simpan ke IndexedDB =====
  $('#addForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('#msg');
    msg.textContent = 'Mengirim...';

    const description = $('#desc').value.trim();
    const lat = parseFloat($('#lat').value);
    const lon = parseFloat($('#lon').value);
    if (!description || Number.isNaN(lat) || Number.isNaN(lon)) {
      msg.textContent = 'Mohon isi deskripsi dan pilih lokasi di peta.';
      msg.classList.add('error');
      return;
    }

    try {
      const photoBlob = await getPhotoBlob();
      if (!photoBlob) throw new Error('Silakan pilih/ambil gambar.');

      // coba online
      const photoFile = new File([photoBlob], 'photo.jpg', { type: photoBlob.type || 'image/jpeg' });
      await StoriesModel.add({ description, photoFile, lat, lon });

      msg.textContent = 'Berhasil menambah cerita.';
      location.hash = '#/home';
    } catch (err) {
      // offline / gagal → simpan ke pending_posts
      try {
        const photoBlob = await getPhotoBlob();
        if (!photoBlob) throw err;
        await addPendingPost({ description, photoBlob, lat, lon });
        msg.textContent = 'Offline: disimpan ke antrian. Akan dikirim saat online.';
      } catch (e2) {
        msg.textContent = err.message || 'Gagal menambah cerita.';
        msg.classList.add('error');
      }
    }
  });
});

/* ===================== TERSIMPAN (IndexedDB UI for pending posts) ===================== */
router.register('/saved', async () => {
  const app = document.getElementById('app');
  app.innerHTML = html`
    <section class="card">
      <h1>📂 Laporan Tersimpan (Offline)</h1>
      <p class="helper">Ini antrian kiriman saat offline. Kamu bisa hapus atau kirim sekarang.</p>
      <div style="display:flex; gap:.5rem; margin:.5rem 0">
        <button id="btnSyncAll" class="primary">Kirim Semua Sekarang</button>
        <button id="btnRefreshSaved" class="secondary">Muat Ulang</button>
      </div>
      <div id="savedList" class="list"></div>
      <p id="savedMsg" class="helper" aria-live="polite"></p>
    </section>
  `;

  const listEl = document.getElementById('savedList');
  const msgEl = document.getElementById('savedMsg');

  async function renderSaved() {
    listEl.innerHTML = '';
    const rows = await listPending();
    if (!rows.length) {
      listEl.innerHTML = `<p class="helper">Tidak ada laporan tersimpan.</p>`;
      return;
    }
    for (const r of rows) {
      const el = document.createElement('article');
      el.className = 'item';
      const time = new Date(r.createdAt || Date.now()).toLocaleString();
      el.innerHTML = `
        <div>
          <strong>${(r.description || '').slice(0, 60) || '(tanpa deskripsi)'}</strong>
          <p class="helper">${time} — ${r.lat ?? '-'}, ${r.lon ?? '-'}</p>
          <div style="display:flex; gap:.5rem; margin-top:.5rem">
            <button class="primary" data-act="send" data-id="${r.id}">Kirim</button>
            <button class="danger"  data-act="del"  data-id="${r.id}">Hapus</button>
          </div>
        </div>
      `;
      listEl.appendChild(el);
    }
  }

  listEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    const act = btn.dataset.act;

    if (act === 'del') {
      await deletePending(id);
      await renderSaved();
      msgEl.textContent = 'Item dihapus.';
    } else if (act === 'send') {
      const rows = await listPending();
      const p = rows.find((x) => x.id === id);
      if (!p) return;
      try {
        const form = new FormData();
        form.append('description', p.description);
        form.append('photo', new File([p.photoBlob], 'offline.jpg', { type: p.photoBlob?.type || 'image/jpeg' }));
        if (p.lat != null && p.lon != null) {
          form.append('lat', String(p.lat));
          form.append('lon', String(p.lon));
        }
        const resp = await fetch(`${API_BASE}/stories`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${AuthModel.token}` },
          body: form,
        });
        if (!resp.ok) throw new Error('Gagal kirim');
        await deletePending(id);
        await renderSaved();
        msgEl.textContent = 'Berhasil dikirim.';
      } catch (err) {
        msgEl.textContent = 'Gagal mengirim. Cek koneksi/token.';
      }
    }
  });

  document.getElementById('btnRefreshSaved').addEventListener('click', renderSaved);
  document.getElementById('btnSyncAll').addEventListener('click', async () => {
    msgEl.textContent = 'Menyinkronkan...';
    await syncPendingNow();
    await renderSaved();
    msgEl.textContent = 'Sinkronisasi selesai.';
  });

  await renderSaved();
});

/* ===================== STORIES-SAVED (Cerita Favorite User) ===================== */
router.register('/stories-saved', async () => {
  const app = document.getElementById('app');
  app.innerHTML = html`
    <section class="card">
      <h1>🔖 Cerita Tersimpan</h1>
      <p class="helper">Cerita yang kamu simpan secara lokal (IndexedDB).</p>
      <div style="display:flex; gap:.5rem; margin:.5rem 0">
        <button id="btnRefreshLocal" class="secondary">Muat Ulang</button>
      </div>
      <div id="localList" class="list"></div>
      <p id="localMsg" class="helper" aria-live="polite"></p>
    </section>
  `;

  const listEl = document.getElementById('localList');
  const msgEl = document.getElementById('localMsg');

  async function renderLocal() {
    listEl.innerHTML = '';
    msgEl.textContent = '';
    const rows = await ambilSemuaFavorite();
    if (!rows.length) {
      listEl.innerHTML = `<p class="helper">Belum ada cerita tersimpan. Simpan cerita dari halaman <a href="#/home">Home</a>.</p>`;
      return;
    }
    msgEl.textContent = rows.length + ' cerita tersimpan';
    for (const r of rows) {
      const el = document.createElement('article');
      el.className = 'item';
      const time = new Date(r.createdAt || Date.now()).toLocaleString();
      el.innerHTML = `
        <img src="${r.photoUrl || ''}" alt="Foto cerita" loading="lazy" />
        <div>
          <strong>${r.name || '(Tanpa Nama)'}</strong>
          <p class="helper">${time}</p>
          <p>${(r.description || '').slice(0, 200)}</p>
          <div style="display:flex; gap:.5rem; margin-top:.5rem">
            <button class="danger" data-act="del" data-id="${r.id}">Hapus</button>
          </div>
        </div>
      `;
      listEl.appendChild(el);
    }
  }

  listEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    const act = btn.dataset.act;
    if (act === 'del') {
      if (!confirm('Hapus cerita ini dari Tersimpan?')) return;
      await hapusFavorite(id);
      await renderLocal();
      tampilkanToast('Cerita berhasil dihapus dari Tersimpan.', 'success');
    }
  });

  document.getElementById('btnRefreshLocal').addEventListener('click', renderLocal);

  await renderLocal();
});

/* ================== PUSH NOTIFICATION ================== */
const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function ensurePermission() {
  if (!('Notification' in window)) throw new Error('Browser tidak mendukung Notification API');
  if (Notification.permission === 'granted') return true;
  const res = await Notification.requestPermission();
  if (res !== 'granted') throw new Error('Izin notifikasi ditolak');
  return true;
}

if ('serviceWorker' in navigator && 'PushManager' in window) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const btn = document.getElementById('btnNotif');
      if (!btn) return;

      // Prevent double listener attachment (khususnya saat HMR/Hot Reload)
      if (btn.dataset.init === 'true') return;
      btn.dataset.init = 'true';

      async function refreshLabel() {
        const sub = await reg.pushManager.getSubscription();
        btn.textContent = sub ? '🔕 Matikan Notifikasi' : '🔔 Aktifkan Notifikasi';
      }

      async function sendSubscriptionToServer(subscription) {
        // POST ke endpoint /notifications/subscribe sesuai dokumentasi API Dicoding
        try {
          const subscriptionJSON = subscription.toJSON();
          const resp = await fetch(`${API_BASE}/notifications/subscribe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(AuthModel.isLoggedIn() ? { Authorization: `Bearer ${AuthModel.token}` } : {}),
            },
            // Format payload sesuai dokumentasi: { endpoint, keys: { p256dh, auth } }
            body: JSON.stringify({
              endpoint: subscriptionJSON.endpoint,
              keys: {
                p256dh: subscriptionJSON.keys.p256dh,
                auth: subscriptionJSON.keys.auth,
              },
            }),
          });
          const data = await resp.json().catch(() => ({}));
          if (!resp.ok) throw new Error(data.message || 'Gagal mengirim subscription ke server');
          console.log('Subscription berhasil dikirim:', data);
          return data;
        } catch (e) {
          console.error('Gagal kirim subscription:', e);
          throw e;
        }
      }

      async function removeSubscriptionOnServer(subscription) {
        // DELETE ke endpoint /notifications/subscribe
        try {
          const subscriptionJSON = subscription.toJSON();
          await fetch(`${API_BASE}/notifications/subscribe`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              ...(AuthModel.isLoggedIn() ? { Authorization: `Bearer ${AuthModel.token}` } : {}),
            },
            body: JSON.stringify({ endpoint: subscriptionJSON.endpoint }),
          });
          console.log('Berhasil unsubscribe dari server');
        } catch (e) {
          console.warn('Gagal unsubscribe dari server:', e);
        }
      }

      btn.addEventListener('click', async () => {
        try {
          const current = await reg.pushManager.getSubscription();
          if (current) {
            // unsubscribe
            await current.unsubscribe();
            await removeSubscriptionOnServer(current);
            tampilkanToast('Notifikasi dimatikan.', 'info');
          } else {
            await ensurePermission();
            const sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
            // POST subscription to API (important: reviewer asked to ensure a POST)
            try {
              await sendSubscriptionToServer(sub);
            } catch (err) {
              // if server failed, try to unsubscribe to avoid dangling subscription
              try {
                await sub.unsubscribe();
              } catch (_) {}
              throw err;
            }
            console.log('PushSubscription:', JSON.stringify(sub));
            tampilkanToast('Berhasil aktifkan notifikasi!', 'success');
          }
          await refreshLabel();
        } catch (e) {
          console.error(e);
          tampilkanToast(e.message || 'Gagal mengubah status langganan.', 'error');
        }
      });

      await refreshLabel();
    } catch (e) {
      console.warn('Push not available:', e);
    }
  });
}

/* ===================== finalize router ===================== */
router.handle();
