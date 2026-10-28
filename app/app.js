/**
 * WarungKas - Fondasi Tahap 1 + Tahap 2 (Produk & Stok) + Tahap 3 (Kasir & Pembayaran)
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
let currentShift = null;

// State Kasir & Keranjang (Tahap 3)
let currentKasirKat = 'SEMUA';
let currentKasirSearch = '';
let cartItems = []; // Array of snapshot objects
let activePickerProduct = null;
let selectedPickerUnit = null; // null = satuan dasar

// State Buku Bon (Tahap 4)
let cachedBonCustomers = [];
let currentBonSearch = '';
let activeBonCustomerId = null;
let activePayingBonId = null;
// State Shift & Laporan (Tahap 5)
let activeShiftCalculation = null;
let activeDetailShiftId = null;


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

// Tanggal zona Asia/Jakarta format YYYYMMDD
function getJakartaDateKey() {
  const d = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(d);

  const y = parts.find(p => p.type === 'year').value;
  const m = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  return `${y}${m}${day}`;
}



// Tanggal zona Asia/Jakarta format YYYY-MM-DD untuk tanggal tertentu (Tahap 5)
function getJakartaISODateString(dateObj = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(dateObj);

  const y = parts.find(p => p.type === 'year').value;
  const m = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  return `${y}-${m}-${day}`;
}

// Normalisasi no hp ke format 62xxx
function normalizePhoneForWA(phone) {
  if (!phone) return '';
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  }
  return clean;
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

// --- HELPER SHIFT & PELANGGAN BON (TAHAP 3) ---
function getActiveShift() {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(['shift'], 'readonly');
    const store = tx.objectStore('shift');
    const req = store.getAll();
    req.onsuccess = () => {
      const shifts = req.result || [];
      const active = shifts.find(s => s.status === 'berlangsung');
      resolve(active || null);
    };
    req.onerror = () => reject(req.error);
  });
}

function saveShift(shift) {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(['shift'], 'readwrite');
    const store = tx.objectStore('shift');
    const req = store.put(shift);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function getAllPelangganBon() {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(['pelanggan_bon'], 'readonly');
    const store = tx.objectStore('pelanggan_bon');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function savePelangganBon(pelanggan) {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(['pelanggan_bon'], 'readwrite');
    const store = tx.objectStore('pelanggan_bon');
    const req = store.put(pelanggan);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function getTransaksiById(trxId) {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(['transaksi'], 'readonly');
    const store = tx.objectStore('transaksi');
    const req = store.get(trxId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

function getPelangganBonById(pelangganId) {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(['pelanggan_bon'], 'readonly');
    const store = tx.objectStore('pelanggan_bon');
    const req = store.get(pelangganId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

function getAllBons() {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(['bon'], 'readonly');
    const store = tx.objectStore('bon');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function getBonById(bonId) {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(['bon'], 'readonly');
    const store = tx.objectStore('bon');
    const req = store.get(bonId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

function getAllPembayaranBon() {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(['pembayaran_bon'], 'readonly');
    const store = tx.objectStore('pembayaran_bon');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// Menghitung nomor urut transaksi harian TRX-<YYYYMMDD>-XXX
async function generateNextNomorTransaksi() {
  const dateKey = getJakartaDateKey();
  const prefix = `TRX-${dateKey}-`;

  const allTrx = await new Promise((resolve) => {
    const tx = dbInstance.transaction(['transaksi'], 'readonly');
    const store = tx.objectStore('transaksi');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });

  const todayCount = allTrx.filter(t => t.nomor && t.nomor.startsWith(prefix)).length;
  const nextSeq = String(todayCount + 1).padStart(3, '0');
  return `${prefix}${nextSeq}`;
}


// --- HELPER SHIFT, TRANSAKSI & LAPORAN (TAHAP 5) ---
function getAllShifts() {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(['shift'], 'readonly');
    const store = tx.objectStore('shift');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function getShiftById(shiftId) {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(['shift'], 'readonly');
    const store = tx.objectStore('shift');
    const req = store.get(shiftId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

function getAllTransaksi() {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(['transaksi'], 'readonly');
    const store = tx.objectStore('transaksi');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function getAllTransaksiItems() {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(['transaksi_item'], 'readonly');
    const store = tx.objectStore('transaksi_item');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function getAllPembayaranTransaksi() {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(['pembayaran_transaksi'], 'readonly');
    const store = tx.objectStore('pembayaran_transaksi');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function getAllPengeluaranKas() {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(['pengeluaran_kas'], 'readonly');
    const store = tx.objectStore('pengeluaran_kas');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function savePengeluaranKas(entry) {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(['pengeluaran_kas'], 'readwrite');
    const store = tx.objectStore('pengeluaran_kas');
    const req = store.add(entry);
    req.onsuccess = () => resolve(entry);
    req.onerror = () => reject(req.error);
  });
}

function getAllVoidTransaksi() {
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(['void_transaksi'], 'readonly');
    const store = tx.objectStore('void_transaksi');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
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
  // Menu Laporan khusus Pemilik (Tahap 5)
  const menuLaporan = document.getElementById('menu-laporan');
  if (menuLaporan) {
    if (isPemilik) {
      menuLaporan.classList.remove('hidden');
    } else {
      menuLaporan.classList.add('hidden');
    }
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

// --- 11. FITUR TAHAP 3: KASIR, SHIFT GATE & TRANSAKSI ---

// Buka Gerbang Kasir (Shift Check)
async function enterKasirModule() {
  currentShift = await getActiveShift();

  if (!currentShift) {
    // Tampilkan Modal Buka Shift
    document.getElementById('input-shift-kasir-nama').value = currentUser.nama;
    document.getElementById('input-shift-modal-awal').value = '0';
    document.getElementById('modal-buka-shift').classList.remove('hidden');
    return;
  }

  // Shift aktif ditemukan, masuk layar kasir
  await initKasirScreen();
}

async function initKasirScreen() {
  await loadProductsCache();

  // Update chip info shift
  const kasirUser = await getUserById(currentShift.kasir_id);
  const kasirNama = kasirUser ? kasirUser.nama : 'Kasir';
  const waktuBuka = new Date(currentShift.waktu_buka).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('kasir-shift-chip').textContent = `Shift: ${kasirNama} • sejak ${waktuBuka}`;

  renderKasirProductGrid();
  updateCartUI();
  showView('view-kasir');
}

function renderKasirProductGrid() {
  const grid = document.getElementById('kasir-product-grid');
  grid.innerHTML = '';

  const kw = currentKasirSearch.toLowerCase().trim();

  const filtered = cachedActiveProducts.filter(p => {
    const matchCat = (currentKasirKat === 'SEMUA' || p.kategori === currentKasirKat);
    const matchKw = (!kw || p.nama.toLowerCase().includes(kw));
    return matchCat && matchKw;
  });

  // Favorit di atas, lalu alfabetis
  filtered.sort((a, b) => {
    if (a.favorit && !b.favorit) return -1;
    if (!a.favorit && b.favorit) return 1;
    return a.nama.localeCompare(b.nama);
  });

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="text-muted text-center" style="grid-column: span 2; padding: 24px;">Tidak ada produk yang cocok.</div>';
    return;
  }

  const fragment = document.createDocumentFragment();

  filtered.forEach(p => {
    const stock = cachedStockMap[p.id] || 0;
    const units = cachedUnitsMap[p.id] || [];
    const stockDisplay = formatEquivalentUnit(stock, p.satuan_dasar, units);

    const card = document.createElement('div');
    card.className = 'pos-card';
    card.onclick = () => openPickerModal(p);

    card.innerHTML = `
      <div>
        <div class="pos-card-nama">
          ${p.favorit ? '<span class="text-amber">★ </span>' : ''}${p.nama}
        </div>
      </div>
      <div>
        <div class="pos-card-price">${formatRp(p.harga_jual)} <span class="text-xs text-muted">/${p.satuan_dasar}</span></div>
        <div class="pos-card-stock">${stockDisplay}</div>
      </div>
    `;

    fragment.appendChild(card);
  });

  grid.appendChild(fragment);
}

// Buka Modal Picker Unit & Qty
function openPickerModal(product) {
  activePickerProduct = product;
  selectedPickerUnit = null; // Default: satuan dasar

  const stock = cachedStockMap[product.id] || 0;
  const units = (cachedUnitsMap[product.id] || []).filter(u => u.status_aktif !== false);

  document.getElementById('picker-prod-nama').textContent = product.nama;
  document.getElementById('picker-prod-stok').textContent = `Stok tersedia: ${stock} ${product.satuan_dasar}`;
  document.getElementById('input-picker-qty').value = '1';

  // Render pilihan satuan (Satuan Dasar + Turunan)
  const optionsContainer = document.getElementById('picker-unit-options');
  optionsContainer.innerHTML = '';

  // 1. Opsi Satuan Dasar
  const baseCard = document.createElement('div');
  baseCard.className = 'unit-radio-card selected';
  baseCard.setAttribute('data-unit-id', 'DASAR');
  baseCard.innerHTML = `
    <div>
      <span class="font-bold">1 ${product.satuan_dasar}</span>
      <span class="text-xs text-muted">(Satuan Dasar)</span>
    </div>
    <div class="font-bold text-amber">${formatRp(product.harga_jual)}</div>
  `;
  baseCard.onclick = () => selectPickerUnitOption(baseCard, null);
  optionsContainer.appendChild(baseCard);

  // 2. Opsi Satuan Turunan
  units.forEach(u => {
    const uCard = document.createElement('div');
    uCard.className = 'unit-radio-card';
    uCard.setAttribute('data-unit-id', u.id);
    uCard.innerHTML = `
      <div>
        <span class="font-bold">1 ${u.nama_satuan}</span>
        <span class="text-xs text-muted">(= ${u.faktor_konversi} ${product.satuan_dasar})</span>
      </div>
      <div class="font-bold text-amber">${formatRp(u.harga_jual)}</div>
    `;
    uCard.onclick = () => selectPickerUnitOption(uCard, u);
    optionsContainer.appendChild(uCard);
  });

  updatePickerSubtotal();
  document.getElementById('modal-picker').classList.remove('hidden');
}

function selectPickerUnitOption(cardEl, unitObj) {
  document.querySelectorAll('#picker-unit-options .unit-radio-card').forEach(c => c.classList.remove('selected'));
  cardEl.classList.add('selected');
  selectedPickerUnit = unitObj;
  updatePickerSubtotal();
}

function updatePickerSubtotal() {
  if (!activePickerProduct) return;
  const qty = Math.max(1, parseInt(document.getElementById('input-picker-qty').value || '1', 10));

  let pricePerUnit = 0;
  let factor = 1;

  if (selectedPickerUnit) {
    pricePerUnit = Number(selectedPickerUnit.harga_jual);
    factor = Number(selectedPickerUnit.faktor_konversi);
  } else {
    pricePerUnit = Number(activePickerProduct.harga_jual);
    factor = 1;
  }

  // Aturan A5: subtotal dibulatkan half-up ke rupiah terdekat
  const subtotal = Math.round(pricePerUnit * qty);
  const totalBaseQty = qty * factor;
  const currentStock = cachedStockMap[activePickerProduct.id] || 0;

  document.getElementById('picker-subtotal').textContent = formatRp(subtotal);

  const warningEl = document.getElementById('picker-stok-warning');
  if (totalBaseQty > currentStock) {
    warningEl.classList.remove('hidden');
  } else {
    warningEl.classList.add('hidden');
  }
}

// Tambah Produk Terpilih ke Keranjang
function addActivePickerToCart() {
  if (!activePickerProduct) return;

  const qty = Math.max(1, parseInt(document.getElementById('input-picker-qty').value || '1', 10));
  const isBase = !selectedPickerUnit;
  const factor = isBase ? 1 : Number(selectedPickerUnit.faktor_konversi);
  const hargaSatuan = isBase ? Number(activePickerProduct.harga_jual) : Number(selectedPickerUnit.harga_jual);
  const namaSatuan = isBase ? activePickerProduct.satuan_dasar : selectedPickerUnit.nama_satuan;
  const satuanId = isBase ? null : selectedPickerUnit.id;

  const jumlahDasar = qty * factor;
  const subtotal = Math.round(hargaSatuan * qty);
  const currentStock = cachedStockMap[activePickerProduct.id] || 0;
  const isOverStock = jumlahDasar > currentStock;

  // Cek jika produk + satuan yang sama sudah ada di keranjang
  const existingIdx = cartItems.findIndex(i => i.produk_id === activePickerProduct.id && i.satuan_id === satuanId);

  if (existingIdx > -1) {
    cartItems[existingIdx].jumlah_satuan += qty;
    cartItems[existingIdx].jumlah_dasar = cartItems[existingIdx].jumlah_satuan * factor;
    cartItems[existingIdx].subtotal = Math.round(cartItems[existingIdx].harga_satuan * cartItems[existingIdx].jumlah_satuan);
    cartItems[existingIdx].stok_lewat = (cartItems[existingIdx].jumlah_dasar > currentStock);
  } else {
    const cartItem = {
      id: generateUUID(),
      produk_id: activePickerProduct.id,
      nama_produk: activePickerProduct.nama,
      satuan_id: satuanId,
      nama_satuan: namaSatuan,
      faktor_konversi: factor,
      harga_satuan: hargaSatuan,
      jumlah_satuan: qty,
      jumlah_dasar: jumlahDasar,
      subtotal: subtotal,
      stok_lewat: isOverStock
    };
    cartItems.push(cartItem);
  }

  document.getElementById('modal-picker').classList.add('hidden');
  activePickerProduct = null;
  selectedPickerUnit = null;

  updateCartUI();
}

// Update Tampilan Keranjang & Bar Bawah
function updateCartUI() {
  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.jumlah_satuan, 0);
  const totalBill = cartItems.reduce((acc, item) => acc + item.subtotal, 0);

  // Update Bar Bawah
  document.getElementById('bottom-bar-items').textContent = `${totalItemsCount} item`;
  document.getElementById('bottom-bar-total').textContent = formatRp(totalBill);
  document.getElementById('cart-badge-count').textContent = totalItemsCount;

  const btnBayar = document.getElementById('btn-bottom-bayar');
  btnBayar.disabled = (cartItems.length === 0);

  // Render Daftar Keranjang di Modal
  renderCartModalItems(totalBill);
}

function renderCartModalItems(totalBill) {
  const container = document.getElementById('cart-items-container');
  container.innerHTML = '';
  document.getElementById('cart-modal-total').textContent = formatRp(totalBill);

  if (cartItems.length === 0) {
    container.innerHTML = '<div class="text-center text-muted" style="padding: 24px;">Keranjang belanja masih kosong.</div>';
    return;
  }

  cartItems.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'cart-item-row';

    row.innerHTML = `
      <div class="cart-item-info">
        <div class="cart-item-title">${item.nama_produk}</div>
        <div class="cart-item-unit">
          ${item.jumlah_satuan} ${item.nama_satuan} × ${formatRp(item.harga_satuan)}
          ${item.stok_lewat ? '<span class="text-danger text-xs font-bold">[Stok Lewat]</span>' : ''}
        </div>
        <div class="font-bold text-amber text-xs">${formatRp(item.subtotal)}</div>
      </div>
      <div class="cart-item-controls">
        <button type="button" class="btn btn-secondary cart-stepper-sm" data-cart-minus="${index}">−</button>
        <span class="cart-qty-val">${item.jumlah_satuan}</span>
        <button type="button" class="btn btn-secondary cart-stepper-sm" data-cart-plus="${index}">+</button>
        <button type="button" class="btn-danger-sm" data-cart-del="${index}" style="margin-left: 6px;">🗑️</button>
      </div>
    `;

    // Event Stepper Keranjang
    row.querySelector(`[data-cart-minus="${index}"]`).onclick = () => {
      if (item.jumlah_satuan > 1) {
        item.jumlah_satuan--;
        item.jumlah_dasar = item.jumlah_satuan * item.faktor_konversi;
        item.subtotal = Math.round(item.harga_satuan * item.jumlah_satuan);
      } else {
        cartItems.splice(index, 1);
      }
      updateCartUI();
    };

    row.querySelector(`[data-cart-plus="${index}"]`).onclick = () => {
      item.jumlah_satuan++;
      item.jumlah_dasar = item.jumlah_satuan * item.faktor_konversi;
      item.subtotal = Math.round(item.harga_satuan * item.jumlah_satuan);
      updateCartUI();
    };

    row.querySelector(`[data-cart-del="${index}"]`).onclick = () => {
      cartItems.splice(index, 1);
      updateCartUI();
    };

    container.appendChild(row);
  });
}

// Buka Modal Pembayaran
async function openPaymentModal() {
  if (cartItems.length === 0) return;

  const totalBill = cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  document.getElementById('pay-total-tagihan').textContent = formatRp(totalBill);

  // Reset form pembayaran
  document.getElementById('input-pay-tunai-received').value = '';
  document.getElementById('input-pay-qris').value = '';
  document.getElementById('input-pay-bon').value = '';

  // Muat daftar pelanggan bon
  await refreshPelangganBonDropdown();

  // Hitung invarian awal
  recalculatePaymentInvariant();

  // Tutup sheet keranjang, buka modal bayar
  document.getElementById('modal-cart').classList.add('hidden');
  document.getElementById('modal-payment').classList.remove('hidden');
}

async function refreshPelangganBonDropdown() {
  const pelanggans = await getAllPelangganBon();
  const select = document.getElementById('select-bon-pelanggan');
  select.innerHTML = '<option value="">-- Pilih Pelanggan Bon --</option>';

  pelanggans.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.nama} ${p.no_hp ? '(' + p.no_hp + ')' : ''}`;
    select.appendChild(opt);
  });
}

// Kalkulasi Invarian Ketat Pembayaran (A5 + PRD §2)
function recalculatePaymentInvariant() {
  const totalBill = cartItems.reduce((acc, item) => acc + item.subtotal, 0);

  const rawCashReceived = Math.max(0, Math.round(Number(document.getElementById('input-pay-tunai-received').value) || 0));
  const rawQris = Math.max(0, Math.round(Number(document.getElementById('input-pay-qris').value) || 0));
  const rawBon = Math.max(0, Math.round(Number(document.getElementById('input-pay-bon').value) || 0));

  // Tampilkan/sembunyikan pemilih pelanggan bon jika porsi bon > 0
  const bonSection = document.getElementById('bon-customer-section');
  if (rawBon > 0) {
    bonSection.classList.remove('hidden');
  } else {
    bonSection.classList.add('hidden');
  }

  // Tagihan yang harus ditutup oleh tunai = totalBill - QRIS - Bon
  const sisaSebelumTunai = Math.max(0, totalBill - rawQris - rawBon);

  // Komponen tunai yang terhitung untuk melunasi tagihan
  const tunaiApplied = Math.min(rawCashReceived, sisaSebelumTunai);
  const kembalian = Math.max(0, rawCashReceived - sisaSebelumTunai);

  // Tampilkan breakdown
  document.getElementById('pay-tunai-applied').textContent = `Terhitung: ${formatRp(tunaiApplied)}`;
  document.getElementById('pay-tunai-change').textContent = formatRp(kembalian);

  // Total pembayaran yang sah menutup tagihan
  const totalPaymentApplied = tunaiApplied + rawQris + rawBon;
  const sisaKurang = totalBill - totalPaymentApplied;

  const badge = document.getElementById('pay-status-badge');
  const errorBox = document.getElementById('pay-invariant-error');
  const btnSubmit = document.getElementById('btn-submit-transaksi');

  const bonValid = (rawBon === 0) || (rawBon > 0 && Boolean(document.getElementById('select-bon-pelanggan').value));

  if (sisaKurang === 0 && bonValid) {
    badge.className = 'pay-badge pay-badge-paid';
    badge.textContent = 'Lunas (Pas)';
    errorBox.classList.add('hidden');
    btnSubmit.disabled = false;
  } else {
    badge.className = 'pay-badge pay-badge-unpaid';
    if (sisaKurang > 0) {
      badge.textContent = `Sisa Tagihan: ${formatRp(sisaKurang)}`;
      errorBox.textContent = `Pembayaran kurang ${formatRp(sisaKurang)}. Harap cukupkan pembayaran.`;
    } else if (!bonValid) {
      badge.textContent = 'Pilih Pelanggan Bon';
      errorBox.textContent = 'Wajib memilih atau mendaftarkan pelanggan untuk transaksi bon.';
    } else {
      badge.textContent = 'Nominal Lebih';
      errorBox.textContent = 'Kelebihan hanya diperbolehkan pada uang tunai (sebagai kembalian).';
    }
    errorBox.classList.remove('hidden');
    btnSubmit.disabled = true;
  }

  return {
    totalBill,
    rawCashReceived,
    tunaiApplied,
    kembalian,
    rawQris,
    rawBon,
    isValid: (sisaKurang === 0 && bonValid)
  };
}

// Simpan Transaksi Atomik dalam Satu Transaksi IndexedDB
async function eksekusiSimpanTransaksi() {
  const calc = recalculatePaymentInvariant();
  if (!calc.isValid) {
    alert('Pembayaran belum memenuhi invarian total transaksi!');
    return;
  }

  if (!currentShift) {
    alert('Tidak ada shift aktif!');
    return;
  }

  const btnSubmit = document.getElementById('btn-submit-transaksi');
  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Menyimpan...';

  try {
    const nomorTransaksi = await generateNextNomorTransaksi();
    const trxId = generateUUID();
    const nowIso = new Date().toISOString();

    // Hitung saldo berjalan stok per produk secara atomik
    const productRunningStock = {};
    for (const item of cartItems) {
      if (productRunningStock[item.produk_id] === undefined) {
        productRunningStock[item.produk_id] = cachedStockMap[item.produk_id] || 0;
      }
    }

    const tx = dbInstance.transaction(
      ['transaksi', 'transaksi_item', 'pembayaran_transaksi', 'pergerakan_stok', 'bon', 'pelanggan_bon', 'log_aktivitas'],
      'readwrite'
    );

    const storeTrx = tx.objectStore('transaksi');
    const storeItem = tx.objectStore('transaksi_item');
    const storePay = tx.objectStore('pembayaran_transaksi');
    const storeMove = tx.objectStore('pergerakan_stok');
    const storeBon = tx.objectStore('bon');
    const storeLog = tx.objectStore('log_aktivitas');

    // 1. Simpan Transaksi Header
    const trxRecord = {
      id: trxId,
      nomor: nomorTransaksi,
      shift_id: currentShift.id,
      kasir_id: currentUser.id,
      waktu: nowIso,
      total: calc.totalBill,
      status: 'selesai',
      jenis: 'biasa',
      dicatat_susulan: false
    };
    storeTrx.add(trxRecord);

    // 2. Simpan Transaksi Item & Mutasi Stok (Ledger JUAL)
    for (const item of cartItems) {
      const itemId = generateUUID();
      const itemRecord = {
        id: itemId,
        transaksi_id: trxId,
        produk_id: item.produk_id,
        nama_produk: item.nama_produk,
        satuan_id: item.satuan_id,
        nama_satuan: item.nama_satuan,
        faktor_konversi: item.faktor_konversi,
        harga_satuan: item.harga_satuan,
        jumlah_satuan: item.jumlah_satuan,
        jumlah_dasar: item.jumlah_dasar,
        subtotal: item.subtotal,
        stok_lewat: item.stok_lewat
      };
      storeItem.add(itemRecord);

      // Hitung saldo sesudah secara berurutan
      productRunningStock[item.produk_id] -= item.jumlah_dasar;
      const saldoSesudah = productRunningStock[item.produk_id];

      const moveRecord = {
        id: generateUUID(),
        produk_id: item.produk_id,
        jenis: 'JUAL',
        jumlah: -item.jumlah_dasar, // Berkurang
        saldo_sesudah: saldoSesudah,
        pengguna_id: currentUser.id,
        waktu: nowIso,
        keterangan: `Penjualan ${nomorTransaksi}`
      };
      storeMove.add(moveRecord);
    }

    // 3. Simpan Pembayaran Transaksi (Tunai, QRIS, Bon)
    const metodeList = [];

    if (calc.tunaiApplied > 0 || calc.rawCashReceived > 0) {
      metodeList.push('tunai');
      storePay.add({
        id: generateUUID(),
        transaksi_id: trxId,
        metode: 'tunai',
        nominal: calc.tunaiApplied,
        uang_diterima: calc.rawCashReceived,
        kembalian: calc.kembalian
      });
    }

    if (calc.rawQris > 0) {
      metodeList.push('qris');
      storePay.add({
        id: generateUUID(),
        transaksi_id: trxId,
        metode: 'qris',
        nominal: calc.rawQris,
        uang_diterima: calc.rawQris,
        kembalian: 0
      });
    }

    if (calc.rawBon > 0) {
      metodeList.push('bon');
      const pelangganId = document.getElementById('select-bon-pelanggan').value;

      storePay.add({
        id: generateUUID(),
        transaksi_id: trxId,
        metode: 'bon',
        nominal: calc.rawBon,
        uang_diterima: calc.rawBon,
        kembalian: 0
      });

      // Buat record bon baru
      const bonRecord = {
        id: generateUUID(),
        pelanggan_id: pelangganId,
        transaksi_id: trxId,
        jumlah: calc.rawBon,
        status: 'belum_lunas',
        dibuat_pada: nowIso
      };
      storeBon.add(bonRecord);
    }

    // 4. Catat Log Aktivitas Transaksi
    storeLog.add({
      id: generateUUID(),
      pengguna_id: currentUser.id,
      waktu: nowIso,
      aksi: 'TRANSAKSI_BARU',
      objek: 'transaksi',
      detail: JSON.stringify({
        nomor: nomorTransaksi,
        total: calc.totalBill,
        metode: metodeList.join(', ')
      })
    });

    tx.oncomplete = () => {
      // Sukses atomik
      document.getElementById('modal-payment').classList.add('hidden');

      // Tampilkan Layar Sukses
      document.getElementById('success-trx-nomor').textContent = nomorTransaksi;
      document.getElementById('success-total').textContent = formatRp(calc.totalBill);

      let breakdownStr = `Metode: ${metodeList.map(m => m.toUpperCase()).join(' + ')}`;
      if (calc.rawBon > 0) {
        const pelSelect = document.getElementById('select-bon-pelanggan');
        breakdownStr += ` (Bon: ${pelSelect.options[pelSelect.selectedIndex].text})`;
      }
      document.getElementById('success-breakdown').textContent = breakdownStr;

      const changeRow = document.getElementById('success-change-row');
      if (calc.kembalian > 0) {
        changeRow.classList.remove('hidden');
        document.getElementById('success-change').textContent = formatRp(calc.kembalian);
      } else {
        changeRow.classList.add('hidden');
      }

      document.getElementById('modal-success').classList.remove('hidden');

      // Kosongkan keranjang & refresh cache stok lokal
      cartItems = [];
      updateCartUI();
      loadProductsCache().then(() => renderKasirProductGrid());
    };

    tx.onerror = (e) => {
      console.error('Transaksi gagal dan dibatalkan (rollback):', e.target.error);
      alert('Terjadi kesalahan saat menyimpan transaksi. Data aman.');
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Simpan Transaksi (Selesai)';
    };

  } catch (err) {
    console.error('Error saat simpan transaksi:', err);
    alert('Terjadi kegagalan sistem penyimpanan transaksi.');
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Simpan Transaksi (Selesai)';
  }
}


// --- 12. FITUR TAHAP 4: BUKU BON DIGITAL ---

// Kalkulasi buku bon dari database: memuat semua pelanggan yang pernah punya bon
async function loadBukuBonData() {
  const [allPelanggan, allBons, allPayments] = await Promise.all([
    getAllPelangganBon(),
    getAllBons(),
    getAllPembayaranBon()
  ]);

  // Map pembayaran per bon_id: Σ nominal
  const paymentByBonId = {};
  for (const pay of allPayments) {
    paymentByBonId[pay.bon_id] = (paymentByBonId[pay.bon_id] || 0) + (Number(pay.jumlah) || 0);
  }

  // Agregasi per pelanggan
  const pelangganMap = {};
  for (const p of allPelanggan) {
    pelangganMap[p.id] = {
      ...p,
      total_bon: 0,
      total_dibayar: 0,
      sisa_bon: 0,
      unpaid_count: 0,
      bons: []
    };
  }

  for (const b of allBons) {
    const totalBayar = paymentByBonId[b.id] || 0;
    const jumlahBon = Number(b.jumlah) || 0;
    const sisa = Math.max(0, jumlahBon - totalBayar);

    if (pelangganMap[b.pelanggan_id]) {
      pelangganMap[b.pelanggan_id].total_bon += jumlahBon;
      pelangganMap[b.pelanggan_id].total_dibayar += totalBayar;
      pelangganMap[b.pelanggan_id].sisa_bon += sisa;
      if (sisa > 0) {
        pelangganMap[b.pelanggan_id].unpaid_count += 1;
      }
      pelangganMap[b.pelanggan_id].bons.push({
        ...b,
        sudah_bayar: totalBayar,
        sisa: sisa
      });
    }
  }

  // Filter: hanya pelanggan yang PERNAH memiliki record bon
  cachedBonCustomers = Object.values(pelangganMap).filter(p => p.bons.length > 0);

  // Urutkan: sisa bon terbesar di atas, lalu nama A-Z
  cachedBonCustomers.sort((a, b) => {
    if (b.sisa_bon !== a.sisa_bon) {
      return b.sisa_bon - a.sisa_bon;
    }
    return a.nama.localeCompare(b.nama);
  });
}

async function renderBukuBonScreen() {
  await loadBukuBonData();
  filterAndRenderBonCustomers();
  showView('view-bon');
}

function filterAndRenderBonCustomers() {
  const container = document.getElementById('list-pelanggan-bon-container');
  container.innerHTML = '';

  const kw = currentBonSearch.toLowerCase().trim();

  // Hitung total seluruh sisa bon warung & pelanggan yang masih berutang
  let totalSemuaBon = 0;
  let berutangCount = 0;

  cachedBonCustomers.forEach(p => {
    totalSemuaBon += p.sisa_bon;
    if (p.sisa_bon > 0) {
      berutangCount++;
    }
  });

  document.getElementById('label-total-semua-bon').textContent = formatRp(totalSemuaBon);
  const badgeCount = document.getElementById('badge-pelanggan-berutang-count');
  badgeCount.textContent = `${berutangCount} Pelanggan Berutang`;
  if (berutangCount > 0) {
    badgeCount.className = 'badge-warning text-xs';
  } else {
    badgeCount.className = 'pay-badge pay-badge-paid text-xs';
    badgeCount.textContent = 'Semua Lunas';
  }

  const filtered = cachedBonCustomers.filter(p => {
    return (!kw || p.nama.toLowerCase().includes(kw));
  });

  document.getElementById('label-total-pelanggan-bon').textContent = `Menampilkan ${filtered.length} pelanggan`;

  if (cachedBonCustomers.length === 0) {
    container.innerHTML = `
      <div class="card text-center text-muted" style="padding: 24px; line-height: 1.5;">
        Belum ada catatan bon.<br>
        <span class="text-xs">Bon tercatat otomatis saat transaksi kasir dibayar sebagian/seluruhnya dengan bon.</span>
      </div>
    `;
    return;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="card text-center text-muted" style="padding: 24px;">
        Tidak ada pelanggan bon yang cocok dengan pencarian.
      </div>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();

  filtered.forEach(p => {
    const isLunas = p.sisa_bon <= 0;
    const item = document.createElement('div');
    item.className = 'bon-customer-item';
    item.onclick = () => openBonCustomerDetail(p.id);

    item.innerHTML = `
      <div class="bon-cust-left">
        <div class="bon-cust-name">${p.nama}</div>
        <div class="bon-cust-sub">
          ${p.no_hp ? '📞 ' + p.no_hp + ' • ' : ''}
          Total Bon: ${formatRp(p.total_bon)}
        </div>
      </div>
      <div class="bon-cust-right">
        ${isLunas
          ? '<span class="pay-badge pay-badge-paid">Lunas</span>'
          : `<span class="bon-cust-sisa">${formatRp(p.sisa_bon)}</span>
             <span class="text-xs text-muted">${p.unpaid_count} bon belum lunas</span>`
        }
      </div>
    `;

    fragment.appendChild(item);
  });

  container.appendChild(fragment);
}

// Buka Detail Pelanggan Bon
async function openBonCustomerDetail(pelangganId) {
  activeBonCustomerId = pelangganId;

  // Muat data segar langsung dari database
  const [pelanggan, allBons, allPayments] = await Promise.all([
    getPelangganBonById(pelangganId),
    getAllBons(),
    getAllPembayaranBon()
  ]);

  if (!pelanggan) return;

  // Filter bon pelanggan ini
  const customerBons = allBons.filter(b => b.pelanggan_id === pelangganId);
  const bonIdsSet = new Set(customerBons.map(b => b.id));

  // Filter pembayaran bon pelanggan ini
  const customerPayments = allPayments.filter(pay => bonIdsSet.has(pay.bon_id));

  // Map total bayar per bon
  const paymentByBonId = {};
  for (const pay of customerPayments) {
    paymentByBonId[pay.bon_id] = (paymentByBonId[pay.bon_id] || 0) + (Number(pay.jumlah) || 0);
  }

  // Hitung total ringkasan
  let totalBon = 0;
  let totalSudahBayar = 0;
  let totalSisa = 0;

  customerBons.forEach(b => {
    const bayar = paymentByBonId[b.id] || 0;
    const jumlah = Number(b.jumlah) || 0;
    const sisa = Math.max(0, jumlah - bayar);

    totalBon += jumlah;
    totalSudahBayar += bayar;
    totalSisa += sisa;

    b.sudah_bayar = bayar;
    b.sisa = sisa;
  });

  // Urutkan bon: terbaru di atas
  customerBons.sort((a, b) => new Date(b.dibuat_pada) - new Date(a.dibuat_pada));

  // Tampilkan data info pelanggan
  document.getElementById('detail-bon-pelanggan-nama').textContent = pelanggan.nama;
  const hpText = pelanggan.no_hp ? `HP: ${pelanggan.no_hp}` : 'HP: -';
  const alamatText = pelanggan.alamat ? `Alamat: ${pelanggan.alamat}` : 'Alamat: -';
  document.getElementById('detail-bon-pelanggan-kontak').textContent = `${hpText} • ${alamatText}`;

  // Tampilkan 3 angka ringkasan
  document.getElementById('detail-stat-total-bon').textContent = formatRp(totalBon);
  document.getElementById('detail-stat-sudah-bayar').textContent = formatRp(totalSudahBayar);
  document.getElementById('detail-stat-sisa-bon').textContent = formatRp(totalSisa);

  // Konfigurasi tombol share WhatsApp
  const btnWa = document.getElementById('btn-share-wa-bon');
  btnWa.onclick = async () => {
    const warungName = (await getPengaturan('nama_warung')) || 'WarungKas';
    const waText = `Halo ${pelanggan.nama}, ringkasan bon di ${warungName}:\n` +
                   `Total bon: ${formatRp(totalBon)}\n` +
                   `Sudah dibayar: ${formatRp(totalSudahBayar)}\n` +
                   `Sisa bon: ${formatRp(totalSisa)}.\n` +
                   `Terima kasih.`;

    const encoded = encodeURIComponent(waText);
    const cleanPhone = normalizePhoneForWA(pelanggan.no_hp);

    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(waUrl, '_blank');
  };

  // Render daftar tagihan bon
  await renderCustomerBonsList(customerBons, pelanggan);

  // Render tabel riwayat pembayaran
  await renderCustomerPaymentsList(customerPayments, customerBons);

  showView('view-bon-detail');
}

async function renderCustomerBonsList(customerBons, pelanggan) {
  const container = document.getElementById('detail-bon-list-container');
  container.innerHTML = '';

  if (customerBons.length === 0) {
    container.innerHTML = '<div class="text-xs text-muted text-center" style="padding: 12px;">Tidak ada catatan bon.</div>';
    return;
  }

  // Pre-load nomor transaksi untuk setiap bon
  const trxMap = {};
  for (const b of customerBons) {
    if (b.transaksi_id) {
      const trx = await getTransaksiById(b.transaksi_id);
      trxMap[b.transaksi_id] = trx ? trx.nomor : '-';
    }
  }

  const fragment = document.createDocumentFragment();

  customerBons.forEach(b => {
    const isLunas = b.sisa <= 0;
    const trxNomor = trxMap[b.transaksi_id] || '-';
    const d = new Date(b.dibuat_pada);
    const dateStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

    const card = document.createElement('div');
    card.className = 'bon-bill-card';

    card.innerHTML = `
      <div class="bon-bill-header">
        <div>
          <span class="font-bold text-sm">${trxNomor}</span>
          <span class="text-xs text-muted" style="display: block;">${dateStr}</span>
        </div>
        <span class="pay-badge ${isLunas ? 'pay-badge-paid' : 'pay-badge-unpaid'}">
          ${isLunas ? 'Lunas' : 'Belum Lunas'}
        </span>
      </div>

      <div class="bon-bill-body">
        <div>
          <span class="text-xs text-muted">Jumlah Bon</span>
          <strong style="display: block;">${formatRp(b.jumlah)}</strong>
        </div>
        <div>
          <span class="text-xs text-muted">Dibayar</span>
          <strong class="text-success" style="display: block;">${formatRp(b.sudah_bayar)}</strong>
        </div>
        <div>
          <span class="text-xs text-muted">Sisa Bon</span>
          <strong class="text-amber" style="display: block;">${formatRp(b.sisa)}</strong>
        </div>
      </div>

      ${!isLunas ? `
        <button type="button" class="btn btn-primary btn-sm btn-block mt-1" data-bon-pay="${b.id}">
          💵 Catat Pembayaran
        </button>
      ` : ''}
    `;

    const payBtn = card.querySelector(`[data-bon-pay="${b.id}"]`);
    if (payBtn) {
      payBtn.onclick = () => openPayBonModal(b, pelanggan, trxNomor);
    }

    fragment.appendChild(card);
  });

  container.appendChild(fragment);
}

async function renderCustomerPaymentsList(payments, customerBons) {
  const tbody = document.getElementById('table-riwayat-bayar-bon');
  tbody.innerHTML = '';

  if (payments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Belum ada riwayat pembayaran bon.</td></tr>';
    return;
  }

  // Map bon_id -> nomor transaksi
  const bonTrxMap = {};
  for (const b of customerBons) {
    if (b.transaksi_id) {
      const trx = await getTransaksiById(b.transaksi_id);
      bonTrxMap[b.id] = trx ? trx.nomor : '-';
    }
  }

  // Urutkan pembayaran: terbaru di atas
  const sortedPayments = [...payments].sort((a, b) => new Date(b.waktu) - new Date(a.waktu));

  sortedPayments.forEach(p => {
    const tr = document.createElement('tr');
    const d = new Date(p.waktu);
    const dateStr = `${d.getDate()}/${d.getMonth() + 1} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    const trxNomor = bonTrxMap[p.bon_id] || '-';
    const metodeLabel = (p.metode || 'tunai').toUpperCase();

    tr.innerHTML = `
      <td class="text-xs text-muted">${dateStr}</td>
      <td class="font-bold text-xs">${trxNomor}</td>
      <td class="text-xs">${metodeLabel}</td>
      <td class="font-bold text-success">${formatRp(p.jumlah)}</td>
    `;

    tbody.appendChild(tr);
  });
}

// Buka Modal Pembayaran Bon
function openPayBonModal(bon, pelanggan, trxNomor) {
  activePayingBonId = bon.id;

  document.getElementById('input-paybon-bon-id').value = bon.id;
  document.getElementById('modal-paybon-nama-pelanggan').textContent = pelanggan.nama;
  document.getElementById('modal-paybon-nomor-trx').textContent = trxNomor || '-';
  document.getElementById('modal-paybon-total-awal').textContent = formatRp(bon.jumlah);
  document.getElementById('modal-paybon-sudah-bayar').textContent = formatRp(bon.sudah_bayar);
  document.getElementById('modal-paybon-sisa-bon').textContent = formatRp(bon.sisa);

  const inputNominal = document.getElementById('input-paybon-nominal');
  inputNominal.value = '';
  inputNominal.max = bon.sisa;

  // Default metode: tunai
  document.querySelectorAll('input[name="paybon-metode"]').forEach(radio => {
    radio.checked = (radio.value === 'tunai');
  });

  document.getElementById('paybon-error-msg').classList.add('hidden');

  // Tombol bayar lunas
  document.getElementById('btn-paybon-lunas').onclick = () => {
    inputNominal.value = bon.sisa;
    document.getElementById('paybon-error-msg').classList.add('hidden');
  };

  document.getElementById('modal-bayar-bon').classList.remove('hidden');
  inputNominal.focus();
}

// Simpan Pembayaran Bon Atomik
async function eksekusiSimpanPembayaranBon(e) {
  e.preventDefault();

  const bonId = document.getElementById('input-paybon-bon-id').value;
  const nominalInput = Math.round(Number(document.getElementById('input-paybon-nominal').value) || 0);
  const errorBox = document.getElementById('paybon-error-msg');
  errorBox.classList.add('hidden');

  if (!bonId) return;

  const bon = await getBonById(bonId);
  if (!bon) {
    errorBox.textContent = 'Data bon tidak ditemukan!';
    errorBox.classList.remove('hidden');
    return;
  }

  // Hitung ulang sisa bon saat ini secara akurat
  const allPayments = await getAllPembayaranBon();
  const currentPayments = allPayments.filter(p => p.bon_id === bonId);
  const totalSudahBayar = currentPayments.reduce((acc, p) => acc + (Number(p.jumlah) || 0), 0);
  const sisaSaatIni = Math.max(0, (Number(bon.jumlah) || 0) - totalSudahBayar);

  if (nominalInput <= 0) {
    errorBox.textContent = 'Nominal pembayaran harus lebih dari Rp 0!';
    errorBox.classList.remove('hidden');
    return;
  }

  if (nominalInput > sisaSaatIni) {
    errorBox.textContent = `Nominal melebihi sisa bon (${formatRp(sisaSaatIni)}). Tidak diperbolehkan kelebihan pada cicilan bon.`;
    errorBox.classList.remove('hidden');
    return;
  }

  const selectedMetode = document.querySelector('input[name="paybon-metode"]:checked')?.value || 'tunai';
  const activeShift = await getActiveShift();
  const shiftId = activeShift ? activeShift.id : null;
  const nowIso = new Date().toISOString();
  const sisaSetelahnya = sisaSaatIni - nominalInput;

  const btnSubmit = document.getElementById('btn-submit-bayar-bon');
  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Menyimpan...';

  try {
    const tx = dbInstance.transaction(
      ['pembayaran_bon', 'bon', 'log_aktivitas'],
      'readwrite'
    );

    const storePayBon = tx.objectStore('pembayaran_bon');
    const storeBon = tx.objectStore('bon');
    const storeLog = tx.objectStore('log_aktivitas');

    // 1. Tambah record pembayaran_bon
    const paymentRecord = {
      id: generateUUID(),
      bon_id: bonId,
      jumlah: nominalInput,
      metode: selectedMetode,
      shift_id: shiftId,
      pengguna_id: currentUser ? currentUser.id : 'sistem',
      waktu: nowIso
    };
    storePayBon.add(paymentRecord);

    // 2. Perbarui status bon jika sisa menjadi 0
    if (sisaSetelahnya === 0) {
      bon.status = 'lunas';
      storeBon.put(bon);
    }

    // 3. Catat log aktivitas
    storeLog.add({
      id: generateUUID(),
      pengguna_id: currentUser ? currentUser.id : 'sistem',
      waktu: nowIso,
      aksi: 'PEMBAYARAN_BON',
      objek: 'bon',
      detail: JSON.stringify({
        bon_id: bonId,
        pelanggan_id: bon.pelanggan_id,
        transaksi_id: bon.transaksi_id,
        jumlah_bayar: nominalInput,
        metode: selectedMetode,
        sisa_akhir: sisaSetelahnya,
        status_akhir: sisaSetelahnya === 0 ? 'lunas' : 'belum_lunas'
      })
    });

    tx.oncomplete = async () => {
      document.getElementById('modal-bayar-bon').classList.add('hidden');
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Simpan Pembayaran';

      alert(`Pembayaran bon ${formatRp(nominalInput)} (${selectedMetode.toUpperCase()}) berhasil dicatat.`);

      // Segarkan layar detail pelanggan
      if (activeBonCustomerId) {
        await openBonCustomerDetail(activeBonCustomerId);
      }
    };

    tx.onerror = (e) => {
      console.error('Gagal menyimpan pembayaran bon:', e.target.error);
      alert('Gagal mencatat pembayaran bon. Coba lagi.');
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Simpan Pembayaran';
    };

  } catch (err) {
    console.error('Error pembayaran bon:', err);
    alert('Terjadi kesalahan sistem saat menyimpan pembayaran bon.');
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Simpan Pembayaran';
  }
}


// --- 12B. FITUR TAHAP 5: SHIFT KASIR & REKONSILIASI KAS ---

// Menghitung angka shift segar dari DB (Shift Aktif maupun Selesai)
async function hitungDataShift(shiftId) {
  const shift = await getShiftById(shiftId);
  if (!shift) return null;

  const [allTrx, allPay, allBonPay, allExpenses, allUsers] = await Promise.all([
    getAllTransaksi(),
    getAllPembayaranTransaksi(),
    getAllPembayaranBon(),
    getAllPengeluaranKas(),
    getAllUsers()
  ]);

  const kasirUser = allUsers.find(u => u.id === shift.kasir_id);
  const kasirNama = kasirUser ? kasirUser.nama : 'Kasir';

  // Transaksi milik shift ini
  const shiftTrx = allTrx.filter(t => t.shift_id === shiftId && t.status === 'selesai');
  const shiftTrxIds = new Set(shiftTrx.map(t => t.id));

  // Pembayaran transaksi shift ini
  const shiftPays = allPay.filter(p => shiftTrxIds.has(p.transaksi_id));

  let tunaiPenjualan = 0;
  let qrisPenjualan = 0;
  let bonPenjualan = 0;

  shiftPays.forEach(p => {
    const nom = Number(p.nominal) || 0;
    if (p.metode === 'tunai') tunaiPenjualan += nom;
    else if (p.metode === 'qris') qrisPenjualan += nom;
    else if (p.metode === 'bon') bonPenjualan += nom;
  });

  const totalPenjualan = shiftTrx.reduce((acc, t) => acc + (Number(t.total) || 0), 0);

  // Pembayaran bon tunai yang masuk shift ini
  const shiftBonPays = allBonPay.filter(b => b.shift_id === shiftId);
  const tunaiBayarBon = shiftBonPays
    .filter(b => b.metode === 'tunai')
    .reduce((acc, b) => acc + (Number(b.jumlah) || 0), 0);

  // Pengeluaran kas shift ini
  const shiftExpenses = allExpenses.filter(e => e.shift_id === shiftId);
  const totalPengeluaran = shiftExpenses.reduce((acc, e) => acc + (Number(e.jumlah) || 0), 0);

  // Rumus Kas Diharapkan = Modal Awal + Tunai Jual + Tunai Bon − Pengeluaran
  const modalAwal = Number(shift.modal_awal) || 0;
  const kasDiharapkan = modalAwal + tunaiPenjualan + tunaiBayarBon - totalPengeluaran;

  return {
    shift,
    kasirNama,
    modalAwal,
    shiftTrx,
    totalPenjualan,
    tunaiPenjualan,
    qrisPenjualan,
    bonPenjualan,
    tunaiBayarBon,
    shiftExpenses,
    totalPengeluaran,
    kasDiharapkan,
    shiftBonPays
  };
}

async function renderShiftScreen() {
  const active = await getActiveShift();
  const noActiveBox = document.getElementById('shift-no-active-box');
  const activeBox = document.getElementById('shift-active-box');

  if (!active) {
    activeShiftCalculation = null;
    noActiveBox.classList.remove('hidden');
    activeBox.classList.add('hidden');
  } else {
    noActiveBox.classList.add('hidden');
    activeBox.classList.remove('hidden');

    const calc = await hitungDataShift(active.id);
    activeShiftCalculation = calc;

    const dOpen = new Date(calc.shift.waktu_buka);
    const timeStr = `${dOpen.getDate()}/${dOpen.getMonth() + 1} ${dOpen.getHours().toString().padStart(2, '0')}:${dOpen.getMinutes().toString().padStart(2, '0')}`;

    document.getElementById('shift-active-opened-at').textContent = `Buka: ${timeStr} WIB`;
    document.getElementById('shift-active-kasir-nama').textContent = `Kasir: ${calc.kasirNama}`;
    document.getElementById('shift-active-modal-awal').textContent = formatRp(calc.modalAwal);
    document.getElementById('shift-active-penjualan-total').textContent = formatRp(calc.totalPenjualan);

    document.getElementById('shift-active-tunai-jual').textContent = formatRp(calc.tunaiPenjualan);
    document.getElementById('shift-active-qris-jual').textContent = formatRp(calc.qrisPenjualan);
    document.getElementById('shift-active-bon-jual').textContent = formatRp(calc.bonPenjualan);
    document.getElementById('shift-active-bayarbon-tunai').textContent = formatRp(calc.tunaiBayarBon);
    document.getElementById('shift-active-pengeluaran-total').textContent = formatRp(calc.totalPengeluaran);

    document.getElementById('shift-active-kas-diharapkan').textContent = formatRp(calc.kasDiharapkan);

    renderActiveExpensesList(calc.shiftExpenses);
  }

  await renderShiftHistoryList();
  showView('view-shift');
}

function renderActiveExpensesList(expenses) {
  const container = document.getElementById('shift-active-pengeluaran-list');
  const countLabel = document.getElementById('shift-active-pengeluaran-count');
  container.innerHTML = '';

  countLabel.textContent = `${expenses.length} pengeluaran`;

  if (expenses.length === 0) {
    container.innerHTML = '<div class="text-xs text-muted text-center" style="padding: 10px;">Belum ada pengeluaran kas.</div>';
    return;
  }

  // Tampilkan terbaru di atas
  const sorted = [...expenses].sort((a, b) => new Date(b.waktu) - new Date(a.waktu));

  sorted.forEach(e => {
    const d = new Date(e.waktu);
    const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    const jenisLabel = e.jenis === 'setor_pemilik' ? 'Setor ke Pemilik' : 'Operasional';

    const item = document.createElement('div');
    item.className = 'expense-item';
    item.innerHTML = `
      <div class="expense-left">
        <div class="expense-title">${e.keterangan || '-'}</div>
        <div class="expense-meta">${timeStr} • ${jenisLabel}</div>
      </div>
      <div class="expense-amount">− ${formatRp(e.jumlah)}</div>
    `;
    container.appendChild(item);
  });
}

async function renderShiftHistoryList() {
  const container = document.getElementById('shift-history-list');
  container.innerHTML = '';

  const [allShifts, allUsers] = await Promise.all([
    getAllShifts(),
    getAllUsers()
  ]);

  const userMap = {};
  allUsers.forEach(u => { userMap[u.id] = u.nama; });

  const finishedShifts = allShifts
    .filter(s => s.status === 'selesai')
    .sort((a, b) => new Date(b.waktu_buka) - new Date(a.waktu_buka));

  if (finishedShifts.length === 0) {
    container.innerHTML = '<div class="text-xs text-muted text-center" style="padding: 14px;">Belum ada shift selesai.</div>';
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const s of finishedShifts) {
    const kasirNama = userMap[s.kasir_id] || 'Kasir';
    const dBuka = new Date(s.waktu_buka);
    const dTut = s.waktu_tutup ? new Date(s.waktu_tutup) : null;
    const dateStr = `${dBuka.getDate()}/${dBuka.getMonth() + 1}/${dBuka.getFullYear()}`;
    const timeStr = `${dBuka.getHours().toString().padStart(2, '0')}:${dBuka.getMinutes().toString().padStart(2, '0')} – ${dTut ? `${dTut.getHours().toString().padStart(2, '0')}:${dTut.getMinutes().toString().padStart(2, '0')}` : '-'}`;

    const selisih = Number(s.selisih) || 0;
    let badgeClass = 'badge-selisih-pas';
    let selisihTeks = `Pas (${formatRp(0)})`;

    if (selisih < 0) {
      badgeClass = 'badge-selisih-minus';
      selisihTeks = `Minus ${formatRp(Math.abs(selisih))}`;
    } else if (selisih > 0) {
      badgeClass = 'badge-selisih-plus';
      selisihTeks = `Plus ${formatRp(selisih)}`;
    }

    const item = document.createElement('div');
    item.className = 'shift-history-item';
    item.onclick = () => openShiftDetail(s.id);

    item.innerHTML = `
      <div class="shift-hist-left">
        <div class="shift-hist-kasir">${kasirNama}</div>
        <div class="shift-hist-time">${dateStr} • ${timeStr}</div>
      </div>
      <div class="shift-hist-right">
        <span class="badge-selisih ${badgeClass} text-xs">${selisihTeks}</span>
        <span class="text-xs text-muted">Aktual: ${formatRp(s.kas_aktual || 0)}</span>
      </div>
    `;

    fragment.appendChild(item);
  }

  container.appendChild(fragment);
}

// Buka Detail Riwayat Shift Selesai
async function openShiftDetail(shiftId) {
  activeDetailShiftId = shiftId;
  const calc = await hitungDataShift(shiftId);
  if (!calc) return;

  const s = calc.shift;
  const dBuka = new Date(s.waktu_buka);
  const dTut = s.waktu_tutup ? new Date(s.waktu_tutup) : null;

  document.getElementById('detail-shift-kasir-nama').textContent = `Kasir: ${calc.kasirNama}`;
  document.getElementById('detail-shift-tanggal').textContent = `${dBuka.getDate()}/${dBuka.getMonth() + 1}/${dBuka.getFullYear()}`;
  document.getElementById('detail-shift-jam-rentang').textContent =
    `Buka: ${dBuka.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • ` +
    `Tutup: ${dTut ? dTut.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}`;

  document.getElementById('detail-shift-modal-awal').textContent = formatRp(calc.modalAwal);
  document.getElementById('detail-shift-total-penjualan').textContent = formatRp(calc.totalPenjualan);
  document.getElementById('detail-shift-kas-diharapkan').textContent = formatRp(calc.kasDiharapkan);
  document.getElementById('detail-shift-kas-aktual').textContent = formatRp(s.kas_aktual || 0);

  const selisih = Number(s.selisih) || 0;
  const selisihLabel = document.getElementById('detail-shift-selisih-label');
  if (selisih === 0) {
    selisihLabel.className = 'badge-selisih badge-selisih-pas';
    selisihLabel.textContent = 'Pas (Rp 0)';
  } else if (selisih < 0) {
    selisihLabel.className = 'badge-selisih badge-selisih-minus';
    selisihLabel.textContent = `Kurang ${formatRp(Math.abs(selisih))}`;
  } else {
    selisihLabel.className = 'badge-selisih badge-selisih-plus';
    selisihLabel.textContent = `Lebih +${formatRp(selisih)}`;
  }

  document.getElementById('detail-shift-tunai-jual').textContent = formatRp(calc.tunaiPenjualan);
  document.getElementById('detail-shift-qris-jual').textContent = formatRp(calc.qrisPenjualan);
  document.getElementById('detail-shift-bon-jual').textContent = formatRp(calc.bonPenjualan);
  document.getElementById('detail-shift-bayarbon-tunai').textContent = formatRp(calc.tunaiBayarBon);
  document.getElementById('detail-shift-total-pengeluaran').textContent = formatRp(calc.totalPengeluaran);

  // Daftar Pengeluaran Shift
  const expContainer = document.getElementById('detail-shift-pengeluaran-list');
  expContainer.innerHTML = '';
  if (calc.shiftExpenses.length === 0) {
    expContainer.innerHTML = '<div class="text-xs text-muted text-center" style="padding: 8px;">Tidak ada pengeluaran kas.</div>';
  } else {
    calc.shiftExpenses.forEach(e => {
      const d = new Date(e.waktu);
      const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      const jenis = e.jenis === 'setor_pemilik' ? 'Setor ke Pemilik' : 'Operasional';
      const row = document.createElement('div');
      row.className = 'expense-item';
      row.innerHTML = `
        <div class="expense-left">
          <div class="expense-title">${e.keterangan || '-'}</div>
          <div class="expense-meta">${timeStr} • ${jenis}</div>
        </div>
        <div class="expense-amount">− ${formatRp(e.jumlah)}</div>
      `;
      expContainer.appendChild(row);
    });
  }

  // Tabel Transaksi Penjualan Shift
  const trxBody = document.getElementById('detail-shift-table-transaksi');
  trxBody.innerHTML = '';
  if (calc.shiftTrx.length === 0) {
    trxBody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Belum ada transaksi penjualan.</td></tr>';
  } else {
    calc.shiftTrx.forEach(t => {
      const d = new Date(t.waktu);
      const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="text-xs text-muted">${timeStr}</td>
        <td class="font-bold text-xs">${t.nomor}</td>
        <td class="font-bold text-amber">${formatRp(t.total)}</td>
      `;
      trxBody.appendChild(tr);
    });
  }

  // Tabel Cicilan Bon Shift
  const bonBody = document.getElementById('detail-shift-table-bayarbon');
  bonBody.innerHTML = '';
  if (calc.shiftBonPays.length === 0) {
    bonBody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Tidak ada pembayaran bon di shift ini.</td></tr>';
  } else {
    calc.shiftBonPays.forEach(b => {
      const d = new Date(b.waktu);
      const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="text-xs text-muted">${timeStr}</td>
        <td class="text-xs font-bold">${(b.metode || 'tunai').toUpperCase()}</td>
        <td class="font-bold text-success">${formatRp(b.jumlah)}</td>
      `;
      bonBody.appendChild(tr);
    });
  }

  showView('view-shift-detail');
}

// Buka Modal Tambah Pengeluaran
function openPengeluaranModal() {
  if (!activeShiftCalculation || !activeShiftCalculation.shift) {
    alert('Tidak ada shift aktif!');
    return;
  }
  document.getElementById('form-pengeluaran-kas').reset();
  document.getElementById('modal-pengeluaran').classList.remove('hidden');
  document.getElementById('input-pengeluaran-jumlah').focus();
}

// Simpan Pengeluaran Kas
async function eksekusiSimpanPengeluaran(e) {
  e.preventDefault();
  if (!activeShiftCalculation || !activeShiftCalculation.shift) return;

  const jenis = document.getElementById('select-pengeluaran-jenis').value;
  const jumlah = Math.round(Number(document.getElementById('input-pengeluaran-jumlah').value) || 0);
  const keterangan = document.getElementById('input-pengeluaran-ket').value.trim();

  if (jumlah <= 0) {
    alert('Jumlah pengeluaran harus lebih dari 0!');
    return;
  }
  if (!keterangan) {
    alert('Keterangan pengeluaran wajib diisi!');
    return;
  }

  const newExpense = {
    id: generateUUID(),
    shift_id: activeShiftCalculation.shift.id,
    jenis: jenis,
    jumlah: jumlah,
    keterangan: keterangan,
    pengguna_id: currentUser ? currentUser.id : 'sistem',
    waktu: new Date().toISOString()
  };

  await savePengeluaranKas(newExpense);

  await catatLog(currentUser ? currentUser.id : 'sistem', 'PENGELUARAN_KAS', 'pengeluaran_kas', {
    shift_id: newExpense.shift_id,
    jenis: jenis,
    jumlah: jumlah,
    keterangan: keterangan
  });

  document.getElementById('modal-pengeluaran').classList.add('hidden');
  await renderShiftScreen();
}

// Buka Modal Tutup Shift
function openTutupShiftModal() {
  if (!activeShiftCalculation || !activeShiftCalculation.shift) {
    alert('Tidak ada shift aktif!');
    return;
  }

  const calc = activeShiftCalculation;
  document.getElementById('modal-tutup-modal-awal').textContent = formatRp(calc.modalAwal);
  document.getElementById('modal-tutup-kas-diharapkan').textContent = formatRp(calc.kasDiharapkan);

  const inputAktual = document.getElementById('input-tutup-kas-aktual');
  inputAktual.value = '';

  updateTutupShiftSelisihUI();

  document.getElementById('modal-tutup-shift').classList.remove('hidden');
  inputAktual.focus();
}

function updateTutupShiftSelisihUI() {
  if (!activeShiftCalculation) return;

  const kasDiharapkan = activeShiftCalculation.kasDiharapkan;
  const rawAktual = document.getElementById('input-tutup-kas-aktual').value;
  const aktualVal = rawAktual === '' ? kasDiharapkan : Math.round(Number(rawAktual) || 0);
  const selisih = aktualVal - kasDiharapkan;

  const badge = document.getElementById('modal-tutup-selisih-badge');
  const warning = document.getElementById('modal-tutup-warning');

  if (rawAktual === '') {
    badge.className = 'badge-selisih badge-selisih-pas';
    badge.textContent = 'Belum diisi';
    warning.classList.add('hidden');
    return;
  }

  if (selisih === 0) {
    badge.className = 'badge-selisih badge-selisih-pas';
    badge.textContent = 'Pas (Rp 0)';
    warning.classList.add('hidden');
  } else if (selisih < 0) {
    badge.className = 'badge-selisih badge-selisih-minus';
    badge.textContent = `Kurang ${formatRp(Math.abs(selisih))}`;
    warning.classList.remove('hidden');
  } else {
    badge.className = 'badge-selisih badge-selisih-plus';
    badge.textContent = `Lebih +${formatRp(selisih)}`;
    warning.classList.remove('hidden');
  }
}

// Konfirmasi Tutup Shift
async function eksekusiTutupShift(e) {
  e.preventDefault();
  if (!activeShiftCalculation || !activeShiftCalculation.shift) return;

  const rawAktual = document.getElementById('input-tutup-kas-aktual').value;
  if (rawAktual === '') {
    alert('Wajib mengisi kas aktual fisik di laci!');
    return;
  }

  const kasAktual = Math.round(Number(rawAktual) || 0);
  if (kasAktual < 0) {
    alert('Kas fisik di laci tidak boleh negatif!');
    return;
  }

  const kasDiharapkan = activeShiftCalculation.kasDiharapkan;
  const selisih = kasAktual - kasDiharapkan;
  const nowIso = new Date().toISOString();

  const shiftToUpdate = {
    ...activeShiftCalculation.shift,
    status: 'selesai',
    waktu_tutup: nowIso,
    kas_aktual: kasAktual,
    selisih: selisih
  };

  await saveShift(shiftToUpdate);

  await catatLog(currentUser ? currentUser.id : 'sistem', 'TUTUP_SHIFT', 'shift', {
    shift_id: shiftToUpdate.id,
    kasir_id: shiftToUpdate.kasir_id,
    modal_awal: shiftToUpdate.modal_awal,
    kas_diharapkan: kasDiharapkan,
    kas_aktual: kasAktual,
    selisih: selisih
  });

  currentShift = null;
  activeShiftCalculation = null;

  document.getElementById('modal-tutup-shift').classList.add('hidden');

  let ringkasanAlert = 'Shift berhasil ditutup!\n' +
    `Kas Diharapkan: ${formatRp(kasDiharapkan)}\n` +
    `Kas Aktual: ${formatRp(kasAktual)}\n`;

  if (selisih === 0) ringkasanAlert += 'Status: Pas (Rp 0)';
  else if (selisih < 0) ringkasanAlert += `Status: Kurang ${formatRp(Math.abs(selisih))}`;
  else ringkasanAlert += `Status: Lebih +${formatRp(selisih)}`;

  alert(ringkasanAlert);
  renderDashboard();
}

// --- 12C. FITUR TAHAP 5: LAPORAN PENJUALAN HARIAN ---
async function renderLaporanScreen(targetDateStr = null) {
  if (!currentUser || currentUser.peran !== 'pemilik') {
    alert('Akses khusus Pemilik!');
    renderDashboard();
    return;
  }

  const dateInput = document.getElementById('input-laporan-tanggal');
  if (!targetDateStr) {
    targetDateStr = getJakartaISODateString(new Date());
    dateInput.value = targetDateStr;
  } else {
    dateInput.value = targetDateStr;
  }

  const [allTrx, allItems, allPays, allBonPays, allVoids] = await Promise.all([
    getAllTransaksi(),
    getAllTransaksiItems(),
    getAllPembayaranTransaksi(),
    getAllPembayaranBon(),
    getAllVoidTransaksi()
  ]);

  // Filter transaksi pada tanggal target (WIB)
  const dayTrx = allTrx.filter(t => {
    if (t.status !== 'selesai') return false;
    const dStr = getJakartaISODateString(new Date(t.waktu));
    return dStr === targetDateStr;
  });

  const emptyBox = document.getElementById('laporan-empty-box');
  const contentBox = document.getElementById('laporan-content-box');

  if (dayTrx.length === 0) {
    emptyBox.classList.remove('hidden');
    contentBox.classList.add('hidden');
    showView('view-laporan');
    return;
  }

  emptyBox.classList.add('hidden');
  contentBox.classList.remove('hidden');

  const dayTrxIds = new Set(dayTrx.map(t => t.id));

  // Penjualan Kotor = Σ total transaksi selesai
  const penjualanKotor = dayTrx.reduce((acc, t) => acc + (Number(t.total) || 0), 0);

  // Total Void hari itu (dari store void_transaksi, saat ini 0)
  const dayVoids = allVoids.filter(v => {
    const dStr = getJakartaISODateString(new Date(v.waktu));
    return dStr === targetDateStr;
  });
  const totalVoid = dayVoids.reduce((acc, v) => acc + (Number(v.total_void) || 0), 0);
  const penjualanBersih = penjualanKotor - totalVoid;

  document.getElementById('laporan-penjualan-bersih').textContent = formatRp(penjualanBersih);
  document.getElementById('laporan-penjualan-kotor').textContent = formatRp(penjualanKotor);
  document.getElementById('laporan-total-void').textContent = formatRp(totalVoid);
  document.getElementById('laporan-total-transaksi').textContent = `${dayTrx.length} transaksi`;

  // Rincian Pembayaran Transaksi Hari Itu
  const dayPays = allPays.filter(p => dayTrxIds.has(p.transaksi_id));
  let payTunai = 0;
  let payQris = 0;
  let payBon = 0;

  dayPays.forEach(p => {
    const nom = Number(p.nominal) || 0;
    if (p.metode === 'tunai') payTunai += nom;
    else if (p.metode === 'qris') payQris += nom;
    else if (p.metode === 'bon') payBon += nom;
  });

  document.getElementById('laporan-pay-tunai').textContent = formatRp(payTunai);
  document.getElementById('laporan-pay-qris').textContent = formatRp(payQris);
  document.getElementById('laporan-pay-bon').textContent = formatRp(payBon);

  // Pembayaran Bon yang Diterima Hari Ini (Bukan Omzet, tapi arus kas masuk)
  const dayBonPays = allBonPays.filter(b => {
    const dStr = getJakartaISODateString(new Date(b.waktu));
    return dStr === targetDateStr;
  });

  let bonBayarTunai = 0;
  let bonBayarQris = 0;

  dayBonPays.forEach(b => {
    const nom = Number(b.jumlah) || 0;
    if (b.metode === 'tunai') bonBayarTunai += nom;
    else if (b.metode === 'qris') bonBayarQris += nom;
  });

  document.getElementById('laporan-bon-tunai').textContent = formatRp(bonBayarTunai);
  document.getElementById('laporan-bon-qris').textContent = formatRp(bonBayarQris);

  // 5 Produk Terlaris Hari Ini
  const dayItems = allItems.filter(i => dayTrxIds.has(i.transaksi_id));
  const productAgg = {};

  dayItems.forEach(i => {
    if (!productAgg[i.produk_id]) {
      productAgg[i.produk_id] = {
        nama: i.nama_produk,
        qty_dasar: 0,
        subtotal: 0
      };
    }
    productAgg[i.produk_id].qty_dasar += Number(i.jumlah_dasar) || 0;
    productAgg[i.produk_id].subtotal += Number(i.subtotal) || 0;
  });

  const sortedTopProds = Object.values(productAgg)
    .sort((a, b) => b.qty_dasar - a.qty_dasar)
    .slice(0, 5);

  const topListContainer = document.getElementById('laporan-top-produk-list');
  topListContainer.innerHTML = '';

  if (sortedTopProds.length === 0) {
    topListContainer.innerHTML = '<div class="text-xs text-muted text-center" style="padding: 8px;">Tidak ada rincian item.</div>';
  } else {
    sortedTopProds.forEach((p, idx) => {
      const row = document.createElement('div');
      row.className = 'top-product-item';
      row.innerHTML = `
        <div>
          <span class="top-prod-rank">${idx + 1}</span>
          <span class="font-bold">${p.nama}</span>
          <span class="text-xs text-muted">${p.qty_dasar} unit dasar</span>
        </div>
        <div class="font-bold text-amber">${formatRp(p.subtotal)}</div>
      `;
      topListContainer.appendChild(row);
    });
  }

  // Tombol Share WhatsApp
  const btnShareWA = document.getElementById('btn-share-wa-laporan');
  btnShareWA.onclick = async () => {
    const warungName = (await getPengaturan('nama_warung')) || 'WarungKas';
    const top1 = sortedTopProds.length > 0 ? `${sortedTopProds[0].nama} (${sortedTopProds[0].qty_dasar} unit)` : '-';

    const waText =
      `*Laporan Penjualan ${warungName}*\n` +
      `Tanggal: ${targetDateStr}\n` +
      `--------------------------------\n` +
      `• Penjualan Bersih: ${formatRp(penjualanBersih)}\n` +
      `• Jumlah Transaksi: ${dayTrx.length}\n` +
      `• Rincian Penjualan:\n` +
      `  - Tunai: ${formatRp(payTunai)}\n` +
      `  - QRIS: ${formatRp(payQris)}\n` +
      `  - Bon: ${formatRp(payBon)}\n` +
      `• Cicilan Bon Masuk:\n` +
      `  - Tunai: ${formatRp(bonBayarTunai)}\n` +
      `  - QRIS: ${formatRp(bonBayarQris)}\n` +
      `• Produk Terlaris: ${top1}\n` +
      `--------------------------------`;

    const url = `https://wa.me/?text=${encodeURIComponent(waText)}`;
    window.open(url, '_blank');
  };

  showView('view-laporan');
}


// --- 13. EVENT LISTENERS ---
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
    localStorage.setItem('wk_session_user_id', pemilikUser.id);
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
      // Simpan sesi login agar refresh/buka ulang aplikasi tidak perlu login lagi
      localStorage.setItem('wk_session_user_id', user.id);
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
    currentShift = null;
    currentEnteredPin = '';
    // Hapus sesi tersimpan: setelah Keluar, login PIN wajib lagi
    localStorage.removeItem('wk_session_user_id');
    renderLoginScreen();
  });

  // Navigasi ke Modul Kasir POS (Tahap 3)
  document.getElementById('menu-kasir').addEventListener('click', enterKasirModule);
  document.getElementById('btn-kasir-back').addEventListener('click', renderDashboard);

  // Filter Kategori Kasir
  document.querySelectorAll('#chips-kasir-kategori .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#chips-kasir-kategori .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentKasirKat = chip.getAttribute('data-kat');
      renderKasirProductGrid();
    });
  });

  // Pencarian Kasir Realtime
  document.getElementById('input-kasir-search').addEventListener('input', (e) => {
    currentKasirSearch = e.target.value;
    renderKasirProductGrid();
  });

  // Stepper Unit Picker Modal
  document.getElementById('btn-picker-minus').addEventListener('click', () => {
    const input = document.getElementById('input-picker-qty');
    const val = Math.max(1, parseInt(input.value || '1', 10) - 1);
    input.value = val;
    updatePickerSubtotal();
  });

  document.getElementById('btn-picker-plus').addEventListener('click', () => {
    const input = document.getElementById('input-picker-qty');
    const val = Math.max(1, parseInt(input.value || '1', 10) + 1);
    input.value = val;
    updatePickerSubtotal();
  });

  document.getElementById('input-picker-qty').addEventListener('input', updatePickerSubtotal);
  document.getElementById('btn-close-picker').addEventListener('click', () => {
    document.getElementById('modal-picker').classList.add('hidden');
    activePickerProduct = null;
    selectedPickerUnit = null;
  });

  document.getElementById('btn-picker-add').addEventListener('click', addActivePickerToCart);

  // Keranjang Bottom Bar & Cart Modal
  document.getElementById('btn-open-cart').addEventListener('click', () => {
    document.getElementById('modal-cart').classList.remove('hidden');
  });

  document.getElementById('btn-close-cart').addEventListener('click', () => {
    document.getElementById('modal-cart').classList.add('hidden');
  });

  document.getElementById('btn-bottom-bayar').addEventListener('click', () => {
    openPaymentModal();
  });

  document.getElementById('btn-lanjut-pembayaran').addEventListener('click', () => {
    openPaymentModal();
  });

  document.getElementById('btn-close-payment').addEventListener('click', () => {
    document.getElementById('modal-payment').classList.add('hidden');
  });

  // Input Pembayaran Listeners
  document.getElementById('input-pay-tunai-received').addEventListener('input', recalculatePaymentInvariant);
  document.getElementById('input-pay-qris').addEventListener('input', recalculatePaymentInvariant);
  document.getElementById('input-pay-bon').addEventListener('input', recalculatePaymentInvariant);
  document.getElementById('select-bon-pelanggan').addEventListener('change', recalculatePaymentInvariant);

  // Tombol Pecahan Cepat Tunai
  document.querySelectorAll('.btn-quick-cash').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-cash');
      const input = document.getElementById('input-pay-tunai-received');
      const totalBill = cartItems.reduce((acc, item) => acc + item.subtotal, 0);
      const rawQris = Math.max(0, Math.round(Number(document.getElementById('input-pay-qris').value) || 0));
      const rawBon = Math.max(0, Math.round(Number(document.getElementById('input-pay-bon').value) || 0));
      const sisa = Math.max(0, totalBill - rawQris - rawBon);

      if (mode === 'pas') {
        input.value = sisa;
      } else if (mode === 'clear') {
        input.value = '';
      } else {
        const nominal = parseInt(mode, 10);
        const currentVal = parseInt(input.value || '0', 10);
        input.value = currentVal + nominal;
      }
      recalculatePaymentInvariant();
    });
  });

  // Tombol Pas QRIS
  document.getElementById('btn-pay-qris-pas').addEventListener('click', () => {
    const totalBill = cartItems.reduce((acc, item) => acc + item.subtotal, 0);
    const rawCash = Math.max(0, Math.round(Number(document.getElementById('input-pay-tunai-received').value) || 0));
    const rawBon = Math.max(0, Math.round(Number(document.getElementById('input-pay-bon').value) || 0));
    const sisa = Math.max(0, totalBill - rawCash - rawBon);
    document.getElementById('input-pay-qris').value = sisa;
    recalculatePaymentInvariant();
  });

  // Tombol Pas BON
  document.getElementById('btn-pay-bon-pas').addEventListener('click', () => {
    const totalBill = cartItems.reduce((acc, item) => acc + item.subtotal, 0);
    const rawCash = Math.max(0, Math.round(Number(document.getElementById('input-pay-tunai-received').value) || 0));
    const rawQris = Math.max(0, Math.round(Number(document.getElementById('input-pay-qris').value) || 0));
    const sisa = Math.max(0, totalBill - rawCash - rawQris);
    document.getElementById('input-pay-bon').value = sisa;
    recalculatePaymentInvariant();
  });

  // Tambah Pelanggan Bon Modal
  document.getElementById('btn-tambah-pelanggan-bon').addEventListener('click', () => {
    document.getElementById('form-tambah-pelanggan-bon').reset();
    document.getElementById('modal-pelanggan-bon').classList.remove('hidden');
  });

  document.getElementById('btn-close-pelanggan-modal').addEventListener('click', () => {
    document.getElementById('modal-pelanggan-bon').classList.add('hidden');
  });

  document.getElementById('form-tambah-pelanggan-bon').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nama = document.getElementById('input-pelanggan-nama').value.trim();
    const hp = document.getElementById('input-pelanggan-hp').value.trim();
    const alamat = document.getElementById('input-pelanggan-alamat').value.trim();

    if (!nama) return;

    const newPel = {
      id: generateUUID(),
      nama: nama,
      no_hp: hp || null,
      alamat: alamat || null,
      dibuat_pada: new Date().toISOString()
    };

    await savePelangganBon(newPel);
    await catatLog(currentUser.id, 'TAMBAH_PELANGGAN_BON', 'pelanggan_bon', { nama: nama });

    await refreshPelangganBonDropdown();
    document.getElementById('select-bon-pelanggan').value = newPel.id;
    document.getElementById('modal-pelanggan-bon').classList.add('hidden');
    recalculatePaymentInvariant();
  });

  // Submit Simpan Transaksi
  document.getElementById('btn-submit-transaksi').addEventListener('click', eksekusiSimpanTransaksi);

  // Transaksi Baru Selesai
  document.getElementById('btn-transaksi-baru').addEventListener('click', () => {
    document.getElementById('modal-success').classList.add('hidden');
  });

  // Buka Shift Form Submit
  document.getElementById('form-buka-shift').addEventListener('submit', async (e) => {
    e.preventDefault();
    const modalAwal = Math.max(0, Math.round(Number(document.getElementById('input-shift-modal-awal').value) || 0));

    const newShift = {
      id: generateUUID(),
      kasir_id: currentUser.id,
      waktu_buka: new Date().toISOString(),
      modal_awal: modalAwal,
      status: 'berlangsung'
    };

    await saveShift(newShift);
    currentShift = newShift;

    await catatLog(currentUser.id, 'BUKA_SHIFT', 'shift', {
      shift_id: newShift.id,
      modal_awal: modalAwal
    });

    document.getElementById('modal-buka-shift').classList.add('hidden');
    await initKasirScreen();
  });

  document.getElementById('btn-cancel-shift').addEventListener('click', () => {
    document.getElementById('modal-buka-shift').classList.add('hidden');
    renderDashboard();
  });


  // --- TAHAP 4: EVENT LISTENERS BUKU BON ---
  document.getElementById('menu-bon').addEventListener('click', renderBukuBonScreen);
  document.getElementById('btn-bon-back').addEventListener('click', renderDashboard);

  document.getElementById('input-cari-pelanggan-bon').addEventListener('input', (e) => {
    currentBonSearch = e.target.value;
    filterAndRenderBonCustomers();
  });

  document.getElementById('btn-back-detail-bon').addEventListener('click', async () => {
    // Kembali dari detail ke daftar: hitung ulang dari database
    await renderBukuBonScreen();
  });

  document.getElementById('btn-close-modal-paybon').addEventListener('click', () => {
    document.getElementById('modal-bayar-bon').classList.add('hidden');
  });

  document.getElementById('form-catat-bayar-bon').addEventListener('submit', eksekusiSimpanPembayaranBon);

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

  // --- TAHAP 5: EVENT LISTENERS SHIFT & LAPORAN ---
  document.getElementById('menu-shift').addEventListener('click', renderShiftScreen);
  document.getElementById('btn-shift-back').addEventListener('click', renderDashboard);

  document.getElementById('btn-shift-go-kasir').addEventListener('click', enterKasirModule);

  document.getElementById('btn-open-modal-pengeluaran').addEventListener('click', openPengeluaranModal);
  document.getElementById('btn-close-modal-pengeluaran').addEventListener('click', () => {
    document.getElementById('modal-pengeluaran').classList.add('hidden');
  });
  document.getElementById('form-pengeluaran-kas').addEventListener('submit', eksekusiSimpanPengeluaran);

  document.getElementById('btn-open-modal-tutup-shift').addEventListener('click', openTutupShiftModal);
  document.getElementById('btn-close-modal-tutup').addEventListener('click', () => {
    document.getElementById('modal-tutup-shift').classList.add('hidden');
  });
  document.getElementById('input-tutup-kas-aktual').addEventListener('input', updateTutupShiftSelisihUI);
  document.getElementById('form-tutup-shift').addEventListener('submit', eksekusiTutupShift);

  document.getElementById('btn-back-shift-detail').addEventListener('click', renderShiftScreen);

  // Menu & Layar Laporan
  document.getElementById('menu-laporan').addEventListener('click', () => {
    renderLaporanScreen();
  });
  document.getElementById('btn-laporan-back').addEventListener('click', renderDashboard);

  document.getElementById('input-laporan-tanggal').addEventListener('change', (e) => {
    if (e.target.value) {
      renderLaporanScreen(e.target.value);
    }
  });
}

// --- 13. BOOTSTRAP APLIKASI ---
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
      // Pulihkan sesi login tersimpan (refresh tidak perlu login ulang)
      const sessionUserId = localStorage.getItem('wk_session_user_id');
      const sessionUser = sessionUserId ? users.find(u => u.id === sessionUserId && u.status_aktif !== false) : null;
      if (sessionUser) {
        currentUser = sessionUser;
        renderDashboard();
      } else {
        if (sessionUserId) localStorage.removeItem('wk_session_user_id');
        renderLoginScreen();
      }
    }
  } catch (err) {
    console.error('Inisialisasi aplikasi gagal:', err);
    alert('Gagal membuka database lokal WarungKas. Pastikan browser mendukung IndexedDB.');
  }
}

window.addEventListener('DOMContentLoaded', initApp);
