const { calculateTotalRAB, calculateVolumeFromDimensions } = require('../utils/rabCalculator');

// Frontend RAB Logic - Copy from App.jsx
const classifyKategori = (namaPekerjaan) => {
  if (!namaPekerjaan || typeof namaPekerjaan !== 'string') {
    return 'Lain-lain';
  }

  const namaLower = namaPekerjaan.toLowerCase();
  
  // Struktur
  if (namaLower.includes('galian') || namaLower.includes('tanah') || 
      namaLower.includes('pondasi') || namaLower.includes('batu') || 
      namaLower.includes('beton') || namaLower.includes('besian') || 
      namaLower.includes('pembesian') || namaLower.includes('kolom') || 
      namaLower.includes('balok') || namaLower.includes('sloof') || 
      namaLower.includes('plat') || namaLower.includes('struktur') || 
      namaLower.includes('cor')) {
    return 'Struktur';
  }
  
  // Dinding
  if (namaLower.includes('dinding') || namaLower.includes('bata') || 
      namaLower.includes('plester') || namaLower.includes('plesteran') || 
      namaLower.includes('pasangan') || namaLower.includes('aci') || 
      namaLower.includes('acian') || namaLower.includes('tembok')) {
    return 'Dinding';
  }
  
  // Lantai
  if (namaLower.includes('lantai') || namaLower.includes('keramik') || 
      namaLower.includes('penutup') || namaLower.includes('flooring') || 
      namaLower.includes('granit') || namaLower.includes('marmer') || 
      namaLower.includes('vinyl')) {
    return 'Lantai';
  }
  
  // Finishing
  if (namaLower.includes('cat') || namaLower.includes('pengecatan') || 
      namaLower.includes('finishing') || namaLower.includes('coating') || 
      namaLower.includes('plafond') || namaLower.includes('ceiling') ||
      namaLower.includes('pintu') || namaLower.includes('jendela') || 
      namaLower.includes('kusen') || namaLower.includes('daun') || 
      namaLower.includes('frame') || namaLower.includes('bukaan') ||
      namaLower.includes('atap') || namaLower.includes('genteng') || 
      namaLower.includes('rangka') || namaLower.includes('kayu') || 
      namaLower.includes('talang') || namaLower.includes('roof') ||
      namaLower.includes('air') || namaLower.includes('plumbing') || 
      namaLower.includes('pipa') || namaLower.includes('drainase') || 
      namaLower.includes('sanitair') || namaLower.includes('wastafel') ||
      namaLower.includes('listrik') || namaLower.includes('electrical') || 
      namaLower.includes('kabel') || namaLower.includes('instalasi') || 
      namaLower.includes('lampu') ||
      namaLower.includes('pembersihan') || namaLower.includes('persiapan') || 
      namaLower.includes('pengukuran') || namaLower.includes('penandaan') || 
      namaLower.includes('clearing') || namaLower.includes('setup')) {
    return 'Finishing';
  }
  
  // Default
  return 'Lain-lain';
};

const transformToGrouped = (dataFlat) => {
  if (!Array.isArray(dataFlat)) {
    throw new Error('ERROR: Input harus array, bukan ' + typeof dataFlat);
  }

  const groupedData = {};
  const kategoriList = [
    'Struktur',
    'Dinding',
    'Lantai',
    'Finishing',
    'Lain-lain'
  ];

  kategoriList.forEach(kategori => {
    groupedData[kategori] = {
      kategori: kategori,
      items: [],
      subtotal: 0
    };
  });

  dataFlat.forEach((item, index) => {
    if (!item || !item.uraian) {
      return;
    }

    const kategori = classifyKategori(item.uraian);
    
    const volume = parseFloat(item.volume) || 0;
    const hargaSatuan = parseFloat(item.harga_satuan) || 0;
    const total = volume * hargaSatuan;

    groupedData[kategori].items.push({
      no: groupedData[kategori].items.length + 1,
      uraian: item.uraian,
      volume: volume,
      satuan: item.satuan || 'unit',
      harga_satuan: hargaSatuan,
      total: total
    });

    groupedData[kategori].subtotal += total;
  });

  return groupedData;
};

const hitungSubtotal = (groupedData) => {
  if (!groupedData || typeof groupedData !== 'object') {
    throw new Error('ERROR: Input harus object grouped structure');
  }

  let subtotalPerKategori = {};
  
  Object.keys(groupedData).forEach(kategori => {
    const dataKategori = groupedData[kategori];
    if (!dataKategori.items || !Array.isArray(dataKategori.items)) {
      throw new Error(`ERROR: Kategori ${kategori} tidak memiliki items array`);
    }
    
    subtotalPerKategori[kategori] = dataKategori.items.reduce((sum, item) => {
      return sum + (parseFloat(item.total) || 0);
    }, 0);
    
    dataKategori.subtotal = subtotalPerKategori[kategori];
  });

  return subtotalPerKategori;
};

const hitungGrandTotal = (groupedData) => {
  if (!groupedData || typeof groupedData !== 'object') {
    throw new Error('ERROR: Input harus object grouped structure');
  }

  let grandTotal = 0;
  
  Object.keys(groupedData).forEach(kategori => {
    const dataKategori = groupedData[kategori];
    if (dataKategori.subtotal) {
      grandTotal += parseFloat(dataKategori.subtotal) || 0;
    }
  });

  return grandTotal;
};

const validateGroupedStructure = (groupedData) => {
  const errors = [];

  if (!groupedData || typeof groupedData !== 'object') {
    errors.push('ERROR: Data harus object grouped structure, bukan flat list/array');
  }

  if (Object.keys(groupedData).length === 0) {
    errors.push('ERROR: Tidak ada kategori dalam grouped structure');
  }

  Object.keys(groupedData).forEach(kategori => {
    const data = groupedData[kategori];
    
    if (!data.items || !Array.isArray(data.items)) {
      errors.push(`ERROR: Kategori ${kategori} tidak memiliki items array`);
    }
    
    if (typeof data.subtotal !== 'number') {
      errors.push(`ERROR: Kategori ${kategori} tidak memiliki subtotal valid`);
    }
  });

  const grandTotal = hitungGrandTotal(groupedData);
  if (grandTotal <= 0) {
    errors.push('ERROR: Grand total harus lebih dari 0');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

const generateRABGrouped = (luas, tipeRumah, provinsi) => {
  try {
    const flatData = [
      // Struktur
      { uraian: 'Galian Tanah untuk Pondasi', volume: luas * 0.3, satuan: 'm³', harga_satuan: 75000 },
      { uraian: 'Urugan Pasir', volume: luas * 0.2, satuan: 'm³', harga_satuan: 45000 },
      { uraian: 'Pemadatan Tanah', volume: luas * 0.3, satuan: 'm³', harga_satuan: 35000 },
      { uraian: 'Pondasi Batu Kosong', volume: luas * 0.15, satuan: 'm³', harga_satuan: 85000 },
      { uraian: 'Sloof Beton Bertulang', volume: luas * 0.05, satuan: 'm³', harga_satuan: 90000 },
      { uraian: 'Kolom Beton Bertulang', volume: luas * 0.08, satuan: 'm³', harga_satuan: 95000 },
      { uraian: 'Balok Beton Bertulang', volume: luas * 0.12, satuan: 'm³', harga_satuan: 90000 },
      { uraian: 'Plat Lantai Beton', volume: luas, satuan: 'm²', harga_satuan: 75000 },
      { uraian: 'Pembesian', volume: luas * 80, satuan: 'kg', harga_satuan: 25000 },
      
      // Dinding
      { uraian: 'Pasangan Bata Merah', volume: luas * 3.5, satuan: 'm²', harga_satuan: 65000 },
      { uraian: 'Plesteran Dinding', volume: luas * 3.5, satuan: 'm²', harga_satuan: 40000 },
      { uraian: 'Acian Dinding', volume: luas * 3.5, satuan: 'm²', harga_satuan: 30000 },
      
      // Lantai
      { uraian: 'Keramik Lantai', volume: luas, satuan: 'm²', harga_satuan: 50000 },
      { uraian: 'Granit Lantai', volume: luas * 0.5, satuan: 'm²', harga_satuan: 120000 },
      
      // Finishing
      { uraian: 'Pembersihan Lokasi Proyek', volume: luas * 0.1, satuan: 'm²', harga_satuan: 50000 },
      { uraian: 'Pengecatan Interior', volume: luas * 3.5, satuan: 'm²', harga_satuan: 30000 },
      { uraian: 'Pengecatan Exterior', volume: luas * 2, satuan: 'm²', harga_satuan: 35000 },
      { uraian: 'Cat Plafond', volume: luas, satuan: 'm²', harga_satuan: 25000 },
      { uraian: 'Kusen Pintu Kayu', volume: 2, satuan: 'unit', harga_satuan: 1200000 },
      { uraian: 'Daun Pintu Utama', volume: 2, satuan: 'unit', harga_satuan: 800000 },
      { uraian: 'Kusen Jendela Kayu', volume: 3, satuan: 'unit', harga_satuan: 850000 },
      { uraian: 'Daun Jendela', volume: 3, satuan: 'unit', harga_satuan: 600000 },
      { uraian: 'Rangka Atap Kayu', volume: luas, satuan: 'm²', harga_satuan: 25000 },
      { uraian: 'Penutup Genteng Beton', volume: luas, satuan: 'm²', harga_satuan: 45000 },
      { uraian: 'Talang Beton', volume: luas * 0.5, satuan: 'm', harga_satuan: 35000 },
      { uraian: 'Instalasi Air Bersih', volume: luas * 0.1, satuan: 'm', harga_satuan: 30000 },
      { uraian: 'Instalasi Air Kotor', volume: luas * 0.1, satuan: 'm', harga_satuan: 35000 },
      { uraian: 'Instalasi Listrik', volume: 5, satuan: 'titik', harga_satuan: 55000 }
    ];

    const groupedData = transformToGrouped(flatData);
    hitungSubtotal(groupedData);
    const grandTotal = hitungGrandTotal(groupedData);
    
    const validation = validateGroupedStructure(groupedData);
    if (!validation.isValid) {
      throw new Error('ERROR: Grouped structure validation failed: ' + validation.errors.join(', '));
    }

    return {
      groupedRAB: groupedData,
      grandTotal: grandTotal,
      totalPPN: grandTotal * 0.11,
      totalProfit: grandTotal * 0.15,
      grandTotalFinal: grandTotal * 1.31,
      validation: validation
    };

  } catch (error) {
    throw new Error('ERROR: Gagal generate RAB dengan grouped structure - ' + error.message);
  }
};

// @desc    Calculate RAB with Grouped Structure
// @route   POST /api/calculate-rab
// @access  Public (no auth required for demo)
exports.calculateRAB = async (req, res, next) => {
  try {
    const { luas, tipeRumah, provinsi } = req.body;

    if (!luas || !tipeRumah || !provinsi) {
      return res.status(400).json({
        success: false,
        message: 'Data tidak lengkap: luas, tipeRumah, dan provinsi diperlukan'
      });
    }

    const rabGrouped = generateRABGrouped(parseFloat(luas), tipeRumah, provinsi);

    // Calculate estimasi waktu dan upah
    const estimasiWaktu = Math.ceil(parseFloat(luas) / 7); // 7m² per hari
    const upahMandor = estimasiWaktu * 150000; // Rp 150k/hari
    const upahTukang = estimasiWaktu * 2 * 120000; // 2 tukang @ Rp 120k/hari
    const upahKenek = estimasiWaktu * 2 * 80000; // 2 kenek @ Rp 80k/hari
    const totalUpah = upahMandor + upahTukang + upahKenek;

    res.status(200).json({
      success: true,
      data: {
        ...rabGrouped,
        estimasiWaktu,
        totalUpah,
        detailUpah: {
          mandor: upahMandor,
          tukang: upahTukang,
          kenek: upahKenek
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get AHSP data
// @route   GET /api/calculate-rab/ahsp
// @access  Public
exports.getAHSPData = async (req, res, next) => {
  try {
    // Return sample AHSP data
    const ahspData = {
      materials: [
        { nama: 'Semen', satuan: 'sak', harga: 75000 },
        { nama: 'Pasir', satuan: 'm³', harga: 120000 },
        { nama: 'Batu', satuan: 'm³', harga: 180000 },
        { nama: 'Besi', satuan: 'kg', harga: 25000 },
        { nama: 'Kayu', satuan: 'm³', harga: 2500000 }
      ],
      labor: [
        { jabatan: 'Mandor', upah: 150000 },
        { jabatan: 'Tukang Batu', upah: 120000 },
        { jabatan: 'Tukang Kayu', upah: 120000 },
        { jabatan: 'Kenek', upah: 80000 }
      ]
    };

    res.status(200).json({
      success: true,
      data: ahspData
    });
  } catch (err) {
    next(err);
  }
};
