# Requirements Document

## Fitur: Critical Features Launch — SIVILIZE HUB PRO

## Pendahuluan

SIVILIZE HUB PRO adalah platform manajemen proyek konstruksi berbasis web untuk kontraktor Indonesia. Dokumen ini mendefinisikan requirements untuk 4 fitur kritikal yang dibutuhkan sebelum peluncuran penuh:

1. **Kurva S / Progress Chart** — Enhancement komponen yang sudah ada agar bisa digunakan untuk laporan ke owner/bank
2. **Preview Sebelum Cetak RAB** — Modal preview mobile-friendly sebelum export PDF/Excel
3. **Notifikasi Otomatis** — Reminder dan alert berbasis kondisi proyek yang berjalan otomatis
4. **Reset Password via Email** — Integrasi email service nyata untuk alur reset password yang berfungsi di production

Stack teknis: React + TypeScript (frontend), Express.js + MongoDB (backend), deploy di Vercel.

---

## Glosarium

- **KurvaS**: Komponen React (`KurvaS.tsx`) yang menampilkan grafik progress rencana vs realisasi proyek konstruksi dalam bentuk kurva S kumulatif
- **RAB**: Rencana Anggaran Biaya — dokumen estimasi biaya proyek konstruksi
- **RAB_Calculator**: Halaman/fitur di aplikasi untuk menghitung dan mengelola RAB
- **Preview_Modal**: Komponen modal yang menampilkan ringkasan RAB sebelum proses export/download
- **Export_Service**: Modul `exportUtils.ts` yang menangani konversi data RAB ke format PDF dan Excel
- **Notification_Engine**: Modul baru yang bertugas mengevaluasi kondisi proyek dan menghasilkan notifikasi otomatis saat aplikasi dimuat
- **Notification_Panel**: Komponen `NotificationPanel.tsx` yang menampilkan daftar notifikasi kepada pengguna
- **Auth_Controller**: Modul `server/controllers/auth.js` yang menangani autentikasi termasuk reset password
- **Email_Service**: Modul baru di backend yang menangani pengiriman email transaksional menggunakan Nodemailer atau Resend API
- **Reset_Token**: String acak 32-byte (hex) yang digunakan sebagai kredensial satu kali untuk reset password
- **AutoSaveDraft**: Field `autoSaveDraft` pada model `Project` di Zustand store yang menyimpan data RAB yang belum disimpan sebagai versi
- **DailyLog**: Entri harian di proyek yang mencatat progress pekerjaan, termasuk field `progressPercent`
- **Periode**: Satuan waktu dalam Kurva S — bisa berupa minggu atau bulan tergantung mode tampilan yang dipilih
- **Deviasi**: Selisih antara progress realisasi dan progress rencana pada periode yang sama, dinyatakan dalam persen

---

## Requirements

---

### Requirement 1: Input Tanggal dan Konfigurasi Durasi Proyek pada Kurva S

**User Story:** Sebagai kontraktor, saya ingin bisa memasukkan tanggal mulai dan target selesai proyek langsung dari halaman Kurva S, agar grafik progress yang dihasilkan akurat dan bisa digunakan untuk laporan ke owner atau bank.

#### Acceptance Criteria

1. THE KurvaS SHALL menampilkan form input untuk tanggal mulai proyek (`startDate`) dan tanggal target selesai (`endDate`) di bagian atas komponen.
2. WHEN pengguna mengisi dan menyimpan tanggal mulai dan tanggal target selesai, THE KurvaS SHALL menghitung ulang durasi proyek dalam minggu berdasarkan selisih kedua tanggal tersebut.
3. WHEN tanggal mulai atau tanggal target selesai belum diisi, THE KurvaS SHALL menampilkan pesan panduan "Isi tanggal mulai dan target selesai untuk mengaktifkan Kurva S" dan menonaktifkan grafik.
4. IF tanggal target selesai lebih awal dari atau sama dengan tanggal mulai, THEN THE KurvaS SHALL menampilkan pesan error "Tanggal selesai harus setelah tanggal mulai" dan tidak menyimpan perubahan.
5. WHEN pengguna menyimpan tanggal proyek, THE KurvaS SHALL menyimpan nilai `startDate` dan `endDate` ke store Zustand melalui action `updateProject`.

---

### Requirement 2: Toggle Tampilan Per Minggu dan Per Bulan pada Kurva S

**User Story:** Sebagai kontraktor, saya ingin bisa beralih antara tampilan Kurva S per minggu dan per bulan, agar saya bisa menyesuaikan level detail laporan sesuai kebutuhan (laporan mingguan untuk mandor, laporan bulanan untuk bank).

#### Acceptance Criteria

1. THE KurvaS SHALL menampilkan tombol toggle dengan dua pilihan: "Per Minggu" dan "Per Bulan".
2. WHEN pengguna memilih mode "Per Bulan", THE KurvaS SHALL mengagregasi data mingguan menjadi data bulanan dengan cara menjumlahkan nilai rencana dan realisasi dari minggu-minggu yang termasuk dalam bulan yang sama.
3. WHILE mode "Per Bulan" aktif, THE KurvaS SHALL menampilkan label sumbu X dalam format "Bln 1", "Bln 2", dst.
4. WHILE mode "Per Minggu" aktif, THE KurvaS SHALL menampilkan label sumbu X dalam format "M1", "M2", dst.
5. THE KurvaS SHALL memastikan bahwa nilai kumulatif rencana pada setiap periode selalu lebih besar dari atau sama dengan nilai kumulatif rencana pada periode sebelumnya, baik dalam mode minggu maupun bulan.
6. THE KurvaS SHALL memastikan bahwa nilai kumulatif rencana pada periode terakhir selalu sama dengan 100% (dengan toleransi pembulatan ±0.1%).

**Correctness Properties:**
- **Monotonicity Invariant**: Untuk semua indeks `i` dari 1 hingga N, `data[i].rencana >= data[i-1].rencana` harus selalu benar, untuk semua kombinasi RAB items yang valid.
- **Completeness Invariant**: `data[N].rencana` harus selalu berada dalam rentang `[99.9, 100.1]` untuk semua kombinasi RAB items dengan `grandTotal > 0`.
- **Aggregation Consistency**: Untuk setiap bulan B, `monthlyData[B].rencana` harus sama dengan nilai `weeklyData[lastWeekOfMonthB].rencana` (nilai kumulatif akhir bulan = nilai kumulatif minggu terakhir bulan tersebut).

---

### Requirement 3: Input Progress Realisasi Manual per Periode pada Kurva S

**User Story:** Sebagai kontraktor, saya ingin bisa memasukkan progress realisasi secara manual per minggu atau per bulan di Kurva S, agar data realisasi tetap akurat meskipun tidak ada entri di Buku Harian (DailyLog) untuk periode tersebut.

#### Acceptance Criteria

1. THE KurvaS SHALL menampilkan tabel di bawah grafik yang berisi kolom: Periode, Rencana (%), Realisasi (%), dan Deviasi (%).
2. WHEN pengguna mengklik sel Realisasi pada baris periode tertentu di tabel, THE KurvaS SHALL mengaktifkan input inline untuk memasukkan nilai persentase realisasi.
3. WHEN pengguna memasukkan nilai realisasi manual, THE KurvaS SHALL memvalidasi bahwa nilai berada dalam rentang 0–100.
4. IF pengguna memasukkan nilai realisasi yang lebih kecil dari nilai realisasi periode sebelumnya, THEN THE KurvaS SHALL menampilkan peringatan "Realisasi tidak boleh lebih kecil dari periode sebelumnya" namun tetap mengizinkan penyimpanan.
5. WHEN nilai realisasi manual disimpan, THE KurvaS SHALL memperbarui grafik secara langsung (real-time) tanpa perlu reload halaman.
6. THE KurvaS SHALL memprioritaskan data realisasi dari DailyLog jika tersedia untuk periode yang sama; data manual hanya digunakan jika tidak ada DailyLog untuk periode tersebut.
7. THE KurvaS SHALL menampilkan indikator visual (ikon atau warna berbeda) pada sel tabel yang menggunakan data realisasi manual vs data dari DailyLog.

---

### Requirement 4: Export Kurva S ke PDF

**User Story:** Sebagai kontraktor, saya ingin bisa mengekspor Kurva S sebagai file PDF, agar saya bisa melampirkannya dalam laporan progress ke owner atau bank.

#### Acceptance Criteria

1. THE KurvaS SHALL menampilkan tombol "Export PDF" yang terlihat jelas di area header komponen.
2. WHEN pengguna mengklik tombol "Export PDF", THE Export_Service SHALL menghasilkan file PDF yang berisi: judul proyek, grafik Kurva S, dan tabel data rencana vs realisasi per periode.
3. THE Export_Service SHALL menyertakan informasi proyek dalam PDF: nama proyek, lokasi, tanggal mulai, tanggal target selesai, dan tanggal cetak.
4. THE Export_Service SHALL menyertakan indikator status deviasi (terlambat/lebih cepat) dalam PDF.
5. WHEN PDF berhasil di-generate, THE Export_Service SHALL memulai proses download file dengan nama format `KurvaS_{NamaProyek}_{Tanggal}.pdf`.
6. IF proses generate PDF gagal, THEN THE Export_Service SHALL menampilkan pesan error "Gagal mengekspor PDF. Silakan coba lagi." kepada pengguna.

**Correctness Properties:**
- **Data Consistency**: Data yang ditampilkan dalam tabel PDF harus identik dengan data yang ditampilkan di tabel pada UI (nilai rencana dan realisasi per periode harus sama persis).

---

### Requirement 5: Modal Preview RAB Sebelum Download

**User Story:** Sebagai kontraktor yang menggunakan HP, saya ingin melihat ringkasan RAB terlebih dahulu sebelum mengunduh file, agar saya bisa memastikan data sudah benar tanpa harus membuka file yang sudah diunduh.

#### Acceptance Criteria

1. THE RAB_Calculator SHALL menampilkan tombol "Cetak / Export" yang terlihat jelas di halaman RAB Calculator.
2. WHEN pengguna mengklik tombol "Cetak / Export", THE Preview_Modal SHALL terbuka dan menampilkan ringkasan RAB yang mencakup: nama proyek, total RAB (grand total), daftar kategori beserta subtotal masing-masing, dan pengaturan finansial (overhead, profit, PPN).
3. THE Preview_Modal SHALL dapat di-scroll secara vertikal untuk mengakomodasi konten yang panjang di layar mobile.
4. THE Preview_Modal SHALL menampilkan dua tombol aksi: "Download PDF" dan "Download Excel".
5. WHEN pengguna mengklik "Download PDF" atau "Download Excel", THE Preview_Modal SHALL menutup diri dan THE Export_Service SHALL memulai proses export dengan format yang dipilih.
6. THE Preview_Modal SHALL menampilkan form konfigurasi yang dapat diisi sebelum download: nama perusahaan, nama estimator, dan nomor dokumen.
7. WHEN pengguna mengklik di luar area modal atau tombol "Tutup", THE Preview_Modal SHALL menutup diri tanpa memulai proses download.
8. THE Preview_Modal SHALL dapat digunakan dengan nyaman pada layar dengan lebar minimum 320px (ukuran HP kecil).

**Correctness Properties:**
- **Preview-Export Consistency**: Untuk semua kombinasi RAB items yang valid, nilai grand total yang ditampilkan di Preview_Modal harus identik dengan nilai grand total yang tertera dalam file PDF atau Excel yang di-export dari modal yang sama.
- **Category Subtotal Consistency**: Jumlah semua subtotal kategori yang ditampilkan di Preview_Modal harus sama dengan nilai subtotal pekerjaan (sebelum overhead/profit/PPN) yang tertera dalam file export.

---

### Requirement 6: Konfigurasi Dokumen pada Preview RAB

**User Story:** Sebagai kontraktor, saya ingin bisa mengisi nama perusahaan, nama estimator, dan nomor dokumen sebelum mencetak RAB, agar dokumen yang dihasilkan terlihat profesional dan sesuai identitas perusahaan saya.

#### Acceptance Criteria

1. THE Preview_Modal SHALL menampilkan field input untuk: nama perusahaan (default: "SIVILIZE HUB PRO"), nama estimator (default: kosong), dan nomor dokumen (default: auto-generate format `SIV-XXXXXX`).
2. WHEN pengguna mengisi field konfigurasi dan mengklik "Download PDF", THE Export_Service SHALL menyertakan nilai konfigurasi tersebut dalam dokumen PDF yang dihasilkan.
3. WHEN pengguna mengisi field konfigurasi dan mengklik "Download Excel", THE Export_Service SHALL menyertakan nilai konfigurasi tersebut dalam dokumen Excel yang dihasilkan.
4. THE Preview_Modal SHALL menyimpan nilai konfigurasi terakhir yang digunakan ke `localStorage` agar tidak perlu diisi ulang pada sesi berikutnya.
5. IF field nama perusahaan dikosongkan, THEN THE Export_Service SHALL menggunakan nilai default "SIVILIZE HUB PRO" sebagai nama perusahaan dalam dokumen.

---

### Requirement 7: Notifikasi Otomatis — Reminder RAB Belum Disimpan

**User Story:** Sebagai kontraktor, saya ingin mendapat pengingat otomatis jika saya sudah menginput data RAB tapi belum menyimpannya sebagai versi, agar saya tidak kehilangan pekerjaan yang sudah dilakukan.

#### Acceptance Criteria

1. WHEN aplikasi dimuat (login atau refresh), THE Notification_Engine SHALL memeriksa semua proyek milik pengguna yang memiliki field `autoSaveDraft` terisi dan field `autoSavedAt` tidak null.
2. WHEN kondisi pada kriteria 1 terpenuhi untuk sebuah proyek, THE Notification_Engine SHALL membuat notifikasi bertipe `warning` dengan judul "RAB Belum Disimpan" dan pesan yang menyebutkan nama proyek yang bersangkutan.
3. THE Notification_Engine SHALL hanya membuat satu notifikasi per proyek per sesi aplikasi untuk kondisi RAB belum disimpan (tidak duplikat).
4. WHEN pengguna menyimpan RAB sebagai versi baru (action `addVersion`), THE Notification_Engine SHALL menghapus notifikasi "RAB Belum Disimpan" yang terkait dengan proyek tersebut.
5. THE Notification_Engine SHALL menyertakan `projectId` pada notifikasi agar pengguna bisa langsung navigasi ke proyek yang dimaksud.

**Correctness Properties:**
- **No-Duplicate Invariant**: Untuk setiap proyek, jumlah notifikasi aktif bertipe "RAB Belum Disimpan" dalam satu sesi tidak boleh melebihi 1. Menjalankan pengecekan notifikasi dua kali berturut-turut tidak boleh menghasilkan notifikasi duplikat.

---

### Requirement 8: Notifikasi Otomatis — Reminder Proyek Tidak Diupdate

**User Story:** Sebagai kontraktor, saya ingin mendapat pengingat otomatis jika ada proyek yang sedang berjalan tapi tidak ada update progress dalam beberapa hari, agar saya tidak lupa mencatat perkembangan proyek.

#### Acceptance Criteria

1. WHEN aplikasi dimuat, THE Notification_Engine SHALL memeriksa semua proyek dengan status `ongoing`.
2. WHEN sebuah proyek berstatus `ongoing` dan tidak memiliki DailyLog dalam 7 hari terakhir (dihitung dari tanggal hari ini), THE Notification_Engine SHALL membuat notifikasi bertipe `warning` dengan judul "Proyek Tidak Diupdate".
3. THE Notification_Engine SHALL menyertakan nama proyek dan jumlah hari sejak update terakhir dalam pesan notifikasi.
4. THE Notification_Engine SHALL hanya membuat notifikasi "Proyek Tidak Diupdate" untuk proyek berstatus `ongoing`; proyek berstatus `draft` atau `completed` tidak boleh menghasilkan notifikasi ini.
5. THE Notification_Engine SHALL hanya membuat satu notifikasi per proyek per sesi untuk kondisi ini.
6. WHERE konfigurasi threshold hari tersedia, THE Notification_Engine SHALL menggunakan nilai threshold yang dikonfigurasi; jika tidak ada konfigurasi, THE Notification_Engine SHALL menggunakan nilai default 7 hari.

**Correctness Properties:**
- **Status Filter Invariant**: Untuk semua proyek dalam store, notifikasi "Proyek Tidak Diupdate" tidak boleh pernah dibuat untuk proyek dengan status selain `ongoing`. Properti ini harus benar untuk semua kombinasi status proyek yang mungkin.
- **No-Duplicate Invariant**: Menjalankan Notification_Engine dua kali dalam satu sesi tidak boleh menghasilkan lebih dari satu notifikasi "Proyek Tidak Diupdate" per proyek.

---

### Requirement 9: Notifikasi Otomatis — Alert Progress Terlambat

**User Story:** Sebagai kontraktor, saya ingin mendapat notifikasi otomatis jika progress realisasi proyek jauh di bawah rencana, agar saya bisa segera mengambil tindakan korektif sebelum keterlambatan semakin parah.

#### Acceptance Criteria

1. WHEN aplikasi dimuat, THE Notification_Engine SHALL menghitung deviasi progress untuk setiap proyek berstatus `ongoing` yang memiliki data Kurva S (startDate terisi dan ada RAB items).
2. WHEN deviasi progress (rencana - realisasi) pada periode saat ini melebihi 10%, THE Notification_Engine SHALL membuat notifikasi bertipe `error` dengan judul "Progress Terlambat".
3. THE Notification_Engine SHALL menyertakan nama proyek, persentase rencana, persentase realisasi, dan nilai deviasi dalam pesan notifikasi.
4. THE Notification_Engine SHALL hanya membuat satu notifikasi "Progress Terlambat" per proyek per sesi.
5. WHERE konfigurasi threshold deviasi tersedia, THE Notification_Engine SHALL menggunakan nilai threshold yang dikonfigurasi; jika tidak ada konfigurasi, THE Notification_Engine SHALL menggunakan nilai default 10%.
6. IF proyek tidak memiliki data realisasi sama sekali (tidak ada DailyLog dan tidak ada input manual), THEN THE Notification_Engine SHALL tidak membuat notifikasi "Progress Terlambat" untuk proyek tersebut.

---

### Requirement 10: Badge Count Notifikasi di Navbar

**User Story:** Sebagai pengguna, saya ingin melihat jumlah notifikasi yang belum dibaca di ikon notifikasi pada navbar, agar saya tahu ada informasi penting tanpa harus membuka panel notifikasi terlebih dahulu.

#### Acceptance Criteria

1. THE Notification_Panel SHALL menampilkan badge angka di ikon notifikasi pada navbar yang menunjukkan jumlah notifikasi yang belum dibaca (`read: false`).
2. WHEN semua notifikasi sudah dibaca, THE Notification_Panel SHALL menyembunyikan badge (tidak menampilkan angka 0).
3. WHEN pengguna menandai semua notifikasi sebagai dibaca, THE Notification_Panel SHALL memperbarui badge count menjadi 0 secara langsung.
4. THE Notification_Panel SHALL memastikan bahwa nilai badge count selalu sama dengan jumlah notifikasi dalam store yang memiliki `read: false`.

**Correctness Properties:**
- **Badge Count Invariant**: Nilai yang ditampilkan pada badge harus selalu sama dengan `notifications.filter(n => !n.read).length`. Properti ini harus benar setelah setiap operasi: tambah notifikasi, tandai dibaca, tandai semua dibaca, dan hapus semua.

---

### Requirement 11: Integrasi Email Service untuk Reset Password

**User Story:** Sebagai pengguna yang lupa password, saya ingin menerima email berisi link reset password yang berfungsi, agar saya bisa mengakses kembali akun saya tanpa bantuan administrator.

#### Acceptance Criteria

1. WHEN pengguna mengirimkan permintaan reset password dengan email yang terdaftar, THE Auth_Controller SHALL menggunakan THE Email_Service untuk mengirimkan email reset password ke alamat email tersebut.
2. THE Email_Service SHALL mengirimkan email yang berisi: link reset password dengan format `{FRONTEND_URL}/reset-password?token={resetToken}`, nama pengguna, instruksi yang jelas, dan tombol CTA "Reset Password Saya".
3. THE Email_Service SHALL menggunakan template HTML yang profesional dengan elemen: logo/nama aplikasi, judul, instruksi, tombol CTA berwarna, informasi kedaluwarsa token (1 jam), dan footer.
4. WHEN email berhasil dikirim, THE Auth_Controller SHALL mengembalikan respons sukses dengan pesan "Email reset password telah dikirim ke [email]" — bukan pesan ambigu.
5. IF pengiriman email gagal karena error pada Email_Service, THEN THE Auth_Controller SHALL mengembalikan respons error HTTP 500 dengan pesan "Gagal mengirim email. Silakan coba lagi." dan mencatat error ke log server.
6. THE Email_Service SHALL mendukung konfigurasi melalui environment variables: `EMAIL_SERVICE` (nilai: `nodemailer` atau `resend`), `EMAIL_FROM`, dan kredensial yang sesuai.

---

### Requirement 12: Rate Limiting untuk Permintaan Reset Password

**User Story:** Sebagai administrator sistem, saya ingin membatasi jumlah permintaan reset password per email per jam, agar sistem terlindungi dari penyalahgunaan dan serangan brute-force.

#### Acceptance Criteria

1. THE Auth_Controller SHALL membatasi permintaan reset password maksimal 3 kali per alamat email dalam periode 1 jam.
2. WHEN pengguna mengirimkan permintaan reset password ke-4 atau lebih dalam 1 jam untuk email yang sama, THE Auth_Controller SHALL mengembalikan respons HTTP 429 dengan pesan "Terlalu banyak permintaan. Coba lagi dalam [X] menit."
3. THE Auth_Controller SHALL menyertakan informasi waktu tunggu yang tersisa dalam pesan error (dalam satuan menit).
4. THE Auth_Controller SHALL menyimpan data rate limit (jumlah request dan timestamp pertama) di MongoDB atau in-memory store yang persisten selama durasi window.
5. WHEN window 1 jam telah berlalu, THE Auth_Controller SHALL mereset counter rate limit untuk email tersebut secara otomatis.

**Correctness Properties (Edge Case):**
- **Rate Limit Boundary**: Request ke-3 dalam 1 jam harus berhasil (HTTP 200). Request ke-4 dalam 1 jam yang sama harus ditolak (HTTP 429). Ini harus konsisten untuk semua alamat email yang valid.

---

### Requirement 13: Keamanan Token Reset Password

**User Story:** Sebagai pengguna, saya ingin memastikan bahwa link reset password hanya bisa digunakan satu kali dan dalam waktu terbatas, agar akun saya tetap aman meskipun email reset pernah bocor.

#### Acceptance Criteria

1. THE Auth_Controller SHALL menghasilkan Reset_Token baru yang unik (32-byte random hex) setiap kali permintaan reset password diterima.
2. THE Auth_Controller SHALL menetapkan masa berlaku Reset_Token selama 1 jam sejak token dibuat.
3. WHEN pengguna menggunakan Reset_Token yang valid untuk mereset password, THE Auth_Controller SHALL menghapus `resetPasswordToken` dan `resetPasswordExpiry` dari dokumen User di database setelah password berhasil diubah.
4. IF pengguna mencoba menggunakan Reset_Token yang sudah pernah digunakan, THEN THE Auth_Controller SHALL mengembalikan respons HTTP 400 dengan pesan "Token tidak valid atau sudah digunakan."
5. IF pengguna mencoba menggunakan Reset_Token yang sudah kedaluwarsa (lebih dari 1 jam), THEN THE Auth_Controller SHALL mengembalikan respons HTTP 400 dengan pesan "Token sudah kedaluwarsa. Silakan minta link reset baru."
6. THE Auth_Controller SHALL memvalidasi bahwa `newPassword` memiliki panjang minimal 8 karakter sebelum melakukan reset.

**Correctness Properties:**
- **Single-Use Token Invariant**: Setelah Reset_Token digunakan satu kali untuk mereset password, token tersebut tidak boleh bisa digunakan lagi. Percobaan penggunaan kedua harus selalu menghasilkan HTTP 400, untuk semua token yang valid.
- **Expiry Invariant (Edge Case)**: Token yang dibuat tepat 1 jam yang lalu (3600 detik) harus ditolak. Token yang dibuat 3599 detik yang lalu harus diterima (jika belum digunakan).

---

### Requirement 14: Alur Reset Password di Frontend

**User Story:** Sebagai pengguna yang mengklik link reset password dari email, saya ingin langsung diarahkan ke halaman reset password dengan token yang sudah terisi otomatis, agar proses reset berjalan mulus tanpa langkah tambahan yang membingungkan.

#### Acceptance Criteria

1. WHEN pengguna membuka URL dengan format `/reset-password?token={token}`, THE AuthPage SHALL secara otomatis membaca parameter `token` dari URL dan mengaktifkan mode `reset`.
2. WHEN mode `reset` aktif dan token berhasil dibaca dari URL, THE AuthPage SHALL menampilkan form input password baru tanpa meminta pengguna memasukkan token secara manual.
3. IF pengguna membuka halaman `/reset-password` tanpa parameter `token` di URL, THEN THE AuthPage SHALL menampilkan pesan error "Link reset tidak valid. Silakan minta link reset baru." dan menampilkan tombol untuk kembali ke halaman lupa password.
4. WHEN pengguna berhasil mereset password, THE AuthPage SHALL menampilkan pesan sukses "Password berhasil diubah! Anda akan diarahkan ke halaman login." dan melakukan redirect ke mode login setelah 3 detik.
5. IF token sudah kedaluwarsa atau tidak valid (respons HTTP 400 dari backend), THEN THE AuthPage SHALL menampilkan pesan error yang spesifik dari backend dan menawarkan opsi "Minta Link Reset Baru".

**Correctness Properties (Edge Case):**
- **Missing Token Edge Case**: Membuka `/reset-password` tanpa query parameter `token` harus selalu menampilkan pesan error, bukan form reset password yang kosong.
- **Expired Token Edge Case**: Mengirimkan token yang sudah kedaluwarsa ke endpoint reset harus menghasilkan pesan error yang informatif, bukan error generik.

---

## Ringkasan Correctness Properties untuk Property-Based Testing

| # | Fitur | Property | Tipe |
|---|-------|----------|------|
| P1 | Kurva S | Nilai kumulatif rencana monoton naik: `data[i].rencana >= data[i-1].rencana` untuk semua i | Invariant |
| P2 | Kurva S | Nilai kumulatif rencana di periode terakhir berada dalam rentang [99.9, 100.1]% | Invariant |
| P3 | Kurva S | Data agregasi bulanan konsisten dengan data mingguan (nilai akhir bulan = nilai minggu terakhir bulan) | Konsistensi |
| P4 | Kurva S | Data tabel PDF identik dengan data tabel UI | Round-trip |
| P5 | Preview RAB | Grand total di Preview_Modal identik dengan grand total dalam file export | Round-trip |
| P6 | Preview RAB | Jumlah subtotal kategori di preview = subtotal pekerjaan dalam file export | Invariant |
| P7 | Notifikasi | Tidak ada notifikasi duplikat per proyek per sesi (idempotent) | Idempotence |
| P8 | Notifikasi | Notifikasi "Proyek Tidak Diupdate" hanya untuk proyek berstatus `ongoing` | Invariant |
| P9 | Notifikasi | Badge count = `notifications.filter(n => !n.read).length` setelah setiap operasi | Invariant |
| P10 | Reset Password | Token yang sudah digunakan tidak bisa dipakai lagi (single-use) | Invariant |
| P11 | Reset Password | Request ke-3 berhasil, request ke-4 ditolak (rate limit boundary) | Edge Case |
| P12 | Reset Password | Token expired (≥3600 detik) ditolak; token valid (<3600 detik) diterima | Edge Case |
| P13 | Reset Password | Buka `/reset-password` tanpa token selalu menampilkan error | Edge Case |
