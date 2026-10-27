/**
 * WarungKas - Fondasi Tahap 1
 * Stack: Pure Vanilla JS + IndexedDB + Web Crypto API (PBKDF2-HMAC-SHA-256)
 */

// --- 1. KONFIGURASI & VARIABEL STATE ---
const DB_NAME = 'warungkas';
const DB_VERSION = 1;
const PBKDF2_ITERATIONS = 100000;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60000;

let dbInstance = null;
let currentUser = null;
let currentEnteredPin = '';
let lockoutTimerInterval = null;

// --- 2. HELPER UTILITAS UMUM ---
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function formatRp(nominal) {
  const intVal = Math.round(Number(nominal) || 0);
  return 'Rp ' + intVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function bufToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuf(hexString) {
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hexString.substr(i * 2, 2), 16);
  }
  return bytes.buffer;
}

// --- 3. KRIPTOGRAFI (PBKDF2-HMAC-SHA-256) ---
async function hashPin(pin, existingSaltHex = null) {
  const enc = new TextEncoder();
  const salt = existingSaltHex
    ? hexToBuf(existingSaltHex)
    : crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  return {
    hash: bufToHex(derivedBits),
    salt: bufToHex(salt),
    iterations: PBKDF2_ITERATIONS
  };
}

async function verifyPin(pin, storedHash, storedSalt, storedIterations) {
  const enc = new TextEncoder();
  const salt = hexToBuf(storedSalt);
  const iterations = storedIterations || PBKDF2_ITERATIONS;

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  return bufToHex(derivedBits) === storedHash;
}

// --- 4. INISIALISASI INDEXEDDB (SKEMA PRD v1.2 + AMENDEMEN v1.3) ---
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (e) => reject(e.target.error);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;

      // 1. produk (keyPath: 'id')
      if (!db.objectStoreNames.contains('produk')) {
        db.createObjectStore('produk', { keyPath: 'id' });
      }

      // 2. satuan_produk (keyPath: 'id')
      if (!db.objectStoreNames.contains('satuan_produk')) {
        db.createObjectStore('satuan_produk', { keyPath: 'id' });
      }

      // 3. pergerakan_stok (keyPath: 'id', index: produk_id)
      if (!db.objectStoreNames.contains('pergerakan_stok')) {
        const os = db.createObjectStore('pergerakan_stok', { keyPath: 'id' });
        os.createIndex('produk_id', 'produk_id', { unique: false });
      }

      // 4. kasir / pengguna (keyPath: 'id')
      if (!db.objectStoreNames.contains('kasir')) {
        db.createObjectStore('kasir', { keyPath: 'id' });
      }

      // 5. shift (keyPath: 'id')
      if (!db.objectStoreNames.contains('shift')) {
        db.createObjectStore('shift', { keyPath: 'id' });
      }

      // 6. transaksi (keyPath: 'id', index: shift_id, waktu)
      if (!db.objectStoreNames.contains('transaksi')) {
        const os = db.createObjectStore('transaksi', { keyPath: 'id' });
        os.createIndex('shift_id', 'shift_id', { unique: false });
        os.createIndex('waktu', 'waktu', { unique: false });
      }

      // 7. transaksi_item (keyPath: 'id', index: transaksi_id)
      if (!db.objectStoreNames.contains('transaksi_item')) {
        const os = db.createObjectStore('transaksi_item', { keyPath: 'id' });
        os.createIndex('transaksi_id', 'transaksi_id', { unique: false });
      }

      // 8. pembayaran_transaksi (keyPath: 'id', index: transaksi_id)
      if (!db.objectStoreNames.contains('pembayaran_transaksi')) {
        const os = db.createObjectStore('pembayaran_transaksi', { keyPath: 'id' });
        os.createIndex('transaksi_id', 'transaksi_id', { unique: false });
      }

      // 9. pelanggan_bon (keyPath: 'id')
      if (!db.objectStoreNames.contains('pelanggan_bon')) {
        db.createObjectStore('pelanggan_bon', { keyPath: 'id' });
      }

      // 10. bon (keyPath: 'id', index: pelanggan_id, status)
      if (!db.objectStoreNames.contains('bon')) {
        const os = db.createObjectStore('bon', { keyPath: 'id' });
        os.createIndex('pelanggan_id', 'pelanggan_id', { unique: false });
        os.createIndex('status', 'status', { unique: false });
      }

      // 11. pembayaran_bon (keyPath: 'id', index: bon_id)
      if (!db.objectStoreNames.contains('pembayaran_bon')) {
        const os = db.createObjectStore('pembayaran_bon', { keyPath: 'id' });
        os.createIndex('bon_id', 'bon_id', { unique: false });
      }

      // 12. pengeluaran_kas (keyPath: 'id', index: shift_id)
      if (!db.objectStoreNames.contains('pengeluaran_kas')) {
        const os = db.createObjectStore('pengeluaran_kas', { keyPath: 'id' });
        os.createIndex('shift_id', 'shift_id', { unique: false });
      }

      // 13. void_transaksi (keyPath: 'id', index: transaksi_id)
      if (!db.objectStoreNames.contains('void_transaksi')) {
        const os = db.createObjectStore('void_transaksi', { keyPath: 'id' });
        os.createIndex('transaksi_id', 'transaksi_id', { unique: false });
      }

      // 14. void_detail (keyPath: 'id', index: void_id)
      if (!db.objectStoreNames.contains('void_detail')) {
        const os = db.createObjectStore('void_detail', { keyPath: 'id' });
        os.createIndex('void_id', 'void_id', { unique: false });
      }

      // 15. log_aktivitas (keyPath: 'id', index: waktu)
      if (!db.objectStoreNames.contains('log_aktivitas')) {
        const os = db.createObjectStore('log_aktivitas', { keyPath: 'id' });
        os.createIndex('waktu', 'waktu', { unique: false });
      }

      // 16. pengaturan (keyPath: 'kunci')
      if (!db.objectStoreNames.contains('pengaturan')) {
        db.createObjectStore('pengaturan', { keyPath: 'kunci' });
      }
    };

    request.onsuccess = (e) => resolve(e.target.result);
  });
}

// --- 5. LOGGING AKTIVITAS TERPUSAT ---
async function catatLog(penggunaId, aksi, objek, detail) {
  if (!dbInstance) return;
  const entry = {
    id: generateUUID(),
    pengguna_id: penggunaId || 'sistem',
    waktu: new Date().toISOString(),
    aksi: aksi,
    objek: objek,
    detail: typeof detail === 'object' ? JSON.stringify(detail) : String(detail)
  };

  return new Promise((resolve) => {
    const tx = dbInstance.transaction(['log_aktivitas'], 'readwrite');
    const store = tx.objectStore('log_aktivitas');
    store.add(entry);
    tx.oncomplete = () => resolve(entry);
    tx.onerror = () => resolve(null);
  });
}

// --- 6. OPERASI DATABASE HELPER ---
function getPengaturan(kunci) {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(['pengaturan'], 'readonly');
    const store = tx.objectStore('pengaturan');
    const req = store.get(kunci);
    req.onsuccess = () => resolve(req.result ? req.result.nilai : null);
    req.onerror = () => reject(req.error);
  });
}

function setPengaturan(kunci, nilai) {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(['pengaturan'], 'readwrite');
    const store = tx.objectStore('pengaturan');
    const req = store.put({ kunci: kunci, nilai: nilai });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function getAllUsers() {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(['kasir'], 'readonly');
    const store = tx.objectStore('kasir');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function getUserById(id) {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(['kasir'], 'readonly');
    const store = tx.objectStore('kasir');
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function saveUser(user) {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(['kasir'], 'readwrite');
    const store = tx.objectStore('kasir');
    const req = store.put(user);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function getRecentLogs(limit = 20) {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(['log_aktivitas'], 'readonly');
    const store = tx.objectStore('log_aktivitas');
    const index = store.index('waktu');
    const req = index.openCursor(null, 'prev');
    const results = [];

    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor && results.length < limit) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

// --- 7. NAVIGASI TAMPILAN ---
function showView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  const target = document.getElementById(viewId);
  if (target) {
    target.classList.remove('hidden');
  }
}

// --- 8. ALUR AUTENTIKASI & LOCKOUT ---
function getLockoutState() {
  const lockedUntil = parseInt(localStorage.getItem('wk_lockout_until') || '0', 10);
  const failedAttempts = parseInt(localStorage.getItem('wk_failed_attempts') || '0', 10);
  const now = Date.now();
  return {
    isLocked: lockedUntil > now,
    remainingSeconds: Math.ceil((lockedUntil - now) / 1000),
    failedAttempts: failedAttempts
  };
}

function recordFailedAttempt() {
  let attempts = parseInt(localStorage.getItem('wk_failed_attempts') || '0', 10) + 1;
  localStorage.setItem('wk_failed_attempts', attempts.toString());

  if (attempts >= MAX_LOGIN_ATTEMPTS) {
    const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
    localStorage.setItem('wk_lockout_until', lockoutUntil.toString());
  }
}

function resetFailedAttempts() {
  localStorage.removeItem('wk_failed_attempts');
  localStorage.removeItem('wk_lockout_until');
}

function updateLockoutUI() {
  const lockout = getLockoutState();
  const lockoutMsg = document.getElementById('login-lockout-msg');
  const timerSpan = document.getElementById('lockout-timer');
  const keypad = document.getElementById('login-keypad');
  const btnSubmit = document.getElementById('btn-login-submit');

  if (lockout.isLocked) {
    lockoutMsg.classList.remove('hidden');
    timerSpan.textContent = lockout.remainingSeconds;
    keypad.style.pointerEvents = 'none';
    keypad.style.opacity = '0.4';
    btnSubmit.disabled = true;

    if (!lockoutTimerInterval) {
      lockoutTimerInterval = setInterval(() => {
        const state = getLockoutState();
        if (state.isLocked) {
          timerSpan.textContent = state.remainingSeconds;
        } else {
          clearInterval(lockoutTimerInterval);
          lockoutTimerInterval = null;
          resetFailedAttempts();
          updateLockoutUI();
        }
      }, 1000);
    }
  } else {
    lockoutMsg.classList.add('hidden');
    keypad.style.pointerEvents = 'auto';
    keypad.style.opacity = '1';
    btnSubmit.disabled = false;
    if (lockoutTimerInterval) {
      clearInterval(lockoutTimerInterval);
      lockoutTimerInterval = null;
    }
  }
}

function updatePinDots() {
  const dots = document.querySelectorAll('#pin-dots .dot');
  dots.forEach((dot, index) => {
    if (index < currentEnteredPin.length) {
      dot.classList.add('filled');
    } else {
      dot.classList.remove('filled');
    }
  });
}

// --- 9. RENDER LOGIKA SCREEN ---
async function renderSetupScreen() {
  showView('view-setup');
  document.getElementById('setup-error').classList.add('hidden');
}

async function renderLoginScreen() {
  currentEnteredPin = '';
  updatePinDots();
  document.getElementById('login-error-msg').classList.add('hidden');

  const warungName = (await getPengaturan('nama_warung')) || 'WarungKas';
  document.getElementById('login-warung-title').textContent = warungName;

  const users = await getAllUsers();
  const activeUsers = users.filter(u => u.status_aktif !== false);
  const select = document.getElementById('login-select-user');
  select.innerHTML = '';

  activeUsers.forEach(u => {
    const opt = document.createElement('option');
    opt.value = u.id;
    opt.textContent = `${u.nama} (${u.peran === 'pemilik' ? 'Pemilik' : 'Kasir'})`;
    select.appendChild(opt);
  });

  updateLockoutUI();
  showView('view-login');
}

async function renderDashboard() {
  if (!currentUser) {
    renderLoginScreen();
    return;
  }

  const warungName = (await getPengaturan('nama_warung')) || 'WarungKas';
  document.getElementById('dash-warung-name').textContent = warungName;
  document.getElementById('dash-user-label').textContent = `${currentUser.nama} • ${currentUser.peran.toUpperCase()}`;
  document.getElementById('dash-greeting').textContent = `Halo, ${currentUser.nama}`;

  const menuPengaturan = document.getElementById('menu-pengaturan');
  if (currentUser.peran === 'pemilik') {
    menuPengaturan.classList.remove('hidden');
  } else {
    menuPengaturan.classList.add('hidden');
  }

  showView('view-dashboard');
}

async function renderPengaturanScreen() {
  if (!currentUser || currentUser.peran !== 'pemilik') {
    alert('Akses ditolak: Hanya Pemilik yang dapat membuka Pengaturan.');
    renderDashboard();
    return;
  }

  const warungName = (await getPengaturan('nama_warung')) || '';
  document.getElementById('input-edit-warung-name').value = warungName;

  await refreshUserTable();
  await refreshLogTable();
  showView('view-pengaturan');
}

async function refreshUserTable() {
  const users = await getAllUsers();
  const tbody = document.getElementById('user-table-body');
  tbody.innerHTML = '';

  users.forEach(u => {
    const tr = document.createElement('tr');

    const tdNama = document.createElement('td');
    tdNama.textContent = u.nama;
    tdNama.className = 'font-bold';

    const tdPeran = document.createElement('td');
    tdPeran.textContent = u.peran === 'pemilik' ? 'Pemilik' : 'Kasir';

    const tdStatus = document.createElement('td');
    const isActive = u.status_aktif !== false;
    tdStatus.textContent = isActive ? 'Aktif' : 'Non-aktif';
    tdStatus.style.color = isActive ? 'var(--success)' : 'var(--danger)';

    const tdAction = document.createElement('td');
    if (u.peran !== 'pemilik') {
      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = isActive ? 'btn-danger-sm' : 'btn-success-sm';
      toggleBtn.textContent = isActive ? 'Nonaktifkan' : 'Aktifkan';
      toggleBtn.onclick = async () => {
        u.status_aktif = !isActive;
        await saveUser(u);
        await catatLog(currentUser.id, 'UBAH_STATUS_KASIR', 'kasir', {
          kasir_id: u.id,
          nama: u.nama,
          status_aktif: u.status_aktif
        });
        refreshUserTable();
      };
      tdAction.appendChild(toggleBtn);
    } else {
      tdAction.textContent = '-';
    }

    tr.appendChild(tdNama);
    tr.appendChild(tdPeran);
    tr.appendChild(tdStatus);
    tr.appendChild(tdAction);
    tbody.appendChild(tr);
  });
}

async function refreshLogTable() {
  const logs = await getRecentLogs(15);
  const tbody = document.getElementById('log-table-body');
  tbody.innerHTML = '';

  logs.forEach(l => {
    const tr = document.createElement('tr');
    const d = new Date(l.waktu);
    const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const tdWaktu = document.createElement('td');
    tdWaktu.textContent = timeStr;

    const tdAksi = document.createElement('td');
    tdAksi.textContent = l.aksi;

    const tdDetail = document.createElement('td');
    tdDetail.textContent = l.detail;

    tr.appendChild(tdWaktu);
    tr.appendChild(tdAksi);
    tr.appendChild(tdDetail);
    tbody.appendChild(tr);
  });
}

// --- 10. EVENT LISTENERS ---
function setupEventListeners() {
  // Setup Awal Form
  document.getElementById('form-setup').addEventListener('submit', async (e) => {
    e.preventDefault();
    const namaWarung = document.getElementById('setup-nama-warung').value.trim();
    const namaPemilik = document.getElementById('setup-nama-pemilik').value.trim();
    const pin = document.getElementById('setup-pin-pemilik').value;
    const pinKonfirm = document.getElementById('setup-pin-pemilik-konfirmasi').value;
    const errBox = document.getElementById('setup-error');

    errBox.classList.add('hidden');

    if (pin.length < 4 || pin.length > 6) {
      errBox.textContent = 'PIN harus 4 sampai 6 digit angka!';
      errBox.classList.remove('hidden');
      return;
    }

    if (pin !== pinKonfirm) {
      errBox.textContent = 'Konfirmasi PIN tidak cocok!';
      errBox.classList.remove('hidden');
      return;
    }

    const hashed = await hashPin(pin);
    const pemilikUser = {
      id: generateUUID(),
      nama: namaPemilik,
      peran: 'pemilik',
      pin_hash: hashed.hash,
      pin_salt: hashed.salt,
      pin_iterasi: hashed.iterations,
      status_aktif: true,
      dibuat_pada: new Date().toISOString()
    };

    await saveUser(pemilikUser);
    await setPengaturan('nama_warung', namaWarung);
    await setPengaturan('zona_waktu', 'Asia/Jakarta');
    await setPengaturan('setup_selesai', true);

    await catatLog(pemilikUser.id, 'SETUP_AWAL', 'sistem', {
      nama_warung: namaWarung,
      pemilik: namaPemilik
    });

    currentUser = pemilikUser;
    renderDashboard();
  });

  // Keypad PIN Login
  document.querySelectorAll('#login-keypad .btn-key').forEach(btn => {
    btn.addEventListener('click', () => {
      const lockout = getLockoutState();
      if (lockout.isLocked) return;

      const key = btn.getAttribute('data-key');
      if (key === 'clear') {
        currentEnteredPin = '';
      } else if (key === 'backspace') {
        currentEnteredPin = currentEnteredPin.slice(0, -1);
      } else if (currentEnteredPin.length < 6) {
        currentEnteredPin += key;
      }
      updatePinDots();
    });
  });

  // Submit Login
  document.getElementById('btn-login-submit').addEventListener('click', async () => {
    const lockout = getLockoutState();
    if (lockout.isLocked) return;

    const errBox = document.getElementById('login-error-msg');
    errBox.classList.add('hidden');

    const selectUser = document.getElementById('login-select-user');
    const userId = selectUser.value;

    if (!userId) {
      errBox.textContent = 'Pilih pengguna terlebih dahulu!';
      errBox.classList.remove('hidden');
      return;
    }

    if (currentEnteredPin.length < 4) {
      errBox.textContent = 'Masukkan minimal 4 digit PIN!';
      errBox.classList.remove('hidden');
      return;
    }

    const user = await getUserById(userId);
    if (!user) {
      errBox.textContent = 'Data pengguna tidak ditemukan!';
      errBox.classList.remove('hidden');
      return;
    }

    const tStart = performance.now();
    const isMatch = await verifyPin(currentEnteredPin, user.pin_hash, user.pin_salt, user.pin_iterasi);
    const duration = performance.now() - tStart;
    console.log(`Verifikasi PIN selesai dalam ${duration.toFixed(2)} ms`);

    if (isMatch) {
      resetFailedAttempts();
      currentUser = user;
      currentEnteredPin = '';
      updatePinDots();
      await catatLog(user.id, 'LOGIN_BERHASIL', 'kasir', { peran: user.peran });
      renderDashboard();
    } else {
      recordFailedAttempt();
      currentEnteredPin = '';
      updatePinDots();
      await catatLog(userId, 'LOGIN_GAGAL', 'kasir', { nama: user.nama });

      const state = getLockoutState();
      if (state.isLocked) {
        updateLockoutUI();
      } else {
        const sisa = MAX_LOGIN_ATTEMPTS - state.failedAttempts;
        errBox.textContent = `PIN salah! Sisa percobaan: ${sisa}`;
        errBox.classList.remove('hidden');
      }
    }
  });

  // Tombol Keluar (Logout)
  document.getElementById('btn-logout').addEventListener('click', () => {
    if (currentUser) {
      catatLog(currentUser.id, 'LOGOUT', 'kasir', {});
    }
    currentUser = null;
    currentEnteredPin = '';
    renderLoginScreen();
  });

  // Navigasi ke Pengaturan
  document.getElementById('menu-pengaturan').addEventListener('click', () => {
    renderPengaturanScreen();
  });

  // Tombol Kembali dari Pengaturan
  document.getElementById('btn-back-to-dash').addEventListener('click', () => {
    renderDashboard();
  });

  // Form Update Nama Warung
  document.getElementById('form-update-warung').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser || currentUser.peran !== 'pemilik') return;

    const newName = document.getElementById('input-edit-warung-name').value.trim();
    if (!newName) return;

    await setPengaturan('nama_warung', newName);
    await catatLog(currentUser.id, 'UBAH_NAMA_WARUNG', 'pengaturan', { nama_baru: newName });
    alert('Nama warung berhasil diperbarui!');
    refreshLogTable();
  });

  // Form Tambah Kasir Baru
  document.getElementById('form-tambah-kasir').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser || currentUser.peran !== 'pemilik') return;

    const nama = document.getElementById('input-kasir-nama').value.trim();
    const pin = document.getElementById('input-kasir-pin').value;

    if (pin.length < 4 || pin.length > 6) {
      alert('PIN Kasir harus 4 sampai 6 angka!');
      return;
    }

    const hashed = await hashPin(pin);
    const newKasir = {
      id: generateUUID(),
      nama: nama,
      peran: 'kasir',
      pin_hash: hashed.hash,
      pin_salt: hashed.salt,
      pin_iterasi: hashed.iterations,
      status_aktif: true,
      dibuat_pada: new Date().toISOString()
    };

    await saveUser(newKasir);
    await catatLog(currentUser.id, 'TAMBAH_KASIR', 'kasir', { kasir_id: newKasir.id, nama: nama });

    document.getElementById('form-tambah-kasir').reset();
    alert(`Kasir "${nama}" berhasil didaftarkan!`);
    await refreshUserTable();
    await refreshLogTable();
  });
}

// --- 11. BOOTSTRAP APLIKASI ---
async function initApp() {
  try {
    dbInstance = await openDatabase();

    // Registrasi Service Worker untuk kapabilitas offline PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.warn('Gagal mendaftarkan Service Worker:', err);
      });
    }

    // Meminta penyimpanan persisten (PRD §7.8)
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then((persistent) => {
        console.log('Status storage persistent:', persistent);
      });
    }

    setupEventListeners();

    // Cek apakah data awal warung & pemilik sudah dibuat
    const isSetupDone = await getPengaturan('setup_selesai');
    const users = await getAllUsers();

    if (!isSetupDone || users.length === 0) {
      renderSetupScreen();
    } else {
      renderLoginScreen();
    }
  } catch (err) {
    console.error('Inisialisasi aplikasi gagal:', err);
    alert('Gagal membuka database lokal WarungKas. Pastikan browser mendukung IndexedDB.');
  }
}

window.addEventListener('DOMContentLoaded', initApp);
