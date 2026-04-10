export interface AHSPTemplate {
  id: string;
  category: 'Struktur' | 'Persiapan' | 'Tanah' | 'Dinding' | 'Lantai' | 'Finishing' | 'Atap' | 'Arsitektur' | 'Mekanikal' | 'Elektrikal' | 'Sanitasi' | 'Lain-lain';
  name: string;
  unit: string;
  materials: { name: string; coeff: number; unit: string }[];
  // Koefisien tenaga kerja per satuan unit pekerjaan (OH)
  laborCoefficients: { name: string; coeff: number; unit: string }[];
  // Produktivitas default (opsional, bisa di-override user)
  productivity?: number; // units per day per team
}

export const AHSP_TEMPLATES: AHSPTemplate[] = [
  // ══════════════════════════════════════════════════════════
  // PEKERJAAN PERSIAPAN — wajib ada di setiap RAB kontraktor
  // ══════════════════════════════════════════════════════════
  {
    id: 'per-001',
    category: 'Persiapan',
    name: 'Pembersihan Lokasi & Perataan Tanah',
    unit: 'm2',
    materials: [],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 0.1, unit: 'OH' },
      { name: 'Mandor', coeff: 0.005, unit: 'OH' },
    ],
    productivity: 50,
  },
  {
    id: 'per-002',
    category: 'Persiapan',
    name: 'Pemasangan Bouwplank (Bowplank)',
    unit: 'm1',
    materials: [
      { name: 'Kayu Kaso 5/7', coeff: 0.012, unit: 'm3' },
      { name: 'Papan Kayu 2/20', coeff: 0.007, unit: 'm3' },
      { name: 'Paku', coeff: 0.1, unit: 'kg' },
    ],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 0.1, unit: 'OH' },
      { name: 'Tukang Kayu', coeff: 0.1, unit: 'OH' },
      { name: 'Kepala Tukang', coeff: 0.01, unit: 'OH' },
      { name: 'Mandor', coeff: 0.005, unit: 'OH' },
    ],
    productivity: 20,
  },
  {
    id: 'per-003',
    category: 'Persiapan',
    name: 'Pembuatan Gudang Bahan & Alat',
    unit: 'm2',
    materials: [
      { name: 'Kayu Kaso 5/7', coeff: 0.02, unit: 'm3' },
      { name: 'Papan Kayu 2/20', coeff: 0.015, unit: 'm3' },
      { name: 'Seng Gelombang', coeff: 1.1, unit: 'm2' },
      { name: 'Paku', coeff: 0.3, unit: 'kg' },
    ],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 0.5, unit: 'OH' },
      { name: 'Tukang Kayu', coeff: 0.5, unit: 'OH' },
      { name: 'Kepala Tukang', coeff: 0.05, unit: 'OH' },
      { name: 'Mandor', coeff: 0.025, unit: 'OH' },
    ],
    productivity: 4,
  },
  {
    id: 'per-004',
    category: 'Persiapan',
    name: 'Pembuatan Direksi Keet (Kantor Lapangan)',
    unit: 'm2',
    materials: [
      { name: 'Kayu Kaso 5/7', coeff: 0.025, unit: 'm3' },
      { name: 'Papan Kayu 2/20', coeff: 0.02, unit: 'm3' },
      { name: 'Seng Gelombang', coeff: 1.1, unit: 'm2' },
      { name: 'Paku', coeff: 0.4, unit: 'kg' },
      { name: 'Kaca Polos 5mm', coeff: 0.1, unit: 'm2' },
    ],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 0.6, unit: 'OH' },
      { name: 'Tukang Kayu', coeff: 0.6, unit: 'OH' },
      { name: 'Kepala Tukang', coeff: 0.06, unit: 'OH' },
      { name: 'Mandor', coeff: 0.03, unit: 'OH' },
    ],
    productivity: 3,
  },
  {
    id: 'per-005',
    category: 'Persiapan',
    name: 'Pengukuran & Pemasangan Patok',
    unit: 'ls',
    materials: [
      { name: 'Kayu Kaso 5/7', coeff: 0.005, unit: 'm3' },
      { name: 'Paku', coeff: 0.05, unit: 'kg' },
      { name: 'Cat Kayu', coeff: 0.1, unit: 'kg' },
    ],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 2.0, unit: 'OH' },
      { name: 'Tukang Kayu', coeff: 1.0, unit: 'OH' },
      { name: 'Mandor', coeff: 0.2, unit: 'OH' },
    ],
    productivity: 1,
  },
  {
    id: 'per-006',
    category: 'Persiapan',
    name: 'Mobilisasi & Demobilisasi Alat',
    unit: 'ls',
    materials: [],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 4.0, unit: 'OH' },
      { name: 'Mandor', coeff: 0.5, unit: 'OH' },
    ],
    productivity: 1,
  },
  {
    id: 'per-007',
    category: 'Persiapan',
    name: 'Pemasangan Papan Nama Proyek',
    unit: 'bh',
    materials: [
      { name: 'Papan Kayu 2/20', coeff: 0.01, unit: 'm3' },
      { name: 'Kayu Kaso 5/7', coeff: 0.008, unit: 'm3' },
      { name: 'Cat Kayu', coeff: 0.5, unit: 'kg' },
      { name: 'Paku', coeff: 0.1, unit: 'kg' },
    ],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 0.5, unit: 'OH' },
      { name: 'Tukang Kayu', coeff: 0.5, unit: 'OH' },
      { name: 'Mandor', coeff: 0.05, unit: 'OH' },
    ],
    productivity: 1,
  },
  {
    id: 'per-008',
    category: 'Persiapan',
    name: 'Penyediaan Air Kerja (Selama Pelaksanaan)',
    unit: 'ls',
    materials: [
      { name: 'Pipa PVC 1/2"', coeff: 10, unit: 'm' },
      { name: 'Fitting PVC', coeff: 5, unit: 'buah' },
    ],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 1.0, unit: 'OH' },
      { name: 'Tukang Pipa', coeff: 1.0, unit: 'OH' },
      { name: 'Mandor', coeff: 0.1, unit: 'OH' },
    ],
    productivity: 1,
  },
  {
    id: 'per-009',
    category: 'Persiapan',
    name: 'Penyediaan Listrik Kerja (Selama Pelaksanaan)',
    unit: 'ls',
    materials: [
      { name: 'Kabel NYM 2x1.5mm', coeff: 20, unit: 'm' },
      { name: 'Stop Kontak', coeff: 3, unit: 'buah' },
      { name: 'MCB 1 Phase', coeff: 1, unit: 'buah' },
    ],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 1.0, unit: 'OH' },
      { name: 'Tukang Listrik', coeff: 1.0, unit: 'OH' },
      { name: 'Mandor', coeff: 0.1, unit: 'OH' },
    ],
    productivity: 1,
  },
  // ══════════════════════════════════════════════════════════
  // K3 — Keselamatan & Kesehatan Kerja (wajib sesuai PP No.50/2012)
  // ══════════════════════════════════════════════════════════
  {
    id: 'k3-001',
    category: 'Persiapan',
    name: 'Perlengkapan K3 (Helm, Rompi, Sepatu Safety)',
    unit: 'set',
    materials: [
      { name: 'Helm Proyek', coeff: 1, unit: 'buah' },
      { name: 'Rompi Safety', coeff: 1, unit: 'buah' },
      { name: 'Sepatu Safety', coeff: 1, unit: 'pasang' },
      { name: 'Sarung Tangan', coeff: 1, unit: 'pasang' },
      { name: 'Kacamata Safety', coeff: 1, unit: 'buah' },
    ],
    laborCoefficients: [],
    productivity: 1,
  },
  {
    id: 'k3-002',
    category: 'Persiapan',
    name: 'Pemasangan Pagar Pengaman Proyek',
    unit: 'm1',
    materials: [
      { name: 'Seng Gelombang', coeff: 0.9, unit: 'm2' },
      { name: 'Kayu Kaso 5/7', coeff: 0.005, unit: 'm3' },
      { name: 'Paku', coeff: 0.1, unit: 'kg' },
    ],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 0.15, unit: 'OH' },
      { name: 'Tukang Kayu', coeff: 0.1, unit: 'OH' },
      { name: 'Mandor', coeff: 0.01, unit: 'OH' },
    ],
    productivity: 15,
  },
  {
    id: 'k3-003',
    category: 'Persiapan',
    name: 'Kotak P3K & Perlengkapan Darurat',
    unit: 'ls',
    materials: [
      { name: 'Kotak P3K', coeff: 1, unit: 'set' },
      { name: 'APAR (Alat Pemadam)', coeff: 1, unit: 'buah' },
    ],
    laborCoefficients: [],
    productivity: 1,
  },
  // STRUKTUR
  {
    id: 'str-001',
    category: 'Struktur',
    name: 'Galian Tanah Pondasi',
    unit: 'm3',
    materials: [],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 0.75, unit: 'OH' },
      { name: 'Mandor', coeff: 0.025, unit: 'OH' },
    ],
    productivity: 1.5,
  },
  {
    id: 'str-000',
    category: 'Struktur',
    name: 'Pondasi Batu Kali 1:4',
    unit: 'm3',
    materials: [
      { name: 'Batu Kali', coeff: 1.2, unit: 'm3' },
      { name: 'Semen PC', coeff: 136, unit: 'kg' },
      { name: 'Pasir Pasang', coeff: 0.544, unit: 'm3' },
    ],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 1.5, unit: 'OH' },
      { name: 'Tukang Batu', coeff: 0.6, unit: 'OH' },
      { name: 'Kepala Tukang', coeff: 0.06, unit: 'OH' },
      { name: 'Mandor', coeff: 0.075, unit: 'OH' },
    ],
    productivity: 0.8,
  },
  {
    id: 'str-004',
    category: 'Struktur',
    name: 'Bekisting Kolom/Balok/Plat',
    unit: 'm2',
    materials: [
      { name: 'Kayu Bekisting', coeff: 0.04, unit: 'm3' },
      { name: 'Paku', coeff: 0.4, unit: 'kg' },
      { name: 'Minyak Bekisting', coeff: 0.2, unit: 'liter' },
    ],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 0.33, unit: 'OH' },
      { name: 'Tukang Kayu', coeff: 0.33, unit: 'OH' },
      { name: 'Kepala Tukang', coeff: 0.033, unit: 'OH' },
      { name: 'Mandor', coeff: 0.017, unit: 'OH' },
    ],
    productivity: 6,
  },
  {
    id: 'str-005',
    category: 'Struktur',
    name: 'Urugan Pasir Bawah Pondasi (t=10cm)',
    unit: 'm2',
    materials: [
      { name: 'Pasir Urug', coeff: 0.12, unit: 'm3' },
    ],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 0.1, unit: 'OH' },
      { name: 'Mandor', coeff: 0.005, unit: 'OH' },
    ],
    productivity: 20,
  },
  {
    id: 'str-002',
    category: 'Struktur',
    name: 'Beton K-225 (Site Mix)',
    unit: 'm3',
    materials: [
      { name: 'Semen PC', coeff: 371, unit: 'kg' },
      { name: 'Pasir Beton', coeff: 0.498, unit: 'm3' },
      { name: 'Krikil (Split)', coeff: 0.776, unit: 'm3' },
      { name: 'Air', coeff: 215, unit: 'liter' },
    ],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 1.65, unit: 'OH' },
      { name: 'Tukang Batu', coeff: 0.275, unit: 'OH' },
      { name: 'Kepala Tukang', coeff: 0.028, unit: 'OH' },
      { name: 'Mandor', coeff: 0.083, unit: 'OH' },
    ],
    productivity: 0.6,
  },
  {
    id: 'str-003',
    category: 'Struktur',
    name: 'Pembesian dengan Besi Polos/Ulir',
    unit: 'kg',
    materials: [
      { name: 'Besi Beton', coeff: 1.05, unit: 'kg' },
      { name: 'Kawat Beton', coeff: 0.015, unit: 'kg' },
    ],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 0.007, unit: 'OH' },
      { name: 'Tukang Besi', coeff: 0.007, unit: 'OH' },
      { name: 'Kepala Tukang', coeff: 0.0007, unit: 'OH' },
      { name: 'Mandor', coeff: 0.0004, unit: 'OH' },
    ],
    productivity: 150,
  },
  // ARSITEKTUR
  {
    id: 'ars-001',
    category: 'Arsitektur',
    name: 'Pasangan Bata Merah 1:4',
    unit: 'm2',
    materials: [
      { name: 'Bata Merah', coeff: 70, unit: 'bh' },
      { name: 'Semen PC', coeff: 11.5, unit: 'kg' },
      { name: 'Pasir Pasang', coeff: 0.043, unit: 'm3' },
    ],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 0.3, unit: 'OH' },
      { name: 'Tukang Batu', coeff: 0.1, unit: 'OH' },
      { name: 'Kepala Tukang', coeff: 0.01, unit: 'OH' },
      { name: 'Mandor', coeff: 0.015, unit: 'OH' },
    ],
    productivity: 10,
  },
  {
    id: 'ars-002',
    category: 'Arsitektur',
    name: 'Plesteran 1:4 Tebal 15mm',
    unit: 'm2',
    materials: [
      { name: 'Semen PC', coeff: 6.24, unit: 'kg' },
      { name: 'Pasir Pasang', coeff: 0.024, unit: 'm3' },
    ],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 0.2, unit: 'OH' },
      { name: 'Tukang Batu', coeff: 0.15, unit: 'OH' },
      { name: 'Kepala Tukang', coeff: 0.015, unit: 'OH' },
      { name: 'Mandor', coeff: 0.01, unit: 'OH' },
    ],
    productivity: 8,
  },
  {
    id: 'ars-003',
    category: 'Arsitektur',
    name: 'Pemasangan Rangka Atap Baja Ringan',
    unit: 'm2',
    materials: [
      { name: 'Baja Ringan C75', coeff: 5.2, unit: 'kg' },
      { name: 'Sekrup Roofing', coeff: 12, unit: 'buah' },
      { name: 'Reng Baja Ringan', coeff: 3.5, unit: 'kg' },
    ],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 0.12, unit: 'OH' },
      { name: 'Tukang Besi', coeff: 0.08, unit: 'OH' },
      { name: 'Kepala Tukang', coeff: 0.008, unit: 'OH' },
      { name: 'Mandor', coeff: 0.006, unit: 'OH' },
    ],
    productivity: 12,
  },
  {
    id: 'ars-004',
    category: 'Arsitektur',
    name: 'Penutup Atap Genteng Beton',
    unit: 'm2',
    materials: [
      { name: 'Genteng Beton', coeff: 14, unit: 'bh' },
      { name: 'Semen PC', coeff: 1.5, unit: 'kg' },
      { name: 'Pasir Pasang', coeff: 0.006, unit: 'm3' },
    ],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 0.08, unit: 'OH' },
      { name: 'Tukang Batu', coeff: 0.06, unit: 'OH' },
      { name: 'Kepala Tukang', coeff: 0.006, unit: 'OH' },
      { name: 'Mandor', coeff: 0.004, unit: 'OH' },
    ],
    productivity: 18,
  },
  {
    id: 'ars-005',
    category: 'Arsitektur',
    name: 'Penutup Atap Spandek/Galvalum',
    unit: 'm2',
    materials: [
      { name: 'Spandek/Galvalum', coeff: 1.05, unit: 'm2' },
      { name: 'Sekrup Roofing', coeff: 8, unit: 'buah' },
      { name: 'Sealant', coeff: 0.05, unit: 'kg' },
    ],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 0.06, unit: 'OH' },
      { name: 'Tukang Besi', coeff: 0.05, unit: 'OH' },
      { name: 'Kepala Tukang', coeff: 0.004, unit: 'OH' },
      { name: 'Mandor', coeff: 0.003, unit: 'OH' },
    ],
    productivity: 24,
  },
  // FINISHING
  {
    id: 'fin-001',
    category: 'Finishing',
    name: 'Pengecatan Tembok Baru (1 Lapis Plamir, 1 Lapis Dasar, 2 Lapis Penutup)',
    unit: 'm2',
    materials: [
      { name: 'Plamir', coeff: 0.1, unit: 'kg' },
      { name: 'Cat Dasar', coeff: 0.1, unit: 'kg' },
      { name: 'Cat Penutup', coeff: 0.26, unit: 'kg' },
    ],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 0.02, unit: 'OH' },
      { name: 'Tukang Cat', coeff: 0.063, unit: 'OH' },
      { name: 'Kepala Tukang', coeff: 0.006, unit: 'OH' },
      { name: 'Mandor', coeff: 0.003, unit: 'OH' },
    ],
    productivity: 25,
  },
  // BUKAAN
  {
    id: 'buk-001',
    category: 'Arsitektur',
    name: 'Kusen + Daun Pintu Kayu (Per Unit)',
    unit: 'unit',
    materials: [
      { name: 'Kayu Kusen', coeff: 0.12, unit: 'm3' },
      { name: 'Daun Pintu Panel', coeff: 1, unit: 'unit' },
      { name: 'Engsel Pintu', coeff: 3, unit: 'buah' },
      { name: 'Kunci Tanam', coeff: 1, unit: 'buah' },
      { name: 'Cat Kayu', coeff: 0.5, unit: 'kg' },
    ],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 0.6, unit: 'OH' },
      { name: 'Tukang Kayu', coeff: 1.2, unit: 'OH' },
      { name: 'Kepala Tukang', coeff: 0.12, unit: 'OH' },
      { name: 'Mandor', coeff: 0.06, unit: 'OH' },
    ],
    productivity: 1,
  },
  {
    id: 'buk-002',
    category: 'Arsitektur',
    name: 'Kusen + Daun Jendela Kayu (Per Unit)',
    unit: 'unit',
    materials: [
      { name: 'Kayu Kusen', coeff: 0.07, unit: 'm3' },
      { name: 'Daun Jendela', coeff: 1, unit: 'unit' },
      { name: 'Engsel Jendela', coeff: 2, unit: 'buah' },
      { name: 'Grendel', coeff: 1, unit: 'buah' },
      { name: 'Kaca Polos 5mm', coeff: 0.6, unit: 'm2' },
      { name: 'Cat Kayu', coeff: 0.3, unit: 'kg' },
    ],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 0.4, unit: 'OH' },
      { name: 'Tukang Kayu', coeff: 0.8, unit: 'OH' },
      { name: 'Kepala Tukang', coeff: 0.08, unit: 'OH' },
      { name: 'Mandor', coeff: 0.04, unit: 'OH' },
    ],
    productivity: 1,
  },
  {
    id: 'buk-003',
    category: 'Arsitektur',
    name: 'Pintu Kamar Mandi (PVC/Aluminium)',
    unit: 'unit',
    materials: [
      { name: 'Kusen Aluminium', coeff: 1, unit: 'set' },
      { name: 'Daun Pintu PVC', coeff: 1, unit: 'unit' },
      { name: 'Engsel', coeff: 2, unit: 'buah' },
      { name: 'Kunci Kamar Mandi', coeff: 1, unit: 'buah' },
    ],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 0.4, unit: 'OH' },
      { name: 'Tukang Kayu', coeff: 0.8, unit: 'OH' },
      { name: 'Kepala Tukang', coeff: 0.08, unit: 'OH' },
      { name: 'Mandor', coeff: 0.04, unit: 'OH' },
    ],
    productivity: 1,
  },
  // MEKANIKAL - PLUMBING
  {
    id: 'mek-001',
    category: 'Mekanikal',
    name: 'Instalasi Pipa Air Bersih PVC (Per Titik)',
    unit: 'titik',
    materials: [
      { name: 'Pipa PVC 1/2"', coeff: 6, unit: 'm' },
      { name: 'Fitting PVC', coeff: 4, unit: 'buah' },
      { name: 'Lem PVC', coeff: 0.1, unit: 'kaleng' },
    ],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 0.5, unit: 'OH' },
      { name: 'Tukang Pipa', coeff: 1.0, unit: 'OH' },
      { name: 'Kepala Tukang', coeff: 0.1, unit: 'OH' },
      { name: 'Mandor', coeff: 0.05, unit: 'OH' },
    ],
    productivity: 3,
  },
  {
    id: 'mek-002',
    category: 'Mekanikal',
    name: 'Instalasi Pipa Air Kotor PVC (Per Titik)',
    unit: 'titik',
    materials: [
      { name: 'Pipa PVC 3"', coeff: 4, unit: 'm' },
      { name: 'Pipa PVC 4"', coeff: 2, unit: 'm' },
      { name: 'Fitting PVC', coeff: 5, unit: 'buah' },
      { name: 'Lem PVC', coeff: 0.15, unit: 'kaleng' },
    ],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 0.6, unit: 'OH' },
      { name: 'Tukang Pipa', coeff: 1.2, unit: 'OH' },
      { name: 'Kepala Tukang', coeff: 0.12, unit: 'OH' },
      { name: 'Mandor', coeff: 0.06, unit: 'OH' },
    ],
    productivity: 2,
  },
  {
    id: 'mek-003',
    category: 'Mekanikal',
    name: 'Instalasi Pipa Air Konsumsi/Minum (Per Titik)',
    unit: 'titik',
    materials: [
      { name: 'Pipa PPR 1/2"', coeff: 5, unit: 'm' },
      { name: 'Fitting PPR', coeff: 4, unit: 'buah' },
    ],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 0.4, unit: 'OH' },
      { name: 'Tukang Pipa', coeff: 0.8, unit: 'OH' },
      { name: 'Kepala Tukang', coeff: 0.08, unit: 'OH' },
      { name: 'Mandor', coeff: 0.04, unit: 'OH' },
    ],
    productivity: 3,
  },
  // SANITASI
  {
    id: 'san-001',
    category: 'Sanitasi',
    name: 'Pemasangan Kloset Duduk (Per Unit)',
    unit: 'unit',
    materials: [
      { name: 'Kloset Duduk', coeff: 1, unit: 'unit' },
      { name: 'Stop Kran', coeff: 1, unit: 'buah' },
      { name: 'Selang Fleksibel', coeff: 1, unit: 'buah' },
      { name: 'Semen PC', coeff: 2, unit: 'kg' },
    ],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 0.5, unit: 'OH' },
      { name: 'Tukang Pipa', coeff: 1.0, unit: 'OH' },
      { name: 'Kepala Tukang', coeff: 0.1, unit: 'OH' },
      { name: 'Mandor', coeff: 0.05, unit: 'OH' },
    ],
    productivity: 2,
  },
  {
    id: 'san-002',
    category: 'Sanitasi',
    name: 'Pemasangan Kloset Jongkok (Per Unit)',
    unit: 'unit',
    materials: [
      { name: 'Kloset Jongkok', coeff: 1, unit: 'unit' },
      { name: 'Semen PC', coeff: 3, unit: 'kg' },
      { name: 'Pasir', coeff: 0.005, unit: 'm3' },
    ],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 0.4, unit: 'OH' },
      { name: 'Tukang Batu', coeff: 0.8, unit: 'OH' },
      { name: 'Kepala Tukang', coeff: 0.08, unit: 'OH' },
      { name: 'Mandor', coeff: 0.04, unit: 'OH' },
    ],
    productivity: 2,
  },
  // ELEKTRIKAL
  {
    id: 'elk-001',
    category: 'Elektrikal',
    name: 'Instalasi Titik Lampu (Per Titik)',
    unit: 'titik',
    materials: [
      { name: 'Kabel NYM 2x1.5mm', coeff: 8, unit: 'm' },
      { name: 'Pipa Conduit', coeff: 4, unit: 'm' },
      { name: 'Fitting Lampu', coeff: 1, unit: 'buah' },
      { name: 'Saklar', coeff: 1, unit: 'buah' },
    ],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 0.3, unit: 'OH' },
      { name: 'Tukang Listrik', coeff: 0.6, unit: 'OH' },
      { name: 'Kepala Tukang', coeff: 0.06, unit: 'OH' },
      { name: 'Mandor', coeff: 0.03, unit: 'OH' },
    ],
    productivity: 4,
  },
  {
    id: 'elk-002',
    category: 'Elektrikal',
    name: 'Instalasi Stop Kontak (Per Titik)',
    unit: 'titik',
    materials: [
      { name: 'Kabel NYM 3x2.5mm', coeff: 8, unit: 'm' },
      { name: 'Pipa Conduit', coeff: 4, unit: 'm' },
      { name: 'Stop Kontak', coeff: 1, unit: 'buah' },
    ],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 0.3, unit: 'OH' },
      { name: 'Tukang Listrik', coeff: 0.6, unit: 'OH' },
      { name: 'Kepala Tukang', coeff: 0.06, unit: 'OH' },
      { name: 'Mandor', coeff: 0.03, unit: 'OH' },
    ],
    productivity: 4,
  },
  {
    id: 'elk-003',
    category: 'Elektrikal',
    name: 'Pemasangan Panel MCB + Instalasi Utama',
    unit: 'unit',
    materials: [
      { name: 'Box Panel MCB', coeff: 1, unit: 'unit' },
      { name: 'MCB 1 Phase', coeff: 6, unit: 'buah' },
      { name: 'Kabel NYY 4x6mm', coeff: 10, unit: 'm' },
    ],
    laborCoefficients: [
      { name: 'Pekerja', coeff: 1.0, unit: 'OH' },
      { name: 'Tukang Listrik', coeff: 2.0, unit: 'OH' },
      { name: 'Kepala Tukang', coeff: 0.2, unit: 'OH' },
      { name: 'Mandor', coeff: 0.1, unit: 'OH' },
    ],
    productivity: 1,
  },
];
