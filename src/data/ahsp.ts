export interface AHSPTemplate {
  id: string;
  category: 'Struktur' | 'Persiapan' | 'Tanah' | 'Dinding' | 'Lantai' | 'Finishing' | 'Atap' | 'Lain-lain';
  name: string;
  unit: string;
  materials: { name: string; coeff: number; unit: string }[];
  // Koefisien tenaga kerja per satuan unit pekerjaan (OH)
  laborCoefficients: { name: string; coeff: number; unit: string }[];
  // Produktivitas default (opsional, bisa di-override user)
  productivity?: number; // units per day per team
}

export const AHSP_TEMPLATES: AHSPTemplate[] = [
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
      { name: 'Besi Beton', coeff: 7.5, unit: 'kg' },
      { name: 'Kawat Beton', coeff: 0.05, unit: 'kg' },
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
    name: 'Penutup Atap Genteng',
    unit: 'm2',
    materials: [
      { name: 'Bata Merah', coeff: 3, unit: 'bh' },
      { name: 'Semen PC', coeff: 1.2, unit: 'kg' },
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
      { name: 'Besi Beton', coeff: 1.5, unit: 'kg' },
      { name: 'Kawat Beton', coeff: 0.02, unit: 'kg' },
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
];
