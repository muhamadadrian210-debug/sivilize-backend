/**
 * Waste Factor Calculator
 * Faktor pemborosan material sesuai standar lapangan Indonesia
 * Referensi: SNI & pengalaman kontraktor
 */

export interface WasteFactor {
  material: string;
  factor: number; // misal 1.10 = 10% waste
  reason: string;
}

// Faktor waste per jenis material
export const WASTE_FACTORS: Record<string, WasteFactor> = {
  'Besi Beton':      { material: 'Besi Beton',      factor: 1.10, reason: 'Potongan & overlap 10%' },
  'Kawat Beton':     { material: 'Kawat Beton',      factor: 1.05, reason: 'Sisa ikatan 5%' },
  'Bata Merah':      { material: 'Bata Merah',       factor: 1.05, reason: 'Pecah & potongan 5%' },
  'Keramik':         { material: 'Keramik',          factor: 1.05, reason: 'Potongan sudut & pecah 5%' },
  'Granit':          { material: 'Granit',           factor: 1.07, reason: 'Potongan & pecah 7%' },
  'Semen PC':        { material: 'Semen PC',         factor: 1.05, reason: 'Tumpah & pengerasan 5%' },
  'Pasir Pasang':    { material: 'Pasir Pasang',     factor: 1.10, reason: 'Susut & tumpah 10%' },
  'Pasir Beton':     { material: 'Pasir Beton',      factor: 1.10, reason: 'Susut & tumpah 10%' },
  'Krikil (Split)':  { material: 'Krikil (Split)',   factor: 1.10, reason: 'Susut & tumpah 10%' },
  'Kayu Kusen':      { material: 'Kayu Kusen',       factor: 1.15, reason: 'Potongan & cacat 15%' },
  'Kayu Bekisting':  { material: 'Kayu Bekisting',   factor: 1.20, reason: 'Pemakaian ulang terbatas 20%' },
  'Kayu Kaso 5/7':   { material: 'Kayu Kaso 5/7',   factor: 1.15, reason: 'Potongan 15%' },
  'Papan Kayu 2/20': { material: 'Papan Kayu 2/20', factor: 1.15, reason: 'Potongan 15%' },
  'Cat Penutup':     { material: 'Cat Penutup',      factor: 1.05, reason: 'Tumpah & sisa kaleng 5%' },
  'Cat Dasar':       { material: 'Cat Dasar',        factor: 1.05, reason: 'Tumpah & sisa kaleng 5%' },
  'Pipa PVC 1/2"':   { material: 'Pipa PVC 1/2"',   factor: 1.10, reason: 'Potongan & sambungan 10%' },
  'Pipa PVC 3"':     { material: 'Pipa PVC 3"',      factor: 1.10, reason: 'Potongan & sambungan 10%' },
  'Kabel NYM 2x1.5mm': { material: 'Kabel NYM 2x1.5mm', factor: 1.10, reason: 'Sisa routing 10%' },
  'Kabel NYM 3x2.5mm': { material: 'Kabel NYM 3x2.5mm', factor: 1.10, reason: 'Sisa routing 10%' },
  'Genteng Beton':   { material: 'Genteng Beton',    factor: 1.05, reason: 'Pecah & potongan 5%' },
  'Baja Ringan C75': { material: 'Baja Ringan C75',  factor: 1.08, reason: 'Potongan & overlap 8%' },
};

/**
 * Hitung volume material dengan waste factor
 */
export const applyWasteFactor = (materialName: string, baseVolume: number): number => {
  const wf = WASTE_FACTORS[materialName];
  if (!wf) return baseVolume;
  return Math.ceil(baseVolume * wf.factor * 100) / 100;
};

/**
 * Hitung total biaya material dengan waste factor
 */
export const calculateMaterialWithWaste = (
  materialName: string,
  baseVolume: number,
  unitPrice: number
): { volume: number; volumeWithWaste: number; cost: number; wasteCost: number; factor: number } => {
  const wf = WASTE_FACTORS[materialName];
  const factor = wf?.factor || 1.0;
  const volumeWithWaste = Math.ceil(baseVolume * factor * 100) / 100;
  const cost = volumeWithWaste * unitPrice;
  const wasteCost = (volumeWithWaste - baseVolume) * unitPrice;
  return { volume: baseVolume, volumeWithWaste, cost, wasteCost, factor };
};

/**
 * Summary waste untuk ditampilkan ke user
 */
export const getWasteSummary = (
  materials: { name: string; volume: number; unitPrice: number }[]
): { totalWasteCost: number; items: { name: string; factor: number; wasteCost: number }[] } => {
  let totalWasteCost = 0;
  const items = materials
    .filter(m => WASTE_FACTORS[m.name])
    .map(m => {
      const { wasteCost, factor } = calculateMaterialWithWaste(m.name, m.volume, m.unitPrice);
      totalWasteCost += wasteCost;
      return { name: m.name, factor, wasteCost };
    });
  return { totalWasteCost, items };
};
