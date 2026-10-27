/**
 * WarungKas - Fondasi Tahap 1 + Tahap 2 (Produk & Stok)
 * Stack: Pure Vanilla JS + IndexedDB (v1) + Web Crypto API (PBKDF2-HMAC-SHA-256)
 * Kode dasar: Gemini 3.8 Flash (AI Studio) — dirakit & ditinjau Muse.
 * Data PRODUK_CONTOH (50 produk) disisipkan Muse dari daftar-produk-contoh.md.
 */

// --- 1. KONFIGURASI & VARIABEL STATE ---
const DB_NAME = 'warungkas';
const DB_VERSION = 1;
const PBKDF2_ITERATIONS = 100000;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60000;

// Konstanta Array Data Contoh Khas Warung Madura
const PRODUK_CONTOH = [
  {
    "nama": "Indomie Goreng",
    "kategori": "Makanan & Camilan",
    "satuan_dasar": "pcs",
    "harga_modal": 3000,
    "harga_jual": 3500,
    "stok_minimum": 5,
    "favorit": true,
    "stok_awal": 40,
    "satuan_turunan": [
      {
        "nama_satuan": "dus",
        "faktor_konversi": 40,
        "harga_jual": 112000
      }
    ]
  },
  {
    "nama": "Indomie Kuah Ayam Bawang",
    "kategori": "Makanan & Camilan",
    "satuan_dasar": "pcs",
    "harga_modal": 3000,
    "harga_jual": 3500,
    "stok_minimum": 5,
    "favorit": false,
    "stok_awal": 40,
    "satuan_turunan": []
  },
  {
    "nama": "Mie Sedaap Goreng",
    "kategori": "Makanan & Camilan",
    "satuan_dasar": "pcs",
    "harga_modal": 2900,
    "harga_jual": 3500,
    "stok_minimum": 5,
    "favorit": false,
    "stok_awal": 40,
    "satuan_turunan": []
  },
  {
    "nama": "Telur Ayam",
    "kategori": "Sembako",
    "satuan_dasar": "butir",
    "harga_modal": 2000,
    "harga_jual": 2500,
    "stok_minimum": 10,
    "favorit": true,
    "stok_awal": 48,
    "satuan_turunan": [
      {
        "nama_satuan": "kg",
        "faktor_konversi": 16,
        "harga_jual": 30000
      }
    ]
  },
  {
    "nama": "Beras Medium",
    "kategori": "Sembako",
    "satuan_dasar": "gram",
    "harga_modal": 13,
    "harga_jual": 14,
    "stok_minimum": 1000,
    "favorit": true,
    "stok_awal": 10000,
    "satuan_turunan": [
      {
        "nama_satuan": "kg",
        "faktor_konversi": 1000,
        "harga_jual": 14000
      },
      {
        "nama_satuan": "karung 5 kg",
        "faktor_konversi": 5000,
        "harga_jual": 68000
      },
      {
        "nama_satuan": "ecer 500 g",
        "faktor_konversi": 500,
        "harga_jual": 7500
      }
    ]
  },
  {
    "nama": "Gula Pasir",
    "kategori": "Sembako",
    "satuan_dasar": "gram",
    "harga_modal": 16,
    "harga_jual": 18,
    "stok_minimum": 500,
    "favorit": false,
    "stok_awal": 5000,
    "satuan_turunan": [
      {
        "nama_satuan": "kg",
        "faktor_konversi": 1000,
        "harga_jual": 17500
      },
      {
        "nama_satuan": "ecer 500 g",
        "faktor_konversi": 500,
        "harga_jual": 9000
      }
    ]
  },
  {
    "nama": "Minyak Goreng 1L (kemasan)",
    "kategori": "Sembako",
    "satuan_dasar": "pcs",
    "harga_modal": 16500,
    "harga_jual": 18000,
    "stok_minimum": 3,
    "favorit": false,
    "stok_awal": 12,
    "satuan_turunan": []
  },
  {
    "nama": "Minyak Goreng Curah",
    "kategori": "Sembako",
    "satuan_dasar": "ml",
    "harga_modal": 15,
    "harga_jual": 18,
    "stok_minimum": 500,
    "favorit": false,
    "stok_awal": 5000,
    "satuan_turunan": [
      {
        "nama_satuan": "250 ml",
        "faktor_konversi": 250,
        "harga_jual": 5000
      },
      {
        "nama_satuan": "500 ml",
        "faktor_konversi": 500,
        "harga_jual": 9500
      },
      {
        "nama_satuan": "1 liter",
        "faktor_konversi": 1000,
        "harga_jual": 18000
      }
    ]
  },
  {
    "nama": "Garam Dapur 250g",
    "kategori": "Sembako",
    "satuan_dasar": "pcs",
    "harga_modal": 2200,
    "harga_jual": 3000,
    "stok_minimum": 5,
    "favorit": false,
    "stok_awal": 20,
    "satuan_turunan": []
  },
  {
    "nama": "Kecap Manis Sachet",
    "kategori": "Sembako",
    "satuan_dasar": "sachet",
    "harga_modal": 700,
    "harga_jual": 1000,
    "stok_minimum": 10,
    "favorit": true,
    "stok_awal": 30,
    "satuan_turunan": []
  },
  {
    "nama": "Saus Sambal Sachet",
    "kategori": "Sembako",
    "satuan_dasar": "sachet",
    "harga_modal": 300,
    "harga_jual": 500,
    "stok_minimum": 10,
    "favorit": false,
    "stok_awal": 30,
    "satuan_turunan": []
  },
  {
    "nama": "Terasi Sachet",
    "kategori": "Sembako",
    "satuan_dasar": "sachet",
    "harga_modal": 600,
    "harga_jual": 1000,
    "stok_minimum": 5,
    "favorit": false,
    "stok_awal": 20,
    "satuan_turunan": []
  },
  {
    "nama": "Kopi Kapal Api Sachet",
    "kategori": "Minuman",
    "satuan_dasar": "sachet",
    "harga_modal": 1100,
    "harga_jual": 1500,
    "stok_minimum": 10,
    "favorit": true,
    "stok_awal": 50,
    "satuan_turunan": [
      {
        "nama_satuan": "renceng",
        "faktor_konversi": 10,
        "harga_jual": 13000
      }
    ]
  },
  {
    "nama": "Kopi ABC Susu Sachet",
    "kategori": "Minuman",
    "satuan_dasar": "sachet",
    "harga_modal": 1500,
    "harga_jual": 2000,
    "stok_minimum": 10,
    "favorit": false,
    "stok_awal": 30,
    "satuan_turunan": []
  },
  {
    "nama": "Good Day Sachet",
    "kategori": "Minuman",
    "satuan_dasar": "sachet",
    "harga_modal": 1600,
    "harga_jual": 2000,
    "stok_minimum": 10,
    "favorit": false,
    "stok_awal": 30,
    "satuan_turunan": []
  },
  {
    "nama": "Susu Kental Manis Sachet",
    "kategori": "Minuman",
    "satuan_dasar": "sachet",
    "harga_modal": 1100,
    "harga_jual": 1500,
    "stok_minimum": 10,
    "favorit": false,
    "stok_awal": 30,
    "satuan_turunan": []
  },
  {
    "nama": "Energen Sachet",
    "kategori": "Minuman",
    "satuan_dasar": "sachet",
    "harga_modal": 1600,
    "harga_jual": 2000,
    "stok_minimum": 10,
    "favorit": false,
    "stok_awal": 30,
    "satuan_turunan": []
  },
  {
    "nama": "Nutrisari Sachet",
    "kategori": "Minuman",
    "satuan_dasar": "sachet",
    "harga_modal": 1000,
    "harga_jual": 1500,
    "stok_minimum": 10,
    "favorit": false,
    "stok_awal": 30,
    "satuan_turunan": []
  },
  {
    "nama": "Teh Celup Sariwangi (isi 25)",
    "kategori": "Minuman",
    "satuan_dasar": "pcs",
    "harga_modal": 5000,
    "harga_jual": 6000,
    "stok_minimum": 3,
    "favorit": false,
    "stok_awal": 10,
    "satuan_turunan": []
  },
  {
    "nama": "Aqua Gelas 240ml",
    "kategori": "Minuman",
    "satuan_dasar": "pcs",
    "harga_modal": 750,
    "harga_jual": 1000,
    "stok_minimum": 24,
    "favorit": true,
    "stok_awal": 48,
    "satuan_turunan": [
      {
        "nama_satuan": "dus",
        "faktor_konversi": 48,
        "harga_jual": 38000
      }
    ]
  },
  {
    "nama": "Aqua Botol 600ml",
    "kategori": "Minuman",
    "satuan_dasar": "pcs",
    "harga_modal": 2800,
    "harga_jual": 3500,
    "stok_minimum": 6,
    "favorit": false,
    "stok_awal": 24,
    "satuan_turunan": []
  },
  {
    "nama": "Teh Botol Sosro 450ml",
    "kategori": "Minuman",
    "satuan_dasar": "pcs",
    "harga_modal": 3300,
    "harga_jual": 4000,
    "stok_minimum": 6,
    "favorit": false,
    "stok_awal": 24,
    "satuan_turunan": []
  },
  {
    "nama": "Kopi Botol (Kopiko/ABC)",
    "kategori": "Minuman",
    "satuan_dasar": "pcs",
    "harga_modal": 3800,
    "harga_jual": 4500,
    "stok_minimum": 6,
    "favorit": false,
    "stok_awal": 24,
    "satuan_turunan": []
  },
  {
    "nama": "Minuman Soda Kaleng",
    "kategori": "Minuman",
    "satuan_dasar": "pcs",
    "harga_modal": 5000,
    "harga_jual": 6000,
    "stok_minimum": 6,
    "favorit": false,
    "stok_awal": 12,
    "satuan_turunan": []
  },
  {
    "nama": "Rokok Sampoerna Mild 16",
    "kategori": "Rokok",
    "satuan_dasar": "batang",
    "harga_modal": 2063,
    "harga_jual": 2500,
    "stok_minimum": 16,
    "favorit": true,
    "stok_awal": 160,
    "satuan_turunan": [
      {
        "nama_satuan": "bungkus",
        "faktor_konversi": 16,
        "harga_jual": 36000
      }
    ]
  },
  {
    "nama": "Rokok Djarum Super 12",
    "kategori": "Rokok",
    "satuan_dasar": "batang",
    "harga_modal": 1708,
    "harga_jual": 2000,
    "stok_minimum": 12,
    "favorit": true,
    "stok_awal": 120,
    "satuan_turunan": [
      {
        "nama_satuan": "bungkus",
        "faktor_konversi": 12,
        "harga_jual": 23000
      }
    ]
  },
  {
    "nama": "Rokok Gudang Garam Filter 12",
    "kategori": "Rokok",
    "satuan_dasar": "batang",
    "harga_modal": 1792,
    "harga_jual": 2000,
    "stok_minimum": 12,
    "favorit": false,
    "stok_awal": 120,
    "satuan_turunan": [
      {
        "nama_satuan": "bungkus",
        "faktor_konversi": 12,
        "harga_jual": 24000
      }
    ]
  },
  {
    "nama": "Rokok LA Lights 16",
    "kategori": "Rokok",
    "satuan_dasar": "batang",
    "harga_modal": 2000,
    "harga_jual": 2500,
    "stok_minimum": 16,
    "favorit": false,
    "stok_awal": 160,
    "satuan_turunan": [
      {
        "nama_satuan": "bungkus",
        "faktor_konversi": 16,
        "harga_jual": 35000
      }
    ]
  },
  {
    "nama": "Korek Api Gas",
    "kategori": "Rokok",
    "satuan_dasar": "pcs",
    "harga_modal": 1800,
    "harga_jual": 2500,
    "stok_minimum": 5,
    "favorit": false,
    "stok_awal": 20,
    "satuan_turunan": []
  },
  {
    "nama": "Roti Aoka",
    "kategori": "Makanan & Camilan",
    "satuan_dasar": "pcs",
    "harga_modal": 2300,
    "harga_jual": 3000,
    "stok_minimum": 5,
    "favorit": false,
    "stok_awal": 20,
    "satuan_turunan": []
  },
  {
    "nama": "Chitato 68g",
    "kategori": "Makanan & Camilan",
    "satuan_dasar": "pcs",
    "harga_modal": 9500,
    "harga_jual": 11000,
    "stok_minimum": 4,
    "favorit": false,
    "stok_awal": 12,
    "satuan_turunan": []
  },
  {
    "nama": "Taro Snack",
    "kategori": "Makanan & Camilan",
    "satuan_dasar": "pcs",
    "harga_modal": 5500,
    "harga_jual": 6500,
    "stok_minimum": 4,
    "favorit": false,
    "stok_awal": 12,
    "satuan_turunan": []
  },
  {
    "nama": "Biskuit Roma Kelapa",
    "kategori": "Makanan & Camilan",
    "satuan_dasar": "pcs",
    "harga_modal": 6800,
    "harga_jual": 8000,
    "stok_minimum": 4,
    "favorit": false,
    "stok_awal": 12,
    "satuan_turunan": []
  },
  {
    "nama": "Permen Kopiko (per pcs)",
    "kategori": "Makanan & Camilan",
    "satuan_dasar": "pcs",
    "harga_modal": 300,
    "harga_jual": 500,
    "stok_minimum": 20,
    "favorit": false,
    "stok_awal": 50,
    "satuan_turunan": []
  },
  {
    "nama": "Sabun Mandi Batang",
    "kategori": "Kebutuhan Rumah",
    "satuan_dasar": "pcs",
    "harga_modal": 3200,
    "harga_jual": 4000,
    "stok_minimum": 5,
    "favorit": false,
    "stok_awal": 15,
    "satuan_turunan": []
  },
  {
    "nama": "Shampo Sachet",
    "kategori": "Kebutuhan Rumah",
    "satuan_dasar": "sachet",
    "harga_modal": 700,
    "harga_jual": 1000,
    "stok_minimum": 10,
    "favorit": false,
    "stok_awal": 30,
    "satuan_turunan": []
  },
  {
    "nama": "Pasta Gigi 75g",
    "kategori": "Kebutuhan Rumah",
    "satuan_dasar": "pcs",
    "harga_modal": 5400,
    "harga_jual": 6500,
    "stok_minimum": 3,
    "favorit": false,
    "stok_awal": 10,
    "satuan_turunan": []
  },
  {
    "nama": "Deterjen Sachet",
    "kategori": "Kebutuhan Rumah",
    "satuan_dasar": "sachet",
    "harga_modal": 750,
    "harga_jual": 1000,
    "stok_minimum": 10,
    "favorit": false,
    "stok_awal": 30,
    "satuan_turunan": []
  },
  {
    "nama": "Sabun Cuci Piring Sachet",
    "kategori": "Kebutuhan Rumah",
    "satuan_dasar": "sachet",
    "harga_modal": 700,
    "harga_jual": 1000,
    "stok_minimum": 10,
    "favorit": false,
    "stok_awal": 30,
    "satuan_turunan": []
  },
  {
    "nama": "Tisu Paseo 250 sheet",
    "kategori": "Kebutuhan Rumah",
    "satuan_dasar": "pcs",
    "harga_modal": 9200,
    "harga_jual": 11000,
    "stok_minimum": 3,
    "favorit": false,
    "stok_awal": 10,
    "satuan_turunan": []
  },
  {
    "nama": "Paracetamol Strip (10 tablet)",
    "kategori": "Lainnya",
    "satuan_dasar": "tablet",
    "harga_modal": 280,
    "harga_jual": 500,
    "stok_minimum": 10,
    "favorit": false,
    "stok_awal": 50,
    "satuan_turunan": [
      {
        "nama_satuan": "strip",
        "faktor_konversi": 10,
        "harga_jual": 4000
      }
    ]
  },
  {
    "nama": "Obat Batuk Sachet",
    "kategori": "Lainnya",
    "satuan_dasar": "sachet",
    "harga_modal": 1800,
    "harga_jual": 2500,
    "stok_minimum": 5,
    "favorit": false,
    "stok_awal": 20,
    "satuan_turunan": []
  },
  {
    "nama": "Minyak Kayu Putih 60ml",
    "kategori": "Lainnya",
    "satuan_dasar": "pcs",
    "harga_modal": 13500,
    "harga_jual": 16000,
    "stok_minimum": 2,
    "favorit": false,
    "stok_awal": 8,
    "satuan_turunan": []
  },
  {
    "nama": "Bensin Eceran 1 Liter",
    "kategori": "Lainnya",
    "satuan_dasar": "ml",
    "harga_modal": 11,
    "harga_jual": 13,
    "stok_minimum": 1000,
    "favorit": true,
    "stok_awal": 10000,
    "satuan_turunan": [
      {
        "nama_satuan": "1 liter",
        "faktor_konversi": 1000,
        "harga_jual": 13000
      },
      {
        "nama_satuan": "500 ml",
        "faktor_konversi": 500,
        "harga_jual": 7000
      }
    ]
  },
  {
    "nama": "Gas LPG 3kg (isi ulang/tukar)",
    "kategori": "Lainnya",
    "satuan_dasar": "pcs",
    "harga_modal": 19000,
    "harga_jual": 22000,
    "stok_minimum": 2,
    "favorit": false,
    "stok_awal": 5,
    "satuan_turunan": []
  },
  {
    "nama": "Air Galon Isi Ulang 19L",
    "kategori": "Lainnya",
    "satuan_dasar": "pcs",
    "harga_modal": 4000,
    "harga_jual": 6000,
    "stok_minimum": 3,
    "favorit": false,
    "stok_awal": 10,
    "satuan_turunan": []
  },
  {
    "nama": "Pulsa Reguler 5.000 (semua operator)",
    "kategori": "Pulsa & Token",
    "satuan_dasar": "pcs",
    "harga_modal": 6800,
    "harga_jual": 7500,
    "stok_minimum": 0,
    "favorit": false,
    "stok_awal": 100,
    "satuan_turunan": []
  },
  {
    "nama": "Pulsa Reguler 10.000",
    "kategori": "Pulsa & Token",
    "satuan_dasar": "pcs",
    "harga_modal": 11300,
    "harga_jual": 12500,
    "stok_minimum": 0,
    "favorit": false,
    "stok_awal": 100,
    "satuan_turunan": []
  },
  {
    "nama": "Token Listrik 20.000",
    "kategori": "Pulsa & Token",
    "satuan_dasar": "pcs",
    "harga_modal": 21000,
    "harga_jual": 22500,
    "stok_minimum": 0,
    "favorit": false,
    "stok_awal": 100,
    "satuan_turunan": []
  },
  {
    "nama": "Token Listrik 50.000",
    "kategori": "Pulsa & Token",
    "satuan_dasar": "pcs",
    "harga_modal": 50500,
    "harga_jual": 52500,
    "stok_minimum": 0,
    "favorit": false,
    "stok_awal": 100,
    "satuan_turunan": []
  }
];

let dbInstance = null;
let currentUser = null;
let currentEnteredPin = '';
let lockoutTimerInterval = null;

// Cache Data Memori untuk Kecepatan Pencarian <300ms
let cachedActiveProducts = [];
let cachedStockMap = {};
let cachedUnitsMap = {};
let currentSelectedKat = 'SEMUA';
let currentSearchKeyword = '';
let activeDetailProductId = null;

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

// --- 4. INISIALISASI INDEXEDDB (SKEMA PRD v1.2 + AMENDEMEN v1.3 - TETAP VERSI 1) ---
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (e) => reject(e.target.error);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;

      if (!db.objectStoreNames.contains('produk')) {
        db.createObjectStore('produk', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('satuan_produk')) {
        db.createObjectStore('satuan_produk', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pergerakan_stok')) {
        const os = db.createObjectStore('pergerakan_stok', { keyPath: 'id' });
        os.createIndex('produk_id', 'produk_id', { unique: false });
      }
      if (!db.objectStoreNames.contains('kasir')) {
        db.createObjectStore('kasir', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('shift')) {
        db.createObjectStore('shift', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('transaksi')) {
        const os = db.createObjectStore('transaksi', { keyPath: 'id' });
        os.createIndex('shift_id', 'shift_id', { unique: false });
        os.createIndex('waktu', 'waktu', { unique: false });
      }
      if (!db.objectStoreNames.contains('transaksi_item')) {
        const os = db.createObjectStore('transaksi_item', { keyPath: 'id' });
        os.createIndex('transaksi_id', 'transaksi_id', { unique: false });
      }
      if (!db.objectStoreNames.contains('pembayaran_transaksi')) {
        const os = db.createObjectStore('pembayaran_transaksi', { keyPath: 'id' });
        os.createIndex('transaksi_id', 'transaksi_id', { unique: false });
      }
      if (!db.objectStoreNames.contains('pelanggan_bon')) {
        db.createObjectStore('pelanggan_bon', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('bon')) {
        const os = db.createObjectStore('bon', { keyPath: 'id' });
        os.createIndex('pelanggan_id', 'pelanggan_id', { unique: false });
        os.createIndex('status', 'status', { unique: false });
      }
      if (!db.objectStoreNames.contains('pembayaran_bon')) {
        const os = db.createObjectStore('pembayaran_bon', { keyPath: 'id' });
        os.createIndex('bon_id', 'bon_id', { unique: false });
      }
      if (!db.objectStoreNames.contains('pengeluaran_kas')) {
        const os = db.createObjectStore('pengeluaran_kas', { keyPath: 'id' });
        os.createIndex('shift_id', 'shift_id', { unique: false });
      }
      if (!db.objectStoreNames.contains('void_transaksi')) {
        const os = db.createObjectStore('void_transaksi', { keyPath: 'id' });
        os.createIndex('transaksi_id', 'transaksi_id', { unique: false });
      }
      if (!db.objectStoreNames.contains('void_detail')) {
        const os = db.createObjectStore('void_detail', { keyPath: 'id' });
        os.createIndex('void_id', 'void_id', { unique: false });
      }
      if (!db.objectStoreNames.contains('log_aktivitas')) {
        const os = db.createObjectStore('log_aktivitas', { keyPath: 'id' });
        os.createIndex('waktu', 'waktu', { unique: false });
      }
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

// --- HELPER STORE PRODUK, SATUAN & STOK ---
function getAllProducts() {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(['produk'], 'readonly');
    const store = tx.objectStore('produk');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function getProductById(id) {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(['produk'], 'readonly');
    const store = tx.objectStore('produk');
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function saveProductRecord(product) {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(['produk'], 'readwrite');
    const store = tx.objectStore('produk');
    const req = store.put(product);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function getAllUnits() {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(['satuan_produk'], 'readonly');
    const store = tx.objectStore('satuan_produk');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function saveUnitRecord(unit) {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(['satuan_produk'], 'readwrite');
    const store = tx.objectStore('satuan_produk');
    const req = store.put(unit);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function getMovementsByProductId(productId) {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(['pergerakan_stok'], 'readonly');
    const store = tx.objectStore('pergerakan_stok');
    const index = store.index('produk_id');
    const req = index.getAll(productId);
    req.onsuccess = () => {
      const list = req.result || [];
      // Urutkan waktu ascending untuk hitung saldo
      list.sort((a, b) => new Date(a.waktu) - new Date(b.waktu));
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
}

// Menghitung saldo stok saat ini = Σ seluruh pergerakan stok produk itu
async function getCalculatedStock(productId) {
  const movements = await getMovementsByProductId(productId);
  let total = 0;
  for (const m of movements) {
    total += Number(m.jumlah) || 0;
  }
  return Math.round(total);
}

// Menulis pergerakan stok baru dengan validasi saldo_sesudah
async function catatPergerakanStok(productId, jenis, jumlahBertanda, keterangan, userId) {
  const currentSaldo = await getCalculatedStock(productId);
  const intJumlah = Math.round(Number(jumlahBertanda));
  const saldoSesudah = currentSaldo + intJumlah;

  const movementRecord = {
    id: generateUUID(),
    produk_id: productId,
    jenis: jenis, // MASUK_KULAKAN | JUAL | VOID_JUAL | RUSAK | KOREKSI
    jumlah: intJumlah,
    saldo_sesudah: saldoSesudah,
    pengguna_id: userId || (currentUser ? currentUser.id : 'sistem'),
    waktu: new Date().toISOString(),
    keterangan: keterangan || '-'
  };

  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(['pergerakan_stok'], 'readwrite');
    const store = tx.objectStore('pergerakan_stok');
    const req = store.add(movementRecord);
    req.onsuccess = () => resolve(movementRecord);
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
  // Enforce batasan peran visual
  enforceRoleUI();
}

function enforceRoleUI() {
  const isPemilik = currentUser && currentUser.peran === 'pemilik';
  document.querySelectorAll('.role-pemilik-only').forEach(el => {
    // Perbaikan Muse: visibilitas box-muat-contoh diatur khusus oleh
    // renderProductListScreen (bergantung flag produk_contoh_dimuat),
    // jangan ditimpa aturan peran umum ini.
    if (el.id === 'box-muat-contoh') return;
    if (isPemilik) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });
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

// --- 10. FITUR TAHAP 2: PRODUK & STOK ---

// Format ekuivalen satuan jual terbesar (misal: 125 batang -> ~10 bungkus 5 batang)
function formatEquivalentUnit(stockBase, baseUnit, units) {
  if (!units || units.length === 0 || stockBase <= 0) {
    return `${stockBase} ${baseUnit}`;
  }

  // Cari satuan aktif dengan faktor konversi terbesar
  const sorted = [...units]
    .filter(u => u.status_aktif !== false && Number(u.faktor_konversi) > 1)
    .sort((a, b) => Number(b.faktor_konversi) - Number(a.faktor_konversi));

  if (sorted.length === 0) {
    return `${stockBase} ${baseUnit}`;
  }

  const largest = sorted[0];
  const factor = Number(largest.faktor_konversi);
  const packageCount = Math.floor(stockBase / factor);
  const remainder = stockBase % factor;

  if (packageCount > 0) {
    if (remainder > 0) {
      return `${stockBase} ${baseUnit} (~${packageCount} ${largest.nama_satuan} + ${remainder} ${baseUnit})`;
    }
    return `${stockBase} ${baseUnit} (~${packageCount} ${largest.nama_satuan})`;
  }

  return `${stockBase} ${baseUnit}`;
}

async function loadProductsCache() {
  const allProds = await getAllProducts();
  cachedActiveProducts = allProds.filter(p => p.status_aktif !== false);

  // Ambil semua pergerakan stok untuk hitung saldo per produk secara cepat
  cachedStockMap = {};
  const allMovements = await new Promise((resolve) => {
    const tx = dbInstance.transaction(['pergerakan_stok'], 'readonly');
    const store = tx.objectStore('pergerakan_stok');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });

  for (const m of allMovements) {
    cachedStockMap[m.produk_id] = (cachedStockMap[m.produk_id] || 0) + (Number(m.jumlah) || 0);
  }

  // Ambil semua satuan turunan
  const allUnits = await getAllUnits();
  cachedUnitsMap = {};
  for (const u of allUnits) {
    if (!cachedUnitsMap[u.produk_id]) {
      cachedUnitsMap[u.produk_id] = [];
    }
    cachedUnitsMap[u.produk_id].push(u);
  }
}

async function renderProductListScreen() {
  await loadProductsCache();

  // Tampilkan/sembunyikan tombol 'Muat Produk Contoh'
  const contohDimuat = await getPengaturan('produk_contoh_dimuat');
  const boxContoh = document.getElementById('box-muat-contoh');
  if (currentUser && currentUser.peran === 'pemilik' && !contohDimuat) {
    boxContoh.classList.remove('hidden');
  } else {
    boxContoh.classList.add('hidden');
  }

  filterAndRenderProducts();
  showView('view-produk');
}

// Pencarian & Filter Cepat In-Memory (<300ms untuk 1.000 produk)
function filterAndRenderProducts() {
  const tStart = performance.now();
  const container = document.getElementById('list-produk-container');
  container.innerHTML = '';

  const kw = currentSearchKeyword.toLowerCase().trim();
  let lowStockCount = 0;

  const filtered = cachedActiveProducts.filter(p => {
    const matchCat = (currentSelectedKat === 'SEMUA' || p.kategori === currentSelectedKat);
    const matchKw = (!kw || p.nama.toLowerCase().includes(kw));
    return matchCat && matchKw;
  });

  // Urutkan: favorit di atas, lalu abjad nama
  filtered.sort((a, b) => {
    if (a.favorit && !b.favorit) return -1;
    if (!a.favorit && b.favorit) return 1;
    return a.nama.localeCompare(b.nama);
  });

  // Hitung jumlah stok menipis dari keseluruhan produk aktif
  cachedActiveProducts.forEach(p => {
    const s = cachedStockMap[p.id] || 0;
    if (s <= (Number(p.stok_minimum) || 0)) {
      lowStockCount++;
    }
  });

  const labelMenipis = document.getElementById('label-menipis-count');
  if (lowStockCount > 0) {
    labelMenipis.textContent = `${lowStockCount} Stok Menipis`;
    labelMenipis.classList.remove('hidden');
  } else {
    labelMenipis.classList.add('hidden');
  }

  document.getElementById('label-total-produk').textContent = `Menampilkan ${filtered.length} produk`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="card text-center text-muted" style="padding: 30px;">
        Belum ada produk yang cocok.
      </div>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();

  filtered.forEach(p => {
    const stock = cachedStockMap[p.id] || 0;
    const isLow = stock <= (Number(p.stok_minimum) || 0);
    const units = cachedUnitsMap[p.id] || [];
    const stockDisplay = formatEquivalentUnit(stock, p.satuan_dasar, units);

    const item = document.createElement('div');
    item.className = 'product-item';
    item.onclick = () => openProductDetail(p.id);

    item.innerHTML = `
      <div class="prod-item-left">
        <div class="prod-item-title">
          ${p.favorit ? '<span class="text-amber">★</span>' : ''}
          <span>${p.nama}</span>
        </div>
        <div class="prod-item-sub">
          <span class="badge-cat">${p.kategori}</span>
          <span>• Modal: ${formatRp(p.harga_modal)}</span>
        </div>
      </div>
      <div class="prod-item-right">
        <div class="prod-price">${formatRp(p.harga_jual)} <span class="text-xs text-muted">/${p.satuan_dasar}</span></div>
        <div class="stock-tag ${isLow ? 'stock-tag-warning' : ''}">
          ${isLow ? '⚠️ ' : ''}${stockDisplay}
        </div>
      </div>
    `;

    fragment.appendChild(item);
  });

  container.appendChild(fragment);
  const dur = performance.now() - tStart;
  if (dur > 50) {
    console.log(`Render produk selesai dalam ${dur.toFixed(2)} ms`);
  }
}

// Buka Detail Produk
async function openProductDetail(productId) {
  activeDetailProductId = productId;
  const prod = await getProductById(productId);
  if (!prod) return;

  const stock = await getCalculatedStock(productId);
  const movements = await getMovementsByProductId(productId);
  const units = (await getAllUnits()).filter(u => u.produk_id === productId);

  // Isi data info utama
  document.getElementById('detail-prod-kategori').textContent = prod.kategori;
  document.getElementById('detail-prod-nama').textContent = prod.nama;
  document.getElementById('detail-prod-satuan-dasar').textContent = prod.satuan_dasar;
  document.getElementById('detail-prod-stok-min').textContent = `${prod.stok_minimum} ${prod.satuan_dasar}`;
  document.getElementById('detail-prod-modal').textContent = formatRp(prod.harga_modal);
  document.getElementById('detail-prod-jual').textContent = formatRp(prod.harga_jual);

  const favSpan = document.getElementById('detail-prod-fav');
  if (prod.favorit) {
    favSpan.classList.remove('hidden');
  } else {
    favSpan.classList.add('hidden');
  }

  // Status stok
  document.getElementById('detail-prod-saldo-angka').textContent = stock;
  document.getElementById('detail-prod-saldo-satuan').textContent = prod.satuan_dasar;
  const eqText = formatEquivalentUnit(stock, prod.satuan_dasar, units);
  document.getElementById('detail-prod-konversi-teks').textContent = (eqText !== `${stock} ${prod.satuan_dasar}`)
    ? `Ekuivalen: ${eqText}`
    : '';

  // Render daftar satuan turunan
  renderUnitsList(prod, units);

  // Render riwayat ledger
  renderLedgerTable(movements, prod.satuan_dasar);

  showView('view-produk-detail');
}

function renderUnitsList(prod, units) {
  const container = document.getElementById('list-satuan-turunan');
  container.innerHTML = '';

  // Satuan dasar otomatis dapat dijual
  const baseRow = document.createElement('div');
  baseRow.className = 'unit-row';
  baseRow.innerHTML = `
    <div>
      <span class="font-bold">1 ${prod.satuan_dasar}</span>
      <span class="text-xs text-muted">(Satuan Dasar Utama)</span>
    </div>
    <div class="font-bold text-amber">${formatRp(prod.harga_jual)}</div>
  `;
  container.appendChild(baseRow);

  if (units.length === 0) {
    const emptyRow = document.createElement('div');
    emptyRow.className = 'text-xs text-muted mt-1';
    emptyRow.textContent = 'Belum ada satuan jual turunan (pak, dus, renceng, dll).';
    container.appendChild(emptyRow);
    return;
  }

  units.forEach(u => {
    const isActive = u.status_aktif !== false;
    const row = document.createElement('div');
    row.className = 'unit-row';

    row.innerHTML = `
      <div>
        <span class="font-bold">1 ${u.nama_satuan}</span>
        <span class="text-xs text-muted">(= ${u.faktor_konversi} ${prod.satuan_dasar})</span>
        <span class="text-xs ${isActive ? 'text-muted' : 'text-danger'}">[${isActive ? 'Aktif' : 'Non-aktif'}]</span>
      </div>
      <div class="flex-between" style="gap: 10px;">
        <span class="font-bold text-amber">${formatRp(u.harga_jual)}</span>
        ${currentUser && currentUser.peran === 'pemilik' ? `
          <button type="button" class="${isActive ? 'btn-danger-sm' : 'btn-success-sm'}" data-unit-toggle="${u.id}">
            ${isActive ? 'Nonaktifkan' : 'Aktifkan'}
          </button>
        ` : ''}
      </div>
    `;

    const toggleBtn = row.querySelector('[data-unit-toggle]');
    if (toggleBtn) {
      toggleBtn.onclick = async () => {
        u.status_aktif = !isActive;
        await saveUnitRecord(u);
        await catatLog(currentUser.id, 'UBAH_SATUAN', 'satuan_produk', {
          satuan_id: u.id,
          nama_satuan: u.nama_satuan,
          status_aktif: u.status_aktif
        });
        openProductDetail(prod.id);
      };
    }

    container.appendChild(row);
  });
}

function renderLedgerTable(movements, baseUnit) {
  const tbody = document.getElementById('table-ledger-body');
  tbody.innerHTML = '';

  if (movements.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Belum ada catatan mutasi stok.</td></tr>';
    return;
  }

  // Tampilkan 25 pergerakan terakhir dari paling baru
  const recent = [...movements].reverse().slice(0, 25);

  recent.forEach(m => {
    const tr = document.createElement('tr');
    const d = new Date(m.waktu);
    const timeStr = `${d.getDate()}/${d.getMonth() + 1} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    const jml = Number(m.jumlah);
    const jmlColor = jml > 0 ? 'var(--success)' : (jml < 0 ? 'var(--danger)' : 'var(--text-main)');
    const jmlSign = jml > 0 ? `+${jml}` : `${jml}`;

    tr.innerHTML = `
      <td class="text-xs text-muted">${timeStr}</td>
      <td class="font-bold text-xs">${m.jenis}</td>
      <td style="color: ${jmlColor}; font-weight: 700;">${jmlSign}</td>
      <td class="font-bold">${m.saldo_sesudah}</td>
      <td class="text-xs text-muted">${m.keterangan || '-'}</td>
    `;

    tbody.appendChild(tr);
  });
}

// Buka Form Tambah / Edit Produk
function openProductForm(product = null) {
  if (!currentUser || currentUser.peran !== 'pemilik') {
    alert('Hanya Pemilik yang dapat menambah atau mengubah produk!');
    return;
  }

  const form = document.getElementById('form-produk');
  form.reset();

  const title = document.getElementById('title-produk-form');
  const btnNonaktif = document.getElementById('btn-nonaktifkan-produk');
  const boxStokAwal = document.getElementById('box-stok-awal-form');

  if (product) {
    title.textContent = 'Ubah Produk';
    document.getElementById('form-prod-id').value = product.id;
    document.getElementById('form-prod-nama').value = product.nama;
    document.getElementById('form-prod-kategori').value = product.kategori;
    document.getElementById('form-prod-satuan-dasar').value = product.satuan_dasar;
    document.getElementById('form-prod-modal').value = product.harga_modal;
    document.getElementById('form-prod-jual').value = product.harga_jual;
    document.getElementById('form-prod-stok-min').value = product.stok_minimum;
    document.getElementById('form-prod-favorit').checked = Boolean(product.favorit);

    boxStokAwal.classList.add('hidden');
    btnNonaktif.classList.remove('hidden');
  } else {
    title.textContent = 'Tambah Produk Baru';
    document.getElementById('form-prod-id').value = '';
    boxStokAwal.classList.remove('hidden');
    btnNonaktif.classList.add('hidden');
  }

  showView('view-produk-form');
}

// Buka Dialog Modal Mutasi Stok
function openMutasiModal(jenis) {
  if (!currentUser || currentUser.peran !== 'pemilik') {
    alert('Hanya Pemilik yang berhak mengubah stok!');
    return;
  }

  const modal = document.getElementById('modal-mutasi');
  const title = document.getElementById('modal-mutasi-title');
  const sub = document.getElementById('modal-mutasi-sub');
  const jenisInput = document.getElementById('modal-mutasi-jenis');
  const groupArah = document.getElementById('group-koreksi-arah');
  const inputJml = document.getElementById('input-mutasi-jumlah');
  const inputKet = document.getElementById('input-mutasi-ket');

  document.getElementById('form-mutasi-stok').reset();
  jenisInput.value = jenis;

  if (jenis === 'MASUK_KULAKAN') {
    title.textContent = 'Tambah Stok (Kulakan)';
    sub.textContent = 'Catat barang baru masuk dari belanja kulakan.';
    groupArah.classList.add('hidden');
    inputKet.placeholder = 'Contoh: Belanja kulakan di agen/pasar';
  } else if (jenis === 'RUSAK') {
    title.textContent = 'Catat Stok Rusak / Hilang';
    sub.textContent = 'Stok akan berkurang otomatis dari saldo fisik.';
    groupArah.classList.add('hidden');
    inputKet.placeholder = 'Wajib alasan: Bungkus sobek / Bocor / Kadaluarsa';
  } else if (jenis === 'KOREKSI') {
    title.textContent = 'Koreksi Stok (Opname)';
    sub.textContent = 'Sesuaikan selisih antara data kasir dan fisik nyata.';
    groupArah.classList.remove('hidden');
    inputKet.placeholder = 'Wajib alasan: Hasil hitung opname fisik';
  }

  modal.classList.remove('hidden');
  inputJml.focus();
}

// Buka Modal Satuan Jual Turunan
function openSatuanModal(satuan = null) {
  if (!currentUser || currentUser.peran !== 'pemilik') {
    alert('Hanya Pemilik yang dapat menambah satuan!');
    return;
  }

  const modal = document.getElementById('modal-satuan');
  const title = document.getElementById('modal-satuan-title');
  const form = document.getElementById('form-satuan-jual');
  form.reset();

  title.textContent = satuan ? 'Ubah Satuan Jual' : 'Tambah Satuan Jual Turunan';
  document.getElementById('modal-satuan-id').value = satuan ? satuan.id : '';

  modal.classList.remove('hidden');
}

// Muat Produk Contoh Secara Atomik dalam Satu Transaksi IndexedDB
async function muatProdukContoh() {
  if (!currentUser || currentUser.peran !== 'pemilik') return;
  // Perbaikan Muse: cegah pemuatan ganda yang menggandakan produk contoh.
  if (await getPengaturan('produk_contoh_dimuat')) {
    alert('Produk contoh sudah pernah dimuat.');
    return;
  }
  if (!confirm('Muat daftar produk contoh warung Madura? Stok awal akan otomatis dicatat.')) return;

  try {
    const tx = dbInstance.transaction(
      ['produk', 'satuan_produk', 'pergerakan_stok', 'pengaturan', 'log_aktivitas'],
      'readwrite'
    );

    const storeProd = tx.objectStore('produk');
    const storeUnit = tx.objectStore('satuan_produk');
    const storeMove = tx.objectStore('pergerakan_stok');
    const storeSet = tx.objectStore('pengaturan');
    const storeLog = tx.objectStore('log_aktivitas');

    const nowIso = new Date().toISOString();

    for (const item of PRODUK_CONTOH) {
      const prodId = generateUUID();
      const prodRecord = {
        id: prodId,
        nama: item.nama,
        kategori: item.kategori,
        satuan_dasar: item.satuan_dasar,
        harga_modal: Math.round(Number(item.harga_modal) || 0),
        harga_jual: Math.round(Number(item.harga_jual) || 0),
        stok_minimum: Math.round(Number(item.stok_minimum) || 0),
        favorit: Boolean(item.favorit),
        status_aktif: true,
        dibuat_pada: nowIso
      };
      storeProd.add(prodRecord);

      // Satuan turunan
      if (Array.isArray(item.satuan_turunan)) {
        for (const unit of item.satuan_turunan) {
          const unitRecord = {
            id: generateUUID(),
            produk_id: prodId,
            nama_satuan: unit.nama_satuan,
            faktor_konversi: Math.round(Number(unit.faktor_konversi) || 1),
            harga_jual: Math.round(Number(unit.harga_jual) || 0),
            status_aktif: true
          };
          storeUnit.add(unitRecord);
        }
      }

      // Pergerakan stok awal (MASUK_KULAKAN)
      const stokAwal = Math.round(Number(item.stok_awal) || 0);
      if (stokAwal > 0) {
        const moveRecord = {
          id: generateUUID(),
          produk_id: prodId,
          jenis: 'MASUK_KULAKAN',
          jumlah: stokAwal,
          saldo_sesudah: stokAwal,
          pengguna_id: currentUser.id,
          waktu: nowIso,
          keterangan: 'Stok awal contoh'
        };
        storeMove.add(moveRecord);
      }
    }

    // Set flag agar tombol tidak muncul lagi
    storeSet.put({ kunci: 'produk_contoh_dimuat', nilai: true });

    // Catat log
    storeLog.add({
      id: generateUUID(),
      pengguna_id: currentUser.id,
      waktu: nowIso,
      aksi: 'MUAT_PRODUK_CONTOH',
      objek: 'produk',
      detail: JSON.stringify({ jumlah: PRODUK_CONTOH.length })
    });

    tx.oncomplete = async () => {
      alert(`Berhasil memuat ${PRODUK_CONTOH.length} produk contoh!`);
      await renderProductListScreen();
    };

    tx.onerror = (e) => {
      console.error('Gagal memuat produk contoh:', e.target.error);
      alert('Gagal memuat produk contoh.');
    };
  } catch (err) {
    console.error(err);
    alert('Terjadi kesalahan saat memproses data contoh.');
  }
}

// --- 11. EVENT LISTENERS ---
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

    const isMatch = await verifyPin(currentEnteredPin, user.pin_hash, user.pin_salt, user.pin_iterasi);

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

  // Navigasi ke Produk & Stok
  document.getElementById('menu-produk').addEventListener('click', () => {
    renderProductListScreen();
  });

  document.getElementById('btn-produk-back').addEventListener('click', () => {
    renderDashboard();
  });

  // Pencarian Produk (Responsif <300ms)
  document.getElementById('input-cari-produk').addEventListener('input', (e) => {
    currentSearchKeyword = e.target.value;
    filterAndRenderProducts();
  });

  // Filter Kategori Chips
  document.querySelectorAll('#chips-kategori .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#chips-kategori .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentSelectedKat = chip.getAttribute('data-kat');
      filterAndRenderProducts();
    });
  });

  // Muat Produk Contoh
  document.getElementById('btn-muat-contoh').addEventListener('click', muatProdukContoh);

  // Navigasi Form Tambah Produk
  document.getElementById('btn-produk-tambah').addEventListener('click', () => {
    openProductForm(null);
  });

  document.getElementById('btn-cancel-produk-form').addEventListener('click', () => {
    renderProductListScreen();
  });

  // Submit Simpan Produk Baru / Edit
  document.getElementById('form-produk').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser || currentUser.peran !== 'pemilik') return;

    const prodId = document.getElementById('form-prod-id').value;
    const isEdit = Boolean(prodId);

    const nama = document.getElementById('form-prod-nama').value.trim();
    const kategori = document.getElementById('form-prod-kategori').value;
    const satuanDasar = document.getElementById('form-prod-satuan-dasar').value.trim().toLowerCase();
    const hargaModal = Math.round(Number(document.getElementById('form-prod-modal').value) || 0);
    const hargaJual = Math.round(Number(document.getElementById('form-prod-jual').value) || 0);
    const stokMin = Math.round(Number(document.getElementById('form-prod-stok-min').value) || 0);
    const favorit = document.getElementById('form-prod-favorit').checked;
    const stokAwal = Math.round(Number(document.getElementById('form-prod-stok-awal').value) || 0);

    const idToSave = isEdit ? prodId : generateUUID();

    const productRecord = {
      id: idToSave,
      nama: nama,
      kategori: kategori,
      satuan_dasar: satuanDasar,
      harga_modal: hargaModal,
      harga_jual: hargaJual,
      stok_minimum: stokMin,
      favorit: favorit,
      status_aktif: true,
      diubah_pada: new Date().toISOString()
    };

    if (!isEdit) {
      productRecord.dibuat_pada = new Date().toISOString();
    } else {
      // Perbaikan Muse: pertahankan tanggal pembuatan asli saat produk diubah.
      const lama = await getProductById(prodId);
      if (lama && lama.dibuat_pada) {
        productRecord.dibuat_pada = lama.dibuat_pada;
      }
    }

    await saveProductRecord(productRecord);

    if (!isEdit && stokAwal > 0) {
      await catatPergerakanStok(idToSave, 'MASUK_KULAKAN', stokAwal, 'Stok awal saat input produk', currentUser.id);
    }

    await catatLog(currentUser.id, isEdit ? 'UBAH_PRODUK' : 'TAMBAH_PRODUK', 'produk', {
      produk_id: idToSave,
      nama: nama
    });

    alert(`Produk "${nama}" berhasil disimpan.`);
    await renderProductListScreen();
  });

  // Nonaktifkan Produk (Soft Delete)
  document.getElementById('btn-nonaktifkan-produk').addEventListener('click', async () => {
    if (!currentUser || currentUser.peran !== 'pemilik') return;
    const prodId = document.getElementById('form-prod-id').value;
    if (!prodId) return;

    const prod = await getProductById(prodId);
    if (!prod) return;

    if (!confirm(`Yakin ingin menonaktifkan produk "${prod.nama}"? Data historis transaksi & stok tetap tersimpan.`)) {
      return;
    }

    prod.status_aktif = false;
    prod.diubah_pada = new Date().toISOString();
    await saveProductRecord(prod);

    await catatLog(currentUser.id, 'NONAKTIF_PRODUK', 'produk', {
      produk_id: prod.id,
      nama: prod.nama
    });

    alert(`Produk "${prod.nama}" telah dinonaktifkan.`);
    await renderProductListScreen();
  });

  // Navigasi Kembali dari Detail Produk
  document.getElementById('btn-back-detail-produk').addEventListener('click', () => {
    renderProductListScreen();
  });

  // Edit Produk dari Layar Detail
  document.getElementById('btn-edit-produk-current').addEventListener('click', async () => {
    if (!activeDetailProductId) return;
    const prod = await getProductById(activeDetailProductId);
    if (prod) openProductForm(prod);
  });

  // Buka Modal Tambah Satuan
  document.getElementById('btn-open-tambah-satuan').addEventListener('click', () => {
    openSatuanModal(null);
  });

  document.getElementById('btn-close-modal-satuan').addEventListener('click', () => {
    document.getElementById('modal-satuan').classList.add('hidden');
  });

  // Submit Simpan Satuan Turunan
  document.getElementById('form-satuan-jual').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser || currentUser.peran !== 'pemilik' || !activeDetailProductId) return;

    const satuanId = document.getElementById('modal-satuan-id').value;
    const namaSatuan = document.getElementById('input-satuan-nama').value.trim().toLowerCase();
    const faktor = Math.round(Number(document.getElementById('input-satuan-faktor').value) || 1);
    const hargaJual = Math.round(Number(document.getElementById('input-satuan-harga').value) || 0);

    const isEdit = Boolean(satuanId);
    const unitRecord = {
      id: isEdit ? satuanId : generateUUID(),
      produk_id: activeDetailProductId,
      nama_satuan: namaSatuan,
      faktor_konversi: faktor,
      harga_jual: hargaJual,
      status_aktif: true
    };

    await saveUnitRecord(unitRecord);
    await catatLog(currentUser.id, isEdit ? 'UBAH_SATUAN' : 'TAMBAH_SATUAN', 'satuan_produk', {
      produk_id: activeDetailProductId,
      nama_satuan: namaSatuan,
      faktor_konversi: faktor,
      harga_jual: hargaJual
    });

    document.getElementById('modal-satuan').classList.add('hidden');
    openProductDetail(activeDetailProductId);
  });

  // Buka Modal Mutasi Stok
  document.getElementById('btn-open-kulakan').addEventListener('click', () => openMutasiModal('MASUK_KULAKAN'));
  document.getElementById('btn-open-rusak').addEventListener('click', () => openMutasiModal('RUSAK'));
  document.getElementById('btn-open-koreksi').addEventListener('click', () => openMutasiModal('KOREKSI'));

  document.getElementById('btn-close-modal-mutasi').addEventListener('click', () => {
    document.getElementById('modal-mutasi').classList.add('hidden');
  });

  // Submit Mutasi Stok
  document.getElementById('form-mutasi-stok').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser || currentUser.peran !== 'pemilik' || !activeDetailProductId) return;

    const jenis = document.getElementById('modal-mutasi-jenis').value;
    const rawJml = Math.round(Number(document.getElementById('input-mutasi-jumlah').value) || 0);
    const ket = document.getElementById('input-mutasi-ket').value.trim();

    if (rawJml <= 0) {
      alert('Jumlah harus berupa angka positif lebih dari 0.');
      return;
    }

    let delta = 0;
    let logAksi = '';

    if (jenis === 'MASUK_KULAKAN') {
      delta = rawJml;
      logAksi = 'STOK_MASUK';
    } else if (jenis === 'RUSAK') {
      delta = -rawJml; // Mengurangi stok
      logAksi = 'STOK_RUSAK';
    } else if (jenis === 'KOREKSI') {
      const arah = document.getElementById('select-koreksi-arah').value;
      delta = (arah === 'TAMBAH') ? rawJml : -rawJml;
      logAksi = 'STOK_KOREKSI';
    }

    await catatPergerakanStok(activeDetailProductId, jenis, delta, ket, currentUser.id);
    await catatLog(currentUser.id, logAksi, 'pergerakan_stok', {
      produk_id: activeDetailProductId,
      jenis: jenis,
      jumlah: delta,
      keterangan: ket
    });

    document.getElementById('modal-mutasi').classList.add('hidden');
    openProductDetail(activeDetailProductId);
  });

  // Navigasi Pengaturan & Keluar
  document.getElementById('menu-pengaturan').addEventListener('click', renderPengaturanScreen);
  document.getElementById('btn-back-to-dash').addEventListener('click', renderDashboard);

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

// --- 12. BOOTSTRAP APLIKASI ---
async function initApp() {
  try {
    dbInstance = await openDatabase();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.warn('Gagal mendaftarkan Service Worker:', err);
      });
    }

    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then((persistent) => {
        console.log('Status storage persistent:', persistent);
      });
    }

    setupEventListeners();

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
