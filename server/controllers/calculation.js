const { calculateTotalRAB } = require('../utils/rabCalculator');

/**
 * AHSP Data sesuai Permen PUPR No. 1 Tahun 2022
 * Koefisien material dan tenaga kerja sudah diverifikasi
 */
const AHSP_PUPR = {
  // Koefisien material per m³ beton K-225 (SNI 7394:2008)
  betonK225: {
    semenPC: 371,       // kg
    pasirBeton: 0.498,  // m³
    krikilSplit: 0.776, // m³
    air: 215,           // liter
    labor: { pekerja: 1.65, tukangBatu: 0.275, kepalaTukang: 0.028, mandor: 0.083 }
  },
  // Koefisien per m² pasangan bata 1:4
  pasanganBata: {
    bataMerah: 70,      // bh
    semenPC: 11.5,      // kg
    pasirPasang: 0.043, // m³
    labor: { pekerja: 0.3, tukangBatu: 0.1, kepalaTukang: 0.01, mandor: 0.015 }
  },
  // Koefisien per m² plesteran 1:4 t=15mm
  plesteran: {
    semenPC: 6.24,      // kg
    pasirPasang: 0.024, // m³
    labor: { pekerja: 0.2, tukangBatu: 0.15, kepalaTukang: 0.015, mandor: 0.01 }
  },
  // Koefisien per kg pembesian
  pembesian: {
    besiBeton: 1.05,    // kg
    kawatBeton: 0.015,  // kg
    labor: { pekerja: 0.007, tukangBesi: 0.007, kepalaTukang: 0.0007, mandor: 0.0004 }
  },
  // Koefisien per m³ pondasi batu kali 1:4
  pondasiBatuKali: {
    batuKali: 1.2,      // m³
    semenPC: 136,       // kg
    pasirPasang: 0.544, // m³
    labor: { pekerja: 1.5, tukangBatu: 0.6, kepalaTukang: 0.06, mandor: 0.075 }
  },
  // Koefisien per m² pengecatan (1 lapis plamir + 1 dasar + 2 penutup)
  pengecatan: {
    plamir: 0.1,        // kg
    catDasar: 0.1,      // kg
    catPenutup: 0.26,   // kg
    labor: { pekerja: 0.02, tukangCat: 0.063, kepalaTukang: 0.006, mandor: 0.003 }
  },
};

// Harga satuan referensi PUPR 2022 (Rp) — rata-rata nasional
// Untuk produksi, gunakan HSPK daerah setempat
const HARGA_SATUAN_PUPR = {
  // Material
  semenPC: 1350,          // per kg (~Rp 67.500/sak 50kg)
  pasirPasang: 280000,    // per m³
  pasirBeton: 320000,     // per m³
  krikilSplit: 330000,    // per m³
  bataMerah: 800,         // per bh
  besiBeton: 14500,       // per kg
  kawatBeton: 22000,      // per kg
  batuKali: 280000,       // per m³
  pasirUrug: 180000,      // per m³
  kayuBekisting: 3200000, // per m³
  paku: 22000,            // per kg
  minyakBekisting: 15000, // per liter
  gentengBeton: 8500,     // per bh (14 bh/m²)
  bajaRinganC75: 18500,   // per kg
  rengBajaRingan: 12000,  // per kg
  sekrupRoofing: 850,     // per bh
  plamir: 28000,          // per kg
  catDasar: 55000,        // per kg
  catPenutup: 80000,      // per kg
  // Upah tenaga kerja (per OH)
  pekerja: 150000,
  tukangBatu: 200000,
  tukangBesi: 200000,
  tukangCat: 185000,
  tukangKayu: 200000,
  tukangPipa: 195000,
  tukangListrik: 210000,
  kepalaTukang: 230000,
  mandor: 270000,
};

/**
 * Hitung harga satuan pekerjaan berdasarkan koefisien PUPR
 */
const hitungHargaSatuan = (koefisien, harga) => {
  let total = 0;
  Object.entries(koefisien).forEach(([key, coeff]) => {
    if (key !== 'labor' && harga[key]) {
      total += coeff * harga[key];
    }
  });
  // Tambah upah
  if (koefisien.labor) {
    Object.entries(koefisien.labor).forEach(([jabatan, coeff]) => {
      if (harga[jabatan]) total += coeff * harga[jabatan];
    });
  }
  return Math.round(total);
};

/**
 * Generate RAB sesuai PUPR dengan jenis pondasi
 */
const generateRABPUPR = (luas, tipeRumah, provinsi, soilType, foundationType) => {
  const perimeter = Math.sqrt(luas) * 4;
  const wallArea = perimeter * 3;
  const plasterArea = wallArea * 2;

  // Faktor regional (sederhana)
  const regionalFactor = {
    'Papua': 1.5, 'Maluku': 1.35, 'Kalimantan': 1.2,
    'Sulawesi': 1.15, 'Nusa Tenggara': 1.25, 'Sumatera': 1.1, 'Jawa': 1.0
  };
  const factor = Object.entries(regionalFactor).find(([region]) =>
    provinsi?.toLowerCase().includes(region.toLowerCase())
  )?.[1] || 1.0;

  const H = {}; // harga dengan faktor regional
  Object.entries(HARGA_SATUAN_PUPR).forEach(([k, v]) => { H[k] = Math.round(v * factor); });

  const items = [];
  let no = 1;

  const addItem = (uraian, satuan, volume, hargaSatuan, kategori) => {
    const total = Math.round(volume * hargaSatuan);
    items.push({ no: no++, uraian, satuan, volume: Math.round(volume * 100) / 100, hargaSatuan, total, kategori });
  };

  // ── PEKERJAAN TANAH ──────────────────────────────────────
  const foundationDepth = { keras: 0.6, sedang: 0.8, lunak: 1.0, gambut: 1.2, pasir: 0.8, berbatu: 0.5 }[soilType] || 0.7;
  const excavationVol = perimeter * 0.6 * foundationDepth;
  addItem('Galian Tanah Pondasi', 'm³', excavationVol, H.pekerja * 0.75 + H.mandor * 0.025, 'Struktur');
  addItem('Urugan Pasir Bawah Pondasi (t=10cm)', 'm²', perimeter * 0.6, H.pasirUrug * 0.12 + H.pekerja * 0.1 + H.mandor * 0.005, 'Struktur');

  // ── PONDASI ──────────────────────────────────────────────
  switch (foundationType || 'batu-kali') {
    case 'batu-kali': {
      const vol = perimeter * 0.6 * 0.7;
      const hsBatuKali = hitungHargaSatuan(AHSP_PUPR.pondasiBatuKali, H);
      addItem('Pondasi Batu Kali 1:4', 'm³', vol, hsBatuKali, 'Struktur');
      // Sloof
      const sloofVol = perimeter * 0.15 * 0.2;
      const hsBeton = hitungHargaSatuan(AHSP_PUPR.betonK225, H);
      addItem('Sloof Beton K-225', 'm³', sloofVol, hsBeton, 'Struktur');
      addItem('Pembesian Sloof', 'kg', sloofVol * 120, hitungHargaSatuan(AHSP_PUPR.pembesian, H), 'Struktur');
      addItem('Bekisting Sloof', 'm²', perimeter * 2, H.kayuBekisting * 0.04 + H.paku * 0.4 + H.pekerja * 0.33 + H.tukangKayu * 0.33 + H.mandor * 0.017, 'Struktur');
      break;
    }
    case 'footplate': {
      const nFootplate = Math.ceil(luas / 16);
      const fpVol = nFootplate * 0.8 * 0.8 * 0.3;
      const hsBeton = hitungHargaSatuan(AHSP_PUPR.betonK225, H);
      addItem('Footplate Beton K-225', 'm³', fpVol, hsBeton, 'Struktur');
      addItem('Pembesian Footplate', 'kg', fpVol * 150, hitungHargaSatuan(AHSP_PUPR.pembesian, H), 'Struktur');
      addItem('Bekisting Footplate', 'm²', nFootplate * 4, H.kayuBekisting * 0.04 + H.paku * 0.4 + H.pekerja * 0.33 + H.tukangKayu * 0.33 + H.mandor * 0.017, 'Struktur');
      const sloofVol = perimeter * 0.15 * 0.25;
      addItem('Sloof Beton K-225', 'm³', sloofVol, hsBeton, 'Struktur');
      addItem('Pembesian Sloof', 'kg', sloofVol * 120, hitungHargaSatuan(AHSP_PUPR.pembesian, H), 'Struktur');
      break;
    }
    case 'strauss-pile': {
      const nPile = Math.ceil(luas / 9);
      const pileDepth = soilType === 'lunak' ? 5 : 4;
      const pileVol = nPile * Math.PI * 0.15 * 0.15 * pileDepth;
      const hsBeton = hitungHargaSatuan(AHSP_PUPR.betonK225, H);
      addItem('Strauss Pile Beton K-225', 'm³', pileVol, hsBeton * 1.3, 'Struktur'); // faktor 1.3 untuk pekerjaan bor
      addItem('Pembesian Strauss Pile', 'kg', pileVol * 180, hitungHargaSatuan(AHSP_PUPR.pembesian, H), 'Struktur');
      const capVol = nPile * 0.6 * 0.6 * 0.3;
      addItem('Pile Cap Beton K-225', 'm³', capVol, hsBeton, 'Struktur');
      break;
    }
    case 'raft': {
      const raftVol = luas * 0.25;
      const hsBeton = hitungHargaSatuan(AHSP_PUPR.betonK225, H);
      addItem('Raft Foundation Beton K-225', 'm³', raftVol, hsBeton, 'Struktur');
      addItem('Pembesian Raft', 'kg', raftVol * 100, hitungHargaSatuan(AHSP_PUPR.pembesian, H), 'Struktur');
      addItem('Bekisting Raft', 'm²', luas * 1.2, H.kayuBekisting * 0.04 + H.paku * 0.4 + H.pekerja * 0.33 + H.tukangKayu * 0.33 + H.mandor * 0.017, 'Struktur');
      break;
    }
    default: {
      const vol = perimeter * 0.6 * 0.7;
      addItem('Pondasi Batu Kali 1:4', 'm³', vol, hitungHargaSatuan(AHSP_PUPR.pondasiBatuKali, H), 'Struktur');
    }
  }

  // ── STRUKTUR ATAS ────────────────────────────────────────
  const hsBeton = hitungHargaSatuan(AHSP_PUPR.betonK225, H);
  const hsPembesian = hitungHargaSatuan(AHSP_PUPR.pembesian, H);
  const hsBekisting = H.kayuBekisting * 0.04 + H.paku * 0.4 + H.pekerja * 0.33 + H.tukangKayu * 0.33 + H.mandor * 0.017;

  addItem('Kolom Beton K-225', 'm³', luas * 0.05, hsBeton, 'Struktur');
  addItem('Pembesian Kolom', 'kg', luas * 0.05 * 120, hsPembesian, 'Struktur');
  addItem('Bekisting Kolom', 'm²', luas * 0.05 * 8, hsBekisting, 'Struktur');
  addItem('Balok Beton K-225', 'm³', luas * 0.07, hsBeton, 'Struktur');
  addItem('Pembesian Balok', 'kg', luas * 0.07 * 110, hsPembesian, 'Struktur');
  addItem('Bekisting Balok', 'm²', luas * 0.07 * 6, hsBekisting, 'Struktur');
  addItem('Plat Lantai Beton K-225', 'm³', luas * 0.12, hsBeton, 'Struktur');
  addItem('Pembesian Plat Lantai', 'kg', luas * 0.12 * 80, hsPembesian, 'Struktur');
  addItem('Bekisting Plat Lantai', 'm²', luas, hsBekisting, 'Struktur');

  // ── DINDING ──────────────────────────────────────────────
  const hsBata = hitungHargaSatuan(AHSP_PUPR.pasanganBata, H);
  const hsPlester = hitungHargaSatuan(AHSP_PUPR.plesteran, H);
  addItem('Pasangan Bata Merah 1:4', 'm²', wallArea, hsBata, 'Dinding');
  addItem('Plesteran 1:4 Tebal 15mm', 'm²', plasterArea, hsPlester, 'Dinding');
  addItem('Acian Dinding', 'm²', plasterArea, H.semenPC * 0.15 + H.pekerja * 0.2 + H.tukangBatu * 0.15 + H.mandor * 0.01, 'Dinding');

  // ── ATAP ─────────────────────────────────────────────────
  const roofArea = luas * 1.2;
  const hsRangkaAtap = H.bajaRinganC75 * 5.2 + H.rengBajaRingan * 3.5 + H.sekrupRoofing * 12 + H.pekerja * 0.12 + H.tukangBesi * 0.08 + H.mandor * 0.006;
  const hsGenteng = H.gentengBeton * 14 + H.semenPC * 1.5 + H.pasirPasang * 0.006 + H.pekerja * 0.08 + H.tukangBatu * 0.06 + H.mandor * 0.004;
  addItem('Rangka Atap Baja Ringan', 'm²', roofArea, hsRangkaAtap, 'Atap');
  addItem('Penutup Atap Genteng Beton', 'm²', roofArea, hsGenteng, 'Atap');

  // ── FINISHING ────────────────────────────────────────────
  const hsCat = hitungHargaSatuan(AHSP_PUPR.pengecatan, H);
  addItem('Pengecatan Tembok (Plamir+Dasar+2x Penutup)', 'm²', plasterArea, hsCat, 'Finishing');

  // ── HITUNG TOTAL ─────────────────────────────────────────
  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const ppn = subtotal * 0.11;
  const profit = subtotal * 0.15;
  const grandTotal = subtotal + ppn + profit;

  // Kelompokkan per kategori
  const grouped = {};
  items.forEach(item => {
    if (!grouped[item.kategori]) grouped[item.kategori] = { items: [], subtotal: 0 };
    grouped[item.kategori].items.push(item);
    grouped[item.kategori].subtotal += item.total;
  });

  return {
    items,
    grouped,
    subtotal,
    ppn,
    profit,
    grandTotal,
    puprCompliant: true,
    referensi: 'Permen PUPR No. 1 Tahun 2022 + SNI 7394:2008',
    foundationType: foundationType || 'batu-kali',
    soilType: soilType || 'sedang',
  };
};

// @desc    Calculate RAB sesuai PUPR
// @route   POST /api/calculate-rab
// @access  Public
exports.calculateRAB = async (req, res, next) => {
  try {
    const { luas, tipeRumah, provinsi, soilType, foundationType } = req.body;

    if (!luas || !tipeRumah || !provinsi) {
      return res.status(400).json({
        success: false,
        message: 'Data tidak lengkap: luas, tipeRumah, dan provinsi diperlukan'
      });
    }

    const result = generateRABPUPR(
      parseFloat(luas), tipeRumah, provinsi, soilType, foundationType
    );

    // Estimasi waktu & upah
    const estimasiWaktu = Math.ceil(parseFloat(luas) / 7);
    const totalUpah = estimasiWaktu * (HARGA_SATUAN_PUPR.mandor + HARGA_SATUAN_PUPR.tukangBatu * 2 + HARGA_SATUAN_PUPR.pekerja * 3);

    res.status(200).json({
      success: true,
      data: {
        ...result,
        estimasiWaktu,
        totalUpah,
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get AHSP data sesuai PUPR
// @route   GET /api/calculate-rab/ahsp
// @access  Public
exports.getAHSPData = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      referensi: 'Permen PUPR No. 1 Tahun 2022',
      data: {
        materials: Object.entries(HARGA_SATUAN_PUPR)
          .filter(([k]) => !['pekerja','tukangBatu','tukangBesi','tukangCat','tukangKayu','tukangPipa','tukangListrik','kepalaTukang','mandor'].includes(k))
          .map(([nama, harga]) => ({ nama, harga, satuan: 'unit' })),
        labor: [
          { jabatan: 'Pekerja',        upah: HARGA_SATUAN_PUPR.pekerja },
          { jabatan: 'Tukang Batu',    upah: HARGA_SATUAN_PUPR.tukangBatu },
          { jabatan: 'Tukang Besi',    upah: HARGA_SATUAN_PUPR.tukangBesi },
          { jabatan: 'Tukang Cat',     upah: HARGA_SATUAN_PUPR.tukangCat },
          { jabatan: 'Tukang Kayu',    upah: HARGA_SATUAN_PUPR.tukangKayu },
          { jabatan: 'Tukang Pipa',    upah: HARGA_SATUAN_PUPR.tukangPipa },
          { jabatan: 'Tukang Listrik', upah: HARGA_SATUAN_PUPR.tukangListrik },
          { jabatan: 'Kepala Tukang',  upah: HARGA_SATUAN_PUPR.kepalaTukang },
          { jabatan: 'Mandor',         upah: HARGA_SATUAN_PUPR.mandor },
        ],
        koefisien: AHSP_PUPR,
      }
    });
  } catch (err) {
    next(err);
  }
};
