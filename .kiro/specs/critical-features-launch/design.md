# Design Document: Critical Features Launch — SIVILIZE HUB PRO

## Ikhtisar

Dokumen ini mendeskripsikan desain teknis untuk 14 fitur SIVILIZE HUB PRO yang mencakup fitur kritikal, penting, dan nice-to-have sebelum peluncuran penuh. Fitur-fitur ini dipilih karena langsung berdampak pada nilai produk bagi kontraktor Indonesia.

**Fitur Kritikal (1-4):** Kurva S / Progress Chart, Preview Cetak RAB, Notifikasi Real, Reset Password via Email.

**Fitur Penting (5-10):** Foto Profil & Edit Profil, Versi RAB dengan Perbandingan, Kalkulator Upah Harian, Template RAB, Share RAB (Read-Only Link), Backup & Restore.

**Fitur Nice-to-Have (11-14):** Laporan Keuangan Proyek, Integrasi WhatsApp, Mode Offline PWA, Multi Bahasa.

**Stack teknis:**
- Frontend: React 19 + TypeScript, Zustand, Recharts, jsPDF + XLSX, Tailwind CSS, Framer Motion
- Backend: Express.js, MongoDB/Mongoose, JWT, bcryptjs, express-rate-limit, Joi
- Deployment: Vercel (frontend + backend terpisah)

---

## Arsitektur Sistem

### Gambaran Komponen yang Terlibat

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 19)                       │
│                                                                   │
│  ┌──────────────┐   ┌──────────────────┐   ┌─────────────────┐  │
│  │  KurvaS.tsx  │   │ RABCalculator.tsx│   │  AuthPage.tsx   │  │
│  │  (enhanced)  │   │  (+ modal btn)   │   │  (UX improved)  │  │
│  └──────┬───────┘   └────────┬─────────┘   └────────┬────────┘  │
│         │                    │                       │           │
│  ┌──────▼───────┐   ┌────────▼─────────┐            │           │
│  │exportKurvaS  │   │ RABPreviewModal  │            │           │
│  │PDF() in      │   │ .tsx (NEW)       │            │           │
│  │exportUtils   │   └────────┬─────────┘            │           │
│  └──────────────┘            │                       │           │
│                    ┌─────────▼──────────┐            │           │
│                    │  exportToPDF()     │            │           │
│                    │  exportToExcel()   │            │           │
│                    │  (existing, reused)│            │           │
│                    └────────────────────┘            │           │
│                                                       │           │
│  ┌──────────────────────────────────────┐            │           │
│  │           Zustand Store              │            │           │
│  │  projects[], notifications[]         │◄───────────┘           │
│  │  + manualProgress field (new)        │                        │
│  │  + updateProjectProgress() (new)     │                        │
│  └──────────────────┬───────────────────┘                        │
│                     │                                             │
│  ┌──────────────────▼───────────────────┐                        │
│  │      notificationEngine.ts (NEW)     │                        │
│  │  runNotificationEngine(projects,     │                        │
│  │    notifications, addNotification)   │                        │
│  └──────────────────────────────────────┘                        │
│                                                                   │
│  ┌──────────────────────────────────────┐                        │
│  │           App.tsx                    │                        │
│  │  useEffect → runNotificationEngine   │                        │
│  │  (dipanggil saat isAuthenticated)    │                        │
│  └──────────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP/REST
┌─────────────────────────────▼───────────────────────────────────┐
│                        BACKEND (Express.js)                      │
│                                                                   │
│  ┌──────────────────────────────────────┐                        │
│  │     server/controllers/auth.js       │                        │
│  │  forgotPassword() — kirim email nyata│                        │
│  │  resetPassword()  — validasi ketat   │                        │
│  │  + in-memory rate limit Map          │                        │
│  └──────────────────┬───────────────────┘                        │
│                     │                                             │
│  ┌──────────────────▼───────────────────┐                        │
│  │     server/utils/emailService.js     │                        │
│  │  sendResetPasswordEmail(to, name,    │                        │
│  │    resetUrl)                         │                        │
│  │  Provider: Nodemailer | Resend API   │                        │
│  └──────────────────────────────────────┘                        │
│                                                                   │
│  ┌──────────────────────────────────────┐                        │
│  │     server/models/User.js            │                        │
│  │  resetPasswordToken: String          │                        │
│  │  resetPasswordExpiry: Date           │                        │
│  └──────────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

### Alur Data Utama

**Fitur 1 — Kurva S:**
```
User input tanggal → updateProject() → KurvaS re-render
                                          ↓
                                   buildChartData(items, startDate, endDate)
                                          ↓
                                   weeklyData[] → (toggle) → monthlyData[]
                                          ↓
                                   Recharts LineChart + Tabel
                                          ↓
                                   exportKurvaSPDF() → jsPDF → download
```

**Fitur 2 — Preview Modal:**
```
User klik "Cetak / Export" → showPreviewModal = true
                                    ↓
                             RABPreviewModal terbuka
                             calculateTotalRAB() → tampilkan ringkasan
                                    ↓
                             User isi konfigurasi → simpan ke localStorage
                                    ↓
                             Klik "Download PDF" → exportToPDF(options)
                             Klik "Download Excel" → exportToExcel(options)
```

**Fitur 3 — Notification Engine:**
```
App.tsx useEffect (isAuthenticated=true)
         ↓
runNotificationEngine(projects, notifications, addNotification)
         ↓
  ┌──────┴──────────────────────────────────────┐
  │  Cek 1: autoSaveDraft → warning notif       │
  │  Cek 2: ongoing + no log 7d → warning notif │
  │  Cek 3: ongoing + deviasi >10% → error notif│
  └──────────────────────────────────────────────┘
         ↓
  Anti-duplikat: cek title + projectId sebelum addNotification()
         ↓
  Zustand store → Navbar badge count update → NotificationPanel
```

**Fitur 4 — Reset Password:**
```
User klik "Lupa Password" → POST /api/auth/forgot-password
                                    ↓
                             Rate limit check (in-memory Map)
                                    ↓
                             Generate crypto token (32 bytes)
                             Simpan ke User.resetPasswordToken
                                    ↓
                             emailService.sendResetPasswordEmail()
                             (Nodemailer atau Resend API)
                                    ↓
                             User klik link di email
                             → /reset-password?token=xxx
                                    ↓
                             AuthPage baca token dari URL
                             → POST /api/auth/reset-password
                                    ↓
                             Validasi token + expiry
                             Hapus token dari DB
                             Return JWT baru
```

---

## Komponen dan Interface

### Fitur 1: Kurva S Enhancement

#### Interface Baru di `useStore.ts`

```typescript
// Tambahan pada interface Project
export interface Project {
  // ... field yang sudah ada ...
  manualProgress?: Record<number, number>; // key: periodIndex, value: persentase 0-100
}

// Action baru
interface AppState {
  // ... actions yang sudah ada ...
  updateProjectProgress: (projectId: string, periodIndex: number, value: number) => void;
}
```

#### Fungsi Baru di `exportUtils.ts`

```typescript
export interface KurvaSChartPoint {
  label: string;        // "M1", "M2", ... atau "Bln 1", "Bln 2", ...
  rencana: number;      // kumulatif rencana 0-100
  realisasi: number | null; // kumulatif realisasi, null jika belum ada data
  isManual: boolean;    // true jika realisasi dari input manual
}

export interface KurvaSExportOptions {
  companyName?: string;
  preparedBy?: string;
  projectNo?: string;
}

export const exportKurvaSPDF = (
  project: Partial<Project>,
  chartData: KurvaSChartPoint[],
  options?: KurvaSExportOptions
): void
```

#### State Baru di `KurvaS.tsx`

```typescript
// State yang ditambahkan ke komponen KurvaS
const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
const [manualProgress, setManualProgress] = useState<Record<number, number>>(
  project.manualProgress || {}
);
const [editingPeriod, setEditingPeriod] = useState<number | null>(null);
const [editValue, setEditValue] = useState<string>('');
```

#### Fungsi Inti: `buildChartData`

```typescript
// Fungsi murni yang bisa ditest secara independen
export function buildChartData(
  items: RABItem[],
  startDate: string,
  endDate: string,
  dailyLogs: DailyLog[],
  manualProgress: Record<number, number>
): KurvaSChartPoint[]
```

**Logika `buildChartData`:**
1. Hitung `durationWeeks = Math.ceil((endDate - startDate) / 7 hari)`
2. Distribusikan bobot setiap RAB item ke minggu-minggu berdasarkan `CATEGORY_WEEK_MAP`
3. Hitung kumulatif rencana per minggu, normalisasi ke 100%
4. Untuk setiap minggu, tentukan realisasi:
   - Cari DailyLog terakhir dalam minggu tersebut → gunakan `progressPercent`
   - Jika tidak ada DailyLog → gunakan `manualProgress[weekIndex]`
   - Jika tidak ada keduanya → `null`
5. Tandai `isManual = true` jika sumber dari manualProgress

**Logika Agregasi Bulanan:**
```typescript
export function aggregateToMonthly(weeklyData: KurvaSChartPoint[]): KurvaSChartPoint[] {
  // Setiap 4 minggu = 1 bulan
  // Nilai kumulatif bulan = nilai kumulatif minggu terakhir bulan tersebut
  // Pastikan monoton naik
}
```

### Fitur 2: RABPreviewModal

#### Interface Props

```typescript
interface RABPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Partial<Project>;
  items: RABItem[];
  financials: FinancialSettings;
  grade: MaterialGrade;
}
```

#### Interface Konfigurasi Export

```typescript
interface ExportConfig {
  companyName: string;
  estimatorName: string;
  documentNumber: string;
}

const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  companyName: 'SIVILIZE HUB PRO',
  estimatorName: '',
  documentNumber: `SIV-${Date.now().toString().slice(-6)}`,
};

const EXPORT_CONFIG_STORAGE_KEY = 'sivilize_export_config';
```

#### Struktur Komponen

```
RABPreviewModal
├── Overlay (klik untuk tutup)
└── Modal Container (max-h-[90vh] overflow-y-auto, min-w-[320px])
    ├── Header (judul + tombol tutup)
    ├── Section: Ringkasan Proyek
    │   ├── Nama Proyek
    │   └── Grand Total (highlight besar)
    ├── Section: Daftar Kategori
    │   └── [kategori]: subtotal (per kategori)
    ├── Section: Pengaturan Finansial
    │   ├── Overhead X%
    │   ├── Profit X%
    │   ├── Contingency X%
    │   └── PPN X%
    ├── Section: Konfigurasi Dokumen
    │   ├── Input: Nama Perusahaan
    │   ├── Input: Nama Estimator
    │   └── Input: Nomor Dokumen
    └── Footer: Tombol Aksi
        ├── [Download PDF]
        └── [Download Excel]
```

### Fitur 3: Notification Engine

#### Interface Modul

```typescript
// src/utils/notificationEngine.ts

export interface NotificationEngineConfig {
  idleThresholdDays?: number;    // default: 7
  deviationThreshold?: number;   // default: 10 (persen)
}

export function runNotificationEngine(
  projects: Project[],
  notifications: AppNotification[],
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void,
  config?: NotificationEngineConfig
): void
```

#### Logika Anti-Duplikat

```typescript
// Cek duplikat sebelum menambahkan notifikasi
function isDuplicate(
  notifications: AppNotification[],
  title: string,
  projectId: string
): boolean {
  return notifications.some(
    n => n.title === title && n.projectId === projectId
  );
}
```

#### Tiga Kondisi yang Dicek

```typescript
// Kondisi 1: RAB belum disimpan
if (project.autoSaveDraft && project.autoSavedAt) {
  const title = 'RAB Belum Disimpan';
  if (!isDuplicate(notifications, title, project.id)) {
    addNotification({
      type: 'warning',
      title,
      message: `Proyek "${project.name}" memiliki data RAB yang belum disimpan sebagai versi.`,
      projectId: project.id,
    });
  }
}

// Kondisi 2: Proyek idle (tidak ada DailyLog dalam N hari)
if (project.status === 'ongoing') {
  const lastLog = getLastDailyLog(project.dailyLogs);
  const daysSinceUpdate = getDaysSince(lastLog?.date);
  const threshold = config?.idleThresholdDays ?? 7;
  
  if (daysSinceUpdate >= threshold) {
    const title = 'Proyek Tidak Diupdate';
    if (!isDuplicate(notifications, title, project.id)) {
      addNotification({
        type: 'warning',
        title,
        message: `Proyek "${project.name}" tidak ada update selama ${daysSinceUpdate} hari.`,
        projectId: project.id,
      });
    }
  }
}

// Kondisi 3: Progress terlambat
if (project.status === 'ongoing' && project.startDate && hasRABItems(project)) {
  const { rencana, realisasi } = getCurrentPeriodProgress(project);
  const hasRealisasi = realisasi !== null && realisasi !== undefined;
  const threshold = config?.deviationThreshold ?? 10;
  
  if (hasRealisasi && (rencana - realisasi) > threshold) {
    const title = 'Progress Terlambat';
    if (!isDuplicate(notifications, title, project.id)) {
      addNotification({
        type: 'error',
        title,
        message: `Proyek "${project.name}": Rencana ${rencana.toFixed(1)}%, Realisasi ${realisasi.toFixed(1)}%, Deviasi ${(rencana - realisasi).toFixed(1)}%.`,
        projectId: project.id,
      });
    }
  }
}
```

### Fitur 4: Email Service & Reset Password

#### Interface Email Service

```typescript
// server/utils/emailService.js

/**
 * @param {string} to - Alamat email penerima
 * @param {string} name - Nama pengguna
 * @param {string} resetUrl - URL reset password lengkap
 * @returns {Promise<void>}
 * @throws {Error} Jika pengiriman email gagal
 */
async function sendResetPasswordEmail(to, name, resetUrl) { ... }

module.exports = { sendResetPasswordEmail };
```

#### Rate Limit Store (In-Memory)

```javascript
// Di server/controllers/auth.js
const resetRateLimits = new Map();
// Struktur: Map<email, { count: number, firstRequest: number }>

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 jam

function checkRateLimit(email) {
  const now = Date.now();
  const record = resetRateLimits.get(email);
  
  if (!record || (now - record.firstRequest) > RATE_LIMIT_WINDOW_MS) {
    // Window baru atau belum ada record
    resetRateLimits.set(email, { count: 1, firstRequest: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    const resetAt = record.firstRequest + RATE_LIMIT_WINDOW_MS;
    const waitMinutes = Math.ceil((resetAt - now) / 60000);
    return { allowed: false, waitMinutes };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count };
}
```

---

## Model Data

### Perubahan pada `Project` Interface

```typescript
// Tambahan field di interface Project (useStore.ts)
export interface Project {
  // ... semua field yang sudah ada ...
  
  // BARU: Progress realisasi manual per periode
  // key = indeks periode (0-based), value = persentase 0-100
  manualProgress?: Record<number, number>;
}
```

### Perubahan pada `User` Model (MongoDB)

Tidak ada perubahan schema — field `resetPasswordToken` dan `resetPasswordExpiry` sudah ada di `server/models/User.js`. Yang berubah hanya logika di controller.

### LocalStorage Keys

```typescript
// Konfigurasi export RAB
const EXPORT_CONFIG_KEY = 'sivilize_export_config';
// Value: ExportConfig JSON

// Sudah ada (tidak berubah):
// 'token' — JWT token
// 'sivilize_remember_me' — email untuk remember me
// 'sivilize-hub-pro-storage' — Zustand persist store
```

---

## Fitur 5: Foto Profil dan Edit Profil

### Ikhtisar

`UserProfileModal.tsx` sudah ada dan sudah terhubung ke `PUT /api/auth/profile` untuk update nama/email/password. Yang kurang adalah: (1) upload foto profil ke server (bukan hanya base64 di localStorage), (2) avatar URL tersimpan di User model, (3) avatar tampil di Navbar dan Sidebar.

### Arsitektur Komponen

```
UserProfileModal.tsx (sudah ada, perlu enhancement)
├── Tab: Edit Profil
│   ├── Avatar Upload (Camera button → input[type=file])
│   │   ├── Mode saat ini: base64 → localStorage (sudah jalan)
│   │   └── Mode baru: multipart/form-data → POST /api/auth/avatar → simpan URL
│   ├── Input Nama
│   └── Input Email
└── Tab: Ubah Password
    ├── Input Password Lama
    ├── Input Password Baru
    └── Input Konfirmasi Password Baru

Navbar.tsx / Sidebar.tsx
└── Avatar display: cek user.avatarUrl → fallback ke localStorage → fallback ke initial
```

### Interface TypeScript Baru

```typescript
// Tambahan pada interface User di useStore.ts
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;  // BARU: URL foto profil dari server
}

// Response dari endpoint upload avatar
interface AvatarUploadResponse {
  success: boolean;
  data: {
    avatarUrl: string;  // URL relatif, misal: /uploads/avatars/user_123_1234567890.jpg
  };
}
```

### Endpoint API Baru

```
POST /api/auth/avatar
Content-Type: multipart/form-data
Authorization: Bearer {token}
Body: { avatar: File }

Response 200:
{
  "success": true,
  "data": { "avatarUrl": "/uploads/avatars/user_123_timestamp.jpg" }
}

Validasi:
- File harus ada
- MIME type: image/jpeg, image/png, image/webp
- Ukuran maksimal: 2MB
- Simpan ke server/uploads/avatars/
- Update User.avatarUrl di database/mockStorage
```

### Perubahan pada `User` Model (MongoDB)

```javascript
// Tambahan field di server/models/User.js
const UserSchema = new mongoose.Schema({
  // ... field yang sudah ada ...
  avatarUrl: {
    type: String,
    default: null,
  },
});
```

### Perubahan pada Zustand Store

```typescript
// Tambahan action di useStore.ts
interface AppState {
  // ... actions yang sudah ada ...
  updateUserAvatar: (avatarUrl: string) => void;
}

// Implementasi:
updateUserAvatar: (avatarUrl) => {
  set((state) => ({
    user: state.user ? { ...state.user, avatarUrl } : null,
  }));
},
```

### Perubahan pada `authService` di `api.ts`

```typescript
// Tambahan di authService
uploadAvatar: async (file: File) => {
  const formData = new FormData();
  formData.append('avatar', file);
  const response = await api.post<AvatarUploadResponse>('/auth/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
},
```

### Logika Avatar Display (Priority Chain)

```typescript
// Di Navbar.tsx dan Sidebar.tsx
const getAvatarSrc = (user: User | null): string | null => {
  if (user?.avatarUrl) return `${API_BASE_URL}${user.avatarUrl}`;
  const localAvatar = localStorage.getItem('sivilize_avatar');
  if (localAvatar) return localAvatar;
  return null; // fallback ke initial huruf
};
```

### Alur Data Upload Avatar

```
User pilih file → handleAvatarChange()
                        ↓
              Validasi: size <= 2MB, type image/*
                        ↓
              authService.uploadAvatar(file)
              → POST /api/auth/avatar (multipart)
                        ↓
              Server: multer middleware → simpan file
              → update User.avatarUrl di DB
              → return { avatarUrl: '/uploads/...' }
                        ↓
              updateUserAvatar(avatarUrl) → Zustand store
                        ↓
              Navbar/Sidebar re-render dengan avatar baru
```


---

## Fitur 6: Versi RAB dengan Perbandingan

### Ikhtisar

Data `Project.versions[]` sudah ada di store. Yang dibutuhkan adalah komponen `RABVersionComparison.tsx` yang menampilkan dua versi RAB side by side dengan highlight perubahan harga per item.

### Komponen Baru: `RABVersionComparison.tsx`

```typescript
// src/components/rab/RABVersionComparison.tsx

interface RABVersionComparisonProps {
  projectId: string;
  versionAId: string;  // versi lama (kiri)
  versionBId: string;  // versi baru (kanan)
  onClose: () => void;
}

interface ComparisonItem {
  id: string;
  category: string;
  name: string;
  // Versi A
  volumeA?: number;
  unitPriceA?: number;
  totalA?: number;
  // Versi B
  volumeB?: number;
  unitPriceB?: number;
  totalB?: number;
  // Diff
  totalDiff: number;       // totalB - totalA (negatif = lebih murah)
  diffPercent: number;     // (totalDiff / totalA) * 100
  status: 'added' | 'removed' | 'increased' | 'decreased' | 'unchanged';
}
```

### Logika Diff

```typescript
export function computeVersionDiff(
  versionA: ProjectVersion,
  versionB: ProjectVersion
): ComparisonItem[] {
  const allItemNames = new Set([
    ...versionA.rabItems.map(i => i.name),
    ...versionB.rabItems.map(i => i.name),
  ]);

  return Array.from(allItemNames).map(name => {
    const itemA = versionA.rabItems.find(i => i.name === name);
    const itemB = versionB.rabItems.find(i => i.name === name);

    const totalA = itemA?.total ?? 0;
    const totalB = itemB?.total ?? 0;
    const totalDiff = totalB - totalA;
    const diffPercent = totalA > 0 ? (totalDiff / totalA) * 100 : 0;

    let status: ComparisonItem['status'];
    if (!itemA) status = 'added';
    else if (!itemB) status = 'removed';
    else if (Math.abs(totalDiff) < 1) status = 'unchanged';
    else if (totalDiff > 0) status = 'increased';
    else status = 'decreased';

    return {
      id: itemA?.id || itemB?.id || name,
      category: itemA?.category || itemB?.category || 'Lain-lain',
      name,
      volumeA: itemA?.volume,
      unitPriceA: itemA?.unitPrice,
      totalA: itemA?.total,
      volumeB: itemB?.volume,
      unitPriceB: itemB?.unitPrice,
      totalB: itemB?.total,
      totalDiff,
      diffPercent,
      status,
    };
  });
}
```

### Struktur UI Komponen

```
RABVersionComparison
├── Header: "Perbandingan Versi RAB"
├── Version Selector
│   ├── Dropdown: Pilih Versi A (kiri)
│   └── Dropdown: Pilih Versi B (kanan)
├── Summary Bar
│   ├── Grand Total Versi A
│   ├── Grand Total Versi B
│   └── Selisih Total (+ merah / - hijau)
├── Filter Tabs: [Semua] [Naik] [Turun] [Baru] [Dihapus]
└── Tabel Perbandingan
    ├── Kolom: Kategori | Nama Item | Total A | Total B | Selisih | %
    └── Row color coding:
        ├── increased: bg-red-500/10, text-red-400
        ├── decreased: bg-green-500/10, text-green-400
        ├── added: bg-blue-500/10, text-blue-400
        └── removed: bg-gray-500/10, text-gray-400 line-through
```

### Integrasi ke RABCalculator

```typescript
// Di RABCalculator.tsx atau halaman proyek
// Tambahkan tombol "Bandingkan Versi" jika project.versions.length >= 2
{project.versions.length >= 2 && (
  <button onClick={() => setShowComparison(true)} className="btn-secondary">
    <GitCompare size={16} /> Bandingkan Versi
  </button>
)}

{showComparison && (
  <RABVersionComparison
    projectId={project.id}
    versionAId={selectedVersionA}
    versionBId={selectedVersionB}
    onClose={() => setShowComparison(false)}
  />
)}
```


---

## Fitur 7: Kalkulator Upah Harian

### Ikhtisar

`LaborCalculator.tsx` sudah ada dan sudah terhubung ke Zustand store (`addLaborPayment`, `updateLaborPayment`). Komponen ini sudah fungsional. Yang perlu dilakukan:
1. Pastikan komponen ditampilkan di tab yang tepat di halaman proyek
2. Tambahkan fitur export ke PDF/Excel terpisah dari RAB material
3. Tambahkan ringkasan per pekerja lintas minggu

### Status Komponen Saat Ini

`LaborCalculator.tsx` sudah memiliki:
- Form input upah mingguan (tanggal, nama pekerja, jabatan, hari kerja, upah/hari)
- Kalkulasi total otomatis: `total = sum(days * dailyWage)`
- Riwayat pembayaran dengan toggle lunas/belum
- Summary: total belum dibayar, sudah dibayar, total keseluruhan
- Default wages per jabatan (Mandor: 270k, Tukang: 200k, dst)

### Yang Perlu Ditambahkan

#### 1. Integrasi ke Tab Proyek

```typescript
// Di halaman detail proyek (misal ProjectDetail.tsx atau RABCalculator.tsx)
// Tambahkan tab "Upah Tenaga Kerja"
const tabs = [
  { id: 'rab', label: 'RAB' },
  { id: 'progress', label: 'Progress' },
  { id: 'labor', label: 'Upah TK' },  // BARU
  { id: 'financial', label: 'Keuangan' },
];

// Render LaborCalculator di tab 'labor'
{activeTab === 'labor' && <LaborCalculator projectId={project.id} />}
```

#### 2. Export Upah ke PDF

```typescript
// Tambahan di LaborCalculator.tsx atau exportUtils.ts
export interface LaborExportOptions {
  projectName: string;
  companyName?: string;
  period?: string;  // misal "Januari 2025"
}

export const exportLaborToPDF = (
  payments: LaborPayment[],
  options: LaborExportOptions
): void => {
  // Gunakan jsPDF
  // Header: nama proyek, perusahaan, periode
  // Tabel: minggu | nama pekerja | jabatan | hari | upah/hari | total
  // Footer: total keseluruhan, tanda tangan mandor
};

export const exportLaborToExcel = (
  payments: LaborPayment[],
  options: LaborExportOptions
): void => {
  // Gunakan XLSX
  // Sheet 1: Rekap per minggu
  // Sheet 2: Rekap per pekerja (pivot)
};
```

#### 3. Ringkasan Per Pekerja

```typescript
// Fungsi helper untuk agregasi data per pekerja
export function aggregateLaborByWorker(
  payments: LaborPayment[]
): WorkerSummary[] {
  // Group by worker name
  // Sum: total hari kerja, total upah
  // Return sorted by total upah desc
}

interface WorkerSummary {
  name: string;
  role: string;
  totalDays: number;
  totalAmount: number;
  weeksWorked: number;
}
```

### Alur Data Export Upah

```
User klik "Export PDF Upah"
         ↓
exportLaborToPDF(project.laborPayments, { projectName, companyName })
         ↓
jsPDF: buat dokumen
  - Header: logo + nama proyek
  - Tabel per minggu dengan detail pekerja
  - Summary: total dibayar, belum dibayar
         ↓
Download: Upah_{NamaProyek}_{Tanggal}.pdf
```


---

## Fitur 8: Template RAB

### Ikhtisar

`RABTemplateManager.tsx` sudah ada dan sudah terhubung ke Zustand store (`saveRABTemplate`, `deleteRABTemplate`). Komponen ini sudah fungsional untuk save/load/delete template. Yang perlu dipastikan adalah integrasi yang benar ke RABCalculator dan tampilan preview yang informatif.

### Status Komponen Saat Ini

`RABTemplateManager.tsx` sudah memiliki:
- Form simpan template (nama, kategori, deskripsi)
- Daftar template dengan card view (nama, kategori, tanggal, jumlah item, total)
- Tombol "Pakai Template" yang memanggil `onLoadTemplate(items, financials)`
- Tombol hapus template
- Callback `onLoadTemplate` untuk inject items ke RAB Calculator

### Yang Perlu Dipastikan

#### 1. Integrasi ke RABCalculator

```typescript
// Di RABCalculator.tsx, pastikan RABTemplateManager dipanggil dengan props yang benar
<RABTemplateManager
  onLoadTemplate={(items, financials) => {
    // Replace current RAB items dengan template items
    setRabItems(items);
    setFinancialSettings(financials);
    showToast('Template berhasil dimuat ke RAB Calculator', 'success');
  }}
  currentItems={rabItems}
  currentFinancials={financialSettings}
/>
```

#### 2. Preview Template yang Lebih Informatif

```typescript
// Tambahkan preview breakdown per kategori di template card
interface TemplatePreviewData {
  categoryBreakdown: { category: string; count: number; subtotal: number }[];
  grandTotal: number;  // setelah overhead/profit/tax
  itemCount: number;
}

// Fungsi helper
export function computeTemplatePreview(template: RABTemplate): TemplatePreviewData {
  const byCategory = template.rabItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = { count: 0, subtotal: 0 };
    acc[item.category].count++;
    acc[item.category].subtotal += item.total;
    return acc;
  }, {} as Record<string, { count: number; subtotal: number }>);

  const subtotal = template.rabItems.reduce((s, i) => s + i.total, 0);
  const { overhead, profit, tax, contingency } = template.financialSettings;
  const grandTotal = subtotal * (1 + overhead/100 + profit/100 + contingency/100 + tax/100);

  return {
    categoryBreakdown: Object.entries(byCategory).map(([category, data]) => ({
      category, ...data
    })),
    grandTotal,
    itemCount: template.rabItems.length,
  };
}
```

#### 3. Konfirmasi Load Template

```typescript
// Saat user klik "Pakai Template", tampilkan konfirmasi yang informatif
const handleLoad = (template: RABTemplate) => {
  const preview = computeTemplatePreview(template);
  // Tampilkan modal konfirmasi dengan:
  // - Nama template
  // - Jumlah item yang akan dimuat
  // - Grand total estimasi
  // - Warning: "Item RAB saat ini akan diganti"
  if (confirm(`Load "${template.name}"? ${preview.itemCount} item, estimasi ${formatCurrency(preview.grandTotal)}`)) {
    onLoadTemplate(template.rabItems, template.financialSettings);
  }
};
```

### LocalStorage Key untuk Template

Template sudah tersimpan di Zustand persist store (`sivilize-hub-pro-storage`), tidak perlu localStorage terpisah.


---

## Fitur 9: Share RAB (Read-Only Link)

### Ikhtisar

Generate link publik untuk RAB yang bisa dibuka tanpa login. Backend perlu endpoint baru untuk generate dan retrieve share token. Frontend perlu halaman `ShareView.tsx` yang accessible tanpa auth.

### Endpoint API Baru

```
POST /api/projects/:id/share
Authorization: Bearer {token}
Body: { expiresInDays?: number }  // default: 30 hari

Response 200:
{
  "success": true,
  "data": {
    "shareToken": "abc123def456...",
    "shareUrl": "https://sivilize-frontend.vercel.app/share/abc123def456",
    "expiresAt": "2025-02-15T00:00:00.000Z"
  }
}

---

GET /api/share/:token
Authorization: tidak diperlukan (public endpoint)

Response 200:
{
  "success": true,
  "data": {
    "projectName": "Rumah Pak Budi",
    "location": "Jakarta Selatan",
    "versions": [...],  // semua versi RAB (read-only)
    "createdAt": "...",
    "sharedBy": "Nama Kontraktor"
  }
}

Response 404:
{
  "success": false,
  "message": "Link tidak valid atau sudah kedaluwarsa"
}
```

### Perubahan pada `Project` Model (MongoDB)

```javascript
// Tambahan field di server/models/Project.js
const ProjectSchema = new mongoose.Schema({
  // ... field yang sudah ada ...
  shareToken: {
    type: String,
    default: null,
    index: true,  // untuk lookup cepat
  },
  shareTokenExpiry: {
    type: Date,
    default: null,
  },
  shareEnabled: {
    type: Boolean,
    default: false,
  },
});
```

### Perubahan pada `Project` Interface (Frontend)

```typescript
// Tambahan field di interface Project di useStore.ts
export interface Project {
  // ... field yang sudah ada ...
  shareToken?: string;
  shareTokenExpiry?: string;
  shareEnabled?: boolean;
}
```

### Komponen Baru: `ShareView.tsx`

```typescript
// src/pages/ShareView.tsx (atau src/components/share/ShareView.tsx)
// Route: /share/:token (tidak memerlukan auth)

interface ShareViewProps {
  token: string;  // dari URL params
}

// State
const [shareData, setShareData] = useState<ShareData | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

// Fetch data saat mount
useEffect(() => {
  const fetchShareData = async () => {
    try {
      const response = await api.get(`/share/${token}`);
      setShareData(response.data.data);
    } catch (err) {
      setError('Link tidak valid atau sudah kedaluwarsa');
    } finally {
      setLoading(false);
    }
  };
  fetchShareData();
}, [token]);
```

### Struktur UI ShareView

```
ShareView (halaman publik, tanpa Navbar/Sidebar)
├── Header: Logo SIVILIZE HUB PRO + badge "Read Only"
├── Project Info Card
│   ├── Nama Proyek
│   ├── Lokasi
│   └── Dibagikan oleh: [nama kontraktor]
├── Version Selector (jika ada multiple versi)
├── RAB Table (read-only, sama dengan tampilan normal)
│   └── Semua item dengan kategori, volume, harga, total
├── Financial Summary
│   ├── Subtotal
│   ├── Overhead, Profit, PPN
│   └── Grand Total (highlight)
├── Footer: "Dibuat dengan SIVILIZE HUB PRO"
└── CTA: "Buat RAB Anda Sendiri" → link ke landing page
```

### Komponen Share Button di RABCalculator

```typescript
// Tambahkan di RABCalculator.tsx
const handleGenerateShareLink = async () => {
  try {
    const response = await projectService.generateShareLink(project.id);
    const shareUrl = response.data.shareUrl;
    // Copy ke clipboard
    await navigator.clipboard.writeText(shareUrl);
    showToast('Link berhasil disalin ke clipboard!', 'success');
    // Update project di store dengan shareToken baru
    updateProject(project.id, {
      shareToken: response.data.shareToken,
      shareEnabled: true,
    });
  } catch {
    showToast('Gagal membuat link share', 'error');
  }
};
```

### Tambahan di `projectService` (api.ts)

```typescript
// Tambahan di projectService
generateShareLink: async (projectId: string, expiresInDays = 30) => {
  const response = await api.post<ApiResponse<ShareLinkData>>(
    `/projects/${projectId}/share`,
    { expiresInDays }
  );
  return response.data;
},
getSharedProject: async (token: string) => {
  const response = await api.get<ApiResponse<SharedProjectData>>(`/share/${token}`);
  return response.data;
},
```

### Alur Data Share RAB

```
User klik "Bagikan RAB"
         ↓
POST /api/projects/:id/share
         ↓
Server: generate crypto token (16 bytes hex)
Simpan shareToken + shareTokenExpiry ke project
         ↓
Return shareUrl ke frontend
         ↓
Frontend: copy URL ke clipboard + tampilkan toast
         ↓
User kirim URL ke klien/owner
         ↓
Klien buka URL /share/:token (tanpa login)
         ↓
GET /api/share/:token → return project data (read-only)
         ↓
ShareView.tsx render RAB dalam mode read-only
```


---

## Fitur 10: Backup dan Restore

### Ikhtisar

Frontend-only feature. Export semua data proyek ke JSON, import kembali dengan merge ke store. Tidak memerlukan backend — semua data sudah ada di Zustand persist store.

### Interface TypeScript

```typescript
// src/utils/backupRestore.ts

export interface BackupData {
  version: string;          // versi format backup, misal "1.0"
  exportedAt: string;       // ISO timestamp
  exportedBy: string;       // nama user
  projects: Project[];
  rabTemplates: RABTemplate[];
}

export interface ImportResult {
  success: boolean;
  projectsImported: number;
  projectsSkipped: number;  // sudah ada dengan ID yang sama
  templatesImported: number;
  errors: string[];
}
```

### Fungsi Export

```typescript
export function exportAllData(
  projects: Project[],
  rabTemplates: RABTemplate[],
  user: User | null
): void {
  const backup: BackupData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    exportedBy: user?.name || 'Unknown',
    projects,
    rabTemplates,
  };

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `sivilize_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();

  URL.revokeObjectURL(url);
}
```

### Fungsi Import (Merge Strategy)

```typescript
export function importData(
  file: File,
  existingProjects: Project[],
  existingTemplates: RABTemplate[],
  callbacks: {
    addProject: (p: Project) => void;
    saveRABTemplate: (t: Omit<RABTemplate, 'id' | 'createdAt'>) => void;
  }
): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup: BackupData = JSON.parse(e.target?.result as string);

        // Validasi format
        if (!backup.version || !backup.projects) {
          reject(new Error('Format file backup tidak valid'));
          return;
        }

        const result: ImportResult = {
          success: true,
          projectsImported: 0,
          projectsSkipped: 0,
          templatesImported: 0,
          errors: [],
        };

        // Merge projects: skip jika ID sudah ada
        const existingIds = new Set(existingProjects.map(p => p.id));
        for (const project of backup.projects) {
          if (existingIds.has(project.id)) {
            result.projectsSkipped++;
          } else {
            callbacks.addProject(project);
            result.projectsImported++;
          }
        }

        // Merge templates: selalu import (buat ID baru)
        for (const template of (backup.rabTemplates || [])) {
          const { id, createdAt, ...templateData } = template;
          callbacks.saveRABTemplate(templateData);
          result.templatesImported++;
        }

        resolve(result);
      } catch (err) {
        reject(new Error('Gagal membaca file backup. Pastikan file tidak rusak.'));
      }
    };
    reader.readAsText(file);
  });
}
```

### Komponen UI: `BackupRestorePanel.tsx`

```typescript
// src/components/settings/BackupRestorePanel.tsx

// Struktur UI:
// ┌─────────────────────────────────────────┐
// │  Backup & Restore Data                  │
// ├─────────────────────────────────────────┤
// │  [Export Semua Data]                    │
// │  Ekspor semua proyek dan template ke    │
// │  file JSON. File ini bisa digunakan     │
// │  untuk restore atau pindah perangkat.   │
// ├─────────────────────────────────────────┤
// │  [Pilih File Backup...]                 │
// │  Import data dari file backup JSON.     │
// │  Data yang sudah ada tidak akan         │
// │  ditimpa (merge strategy).              │
// └─────────────────────────────────────────┘
```

### Integrasi ke Settings/Profile

```typescript
// Tambahkan BackupRestorePanel di halaman Settings atau UserProfileModal
// Tab baru: "Backup & Restore"
```

### Alur Data Backup

```
Export:
User klik "Export Semua Data"
         ↓
exportAllData(projects, rabTemplates, user)
         ↓
JSON.stringify → Blob → URL.createObjectURL
         ↓
Download: sivilize_backup_2025-01-15.json

Restore:
User pilih file .json
         ↓
FileReader.readAsText(file)
         ↓
JSON.parse → validasi format
         ↓
Merge: skip project dengan ID duplikat
         ↓
addProject() untuk setiap project baru
         ↓
Toast: "X proyek berhasil diimport, Y dilewati"
```


---

## Fitur 11: Laporan Keuangan Proyek

### Ikhtisar

Data `Project.costRealizations[]` sudah ada di store. Yang dibutuhkan adalah komponen `FinancialReport.tsx` yang menampilkan chart realisasi vs RAB per kategori dan summary total terpakai vs sisa anggaran.

### Komponen Baru: `FinancialReport.tsx`

```typescript
// src/components/financial/FinancialReport.tsx

interface FinancialReportProps {
  projectId: string;
}

interface CategoryFinancial {
  category: string;
  anggaran: number;      // dari RAB items (sum total per kategori)
  realisasi: number;     // dari costRealizations (sum amount per kategori)
  sisa: number;          // anggaran - realisasi
  persentase: number;    // (realisasi / anggaran) * 100
  status: 'aman' | 'warning' | 'over';  // <80%, 80-100%, >100%
}

interface FinancialSummary {
  totalAnggaran: number;   // grand total RAB (versi terbaru)
  totalRealisasi: number;  // sum semua costRealizations
  totalSisa: number;       // totalAnggaran - totalRealisasi
  persentaseTerpakai: number;
  byCategory: CategoryFinancial[];
}
```

### Fungsi Kalkulasi

```typescript
export function computeFinancialReport(
  project: Project
): FinancialSummary {
  // Ambil versi RAB terbaru
  const latestVersion = project.versions[project.versions.length - 1];
  if (!latestVersion) return emptyReport();

  // Hitung anggaran per kategori dari RAB items
  const anggaranByCategory = latestVersion.rabItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.total;
    return acc;
  }, {} as Record<string, number>);

  // Hitung realisasi per kategori dari costRealizations
  const realisasiByCategory = (project.costRealizations || []).reduce((acc, cost) => {
    acc[cost.category] = (acc[cost.category] || 0) + cost.amount;
    return acc;
  }, {} as Record<string, number>);

  // Gabungkan semua kategori
  const allCategories = new Set([
    ...Object.keys(anggaranByCategory),
    ...Object.keys(realisasiByCategory),
  ]);

  const byCategory: CategoryFinancial[] = Array.from(allCategories).map(category => {
    const anggaran = anggaranByCategory[category] || 0;
    const realisasi = realisasiByCategory[category] || 0;
    const sisa = anggaran - realisasi;
    const persentase = anggaran > 0 ? (realisasi / anggaran) * 100 : 0;
    const status = persentase > 100 ? 'over' : persentase >= 80 ? 'warning' : 'aman';
    return { category, anggaran, realisasi, sisa, persentase, status };
  });

  const totalAnggaran = latestVersion.summary?.grandTotal || 0;
  const totalRealisasi = (project.costRealizations || []).reduce((s, c) => s + c.amount, 0);

  return {
    totalAnggaran,
    totalRealisasi,
    totalSisa: totalAnggaran - totalRealisasi,
    persentaseTerpakai: totalAnggaran > 0 ? (totalRealisasi / totalAnggaran) * 100 : 0,
    byCategory,
  };
}
```

### Struktur UI Komponen

```
FinancialReport
├── Summary Cards (4 cards)
│   ├── Total Anggaran (RAB Grand Total)
│   ├── Total Realisasi (sum costRealizations)
│   ├── Sisa Anggaran (anggaran - realisasi)
│   └── % Terpakai (progress bar)
├── Chart: Bar Chart (Recharts BarChart)
│   ├── X-axis: kategori pekerjaan
│   ├── Bar 1 (biru): Anggaran
│   └── Bar 2 (oranye): Realisasi
├── Tabel Detail per Kategori
│   ├── Kolom: Kategori | Anggaran | Realisasi | Sisa | %
│   └── Row color: aman=hijau, warning=kuning, over=merah
└── Tombol: [Export Laporan PDF]
```

### Recharts Configuration

```typescript
// Chart configuration
<BarChart data={report.byCategory} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
  <XAxis dataKey="category" tick={{ fill: '#888', fontSize: 11 }} />
  <YAxis tickFormatter={(v) => formatCurrencyShort(v)} tick={{ fill: '#888' }} />
  <Tooltip formatter={(v) => formatCurrency(v as number)} />
  <Legend />
  <Bar dataKey="anggaran" name="Anggaran RAB" fill="#3b82f6" radius={[4, 4, 0, 0]} />
  <Bar dataKey="realisasi" name="Realisasi" fill="#f97316" radius={[4, 4, 0, 0]} />
</BarChart>
```


---

## Fitur 12: Integrasi WhatsApp

### Ikhtisar

Kirim ringkasan RAB via WhatsApp menggunakan deep link `https://wa.me/?text=...`. Tidak memerlukan WhatsApp Business API — cukup generate teks ringkasan dan encode ke URL.

### Fungsi Generate Teks WA

```typescript
// src/utils/whatsappShare.ts

export interface WAShareOptions {
  projectName: string;
  location: string;
  grandTotal: number;
  categoryBreakdown: { category: string; subtotal: number }[];
  versionLabel?: string;
  companyName?: string;
  preparedBy?: string;
}

export function generateWAText(options: WAShareOptions): string {
  const {
    projectName, location, grandTotal,
    categoryBreakdown, versionLabel, companyName, preparedBy
  } = options;

  const lines = [
    `*RINGKASAN RAB - ${projectName.toUpperCase()}*`,
    `_${companyName || 'SIVILIZE HUB PRO'}_`,
    ``,
    `📍 Lokasi: ${location}`,
    versionLabel ? `📋 Versi: ${versionLabel}` : '',
    ``,
    `*RINCIAN BIAYA:*`,
    ...categoryBreakdown.map(c =>
      `• ${c.category}: ${formatCurrencyWA(c.subtotal)}`
    ),
    ``,
    `*TOTAL RAB: ${formatCurrencyWA(grandTotal)}*`,
    ``,
    preparedBy ? `Disusun oleh: ${preparedBy}` : '',
    `Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    ``,
    `_Dibuat dengan SIVILIZE HUB PRO_`,
  ].filter(Boolean).join('\n');

  return lines;
}

function formatCurrencyWA(amount: number): string {
  // Format: Rp 1.250.000.000
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function openWhatsApp(text: string, phoneNumber?: string): void {
  const encoded = encodeURIComponent(text);
  const url = phoneNumber
    ? `https://wa.me/${phoneNumber}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
```

### Integrasi ke RABCalculator / RABPreviewModal

```typescript
// Tambahkan tombol "Kirim via WhatsApp" di RABPreviewModal atau RABCalculator
const handleShareWA = () => {
  const latestVersion = project.versions[project.versions.length - 1];
  if (!latestVersion) return;

  const categoryBreakdown = Object.entries(
    latestVersion.rabItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.total;
      return acc;
    }, {} as Record<string, number>)
  ).map(([category, subtotal]) => ({ category, subtotal }));

  const text = generateWAText({
    projectName: project.name,
    location: project.location,
    grandTotal: latestVersion.summary?.grandTotal || 0,
    categoryBreakdown,
    versionLabel: `v${latestVersion.versionNum}`,
    companyName: exportConfig.companyName,
    preparedBy: exportConfig.estimatorName,
  });

  openWhatsApp(text);
};
```

### Contoh Output Teks WA

```
*RINGKASAN RAB - RUMAH PAK BUDI*
_CV. Maju Jaya Konstruksi_

📍 Lokasi: Jakarta Selatan
📋 Versi: v2

*RINCIAN BIAYA:*
• Struktur: Rp 125.000.000
• Arsitektur: Rp 85.000.000
• Finishing: Rp 45.000.000
• MEP: Rp 35.000.000

*TOTAL RAB: Rp 290.000.000*

Disusun oleh: Budi Santoso
Tanggal: 15 Januari 2025

_Dibuat dengan SIVILIZE HUB PRO_
```


---

## Fitur 13: Mode Offline PWA

### Ikhtisar

Implementasi Progressive Web App (PWA) menggunakan `vite-plugin-pwa`. Service worker akan cache assets statis (cache-first) dan menggunakan network-first untuk API calls. Ini memungkinkan aplikasi tetap bisa diakses dan digunakan secara terbatas saat offline.

### Dependensi Baru

```json
// package.json
{
  "devDependencies": {
    "vite-plugin-pwa": "^0.20.0"
  }
}
```

### Konfigurasi `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'SIVILIZE HUB PRO',
        short_name: 'SIVILIZE',
        description: 'Platform Manajemen Proyek Konstruksi',
        theme_color: '#0ea5e9',
        background_color: '#0a0a0f',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Cache-first untuk assets statis
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Network-first untuk API calls
            urlPattern: /^https:\/\/server-.*\.vercel\.app\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24,  // 24 jam
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            // Cache-first untuk gambar
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,  // 30 hari
              },
            },
          },
        ],
      },
    }),
  ],
});
```

### File Assets yang Diperlukan

```
public/
├── pwa-192x192.png    (icon 192x192)
├── pwa-512x512.png    (icon 512x512)
├── apple-touch-icon.png  (180x180)
└── masked-icon.svg    (maskable icon)
```

### Indikator Status Offline di UI

```typescript
// src/hooks/useOnlineStatus.ts
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Di Navbar.tsx: tampilkan badge "Offline" jika !isOnline
{!isOnline && (
  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full font-bold">
    Offline
  </span>
)}
```

### Strategi Caching

| Resource | Strategy | Alasan |
|----------|----------|--------|
| JS/CSS/HTML | Cache First | Assets statis tidak berubah setelah build |
| Gambar | Cache First | Jarang berubah, hemat bandwidth |
| API `/api/projects` | Network First | Data harus fresh, fallback ke cache |
| API `/api/auth/*` | Network Only | Auth harus selalu online |
| Zustand Store | Persist (localStorage) | Data proyek tersimpan lokal otomatis |

### Catatan Penting

Karena Zustand sudah menggunakan `persist` middleware, semua data proyek sudah tersimpan di localStorage. Ini berarti user bisa melihat dan mengedit data proyek yang sudah di-load sebelumnya meskipun offline. Sinkronisasi ke backend terjadi saat kembali online.


---

## Fitur 14: Multi Bahasa (i18n)

### Ikhtisar

`src/i18n/translations.ts` sudah ada dengan struktur lengkap untuk EN dan ID. `useLanguage.ts` hook sudah ada. Yang perlu dilakukan adalah: (1) aktifkan toggle bahasa di Navbar, (2) pastikan semua komponen menggunakan translation key, (3) buat language context agar state bahasa tersedia di seluruh app.

### Status Saat Ini

Sudah ada:
- `src/i18n/translations.ts` — translations untuk EN dan ID (nav, dashboard, rab, categories, validation, ai, auth, buttons)
- `src/hooks/useLanguage.ts` — hook dengan `language`, `changeLanguage`, `t(path)`, `availableLanguages`
- `localStorage.setItem('sivilize_language', language)` — persistensi bahasa

Yang belum ada:
- Language Context untuk share state ke seluruh app
- Toggle bahasa di Navbar
- Penggunaan `t()` di komponen-komponen utama

### Language Context

```typescript
// src/contexts/LanguageContext.tsx
import { createContext, useContext, ReactNode } from 'react';
import { useLanguage } from '../hooks/useLanguage';

type LanguageContextType = ReturnType<typeof useLanguage>;

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const languageState = useLanguage();
  return (
    <LanguageContext.Provider value={languageState}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageContext(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguageContext must be used within LanguageProvider');
  return ctx;
}
```

### Integrasi di `App.tsx`

```typescript
// Wrap seluruh app dengan LanguageProvider
import { LanguageProvider } from './contexts/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        {/* ... rest of app ... */}
      </ToastProvider>
    </LanguageProvider>
  );
}
```

### Toggle Bahasa di Navbar

```typescript
// Di Navbar.tsx
import { useLanguageContext } from '../../contexts/LanguageContext';

const { language, changeLanguage } = useLanguageContext();

// Toggle button
<button
  onClick={() => changeLanguage(language === 'id' ? 'en' : 'id')}
  className="flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-border hover:border-primary"
  title="Toggle Language"
>
  <Globe size={14} />
  {language === 'id' ? 'ID' : 'EN'}
</button>
```

### Penggunaan `t()` di Komponen

```typescript
// Contoh penggunaan di komponen
import { useLanguageContext } from '../../contexts/LanguageContext';

const MyComponent = () => {
  const { t } = useLanguageContext();

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <button>{t('buttons.save')}</button>
      <p>{t('rab.calculate')}</p>
    </div>
  );
};
```

### Translation Keys yang Perlu Ditambahkan

```typescript
// Tambahan keys di src/i18n/translations.ts untuk fitur baru

// EN
features: {
  shareRAB: 'Share RAB',
  shareLink: 'Share Link',
  copyLink: 'Copy Link',
  linkCopied: 'Link copied to clipboard!',
  backup: 'Backup & Restore',
  exportData: 'Export All Data',
  importData: 'Import Data',
  laborCalc: 'Labor Calculator',
  versionCompare: 'Compare Versions',
  financialReport: 'Financial Report',
  shareViaWA: 'Share via WhatsApp',
  offlineMode: 'Offline Mode',
  offlineBadge: 'Offline',
}

// ID
features: {
  shareRAB: 'Bagikan RAB',
  shareLink: 'Link Berbagi',
  copyLink: 'Salin Link',
  linkCopied: 'Link berhasil disalin!',
  backup: 'Backup & Restore',
  exportData: 'Export Semua Data',
  importData: 'Import Data',
  laborCalc: 'Kalkulator Upah',
  versionCompare: 'Bandingkan Versi',
  financialReport: 'Laporan Keuangan',
  shareViaWA: 'Kirim via WhatsApp',
  offlineMode: 'Mode Offline',
  offlineBadge: 'Offline',
}
```

### Komponen yang Perlu Diupdate

Prioritas komponen yang perlu menggunakan `t()`:
1. `Navbar.tsx` — nav items, logout, language toggle
2. `Dashboard.tsx` — judul, tombol buat proyek, statistik
3. `AuthPage.tsx` — form login/register, label, tombol
4. `RABCalculator.tsx` — label form, tombol export, kategori
5. `NotificationPanel.tsx` — judul, tombol mark all read


---

## Model Data — Tambahan untuk Fitur 5-14

### Perubahan pada `Project` Interface (useStore.ts)

```typescript
export interface Project {
  // ... semua field yang sudah ada ...

  // BARU (Fitur 9 — Share RAB)
  shareToken?: string;
  shareTokenExpiry?: string;
  shareEnabled?: boolean;
}
```

### Perubahan pada `User` Interface (useStore.ts)

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;  // BARU (Fitur 5 — Foto Profil)
}
```

### Perubahan pada `User` Model MongoDB (server/models/User.js)

```javascript
// Tambahan field
avatarUrl: {
  type: String,
  default: null,
},
```

### Perubahan pada `Project` Model MongoDB (server/models/Project.js)

```javascript
// Tambahan field (Fitur 9 — Share RAB)
shareToken: {
  type: String,
  default: null,
  index: true,
},
shareTokenExpiry: {
  type: Date,
  default: null,
},
shareEnabled: {
  type: Boolean,
  default: false,
},
```

### LocalStorage Keys — Tambahan

```typescript
// Bahasa aktif
'sivilize_language'  // 'id' | 'en'

// Avatar (fallback jika server upload belum tersedia)
'sivilize_avatar'    // base64 string (sudah ada)

// Konfigurasi export (sudah ada)
'sivilize_export_config'  // ExportConfig JSON
```

### Zustand Store — Tambahan Actions

```typescript
interface AppState {
  // ... actions yang sudah ada ...

  // Fitur 5 — Foto Profil
  updateUserAvatar: (avatarUrl: string) => void;

  // Fitur 10 — Backup & Restore (tidak perlu action baru,
  // gunakan addProject() dan saveRABTemplate() yang sudah ada)
}
```

### File Baru yang Perlu Dibuat

| File | Fitur | Keterangan |
|------|-------|------------|
| `src/components/rab/RABVersionComparison.tsx` | 6 | Komponen perbandingan versi |
| `src/components/financial/FinancialReport.tsx` | 11 | Laporan keuangan |
| `src/components/settings/BackupRestorePanel.tsx` | 10 | Panel backup/restore |
| `src/pages/ShareView.tsx` | 9 | Halaman share publik |
| `src/contexts/LanguageContext.tsx` | 14 | Language context |
| `src/hooks/useOnlineStatus.ts` | 13 | Hook status online/offline |
| `src/utils/backupRestore.ts` | 10 | Fungsi export/import data |
| `src/utils/whatsappShare.ts` | 12 | Fungsi generate WA text |
| `server/routes/share.js` | 9 | Route publik untuk share |
| `server/controllers/share.js` | 9 | Controller share RAB |


---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Properties dari Fitur 1-4 (sudah ada di requirements.md)

Lihat tabel di requirements.md (P1-P13). Properties ini mencakup:
- Kurva S: monotonicity, completeness, aggregation consistency, data consistency
- Preview RAB: preview-export consistency, category subtotal consistency
- Notifikasi: no-duplicate invariant, status filter invariant, badge count invariant
- Reset Password: single-use token, rate limit boundary, expiry invariant

### Properties Baru dari Fitur 5-14

Berdasarkan prework analysis, berikut adalah properties yang dapat ditest secara otomatis:

---

### Property 14: Kalkulasi Total Upah

*For any* daftar pekerja dengan jumlah hari dan upah per hari, total upah yang dihitung oleh `LaborCalculator` harus selalu sama dengan `sum(worker.days * worker.dailyWage)` untuk semua pekerja dalam daftar tersebut.

**Validates: Fitur 7 — Kalkulator Upah Harian**

---

### Property 15: Round-Trip Template RAB

*For any* set of RAB items dan financial settings, menyimpan sebagai template kemudian memuatnya kembali harus menghasilkan items dan settings yang identik dengan yang disimpan (deep equality).

**Validates: Fitur 8 — Template RAB**

---

### Property 16: Preview Template Mengandung Informasi Lengkap

*For any* template RAB, rendered preview card harus mengandung: nama template, kategori, jumlah item, dan total estimasi biaya. Tidak boleh ada template yang ditampilkan tanpa salah satu dari keempat informasi tersebut.

**Validates: Fitur 8 — Template RAB**

---

### Property 17: Diff Versi RAB — Konsistensi Arah Perubahan

*For any* dua versi RAB (A dan B), untuk setiap item yang ada di kedua versi: jika `totalB > totalA` maka `status` harus `increased`, jika `totalB < totalA` maka `status` harus `decreased`, jika `totalB === totalA` maka `status` harus `unchanged`. Tidak boleh ada inkonsistensi antara nilai diff dan status yang ditampilkan.

**Validates: Fitur 6 — Versi RAB dengan Perbandingan**

---

### Property 18: Round-Trip Backup & Restore

*For any* set of projects, mengeksport ke JSON kemudian mengimport kembali ke store kosong harus menghasilkan set projects yang identik dengan yang diekspor (semua field, semua versi, semua daily logs).

**Validates: Fitur 10 — Backup & Restore**

---

### Property 19: Merge Strategy Restore Tidak Menghapus Data Existing

*For any* kombinasi existing projects dan imported projects, setelah operasi import: semua existing projects harus tetap ada di store, dan semua imported projects dengan ID baru harus ditambahkan. Tidak boleh ada data yang hilang.

**Validates: Fitur 10 — Backup & Restore**

---

### Property 20: Kalkulasi Sisa Anggaran

*For any* proyek dengan grand total RAB dan daftar cost realizations, nilai `totalSisa` yang dihitung oleh `computeFinancialReport` harus selalu sama dengan `grandTotal - sum(costRealizations.amount)`.

**Validates: Fitur 11 — Laporan Keuangan**

---

### Property 21: WA URL Mengandung Data RAB yang Benar

*For any* data RAB (nama proyek, total), URL WhatsApp yang dihasilkan oleh `generateWAText` + `openWhatsApp` harus mengandung nama proyek dan total yang ter-encode dengan benar dalam query parameter `text`.

**Validates: Fitur 12 — Integrasi WhatsApp**

---

### Property 22: Keunikan Share Token

*For any* dua permintaan generate share token untuk proyek yang berbeda (atau permintaan berulang untuk proyek yang sama), token yang dihasilkan harus berbeda. Probabilitas collision harus mendekati nol (16-byte random hex = 2^128 kemungkinan).

**Validates: Fitur 9 — Share RAB**

---

### Property 23: Translation Key Completeness

*For any* translation key yang ada di objek `translations.id`, key yang sama harus ada di `translations.en` dan mengembalikan string non-kosong. Tidak boleh ada key yang ada di satu bahasa tapi tidak di bahasa lain.

**Validates: Fitur 14 — Multi Bahasa**

---

### Property Reflection — Eliminasi Redundansi

Setelah review semua properties:

- **P15 (Template Round-Trip)** dan **P16 (Preview Info Lengkap)** tidak redundan — P15 menguji data integrity, P16 menguji rendering.
- **P18 (Backup Round-Trip)** dan **P19 (Merge Strategy)** tidak redundan — P18 menguji full restore, P19 menguji partial merge.
- **P14 (Total Upah)** adalah property matematika murni, tidak overlap dengan yang lain.
- **P17 (Diff Konsistensi)** adalah property tentang logika klasifikasi, tidak overlap.
- **P20 (Sisa Anggaran)** adalah property matematika, tidak overlap.
- **P21 (WA URL)** adalah property tentang encoding, tidak overlap.
- **P22 (Token Uniqueness)** adalah property probabilistik, tidak overlap.
- **P23 (Translation Completeness)** adalah property tentang data completeness, tidak overlap.

Semua 10 properties baru (P14-P23) memberikan nilai validasi yang unik.


---

## Error Handling

### Fitur 5 — Foto Profil

| Kondisi Error | Handling |
|---------------|----------|
| File > 2MB | Toast warning "Foto maksimal 2MB", batalkan upload |
| MIME type bukan image/* | Toast warning "Format file tidak didukung" |
| Upload gagal (network error) | Toast error "Gagal upload foto. Coba lagi." |
| Server error 500 | Toast error + fallback ke avatar localStorage |
| User tidak login | Redirect ke login page |

### Fitur 6 — Versi RAB Comparison

| Kondisi Error | Handling |
|---------------|----------|
| Versi A = Versi B | Tampilkan pesan "Pilih dua versi yang berbeda" |
| Project tidak punya versi | Sembunyikan tombol "Bandingkan Versi" |
| Project hanya punya 1 versi | Disable dropdown versi kedua |

### Fitur 9 — Share RAB

| Kondisi Error | Handling |
|---------------|----------|
| Token tidak ditemukan | HTTP 404 + pesan "Link tidak valid atau sudah kedaluwarsa" |
| Token expired | HTTP 404 + pesan yang sama (tidak expose info expiry ke publik) |
| Clipboard API tidak tersedia | Fallback: tampilkan URL dalam input field untuk copy manual |
| Network error saat generate | Toast error "Gagal membuat link. Coba lagi." |

### Fitur 10 — Backup & Restore

| Kondisi Error | Handling |
|---------------|----------|
| File bukan JSON | Toast error "File harus berformat JSON" |
| JSON tidak valid | Toast error "File backup rusak atau tidak valid" |
| Format backup tidak dikenal | Toast error "Versi format backup tidak didukung" |
| Import sebagian gagal | Toast warning dengan detail: "X berhasil, Y gagal" |

### Fitur 13 — PWA

| Kondisi Error | Handling |
|---------------|----------|
| Service worker tidak didukung | Aplikasi tetap berjalan normal tanpa offline support |
| Cache storage penuh | Service worker skip caching, tidak error |
| API call gagal saat offline | Tampilkan data dari cache + badge "Offline" di Navbar |
| Update service worker tersedia | Banner "Update tersedia, klik untuk refresh" |

### Fitur 14 — Multi Bahasa

| Kondisi Error | Handling |
|---------------|----------|
| Translation key tidak ditemukan | Kembalikan key itu sendiri sebagai fallback (sudah diimplementasi di `getNestedValue`) |
| localStorage tidak tersedia | Gunakan bahasa default 'id' |


---

## Testing Strategy

### Pendekatan Dual Testing

Semua fitur menggunakan kombinasi:
1. **Unit tests** — contoh spesifik, edge cases, error conditions
2. **Property-based tests** — properties universal (P14-P23) menggunakan library PBT

### Library PBT yang Digunakan

**Frontend (TypeScript):** `fast-check` (npm package)
```bash
npm install --save-dev fast-check
```

**Konfigurasi:** Minimum 100 iterasi per property test.

### Property Tests (fast-check)

```typescript
// Contoh implementasi Property 14 — Kalkulasi Total Upah
// Feature: critical-features-launch, Property 14: total upah = sum(days * dailyWage)
import * as fc from 'fast-check';

test('P14: total upah selalu sama dengan sum(days * dailyWage)', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          name: fc.string({ minLength: 1 }),
          role: fc.constantFrom('Mandor', 'Tukang Batu', 'Pekerja'),
          days: fc.integer({ min: 1, max: 7 }),
          dailyWage: fc.integer({ min: 50000, max: 500000 }),
        }),
        { minLength: 1, maxLength: 20 }
      ),
      (workers) => {
        const expectedTotal = workers.reduce((s, w) => s + w.days * w.dailyWage, 0);
        const actualTotal = calculateLaborTotal(workers);
        return actualTotal === expectedTotal;
      }
    ),
    { numRuns: 100 }
  );
});

// Contoh implementasi Property 15 — Round-Trip Template RAB
// Feature: critical-features-launch, Property 15: template round-trip preserves data
test('P15: load template menghasilkan items identik dengan yang disimpan', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          id: fc.uuid(),
          category: fc.constantFrom('Struktur', 'Arsitektur', 'Finishing', 'MEP'),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          volume: fc.float({ min: 0.1, max: 1000 }),
          unit: fc.constantFrom('m2', 'm3', 'unit', 'ls'),
          unitPrice: fc.integer({ min: 1000, max: 10000000 }),
          total: fc.integer({ min: 1000, max: 100000000 }),
        }),
        { minLength: 1, maxLength: 50 }
      ),
      (items) => {
        const template = createTemplate(items, defaultFinancials);
        const loaded = loadTemplate(template);
        return deepEqual(loaded.items, items);
      }
    ),
    { numRuns: 100 }
  );
});

// Contoh implementasi Property 17 — Diff Versi RAB
// Feature: critical-features-launch, Property 17: diff status konsisten dengan nilai
test('P17: status diff selalu konsisten dengan nilai totalDiff', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          name: fc.string({ minLength: 1 }),
          totalA: fc.integer({ min: 0, max: 100000000 }),
          totalB: fc.integer({ min: 0, max: 100000000 }),
        }),
        { minLength: 1, maxLength: 30 }
      ),
      (items) => {
        const diffs = computeVersionDiff(
          { rabItems: items.map(i => ({ ...i, total: i.totalA })) },
          { rabItems: items.map(i => ({ ...i, total: i.totalB })) }
        );
        return diffs.every(d => {
          if (d.totalDiff > 0) return d.status === 'increased';
          if (d.totalDiff < 0) return d.status === 'decreased';
          return d.status === 'unchanged';
        });
      }
    ),
    { numRuns: 100 }
  );
});

// Contoh implementasi Property 18 — Backup Round-Trip
// Feature: critical-features-launch, Property 18: backup round-trip preserves all projects
test('P18: export lalu import menghasilkan projects yang identik', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          id: fc.uuid(),
          name: fc.string({ minLength: 1 }),
          location: fc.string({ minLength: 1 }),
          type: fc.constant('rumah'),
          floors: fc.integer({ min: 1, max: 5 }),
          dimensions: fc.constant([]),
          versions: fc.constant([]),
          dailyLogs: fc.constant([]),
          status: fc.constantFrom('draft', 'ongoing', 'completed'),
        }),
        { minLength: 1, maxLength: 10 }
      ),
      (projects) => {
        const backup = createBackup(projects, [], null);
        const imported = parseBackup(backup);
        return deepEqual(imported.projects, projects);
      }
    ),
    { numRuns: 100 }
  );
});

// Contoh implementasi Property 20 — Kalkulasi Sisa Anggaran
// Feature: critical-features-launch, Property 20: sisa = grandTotal - sum(realizations)
test('P20: sisa anggaran selalu = grandTotal - sum(realisasi)', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 10000000000 }),
      fc.array(fc.integer({ min: 0, max: 1000000000 }), { minLength: 0, maxLength: 20 }),
      (grandTotal, realizationAmounts) => {
        const project = createProjectWithRealizations(grandTotal, realizationAmounts);
        const report = computeFinancialReport(project);
        const expectedSisa = grandTotal - realizationAmounts.reduce((s, a) => s + a, 0);
        return Math.abs(report.totalSisa - expectedSisa) < 1; // toleransi floating point
      }
    ),
    { numRuns: 100 }
  );
});

// Contoh implementasi Property 23 — Translation Key Completeness
// Feature: critical-features-launch, Property 23: semua key ID ada di EN
test('P23: semua translation key ID tersedia di EN', () => {
  const idKeys = getAllKeys(translations.id);
  const enKeys = new Set(getAllKeys(translations.en));

  idKeys.forEach(key => {
    expect(enKeys.has(key)).toBe(true);
    expect(translations.en[key]).toBeTruthy();
  });
});
```

### Unit Tests

```typescript
// Fitur 6 — Versi RAB Comparison
describe('computeVersionDiff', () => {
  it('item baru di versi B harus status "added"', () => { ... });
  it('item dihapus dari versi B harus status "removed"', () => { ... });
  it('item dengan harga sama harus status "unchanged"', () => { ... });
  it('diffPercent dihitung dengan benar', () => { ... });
});

// Fitur 9 — Share RAB
describe('Share Token', () => {
  it('token expired harus return 404', async () => { ... });
  it('token valid harus return project data', async () => { ... });
  it('token tidak ada harus return 404', async () => { ... });
});

// Fitur 10 — Backup & Restore
describe('importData', () => {
  it('file JSON tidak valid harus throw error', async () => { ... });
  it('project dengan ID duplikat harus di-skip', async () => { ... });
  it('template selalu diimport dengan ID baru', async () => { ... });
});

// Fitur 12 — WhatsApp
describe('generateWAText', () => {
  it('teks harus mengandung nama proyek', () => { ... });
  it('teks harus mengandung grand total', () => { ... });
  it('URL harus mengandung encoded text', () => { ... });
});
```

### Integration Tests

```typescript
// Fitur 5 — Upload Avatar
describe('POST /api/auth/avatar', () => {
  it('upload file valid harus return avatarUrl', async () => { ... });
  it('file > 2MB harus return 400', async () => { ... });
  it('tanpa auth harus return 401', async () => { ... });
});

// Fitur 9 — Share RAB
describe('GET /api/share/:token', () => {
  it('token valid harus return project data tanpa auth', async () => { ... });
  it('token tidak valid harus return 404', async () => { ... });
});
```

### Ringkasan Semua Correctness Properties

| # | Fitur | Property | Tipe |
|---|-------|----------|------|
| P1-P13 | Fitur 1-4 | Lihat requirements.md | Berbagai |
| P14 | Kalkulator Upah | Total = sum(days * wage) | Invariant |
| P15 | Template RAB | Load template = data yang disimpan | Round-trip |
| P16 | Template RAB | Preview mengandung info lengkap | Invariant |
| P17 | Versi RAB | Status diff konsisten dengan nilai | Invariant |
| P18 | Backup & Restore | Export → Import = data identik | Round-trip |
| P19 | Backup & Restore | Merge tidak menghapus data existing | Invariant |
| P20 | Laporan Keuangan | Sisa = grandTotal - sum(realisasi) | Invariant |
| P21 | WhatsApp | URL mengandung data RAB ter-encode | Invariant |
| P22 | Share RAB | Token selalu unik | Invariant |
| P23 | Multi Bahasa | Semua key ID tersedia di EN | Invariant |

