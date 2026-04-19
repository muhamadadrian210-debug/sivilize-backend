# Implementation Plan: Critical Features Launch — SIVILIZE HUB PRO

## Overview

Rencana implementasi 14 fitur untuk SIVILIZE HUB PRO, diurutkan berdasarkan dependency dan prioritas bisnis. Fase 1 (Kritikal) harus selesai sebelum launch. Fase 2 (Penting) meningkatkan profesionalisme produk. Fase 3 (Nice-to-Have) ditandai dengan `*` dan bisa dilewati untuk MVP.

Stack: React 19 + TypeScript, Zustand, Recharts, jsPDF + XLSX, Express.js, MongoDB.

---

## Tasks

---

## FASE 1 — KRITIKAL (Harus selesai sebelum launch)

---

### Fitur 4: Reset Password via Email

- [ ] 1. Buat `server/utils/emailService.js` — modul pengiriman email
  - [ ] 1.1 Implementasi fungsi `sendResetPasswordEmail(to, name, resetUrl)`
    - Dukung dua provider via env var `EMAIL_SERVICE`: `nodemailer` (SMTP) dan `resend` (Resend API)
    - Template HTML profesional: logo SIVILIZE HUB PRO, judul, instruksi, tombol CTA berwarna `#FF7A00`, info expiry 1 jam, footer
    - Throw `Error` jika pengiriman gagal (agar controller bisa catch)
    - Baca env vars: `EMAIL_SERVICE`, `EMAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `RESEND_API_KEY`
    - _Requirements: 11.1, 11.2, 11.3, 11.6_

  - [ ]* 1.2 Tulis unit test untuk `emailService.js`
    - Test: fungsi dipanggil dengan parameter yang benar
    - Test: throw error jika provider tidak dikonfigurasi
    - _Requirements: 11.5_

- [ ] 2. Update `server/controllers/auth.js` — tambah rate limiting dan integrasi email
  - [ ] 2.1 Tambahkan in-memory rate limit store di atas file
    - Deklarasi `const resetRateLimits = new Map()` di module scope
    - Implementasi fungsi `checkRateLimit(email)` sesuai desain: max 3 request per jam per email
    - Return `{ allowed: true, remaining }` atau `{ allowed: false, waitMinutes }`
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ] 2.2 Update fungsi `forgotPassword()` — integrasikan email service dan rate limit
    - Panggil `checkRateLimit(email)` di awal; jika tidak allowed, return HTTP 429 dengan pesan "Terlalu banyak permintaan. Coba lagi dalam X menit."
    - Setelah token disimpan ke DB, panggil `emailService.sendResetPasswordEmail(email, user.name, resetUrl)`
    - Jika email berhasil: return HTTP 200 dengan pesan "Email reset password telah dikirim ke [email]"
    - Jika email gagal: return HTTP 500 dengan pesan "Gagal mengirim email. Silakan coba lagi." + log error
    - Hapus return `resetToken` dan `resetUrl` di production (`NODE_ENV === 'production'`)
    - _Requirements: 11.1, 11.4, 11.5, 12.1, 12.2_

  - [ ] 2.3 Update fungsi `resetPassword()` — validasi ketat
    - Validasi `newPassword.length >= 8`; jika tidak, return HTTP 400 "Password minimal 8 karakter"
    - Setelah reset berhasil, hapus `resetPasswordToken` dan `resetPasswordExpiry` dari DB (sudah ada, pastikan benar)
    - Pesan error spesifik: "Token tidak valid atau sudah digunakan." vs "Token sudah kedaluwarsa. Silakan minta link reset baru."
    - _Requirements: 13.3, 13.4, 13.5, 13.6_

  - [ ]* 2.4 Tulis property test untuk rate limit boundary (P11)
    - **Property 11: Rate Limit Boundary**
    - **Validates: Requirements 12.1, 12.2**
    - Test: request ke-3 harus allowed, request ke-4 harus ditolak
    - _Requirements: 12.1, 12.2_

  - [ ]* 2.5 Tulis property test untuk token expiry (P12)
    - **Property 12: Expiry Invariant**
    - **Validates: Requirements 13.2, 13.5**
    - Test: token ≥3600 detik ditolak, token <3600 detik diterima
    - _Requirements: 13.2, 13.5_

  - [ ]* 2.6 Tulis property test untuk single-use token (P10)
    - **Property 10: Single-Use Token Invariant**
    - **Validates: Requirements 13.3, 13.4**
    - Test: token yang sudah digunakan tidak bisa dipakai lagi
    - _Requirements: 13.3, 13.4_

- [ ] 3. Update `src/components/auth/AuthPage.tsx` — UX improvement reset password
  - [ ] 3.1 Perbaiki handling mode `reset` saat tidak ada token di URL
    - Jika `mode === 'reset'` dan `resetToken` kosong, tampilkan pesan error "Link reset tidak valid. Silakan minta link reset baru." dan tombol "Minta Link Reset Baru" (set mode ke 'forgot')
    - _Requirements: 14.3_

  - [ ] 3.2 Tambahkan redirect otomatis setelah reset berhasil
    - Setelah `resetPassword` sukses, tampilkan pesan "Password berhasil diubah! Anda akan diarahkan ke halaman login."
    - Gunakan `setTimeout` 3 detik lalu set `mode('login')` dan clear form
    - _Requirements: 14.4_

  - [ ] 3.3 Tampilkan error spesifik dari backend + opsi "Minta Link Reset Baru"
    - Jika response HTTP 400 dari `resetPassword`, tampilkan pesan error dari backend
    - Tambahkan tombol "Minta Link Reset Baru" yang set mode ke 'forgot'
    - _Requirements: 14.5_

  - [ ]* 3.4 Tulis property test untuk missing token edge case (P13)
    - **Property 13: Missing Token Edge Case**
    - **Validates: Requirements 14.3**
    - Test: buka `/reset-password` tanpa token selalu tampilkan error
    - _Requirements: 14.3_

- [ ] 4. Checkpoint — Reset Password
  - Pastikan semua test pass. Uji manual: kirim email reset, klik link, reset password berhasil. Tanya user jika ada pertanyaan.


---

### Fitur 3: Notifikasi Real — Notification Engine + Badge Count

- [ ] 5. Buat `src/utils/notificationEngine.ts` — modul engine notifikasi
  - [ ] 5.1 Implementasi fungsi helper internal
    - `isDuplicate(notifications, title, projectId)` — cek duplikat berdasarkan title + projectId
    - `getLastDailyLog(dailyLogs)` — return log terbaru berdasarkan tanggal
    - `getDaysSince(dateStr)` — hitung hari sejak tanggal tertentu
    - `hasRABItems(project)` — cek apakah project punya RAB items
    - `getCurrentPeriodProgress(project)` — hitung rencana dan realisasi periode saat ini
    - _Requirements: 7.3, 8.5, 9.4_

  - [ ] 5.2 Implementasi fungsi utama `runNotificationEngine(projects, notifications, addNotification, config?)`
    - Export interface `NotificationEngineConfig { idleThresholdDays?: number; deviationThreshold?: number }`
    - Kondisi 1: cek `autoSaveDraft && autoSavedAt` → notif warning "RAB Belum Disimpan"
    - Kondisi 2: cek `status === 'ongoing'` + tidak ada DailyLog dalam N hari → notif warning "Proyek Tidak Diupdate"
    - Kondisi 3: cek `status === 'ongoing'` + deviasi >10% → notif error "Progress Terlambat"
    - Setiap kondisi wajib cek `isDuplicate` sebelum `addNotification`
    - _Requirements: 7.1, 7.2, 7.3, 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.6_

  - [ ]* 5.3 Tulis property test untuk no-duplicate invariant (P7)
    - **Property 7: No-Duplicate Invariant**
    - **Validates: Requirements 7.3, 8.5, 9.4**
    - Test: menjalankan engine dua kali tidak menghasilkan notifikasi duplikat
    - _Requirements: 7.3, 8.5_

  - [ ]* 5.4 Tulis property test untuk status filter invariant (P8)
    - **Property 8: Status Filter Invariant**
    - **Validates: Requirements 8.4**
    - Test: notifikasi "Proyek Tidak Diupdate" tidak pernah dibuat untuk proyek non-ongoing
    - _Requirements: 8.4_

- [ ] 6. Update `src/App.tsx` — integrasikan notification engine
  - Tambahkan `useEffect` yang memanggil `runNotificationEngine(projects, notifications, addNotification)` saat `isAuthenticated === true`
  - Dependency array: `[isAuthenticated, projects]`
  - Import `runNotificationEngine` dari `../utils/notificationEngine`
  - _Requirements: 7.1, 8.1, 9.1_

- [ ] 7. Update `src/components/common/Navbar.tsx` — badge count notifikasi
  - [ ] 7.1 Tambahkan badge count di ikon notifikasi
    - Hitung `unreadCount = notifications.filter(n => !n.read).length`
    - Tampilkan badge merah dengan angka jika `unreadCount > 0`
    - Sembunyikan badge jika `unreadCount === 0`
    - _Requirements: 10.1, 10.2_

  - [ ]* 7.2 Tulis property test untuk badge count invariant (P9)
    - **Property 9: Badge Count Invariant**
    - **Validates: Requirements 10.1, 10.4**
    - Test: badge count selalu sama dengan `notifications.filter(n => !n.read).length` setelah setiap operasi
    - _Requirements: 10.1, 10.4_

- [ ] 8. Checkpoint — Notification Engine
  - Pastikan semua test pass. Uji manual: buat proyek ongoing tanpa log 7 hari, pastikan notifikasi muncul. Tanya user jika ada pertanyaan.


---

### Fitur 2: Preview Cetak RAB — RABPreviewModal

- [ ] 9. Buat `src/components/export/RABPreviewModal.tsx` — modal preview sebelum export
  - [ ] 9.1 Definisikan interfaces dan konstanta
    - Interface `RABPreviewModalProps { isOpen, onClose, project, items, financials, grade }`
    - Interface `ExportConfig { companyName, estimatorName, documentNumber }`
    - Konstanta `DEFAULT_EXPORT_CONFIG` dan `EXPORT_CONFIG_STORAGE_KEY = 'sivilize_export_config'`
    - Load config dari localStorage saat mount; simpan ke localStorage saat download
    - _Requirements: 6.1, 6.4_

  - [ ] 9.2 Implementasi struktur modal dan ringkasan RAB
    - Overlay dengan klik-untuk-tutup; modal container `max-h-[90vh] overflow-y-auto min-w-[320px]`
    - Header: judul "Preview RAB" + tombol tutup (X)
    - Section ringkasan: nama proyek, grand total (highlight besar), daftar kategori + subtotal
    - Section finansial: overhead%, profit%, contingency%, PPN%
    - Gunakan `calculateTotalRAB(items, financials)` dari `utils/calculations`
    - _Requirements: 5.2, 5.3, 5.7, 5.8_

  - [ ] 9.3 Implementasi form konfigurasi dokumen dan tombol aksi
    - Input: nama perusahaan (default "SIVILIZE HUB PRO"), nama estimator, nomor dokumen (auto-generate `SIV-XXXXXX`)
    - Jika nama perusahaan dikosongkan, gunakan default saat export
    - Tombol "Download PDF" → panggil `exportToPDF(project, items, financials, grade, config)` lalu `onClose()`
    - Tombol "Download Excel" → panggil `exportToExcel(project, items, financials, grade, config)` lalu `onClose()`
    - _Requirements: 5.4, 5.5, 6.1, 6.2, 6.3, 6.5_

  - [ ]* 9.4 Tulis property test untuk preview-export consistency (P5)
    - **Property 5: Preview-Export Consistency**
    - **Validates: Requirements 5.2, 5.5**
    - Test: grand total di preview identik dengan grand total dalam file export untuk semua kombinasi RAB items
    - _Requirements: 5.2_

  - [ ]* 9.5 Tulis property test untuk category subtotal consistency (P6)
    - **Property 6: Category Subtotal Consistency**
    - **Validates: Requirements 5.2**
    - Test: jumlah subtotal kategori di preview = subtotal pekerjaan dalam file export
    - _Requirements: 5.2_

- [ ] 10. Integrasikan `RABPreviewModal` ke komponen RABCalculator
  - Tambahkan state `showPreviewModal` di RABCalculator
  - Ganti tombol export langsung dengan tombol "Cetak / Export" yang membuka modal
  - Pass props yang benar: `project`, `items`, `financials`, `grade`
  - _Requirements: 5.1_

- [ ] 11. Checkpoint — RABPreviewModal
  - Pastikan semua test pass. Uji manual di mobile (320px): buka modal, isi konfigurasi, download PDF dan Excel. Tanya user jika ada pertanyaan.


---

### Fitur 1: Kurva S Enhancement

- [ ] 12. Update `src/store/useStore.ts` — tambah field dan action untuk Kurva S
  - Tambahkan field `manualProgress?: Record<number, number>` ke interface `Project`
  - Tambahkan action `updateProjectProgress(projectId, periodIndex, value)` ke interface `AppState`
  - Implementasi action: update `projects` array dengan spread operator, set `manualProgress[periodIndex] = value`
  - _Requirements: 1.5, 3.5_

- [ ] 13. Buat `src/utils/kurvaSUtils.ts` — fungsi murni untuk Kurva S
  - [ ] 13.1 Implementasi `buildChartData(items, startDate, endDate, dailyLogs, manualProgress)`
    - Export interface `KurvaSChartPoint { label, rencana, realisasi, isManual }`
    - Hitung `durationWeeks = Math.ceil((endDate - startDate) / 7 hari)`
    - Distribusikan bobot RAB items ke minggu berdasarkan `CATEGORY_WEEK_MAP`
    - Hitung kumulatif rencana per minggu, normalisasi ke 100%
    - Prioritas realisasi: DailyLog > manualProgress > null
    - Tandai `isManual = true` jika sumber dari manualProgress
    - _Requirements: 1.2, 3.6, 3.7_

  - [ ] 13.2 Implementasi `aggregateToMonthly(weeklyData)`
    - Setiap 4 minggu = 1 bulan; label "Bln 1", "Bln 2", dst.
    - Nilai kumulatif bulan = nilai kumulatif minggu terakhir bulan tersebut
    - Pastikan monoton naik
    - _Requirements: 2.2, 2.3_

  - [ ]* 13.3 Tulis property test untuk monotonicity invariant (P1)
    - **Property 1: Monotonicity Invariant**
    - **Validates: Requirements 2.5**
    - Test: `data[i].rencana >= data[i-1].rencana` untuk semua i, semua kombinasi RAB items valid
    - _Requirements: 2.5_

  - [ ]* 13.4 Tulis property test untuk completeness invariant (P2)
    - **Property 2: Completeness Invariant**
    - **Validates: Requirements 2.6**
    - Test: `data[N].rencana` selalu dalam rentang [99.9, 100.1] untuk semua RAB items dengan grandTotal > 0
    - _Requirements: 2.6_

  - [ ]* 13.5 Tulis property test untuk aggregation consistency (P3)
    - **Property 3: Aggregation Consistency**
    - **Validates: Requirements 2.2**
    - Test: `monthlyData[B].rencana === weeklyData[lastWeekOfMonthB].rencana` untuk setiap bulan B
    - _Requirements: 2.2_

- [ ] 14. Update `src/utils/exportUtils.ts` — tambah `exportKurvaSPDF`
  - Export interface `KurvaSExportOptions { companyName?, preparedBy?, projectNo? }`
  - Implementasi `exportKurvaSPDF(project, chartData, options?)` menggunakan jsPDF
  - Konten PDF: header proyek (nama, lokasi, tanggal mulai, tanggal selesai, tanggal cetak), grafik Kurva S (sebagai tabel data), tabel rencana vs realisasi per periode, indikator status deviasi
  - Nama file: `KurvaS_{NamaProyek}_{Tanggal}.pdf`
  - _Requirements: 4.2, 4.3, 4.4, 4.5_

  - [ ]* 14.1 Tulis property test untuk data consistency PDF (P4)
    - **Property 4: Data Consistency**
    - **Validates: Requirements 4.2**
    - Test: data tabel PDF identik dengan data tabel UI (nilai rencana dan realisasi per periode)
    - _Requirements: 4.2_

- [ ] 15. Update `src/components/rab/KurvaS.tsx` — enhancement lengkap
  - [ ] 15.1 Tambahkan form input tanggal mulai dan tanggal selesai
    - Tampilkan di bagian atas komponen
    - Validasi: endDate harus setelah startDate; tampilkan error "Tanggal selesai harus setelah tanggal mulai"
    - Jika tanggal belum diisi, tampilkan pesan panduan dan nonaktifkan grafik
    - Simpan ke store via `updateProject({ startDate, endDate })`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 15.2 Tambahkan toggle tampilan Per Minggu / Per Bulan
    - State `viewMode: 'weekly' | 'monthly'`
    - Tombol toggle dengan dua pilihan
    - Gunakan `buildChartData` untuk weekly, `aggregateToMonthly` untuk monthly
    - Label X-axis: "M1", "M2" (weekly) atau "Bln 1", "Bln 2" (monthly)
    - _Requirements: 2.1, 2.3, 2.4_

  - [ ] 15.3 Tambahkan tabel input progress realisasi manual
    - Tabel di bawah grafik: kolom Periode, Rencana (%), Realisasi (%), Deviasi (%)
    - Klik sel Realisasi → aktifkan input inline
    - Validasi: nilai 0–100; peringatan jika lebih kecil dari periode sebelumnya
    - Simpan via `updateProjectProgress(projectId, periodIndex, value)`
    - Indikator visual: ikon berbeda untuk data manual vs DailyLog
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ] 15.4 Tambahkan tombol "Export PDF" dan integrasikan `exportKurvaSPDF`
    - Tombol "Export PDF" di header komponen
    - Panggil `exportKurvaSPDF(project, chartData, options)`
    - Tampilkan error toast jika gagal: "Gagal mengekspor PDF. Silakan coba lagi."
    - _Requirements: 4.1, 4.5, 4.6_

- [ ] 16. Checkpoint — Kurva S Enhancement
  - Pastikan semua test pass. Uji manual: input tanggal, toggle weekly/monthly, input manual progress, export PDF. Tanya user jika ada pertanyaan.


---

## FASE 2 — PENTING (Meningkatkan profesionalisme produk)

---

### Fitur 5: Foto Profil & Edit Profil

- [ ] 17. Update `server/models/User.js` — tambah field `avatarUrl`
  - Tambahkan field `avatarUrl: { type: String, default: null }` ke `UserSchema`
  - _Requirements: Fitur 5_

- [ ] 18. Update `server/controllers/auth.js` — tambah endpoint upload avatar
  - [ ] 18.1 Tambahkan fungsi `uploadAvatar(req, res, next)`
    - Gunakan `multer` middleware untuk handle `multipart/form-data`
    - Validasi: file harus ada, MIME type `image/jpeg|png|webp`, ukuran ≤ 2MB
    - Simpan file ke `server/uploads/avatars/user_{userId}_{timestamp}.{ext}`
    - Update `User.avatarUrl` di DB/mockStorage
    - Return `{ success: true, data: { avatarUrl: '/uploads/avatars/...' } }`
    - Error handling: file > 2MB → 400, MIME tidak valid → 400, server error → 500
    - _Requirements: Fitur 5_

  - [ ] 18.2 Update `getMe()` — sertakan `avatarUrl` dalam response
    - Tambahkan `avatarUrl: user.avatarUrl` ke response data
    - _Requirements: Fitur 5_

- [ ] 19. Update `server/routes/auth.js` — tambah route avatar
  - Tambahkan `router.post('/avatar', protect, uploadAvatar)`
  - Import `uploadAvatar` dari controller
  - _Requirements: Fitur 5_

- [ ] 20. Update `src/store/useStore.ts` — tambah `avatarUrl` dan action
  - Tambahkan field `avatarUrl?: string` ke interface `User`
  - Tambahkan action `updateUserAvatar(avatarUrl: string)` ke interface `AppState`
  - Implementasi: `set(state => ({ user: state.user ? { ...state.user, avatarUrl } : null }))`
  - _Requirements: Fitur 5_

- [ ] 21. Update `src/services/api.ts` — tambah `uploadAvatar`
  - Tambahkan `uploadAvatar: async (file: File)` ke `authService`
  - Gunakan `FormData` dan header `Content-Type: multipart/form-data`
  - Return `AvatarUploadResponse`
  - _Requirements: Fitur 5_

- [ ] 22. Update `src/components/common/UserProfileModal.tsx` — avatar upload
  - Tambahkan `input[type=file]` tersembunyi dengan tombol kamera di atas avatar
  - Validasi client-side: size ≤ 2MB, type `image/*`; tampilkan toast error jika tidak valid
  - Panggil `authService.uploadAvatar(file)` → `updateUserAvatar(avatarUrl)`
  - Preview avatar baru secara langsung setelah upload berhasil
  - _Requirements: Fitur 5_

- [ ] 23. Update `src/components/common/Navbar.tsx` — tampilkan avatar
  - Implementasi `getAvatarSrc(user)`: cek `user.avatarUrl` → fallback `localStorage.getItem('sivilize_avatar')` → fallback initial huruf
  - Tampilkan `<img>` jika ada avatarUrl, fallback ke div dengan initial huruf
  - _Requirements: Fitur 5_


---

### Fitur 8: Template RAB — Pastikan Integrasi ke RABCalculator

- [ ] 24. Verifikasi dan perbaiki integrasi `RABTemplateManager` ke `RABCalculator`
  - [ ] 24.1 Pastikan `RABTemplateManager` dipanggil dengan props yang benar di `RABCalculator.tsx`
    - Callback `onLoadTemplate(items, financials)` harus replace `rabItems` dan `financialSettings` di state RABCalculator
    - Tampilkan toast sukses "Template berhasil dimuat ke RAB Calculator"
    - _Requirements: Fitur 8_

  - [ ] 24.2 Tambahkan konfirmasi sebelum load template
    - Implementasi fungsi `computeTemplatePreview(template)` yang menghitung `categoryBreakdown`, `grandTotal`, `itemCount`
    - Tampilkan modal konfirmasi dengan: nama template, jumlah item, grand total estimasi, warning "Item RAB saat ini akan diganti"
    - _Requirements: Fitur 8_

  - [ ]* 24.3 Tulis property test untuk round-trip template RAB (P15)
    - **Property 15: Round-Trip Template RAB**
    - **Validates: Fitur 8 — Template RAB**
    - Test: simpan template lalu load kembali menghasilkan items dan settings identik (deep equality)
    - _Requirements: Fitur 8_

  - [ ]* 24.4 Tulis property test untuk preview template info lengkap (P16)
    - **Property 16: Preview Template Mengandung Informasi Lengkap**
    - **Validates: Fitur 8 — Template RAB**
    - Test: setiap template card harus mengandung nama, kategori, jumlah item, dan total estimasi
    - _Requirements: Fitur 8_


---

### Fitur 7: Kalkulator Upah Harian — Integrasi Tab + Export

- [ ] 25. Integrasikan `LaborCalculator` ke tab proyek
  - Cari komponen halaman detail proyek (RABCalculator atau ProjectDetail)
  - Tambahkan tab "Upah TK" ke daftar tab proyek
  - Render `<LaborCalculator projectId={project.id} />` saat tab aktif
  - _Requirements: Fitur 7_

- [ ] 26. Update `src/utils/exportUtils.ts` — tambah `exportLaborToPDF` dan `exportLaborToExcel`
  - [ ] 26.1 Implementasi `exportLaborToPDF(payments, options)`
    - Export interface `LaborExportOptions { projectName, companyName?, period? }`
    - Gunakan jsPDF: header (nama proyek, perusahaan, periode), tabel (minggu | nama pekerja | jabatan | hari | upah/hari | total), footer (total keseluruhan, area tanda tangan mandor)
    - Nama file: `Upah_{NamaProyek}_{Tanggal}.pdf`
    - _Requirements: Fitur 7_

  - [ ] 26.2 Implementasi `exportLaborToExcel(payments, options)`
    - Sheet 1: Rekap per minggu dengan detail pekerja
    - Sheet 2: Rekap per pekerja (pivot — group by nama, sum hari dan total)
    - Nama file: `Upah_{NamaProyek}_{Tanggal}.xlsx`
    - _Requirements: Fitur 7_

  - [ ] 26.3 Implementasi `aggregateLaborByWorker(payments)` — ringkasan per pekerja
    - Group by nama pekerja, sum total hari kerja dan total upah
    - Return `WorkerSummary[]` sorted by totalAmount desc
    - _Requirements: Fitur 7_

  - [ ]* 26.4 Tulis property test untuk kalkulasi total upah (P14)
    - **Property 14: Kalkulasi Total Upah**
    - **Validates: Fitur 7 — Kalkulator Upah Harian**
    - Test: total upah selalu sama dengan `sum(worker.days * worker.dailyWage)` untuk semua kombinasi pekerja
    - _Requirements: Fitur 7_

- [ ] 27. Update `LaborCalculator.tsx` — tambahkan tombol export
  - Tambahkan tombol "Export PDF" dan "Export Excel" di header komponen
  - Panggil `exportLaborToPDF` dan `exportLaborToExcel` dengan data dari store
  - Tampilkan ringkasan per pekerja menggunakan `aggregateLaborByWorker`
  - _Requirements: Fitur 7_


---

### Fitur 6: Versi RAB dengan Perbandingan — RABVersionComparison

- [ ] 28. Buat `src/components/rab/RABVersionComparison.tsx`
  - [ ] 28.1 Implementasi fungsi `computeVersionDiff(versionA, versionB)`
    - Export interface `ComparisonItem { id, category, name, volumeA?, unitPriceA?, totalA?, volumeB?, unitPriceB?, totalB?, totalDiff, diffPercent, status }`
    - Gabungkan semua item names dari kedua versi menggunakan `Set`
    - Tentukan status: `added` (hanya di B), `removed` (hanya di A), `unchanged` (|diff| < 1), `increased` (diff > 0), `decreased` (diff < 0)
    - _Requirements: Fitur 6_

  - [ ] 28.2 Implementasi komponen UI `RABVersionComparison`
    - Props: `{ projectId, versionAId, versionBId, onClose }`
    - Header: "Perbandingan Versi RAB" + tombol tutup
    - Dropdown selector untuk Versi A dan Versi B
    - Summary bar: Grand Total A, Grand Total B, Selisih Total
    - Filter tabs: [Semua] [Naik] [Turun] [Baru] [Dihapus]
    - Tabel dengan color coding: increased=merah, decreased=hijau, added=biru, removed=abu line-through
    - _Requirements: Fitur 6_

  - [ ] 28.3 Integrasikan ke RABCalculator — tombol "Bandingkan Versi"
    - Tampilkan tombol hanya jika `project.versions.length >= 2`
    - State `showComparison`, `selectedVersionA`, `selectedVersionB`
    - Default: versionA = versi pertama, versionB = versi terbaru
    - _Requirements: Fitur 6_

  - [ ]* 28.4 Tulis property test untuk diff konsistensi arah perubahan (P17)
    - **Property 17: Diff Versi RAB — Konsistensi Arah Perubahan**
    - **Validates: Fitur 6 — Versi RAB dengan Perbandingan**
    - Test: jika totalB > totalA maka status = 'increased', jika totalB < totalA maka status = 'decreased', jika sama maka 'unchanged'
    - _Requirements: Fitur 6_


---

### Fitur 10: Backup & Restore

- [ ] 29. Buat `src/utils/backupRestore.ts` — fungsi export dan import data
  - [ ] 29.1 Implementasi `exportAllData(projects, rabTemplates, user)`
    - Export interface `BackupData { version, exportedAt, exportedBy, projects, rabTemplates }`
    - Buat JSON dengan `JSON.stringify(backup, null, 2)`
    - Download via `Blob` + `URL.createObjectURL` + `<a>` click
    - Nama file: `sivilize_backup_{YYYY-MM-DD}.json`
    - _Requirements: Fitur 10_

  - [ ] 29.2 Implementasi `importData(file, existingProjects, existingTemplates, callbacks)`
    - Export interface `ImportResult { success, projectsImported, projectsSkipped, templatesImported, errors }`
    - Validasi format: cek `backup.version` dan `backup.projects` ada
    - Merge strategy: skip project jika ID sudah ada di existing; selalu import template dengan ID baru
    - Return `Promise<ImportResult>`
    - _Requirements: Fitur 10_

  - [ ]* 29.3 Tulis property test untuk backup round-trip (P18)
    - **Property 18: Round-Trip Backup & Restore**
    - **Validates: Fitur 10 — Backup & Restore**
    - Test: export lalu import ke store kosong menghasilkan projects identik
    - _Requirements: Fitur 10_

  - [ ]* 29.4 Tulis property test untuk merge strategy (P19)
    - **Property 19: Merge Strategy Tidak Menghapus Data Existing**
    - **Validates: Fitur 10 — Backup & Restore**
    - Test: setelah import, semua existing projects tetap ada dan imported projects dengan ID baru ditambahkan
    - _Requirements: Fitur 10_

- [ ] 30. Buat `src/components/settings/BackupRestorePanel.tsx`
  - Tombol "Export Semua Data" → panggil `exportAllData(projects, rabTemplates, user)`
  - Input file `accept=".json"` + tombol "Import Data" → panggil `importData(file, ...)`
  - Tampilkan hasil import: toast sukses "X proyek berhasil diimport, Y dilewati" atau toast error
  - Error handling: file bukan JSON → toast error, JSON tidak valid → toast error
  - _Requirements: Fitur 10_

- [ ] 31. Integrasikan `BackupRestorePanel` ke halaman Settings atau UserProfileModal
  - Tambahkan tab "Backup & Restore" di Settings/Profile
  - Render `<BackupRestorePanel />`
  - _Requirements: Fitur 10_


---

### Fitur 9: Share RAB — Backend Endpoint + ShareView Frontend

- [ ] 32. Update `server/models/Project.js` — tambah share fields
  - Tambahkan ke `ProjectSchema`: `shareToken: { type: String, default: null, index: true }`, `shareTokenExpiry: { type: Date, default: null }`, `shareEnabled: { type: Boolean, default: false }`
  - _Requirements: Fitur 9_

- [ ] 33. Buat `server/controllers/share.js` — controller share RAB
  - [ ] 33.1 Implementasi `generateShareLink(req, res, next)`
    - Route: `POST /api/projects/:id/share` (protected)
    - Generate `crypto.randomBytes(16).toString('hex')` sebagai shareToken
    - Hitung `shareTokenExpiry = Date.now() + expiresInDays * 24 * 60 * 60 * 1000` (default 30 hari)
    - Simpan ke project di DB/mockStorage
    - Return `{ shareToken, shareUrl, expiresAt }`
    - _Requirements: Fitur 9_

  - [ ] 33.2 Implementasi `getSharedProject(req, res, next)`
    - Route: `GET /api/share/:token` (public, tanpa auth)
    - Cari project berdasarkan `shareToken` dan cek `shareTokenExpiry > Date.now()`
    - Jika tidak ditemukan atau expired: return 404 "Link tidak valid atau sudah kedaluwarsa"
    - Return data project (read-only): `projectName, location, versions, createdAt, sharedBy`
    - _Requirements: Fitur 9_

  - [ ]* 33.3 Tulis unit test untuk share token uniqueness (P22)
    - **Property 22: Keunikan Share Token**
    - **Validates: Fitur 9 — Share RAB**
    - Test: dua panggilan generate token menghasilkan token yang berbeda
    - _Requirements: Fitur 9_

- [ ] 34. Buat `server/routes/share.js` dan update `server/index.js`
  - Buat `server/routes/share.js`: `router.get('/:token', getSharedProject)`
  - Update `server/routes/auth.js` atau `server/routes/projects.js`: tambahkan route `POST /projects/:id/share`
  - Update `server/index.js`: mount `app.use('/api/share', shareRoutes)`
  - _Requirements: Fitur 9_

- [ ] 35. Update `src/services/api.ts` — tambah share service
  - Tambahkan ke `projectService`: `generateShareLink(projectId, expiresInDays?)` → `POST /projects/:id/share`
  - Tambahkan `getSharedProject(token)` → `GET /share/:token`
  - _Requirements: Fitur 9_

- [ ] 36. Update `src/store/useStore.ts` — tambah share fields ke Project interface
  - Tambahkan ke interface `Project`: `shareToken?: string`, `shareTokenExpiry?: string`, `shareEnabled?: boolean`
  - _Requirements: Fitur 9_

- [ ] 37. Buat `src/pages/ShareView.tsx` — halaman publik read-only
  - [ ] 37.1 Implementasi fetch data dan state management
    - Baca token dari URL params (`/share/:token`)
    - Fetch data via `projectService.getSharedProject(token)` saat mount
    - State: `shareData`, `loading`, `error`
    - Tampilkan loading spinner, error state ("Link tidak valid atau sudah kedaluwarsa"), atau konten
    - _Requirements: Fitur 9_

  - [ ] 37.2 Implementasi UI halaman ShareView
    - Tanpa Navbar/Sidebar (halaman standalone)
    - Header: logo SIVILIZE HUB PRO + badge "Read Only"
    - Project info card: nama proyek, lokasi, dibagikan oleh
    - Version selector jika ada multiple versi
    - Tabel RAB read-only dengan semua item, kategori, volume, harga, total
    - Financial summary: subtotal, overhead, profit, PPN, grand total
    - Footer: "Dibuat dengan SIVILIZE HUB PRO" + CTA "Buat RAB Anda Sendiri"
    - _Requirements: Fitur 9_

- [ ] 38. Integrasikan share button ke RABCalculator
  - Tambahkan tombol "Bagikan RAB" di RABCalculator
  - Panggil `projectService.generateShareLink(project.id)` → copy URL ke clipboard
  - Fallback jika Clipboard API tidak tersedia: tampilkan URL dalam input field
  - Toast sukses "Link berhasil disalin ke clipboard!" atau error "Gagal membuat link. Coba lagi."
  - Update project di store dengan `shareToken` dan `shareEnabled: true`
  - _Requirements: Fitur 9_

- [ ] 39. Update `src/App.tsx` — tambahkan route `/share/:token`
  - Tambahkan route publik (tanpa auth guard) untuk `ShareView`
  - _Requirements: Fitur 9_

- [ ] 40. Checkpoint — Fase 2
  - Pastikan semua test pass. Uji manual: upload avatar, bandingkan versi RAB, export upah, backup/restore, share RAB. Tanya user jika ada pertanyaan.


---

## FASE 3 — NICE TO HAVE (Tandai dengan `*`)

---

### Fitur 11: Laporan Keuangan Proyek

- [ ]* 41. Buat `src/components/financial/FinancialReport.tsx`
  - [ ]* 41.1 Implementasi fungsi `computeFinancialReport(project)`
    - Export interface `CategoryFinancial { category, anggaran, realisasi, sisa, persentase, status }`
    - Export interface `FinancialSummary { totalAnggaran, totalRealisasi, totalSisa, persentaseTerpakai, byCategory }`
    - Hitung anggaran per kategori dari `latestVersion.rabItems`
    - Hitung realisasi per kategori dari `project.costRealizations`
    - Status: `aman` (<80%), `warning` (80-100%), `over` (>100%)
    - _Requirements: Fitur 11_

  - [ ]* 41.2 Implementasi komponen UI `FinancialReport`
    - Props: `{ projectId: string }`
    - 4 summary cards: Total Anggaran, Total Realisasi, Sisa Anggaran, % Terpakai (progress bar)
    - Recharts `BarChart`: X-axis kategori, Bar biru (anggaran), Bar oranye (realisasi)
    - Tabel detail per kategori dengan color coding (aman=hijau, warning=kuning, over=merah)
    - Tombol "Export Laporan PDF"
    - _Requirements: Fitur 11_

  - [ ]* 41.3 Tulis property test untuk kalkulasi sisa anggaran (P20)
    - **Property 20: Kalkulasi Sisa Anggaran**
    - **Validates: Fitur 11 — Laporan Keuangan**
    - Test: `totalSisa === grandTotal - sum(costRealizations.amount)` untuk semua kombinasi
    - _Requirements: Fitur 11_

- [ ]* 42. Integrasikan `FinancialReport` ke tab proyek
  - Tambahkan tab "Laporan Keuangan" di halaman detail proyek
  - Render `<FinancialReport projectId={project.id} />`
  - _Requirements: Fitur 11_


---

### Fitur 12: Integrasi WhatsApp

- [ ]* 43. Buat `src/utils/whatsappShare.ts` — fungsi generate teks dan buka WA
  - [ ]* 43.1 Implementasi `generateWAText(options)`
    - Export interface `WAShareOptions { projectName, location, grandTotal, categoryBreakdown, versionLabel?, companyName?, preparedBy? }`
    - Generate teks dengan format: judul bold, emoji lokasi, rincian per kategori, total bold, footer SIVILIZE HUB PRO
    - Implementasi `formatCurrencyWA(amount)` menggunakan `Intl.NumberFormat`
    - _Requirements: Fitur 12_

  - [ ]* 43.2 Implementasi `openWhatsApp(text, phoneNumber?)`
    - Encode teks dengan `encodeURIComponent`
    - Buka URL `https://wa.me/?text={encoded}` atau `https://wa.me/{phone}?text={encoded}`
    - Gunakan `window.open(url, '_blank', 'noopener,noreferrer')`
    - _Requirements: Fitur 12_

  - [ ]* 43.3 Tulis property test untuk WA URL encoding (P21)
    - **Property 21: WA URL Mengandung Data RAB yang Benar**
    - **Validates: Fitur 12 — Integrasi WhatsApp**
    - Test: URL yang dihasilkan mengandung nama proyek dan total yang ter-encode dengan benar
    - _Requirements: Fitur 12_

- [ ]* 44. Integrasikan tombol "Kirim via WhatsApp" ke `RABPreviewModal` atau `RABCalculator`
  - Tambahkan tombol dengan ikon WhatsApp
  - Panggil `generateWAText` dengan data dari project dan versi terbaru
  - Panggil `openWhatsApp(text)`
  - _Requirements: Fitur 12_


---

### Fitur 14: Multi Bahasa — LanguageContext + Toggle Navbar

- [ ]* 45. Buat `src/contexts/LanguageContext.tsx` — language context
  - Buat `LanguageContext` menggunakan `createContext`
  - `LanguageProvider` component yang wrap `useLanguage()` hook
  - Export `useLanguageContext()` hook dengan error jika digunakan di luar provider
  - _Requirements: Fitur 14_

- [ ]* 46. Update `src/App.tsx` — wrap dengan `LanguageProvider`
  - Import dan wrap seluruh app dengan `<LanguageProvider>`
  - _Requirements: Fitur 14_

- [ ]* 47. Update `src/components/common/Navbar.tsx` — tambah toggle bahasa
  - Import `useLanguageContext`
  - Tambahkan tombol toggle ID/EN dengan ikon Globe (lucide-react)
  - `onClick`: `changeLanguage(language === 'id' ? 'en' : 'id')`
  - _Requirements: Fitur 14_

- [ ]* 48. Update komponen prioritas untuk menggunakan `t()`
  - Update `Navbar.tsx`: nav items, logout button
  - Update `AuthPage.tsx`: label form, tombol submit, pesan error
  - Update `Dashboard.tsx`: judul, tombol buat proyek
  - Update `NotificationPanel.tsx`: judul, tombol mark all read
  - _Requirements: Fitur 14_

- [ ]* 49. Tambahkan translation keys baru ke `src/i18n/translations.ts`
  - Tambahkan section `features` untuk fitur-fitur baru (shareRAB, backup, laborCalc, versionCompare, financialReport, shareViaWA, offlineMode, dll.)
  - Pastikan keys ada di kedua bahasa (id dan en)
  - _Requirements: Fitur 14_

  - [ ]* 49.1 Tulis property test untuk translation key completeness (P23)
    - **Property 23: Translation Key Completeness**
    - **Validates: Fitur 14 — Multi Bahasa**
    - Test: semua key yang ada di `translations.id` juga ada di `translations.en` dan mengembalikan string non-kosong
    - _Requirements: Fitur 14_


---

### Fitur 13: Mode Offline PWA

- [ ]* 50. Install dependensi dan konfigurasi `vite-plugin-pwa`
  - Install: `npm install --save-dev vite-plugin-pwa@0.20.0`
  - Update `vite.config.ts`: import `VitePWA`, tambahkan ke plugins array
  - Konfigurasi manifest: name, short_name, theme_color `#0ea5e9`, background_color `#0a0a0f`, display standalone
  - Konfigurasi workbox: cache-first untuk assets statis, network-first untuk API calls (`/api/.*`), cache-first untuk gambar
  - _Requirements: Fitur 13_

- [ ]* 51. Buat file assets PWA yang diperlukan
  - Buat/tambahkan ke `public/`: `pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png`, `masked-icon.svg`
  - Gunakan logo SIVILIZE HUB PRO yang sudah ada sebagai basis
  - _Requirements: Fitur 13_

- [ ]* 52. Buat `src/hooks/useOnlineStatus.ts` — hook status online/offline
  - State `isOnline = navigator.onLine`
  - Event listeners: `window.addEventListener('online', ...)` dan `window.addEventListener('offline', ...)`
  - Cleanup di return function
  - _Requirements: Fitur 13_

- [ ]* 53. Update `src/components/common/Navbar.tsx` — tampilkan badge "Offline"
  - Import `useOnlineStatus`
  - Tampilkan badge kuning "Offline" jika `!isOnline`
  - _Requirements: Fitur 13_

- [ ] 54. Final Checkpoint — Semua Fitur
  - Pastikan semua test pass (unit, property, integration).
  - Verifikasi build production tidak ada error: `npm run build`.
  - Tanya user jika ada pertanyaan sebelum dianggap selesai.


---

## Notes

- Tasks bertanda `*` adalah opsional (Fase 3 dan sub-tasks test) dan bisa dilewati untuk MVP yang lebih cepat
- Sub-tasks test bertanda `*` (property tests dan unit tests) tidak diimplementasi secara otomatis — harus dijalankan manual
- Setiap task mereferensikan requirements spesifik untuk traceability
- Checkpoints memastikan validasi inkremental setelah setiap fase besar
- Property tests menggunakan library `fast-check` (install: `npm install --save-dev fast-check`)
- Urutan implementasi mengikuti dependency: Reset Password → Notifikasi → Preview RAB → Kurva S → Profil → Template → Upah → Versi → Backup → Share → Laporan → WhatsApp → Multi Bahasa → PWA

### Ringkasan Property Tests

| Property | Task | Fitur | Tipe |
|----------|------|-------|------|
| P1: Monotonicity Invariant | 13.3 | Kurva S | Invariant |
| P2: Completeness Invariant | 13.4 | Kurva S | Invariant |
| P3: Aggregation Consistency | 13.5 | Kurva S | Konsistensi |
| P4: Data Consistency PDF | 14.1 | Kurva S Export | Round-trip |
| P5: Preview-Export Consistency | 9.4 | Preview RAB | Round-trip |
| P6: Category Subtotal Consistency | 9.5 | Preview RAB | Invariant |
| P7: No-Duplicate Invariant | 5.3 | Notifikasi | Idempotence |
| P8: Status Filter Invariant | 5.4 | Notifikasi | Invariant |
| P9: Badge Count Invariant | 7.2 | Notifikasi | Invariant |
| P10: Single-Use Token | 2.6 | Reset Password | Invariant |
| P11: Rate Limit Boundary | 2.4 | Reset Password | Edge Case |
| P12: Expiry Invariant | 2.5 | Reset Password | Edge Case |
| P13: Missing Token Edge Case | 3.4 | Reset Password | Edge Case |
| P14: Kalkulasi Total Upah | 26.4 | Kalkulator Upah | Invariant |
| P15: Round-Trip Template RAB | 24.3 | Template RAB | Round-trip |
| P16: Preview Template Info Lengkap | 24.4 | Template RAB | Invariant |
| P17: Diff Konsistensi Arah | 28.4 | Versi RAB | Invariant |
| P18: Backup Round-Trip | 29.3 | Backup & Restore | Round-trip |
| P19: Merge Strategy | 29.4 | Backup & Restore | Invariant |
| P20: Kalkulasi Sisa Anggaran | 41.3 | Laporan Keuangan | Invariant |
| P21: WA URL Encoding | 43.3 | WhatsApp | Invariant |
| P22: Keunikan Share Token | 33.3 | Share RAB | Invariant |
| P23: Translation Key Completeness | 49.1 | Multi Bahasa | Invariant |
