export interface CityPrices {
  id: string;
  name: string;
  provinceId: string;
  provinceName: string;
  region: string;
  materials: { [key: string]: number };
  labor: { [key: string]: number };
}

export interface ProvinceOption {
  id: string;
  name: string;
  region: string;
  cities: string[];
}

export type MaterialGrade = 'A' | 'B' | 'C';

// Tipe lokasi proyek â€” menentukan multiplier ongkos angkut
export type LocationType = 'kota' | 'pinggiran' | 'pelosok' | 'sangat-terpencil';

export const LOCATION_TYPE_OPTIONS: { id: LocationType; label: string; multiplier: number; desc: string }[] = [
  { id: 'kota',            label: 'Pusat Kota',        multiplier: 1.00, desc: 'Akses mudah, material tersedia' },
  { id: 'pinggiran',       label: 'Pinggiran Kota',    multiplier: 1.08, desc: 'Jarak 10â€“30km dari pusat kota' },
  { id: 'pelosok',         label: 'Pelosok/Desa',      multiplier: 1.18, desc: 'Jarak >30km, akses terbatas' },
  { id: 'sangat-terpencil',label: 'Sangat Terpencil',  multiplier: 1.35, desc: 'Pulau terpencil, pegunungan, akses sulit' },
];

export const getLocationMultiplier = (locationType: LocationType = 'kota'): number =>
  LOCATION_TYPE_OPTIONS.find(l => l.id === locationType)?.multiplier ?? 1.0;

export interface MaterialTransparency {
  materialName: string;
  brand: string;
  spec: string;
  standardRef: string;
}

export interface RegionalPriceOverride {
  materials?: Record<string, number>;
  labor?: Record<string, number>;
}

// Harga material default (per satuan, harga pasar 2025 Indonesia)
// Referensi: AHSP SNI, Harga Satuan Kota 2025, survey pasar
const defaultMaterials: Record<string, number> = {
  // === STRUKTUR ===
  'Semen PC': 1350,           // per kg (~Rp 67.500/sak 50kg)
  'Pasir Pasang': 280000,     // per mÂ³
  'Pasir Beton': 320000,      // per mÂ³
  'Krikil (Split)': 330000,   // per mÂ³
  'Bata Merah': 800,          // per buah
  'Besi Beton': 14500,        // per kg
  'Kawat Beton': 22000,       // per kg
  'Air': 50,                  // per liter

  // === FINISHING - CAT ===
  'Plamir': 28000,            // per kg
  'Cat Dasar': 55000,         // per kg
  'Cat Penutup': 80000,       // per kg
  'Cat Kayu': 75000,          // per kg

  // === KAYU & KUSEN ===
  'Kayu Kusen': 4500000,      // per mÂ³ (kayu kelas II)
  'Kayu Rangka Atap': 3800000,// per mÂ³

  // === PINTU ===
  'Daun Pintu Panel': 850000, // per unit (pintu panel kayu)
  'Daun Pintu PVC': 650000,   // per unit (pintu PVC kamar mandi)
  'Engsel Pintu': 45000,      // per buah (engsel tanam)
  'Kunci Tanam': 185000,      // per buah (kunci tanam standar)

  // === JENDELA ===
  'Daun Jendela': 350000,     // per unit
  'Engsel Jendela': 35000,    // per buah
  'Grendel': 25000,           // per buah
  'Kaca Polos 5mm': 120000,   // per mÂ²

  // === ALUMINIUM ===
  'Kusen Aluminium': 850000,  // per set (kusen + frame)

  // === KUNCI & AKSESORIS ===
  'Kunci Kamar Mandi': 95000, // per buah

  // === PLUMBING ===
  'Pipa PVC 1/2"': 28000,     // per m
  'Pipa PVC 3"': 55000,       // per m
  'Pipa PVC 4"': 75000,       // per m
  'Pipa PPR 1/2"': 45000,     // per m
  'Fitting PVC': 8500,        // per buah
  'Fitting PPR': 12000,       // per buah
  'Lem PVC': 35000,           // per kaleng
  'Stop Kran': 85000,         // per buah
  'Selang Fleksibel': 55000,  // per buah

  // === SANITASI ===
  'Kloset Duduk': 1250000,    // per unit (standar)
  'Kloset Jongkok': 350000,   // per unit

  // === ELEKTRIKAL ===
  'Kabel NYM 2x1.5mm': 18000, // per m
  'Kabel NYM 3x2.5mm': 28000, // per m
  'Kabel NYY 4x6mm': 85000,   // per m
  'Pipa Conduit': 12000,      // per m
  'Fitting Lampu': 35000,     // per buah
  'Saklar': 45000,            // per buah
  'Stop Kontak': 55000,       // per buah
  'Box Panel MCB': 350000,    // per unit
  'MCB 1 Phase': 85000,       // per buah

  // === ATAP ===
  'Genteng Beton': 8500,      // per buah (~14 buah/mÂ²)
  'Genteng Keramik': 12000,   // per buah
  'Spandek/Galvalum': 85000,  // per mÂ²
  'Baja Ringan C75': 18500,   // per kg
  'Reng Baja Ringan': 12000,  // per kg
  'Sekrup Roofing': 850,      // per buah
  'Sealant': 45000,           // per kg

  // === PONDASI ===
  'Batu Kali': 280000,        // per mÂ³
  'Pasir Urug': 180000,       // per mÂ³

  // === PERSIAPAN ===
  'Kayu Kaso 5/7': 3500000,     // per mÂ³
  'Papan Kayu 2/20': 3200000,   // per mÂ³
  'Seng Gelombang': 85000,      // per mÂ²
  // === K3 ===
  'Helm Proyek': 85000,         // per buah
  'Rompi Safety': 65000,        // per buah
  'Sepatu Safety': 250000,      // per pasang
  'Sarung Tangan': 25000,       // per pasang
  'Kacamata Safety': 35000,     // per buah
  'Kotak P3K': 150000,          // per set
  'APAR (Alat Pemadam)': 350000,// per buah
  'Kayu Bekisting': 3200000,  // per mÂ³ (kayu kelas III)
  'Paku': 22000,              // per kg
  'Minyak Bekisting': 15000,  // per liter
};

// Upah tenaga kerja per OH (Orang Hari) - harga pasar 2025
// Referensi: Standar Harga Konstruksi Kota 2025, survey lapangan
const defaultLabor = {
  'Pekerja': 150000,        // Rp 130.000-170.000/OH
  'Tukang Batu': 200000,    // Rp 180.000-220.000/OH
  'Tukang Besi': 200000,    // Rp 180.000-220.000/OH
  'Tukang Cat': 185000,     // Rp 170.000-200.000/OH
  'Tukang Kayu': 200000,    // Rp 180.000-220.000/OH
  'Tukang Pipa': 195000,    // Rp 180.000-210.000/OH
  'Tukang Listrik': 210000, // Rp 190.000-230.000/OH
  'Kepala Tukang': 230000,  // Rp 210.000-250.000/OH
  'Mandor': 270000,         // Rp 250.000-300.000/OH
};

export const PROVINCES: ProvinceOption[] = [
  { id: 'aceh', name: 'Aceh', region: 'Sumatera', cities: ['Banda Aceh','Sabang','Langsa','Lhokseumawe','Subulussalam','Aceh Besar','Pidie','Pidie Jaya','Bireuen','Aceh Utara','Aceh Timur','Aceh Tamiang','Aceh Tengah','Bener Meriah','Gayo Lues','Aceh Tenggara','Aceh Selatan','Aceh Barat Daya','Nagan Raya','Aceh Barat','Aceh Jaya','Simeulue','Aceh Singkil'] },
  { id: 'sumut', name: 'Sumatera Utara', region: 'Sumatera', cities: ['Medan','Binjai','Tebing Tinggi','Pematangsiantar','Tanjungbalai','Sibolga','Padangsidimpuan','Gunungsitoli','Deli Serdang','Langkat','Karo','Simalungun','Asahan','Labuhanbatu','Labuhanbatu Utara','Labuhanbatu Selatan','Tapanuli Utara','Tapanuli Tengah','Tapanuli Selatan','Mandailing Natal','Padang Lawas','Padang Lawas Utara','Humbang Hasundutan','Toba','Samosir','Dairi','Pakpak Bharat','Nias','Nias Utara','Nias Barat','Nias Selatan','Batubara','Serdang Bedagai'] },
  { id: 'sumbar', name: 'Sumatera Barat', region: 'Sumatera', cities: ['Padang','Solok','Sawahlunto','Padang Panjang','Bukittinggi','Payakumbuh','Pariaman','Agam','Tanah Datar','Lima Puluh Kota','Pasaman','Pasaman Barat','Solok Selatan','Dharmasraya','Sijunjung','Pesisir Selatan','Padang Pariaman','Kepulauan Mentawai'] },
  { id: 'riau', name: 'Riau', region: 'Sumatera', cities: ['Pekanbaru','Dumai','Kampar','Pelalawan','Siak','Bengkalis','Kepulauan Meranti','Rokan Hulu','Rokan Hilir','Indragiri Hulu','Indragiri Hilir','Kuantan Singingi'] },
  { id: 'jambi', name: 'Jambi', region: 'Sumatera', cities: ['Jambi','Sungai Penuh','Batanghari','Muaro Jambi','Tanjung Jabung Barat','Tanjung Jabung Timur','Bungo','Tebo','Sarolangun','Merangin','Kerinci'] },
  { id: 'sumsel', name: 'Sumatera Selatan', region: 'Sumatera', cities: ['Palembang','Prabumulih','Pagar Alam','Lubuklinggau','Ogan Komering Ulu','Ogan Komering Ulu Timur','Ogan Komering Ulu Selatan','Ogan Komering Ilir','Ogan Ilir','Muara Enim','Lahat','Empat Lawang','Musi Banyuasin','Banyuasin','Musi Rawas','Musi Rawas Utara','Penukal Abab Lematang Ilir'] },
  { id: 'bengkulu', name: 'Bengkulu', region: 'Sumatera', cities: ['Bengkulu','Bengkulu Utara','Bengkulu Tengah','Bengkulu Selatan','Rejang Lebong','Kepahiang','Lebong','Mukomuko','Seluma','Kaur'] },
  { id: 'lampung', name: 'Lampung', region: 'Sumatera', cities: ['Bandar Lampung','Metro','Lampung Utara','Lampung Tengah','Lampung Selatan','Lampung Barat','Lampung Timur','Tulang Bawang','Tulang Bawang Barat','Tanggamus','Pringsewu','Pesawaran','Mesuji','Way Kanan','Pesisir Barat'] },
  { id: 'babel', name: 'Kepulauan Bangka Belitung', region: 'Sumatera', cities: ['Pangkalpinang','Bangka','Bangka Barat','Bangka Tengah','Bangka Selatan','Belitung','Belitung Timur'] },
  { id: 'kepri', name: 'Kepulauan Riau', region: 'Sumatera', cities: ['Tanjungpinang','Batam','Bintan','Karimun','Natuna','Lingga','Kepulauan Anambas'] },
  { id: 'jakarta', name: 'DKI Jakarta', region: 'Jawa', cities: ['Jakarta Pusat','Jakarta Utara','Jakarta Barat','Jakarta Selatan','Jakarta Timur','Kepulauan Seribu'] },
  { id: 'jabar', name: 'Jawa Barat', region: 'Jawa', cities: ['Bandung','Bogor','Bekasi','Depok','Cimahi','Tasikmalaya','Banjar','Sukabumi','Cirebon','Bogor (Kab)','Sukabumi (Kab)','Cianjur','Bandung (Kab)','Garut','Tasikmalaya (Kab)','Ciamis','Pangandaran','Kuningan','Cirebon (Kab)','Majalengka','Sumedang','Indramayu','Subang','Purwakarta','Karawang','Bekasi (Kab)','Bandung Barat'] },
  { id: 'jateng', name: 'Jawa Tengah', region: 'Jawa', cities: ['Semarang','Surakarta','Salatiga','Magelang','Pekalongan','Tegal','Cilacap','Banyumas','Purbalingga','Banjarnegara','Kebumen','Purworejo','Wonosobo','Magelang (Kab)','Boyolali','Klaten','Sukoharjo','Wonogiri','Karanganyar','Sragen','Grobogan','Blora','Rembang','Pati','Kudus','Jepara','Demak','Semarang (Kab)','Temanggung','Kendal','Batang','Pekalongan (Kab)','Pemalang','Tegal (Kab)','Brebes'] },
  { id: 'yogyakarta', name: 'DI Yogyakarta', region: 'Jawa', cities: ['Yogyakarta','Bantul','Sleman','Gunungkidul','Kulon Progo'] },
  { id: 'jatim', name: 'Jawa Timur', region: 'Jawa', cities: ['Surabaya','Malang','Batu','Madiun','Kediri','Blitar','Probolinggo','Pasuruan','Mojokerto','Pacitan','Ponorogo','Trenggalek','Tulungagung','Blitar (Kab)','Kediri (Kab)','Malang (Kab)','Lumajang','Jember','Banyuwangi','Bondowoso','Situbondo','Probolinggo (Kab)','Pasuruan (Kab)','Sidoarjo','Mojokerto (Kab)','Jombang','Nganjuk','Madiun (Kab)','Magetan','Ngawi','Bojonegoro','Tuban','Lamongan','Gresik','Bangkalan','Sampang','Pamekasan','Sumenep'] },
  { id: 'banten', name: 'Banten', region: 'Jawa', cities: ['Serang','Cilegon','Tangerang','Tangerang Selatan','Serang (Kab)','Pandeglang','Lebak','Tangerang (Kab)'] },
  { id: 'bali', name: 'Bali', region: 'Nusa Tenggara', cities: ['Denpasar','Badung','Gianyar','Tabanan','Jembrana','Buleleng','Bangli','Klungkung','Karangasem'] },
  { id: 'ntb', name: 'Nusa Tenggara Barat', region: 'Nusa Tenggara', cities: ['Mataram','Bima','Lombok Barat','Lombok Tengah','Lombok Timur','Lombok Utara','Sumbawa','Sumbawa Barat','Dompu','Bima (Kab)'] },
  { id: 'ntt', name: 'Nusa Tenggara Timur', region: 'Nusa Tenggara', cities: ['Kupang','Kupang (Kab)','Timor Tengah Selatan','Timor Tengah Utara','Belu','Malaka','Alor','Flores Timur','Lembata','Sikka','Ende','Ngada','Nagekeo','Manggarai','Manggarai Barat','Manggarai Timur','Sumba Barat','Sumba Barat Daya','Sumba Tengah','Sumba Timur','Sabu Raijua','Rote Ndao'] },
  { id: 'kalbar', name: 'Kalimantan Barat', region: 'Kalimantan', cities: ['Pontianak','Singkawang','Pontianak (Kab)','Kubu Raya','Mempawah','Sambas','Bengkayang','Landak','Sanggau','Sekadau','Sintang','Melawi','Kapuas Hulu','Kayong Utara','Ketapang'] },
  { id: 'kalteng', name: 'Kalimantan Tengah', region: 'Kalimantan', cities: ['Palangka Raya','Kotawaringin Barat','Kotawaringin Timur','Kapuas','Barito Selatan','Barito Utara','Barito Timur','Murung Raya','Pulang Pisau','Gunung Mas','Katingan','Seruyan','Sukamara','Lamandau'] },
  { id: 'kalsel', name: 'Kalimantan Selatan', region: 'Kalimantan', cities: ['Banjarmasin','Banjarbaru','Banjar','Barito Kuala','Tapin','Hulu Sungai Selatan','Hulu Sungai Tengah','Hulu Sungai Utara','Balangan','Tabalong','Tanah Laut','Tanah Bumbu','Kotabaru'] },
  { id: 'kaltim', name: 'Kalimantan Timur', region: 'Kalimantan', cities: ['Samarinda','Balikpapan','Bontang','Kutai Kartanegara','Kutai Barat','Kutai Timur','Berau','Paser','Penajam Paser Utara','Mahakam Ulu'] },
  { id: 'kalut', name: 'Kalimantan Utara', region: 'Kalimantan', cities: ['Tarakan','Bulungan','Malinau','Nunukan','Tana Tidung'] },
  { id: 'sulut', name: 'Sulawesi Utara', region: 'Sulawesi', cities: ['Manado','Bitung','Tomohon','Kotamobagu','Minahasa','Minahasa Utara','Minahasa Selatan','Minahasa Tenggara','Bolaang Mongondow','Bolaang Mongondow Utara','Bolaang Mongondow Selatan','Bolaang Mongondow Timur','Kepulauan Sangihe','Kepulauan Talaud','Kepulauan Siau Tagulandang Biaro'] },
  { id: 'gorontalo', name: 'Gorontalo', region: 'Sulawesi', cities: ['Gorontalo','Gorontalo (Kab)','Boalemo','Pohuwato','Bone Bolango','Gorontalo Utara'] },
  { id: 'sulteng', name: 'Sulawesi Tengah', region: 'Sulawesi', cities: ['Palu','Donggala','Sigi','Parigi Moutong','Poso','Tojo Una-Una','Banggai','Banggai Kepulauan','Banggai Laut','Morowali','Morowali Utara','Tolitoli','Buol'] },
  { id: 'sulbar', name: 'Sulawesi Barat', region: 'Sulawesi', cities: ['Mamuju','Mamuju Tengah','Mamuju Utara','Majene','Polewali Mandar','Mamasa'] },
  { id: 'sulsel', name: 'Sulawesi Selatan', region: 'Sulawesi', cities: ['Makassar','Parepare','Palopo','Gowa','Takalar','Jeneponto','Bantaeng','Bulukumba','Sinjai','Bone','Soppeng','Wajo','Sidrap','Pinrang','Enrekang','Luwu','Luwu Utara','Luwu Timur','Tana Toraja','Toraja Utara','Maros','Pangkep','Barru','Kepulauan Selayar'] },
  { id: 'sultra', name: 'Sulawesi Tenggara', region: 'Sulawesi', cities: ['Kendari','Baubau','Konawe','Konawe Selatan','Konawe Utara','Konawe Kepulauan','Kolaka','Kolaka Utara','Kolaka Timur','Bombana','Buton','Buton Utara','Buton Selatan','Buton Tengah','Muna','Muna Barat','Wakatobi'] },
  { id: 'maluku', name: 'Maluku', region: 'Maluku', cities: ['Ambon','Tual','Maluku Tengah','Maluku Tenggara','Maluku Tenggara Barat','Maluku Barat Daya','Kepulauan Aru','Seram Bagian Barat','Seram Bagian Timur','Buru','Buru Selatan'] },
  { id: 'malut', name: 'Maluku Utara', region: 'Maluku', cities: ['Ternate','Tidore Kepulauan','Halmahera Barat','Halmahera Tengah','Halmahera Utara','Halmahera Selatan','Halmahera Timur','Kepulauan Sula','Pulau Taliabu','Pulau Morotai'] },
  { id: 'papua', name: 'Papua', region: 'Papua', cities: ['Jayapura','Jayapura (Kab)','Keerom','Sarmi','Mamberamo Raya','Biak Numfor','Supiori','Kepulauan Yapen','Waropen'] },
  { id: 'papua-barat', name: 'Papua Barat', region: 'Papua', cities: ['Manokwari','Manokwari Selatan','Pegunungan Arfak','Teluk Bintuni','Teluk Wondama','Fakfak','Kaimana','Sorong Selatan','Raja Ampat'] },
  { id: 'papua-barat-daya', name: 'Papua Barat Daya', region: 'Papua', cities: ['Sorong','Sorong (Kab)','Maybrat','Tambrauw'] },
  { id: 'papua-tengah', name: 'Papua Tengah', region: 'Papua', cities: ['Nabire','Paniai','Mimika','Dogiyai','Intan Jaya','Deiyai','Puncak','Puncak Jaya'] },
  { id: 'papua-pegunungan', name: 'Papua Pegunungan', region: 'Papua', cities: ['Wamena','Jayawijaya','Lanny Jaya','Mamberamo Tengah','Nduga','Pegunungan Bintang','Tolikara','Yahukimo','Yalimo'] },
  { id: 'papua-selatan', name: 'Papua Selatan', region: 'Papua', cities: ['Merauke','Boven Digoel','Mappi','Asmat'] },
];

export const CITIES: CityPrices[] = PROVINCES.flatMap((province) => {
  // Faktor penyesuaian harga per wilayah (biaya logistik & ketersediaan material)
  const regionalFactor: Record<string, { mat: number; lab: number }> = {
    'Jawa':           { mat: 1.00, lab: 1.00 },
    'Sumatera':       { mat: 1.10, lab: 1.05 },
    'Kalimantan':     { mat: 1.20, lab: 1.15 },
    'Sulawesi':       { mat: 1.15, lab: 1.10 },
    'Nusa Tenggara':  { mat: 1.25, lab: 1.15 },
    'Maluku':         { mat: 1.35, lab: 1.20 },
    'Papua':          { mat: 1.50, lab: 1.35 },
  };

  const factor = regionalFactor[province.region] || { mat: 1.10, lab: 1.05 };

  return province.cities.map((cityName, index) => ({
    id: `${province.id}-${index + 1}`,
    name: cityName,
    provinceId: province.id,
    provinceName: province.name,
    region: province.region,
    materials: Object.fromEntries(
      Object.entries(defaultMaterials).map(([k, v]) => [k, Math.round(v * factor.mat)])
    ),
    labor: Object.fromEntries(
      Object.entries(defaultLabor).map(([k, v]) => [k, Math.round(v * factor.lab)])
    ),
  }));
});

export const DEFAULT_PROVINCE_ID = PROVINCES[0]?.id ?? '';
export const DEFAULT_CITY_ID = CITIES[0]?.id ?? '';
export const DEFAULT_MATERIAL_GRADE: MaterialGrade = 'B';

export const MATERIAL_GRADE_OPTIONS: Array<{
  id: MaterialGrade;
  label: string;
  description: string;
}> = [
  { id: 'A', label: 'Grade A (Mewah)', description: 'Material premium, finishing superior, tetap sesuai kaidah struktur.' },
  { id: 'B', label: 'Grade B (Standar)', description: 'Material standar konstruksi harian dengan performa seimbang.' },
  { id: 'C', label: 'Grade C (Super Irit)', description: 'Efisien biaya namun tetap mengutamakan keselamatan dan kekuatan.' },
];

const GRADE_MULTIPLIER: Record<MaterialGrade, number> = {
  A: 1.25,
  B: 1,
  C: 0.9,
};

const MATERIAL_BRANDS_BY_GRADE: Record<MaterialGrade, Record<string, { brand: string; spec: string }>> = {
  A: {
    'Semen PC': { brand: 'Bosowa / Tiga Roda Premium', spec: 'Portland Composite Cement, mutu premium' },
    'Pasir Pasang': { brand: 'Pasir Cilegon Pilihan', spec: 'Ayak halus, kadar lumpur terkontrol' },
    'Pasir Beton': { brand: 'Pasir Beton Lumajang', spec: 'Gradasi baik untuk beton struktural' },
    'Krikil (Split)': { brand: 'Split Andesit 1/2', spec: 'Keras, bersih, sesuai spesifikasi campuran' },
    'Bata Merah': { brand: 'Bata Merah Oven Super', spec: 'Dimensi stabil, serapan air terkendali' },
    'Besi Beton': { brand: 'Krakatau Steel / Master Steel', spec: 'BJTS 420, SNI tulangan beton' },
    'Kawat Beton': { brand: 'Kawat Ikat Premium', spec: 'Diameter konsisten, anti rapuh' },
    'Plamir': { brand: 'Avian / Jotun Plamur', spec: 'Daya rekat tinggi, minim retak rambut' },
    'Cat Dasar': { brand: 'Nippon Vinilex Primer', spec: 'Daya tutup baik, tahan alkali' },
    'Cat Penutup': { brand: 'Dulux / Jotun Premium', spec: 'Ketahanan cuaca dan warna tinggi' },
    'Cat Kayu': { brand: 'Impra / Propan Premium', spec: 'Anti jamur, tahan cuaca' },
    'Air': { brand: 'Air Bersih PDAM/Sumur Uji', spec: 'Tidak mengandung minyak/garam merusak' },
    'Kayu Kusen': { brand: 'Kayu Kamper / Meranti AA', spec: 'Kelas kuat II, kering oven' },
    'Kayu Rangka Atap': { brand: 'Kayu Kamper / Meranti', spec: 'Kelas kuat II, bebas cacat' },
    'Daun Pintu Panel': { brand: 'Pintu Panel Solid Mahoni', spec: 'Kayu solid, finishing halus' },
    'Daun Pintu PVC': { brand: 'Conwood / Seven', spec: 'Anti air, anti rayap' },
    'Engsel Pintu': { brand: 'Dekson / Dorma', spec: 'Stainless steel, anti karat' },
    'Kunci Tanam': { brand: 'Dekson / Yale', spec: 'Kunci tanam 2 putaran, anti buka paksa' },
    'Daun Jendela': { brand: 'Jendela Kayu Solid', spec: 'Kayu kamper, finishing cat' },
    'Engsel Jendela': { brand: 'Dekson Stainless', spec: 'Anti karat, presisi' },
    'Grendel': { brand: 'Dekson / Solid', spec: 'Stainless steel' },
    'Kaca Polos 5mm': { brand: 'Asahimas / Mulia Glass', spec: 'Kaca float 5mm, jernih' },
    'Kusen Aluminium': { brand: 'YKK / Alexindo Premium', spec: 'Profil 4" anodized' },
    'Kunci Kamar Mandi': { brand: 'Dekson / Solid', spec: 'Kunci kamar mandi indicator' },
    'Pipa PVC 1/2"': { brand: 'Wavin / Rucika', spec: 'AW class, SNI' },
    'Pipa PVC 3"': { brand: 'Wavin / Rucika', spec: 'AW class, SNI' },
    'Pipa PVC 4"': { brand: 'Wavin / Rucika', spec: 'AW class, SNI' },
    'Pipa PPR 1/2"': { brand: 'Wavin Tigris / Georg Fischer', spec: 'PN20, food grade' },
    'Fitting PVC': { brand: 'Wavin / Rucika', spec: 'SNI, pressure rated' },
    'Fitting PPR': { brand: 'Wavin Tigris', spec: 'PN20, heat fusion' },
    'Lem PVC': { brand: 'Tangit / Henkel', spec: 'Solvent cement, kuat' },
    'Stop Kran': { brand: 'San-Ei / Onda', spec: 'Brass, anti bocor' },
    'Selang Fleksibel': { brand: 'Onda / San-Ei', spec: 'Stainless braided' },
    'Kloset Duduk': { brand: 'TOTO / American Standard', spec: 'Dual flush, water saving' },
    'Kloset Jongkok': { brand: 'TOTO / Ina', spec: 'Porselen, anti slip' },
    'Kabel NYM 2x1.5mm': { brand: 'Supreme / Kabelindo', spec: 'SNI, 300/500V' },
    'Kabel NYM 3x2.5mm': { brand: 'Supreme / Kabelindo', spec: 'SNI, 300/500V' },
    'Kabel NYY 4x6mm': { brand: 'Supreme / Kabelindo', spec: 'SNI, 0.6/1kV' },
    'Pipa Conduit': { brand: 'Clipsal / Ega', spec: 'PVC conduit, fire retardant' },
    'Fitting Lampu': { brand: 'Broco / Panasonic', spec: 'E27, porcelain' },
    'Saklar': { brand: 'Panasonic / Schneider', spec: 'Flush mount, 10A' },
    'Stop Kontak': { brand: 'Panasonic / Schneider', spec: 'Grounded, 16A' },
    'Box Panel MCB': { brand: 'Schneider / Hager', spec: 'IP40, 12 way' },
    'MCB 1 Phase': { brand: 'Schneider / ABB', spec: '10A-20A, 6kA' },
    'Genteng Beton': { brand: 'Monier / Cisangkan', spec: 'Beton press, anti lumut' },
    'Genteng Keramik': { brand: 'KIA / Kanmuri', spec: 'Glasir, tahan cuaca' },
    'Spandek/Galvalum': { brand: 'BlueScope / Lysaght', spec: 'Zincalume AZ150' },
  },
  B: {
    'Semen PC': { brand: 'Bosowa / Dynamix', spec: 'Portland Composite Cement, mutu standar proyek' },
    'Pasir Pasang': { brand: 'Pasir Pasang Lokal', spec: 'Kadar lumpur dikontrol lapangan' },
    'Pasir Beton': { brand: 'Pasir Beton Lokal', spec: 'Layak untuk campuran beton normal' },
    'Krikil (Split)': { brand: 'Split Lokal 1/2', spec: 'Ukuran seragam, cukup bersih' },
    'Bata Merah': { brand: 'Bata Merah Press', spec: 'Mutu standar pasangan dinding' },
    'Besi Beton': { brand: 'Besi Beton SNI Lokal', spec: 'BJTS 280/420 sesuai kebutuhan desain' },
    'Kawat Beton': { brand: 'Kawat Ikat Galvanis', spec: 'Lentur dan mudah dibentuk' },
    'Plamir': { brand: 'No Drop / Avitex Putty', spec: 'Plamir standar interior-eksterior' },
    'Cat Dasar': { brand: 'Avitex Primer', spec: 'Primer standar dinding' },
    'Cat Penutup': { brand: 'Avitex / Mowilex', spec: 'Finishing standar kualitas baik' },
    'Cat Kayu': { brand: 'Impra / Propan Standar', spec: 'Cat kayu standar' },
    'Air': { brand: 'Air Bersih Lokal', spec: 'Sumber air bersih terkontrol' },
    'Kayu Kusen': { brand: 'Kayu Meranti / Bengkirai', spec: 'Kelas kuat II-III' },
    'Kayu Rangka Atap': { brand: 'Kayu Meranti Lokal', spec: 'Kelas kuat II-III' },
    'Daun Pintu Panel': { brand: 'Pintu Panel Meranti', spec: 'Kayu solid standar' },
    'Daun Pintu PVC': { brand: 'Conwood / Lokal', spec: 'Anti air standar' },
    'Engsel Pintu': { brand: 'Solid / Lokal SNI', spec: 'Besi galvanis, 3 buah/pintu' },
    'Kunci Tanam': { brand: 'Solid / Lokal', spec: 'Kunci tanam standar' },
    'Daun Jendela': { brand: 'Jendela Kayu Meranti', spec: 'Kayu meranti, cat standar' },
    'Engsel Jendela': { brand: 'Solid Standar', spec: 'Besi galvanis' },
    'Grendel': { brand: 'Solid / Lokal', spec: 'Besi galvanis' },
    'Kaca Polos 5mm': { brand: 'Mulia Glass / Lokal', spec: 'Kaca float 5mm' },
    'Kusen Aluminium': { brand: 'Alexindo / Lokal', spec: 'Profil 3" standar' },
    'Kunci Kamar Mandi': { brand: 'Solid / Lokal', spec: 'Kunci kamar mandi standar' },
    'Pipa PVC 1/2"': { brand: 'Rucika / Pralon', spec: 'AW class, SNI' },
    'Pipa PVC 3"': { brand: 'Rucika / Pralon', spec: 'AW class, SNI' },
    'Pipa PVC 4"': { brand: 'Rucika / Pralon', spec: 'AW class, SNI' },
    'Pipa PPR 1/2"': { brand: 'Wavin / Lokal', spec: 'PN16, standar' },
    'Fitting PVC': { brand: 'Rucika / Pralon', spec: 'SNI standar' },
    'Fitting PPR': { brand: 'Wavin / Lokal', spec: 'PN16' },
    'Lem PVC': { brand: 'Tangit / Lokal', spec: 'Solvent cement standar' },
    'Stop Kran': { brand: 'Onda / Lokal', spec: 'Brass standar' },
    'Selang Fleksibel': { brand: 'Onda / Lokal', spec: 'PVC braided' },
    'Kloset Duduk': { brand: 'Ina / INA Sanitasi', spec: 'Dual flush standar' },
    'Kloset Jongkok': { brand: 'Ina / Lokal', spec: 'Porselen standar' },
    'Kabel NYM 2x1.5mm': { brand: 'Eterna / Extrana', spec: 'SNI, 300/500V' },
    'Kabel NYM 3x2.5mm': { brand: 'Eterna / Extrana', spec: 'SNI, 300/500V' },
    'Kabel NYY 4x6mm': { brand: 'Eterna / Extrana', spec: 'SNI, 0.6/1kV' },
    'Pipa Conduit': { brand: 'Ega / Lokal', spec: 'PVC conduit standar' },
    'Fitting Lampu': { brand: 'Broco / Lokal', spec: 'E27 standar' },
    'Saklar': { brand: 'Broco / Lokal', spec: 'Flush mount standar' },
    'Stop Kontak': { brand: 'Broco / Lokal', spec: 'Grounded standar' },
    'Box Panel MCB': { brand: 'Hager / Lokal', spec: 'IP40, 8-12 way' },
    'MCB 1 Phase': { brand: 'Hager / Lokal', spec: '10A-16A standar' },
    'Genteng Beton': { brand: 'Cisangkan / Lokal', spec: 'Beton press standar' },
    'Genteng Keramik': { brand: 'KIA / Lokal', spec: 'Keramik standar' },
    'Spandek/Galvalum': { brand: 'Lokal SNI', spec: 'Zincalume standar' },
  },
  C: {
    'Semen PC': { brand: 'Bosowa Ekonomis / Lokal SNI', spec: 'PCC ekonomis tetap bersertifikat' },
    'Pasir Pasang': { brand: 'Pasir Lokal Ekonomis', spec: 'Disaring ulang sebelum pemakaian' },
    'Pasir Beton': { brand: 'Pasir Beton Lokal Ekonomis', spec: 'Gradasi minimum layak campuran' },
    'Krikil (Split)': { brand: 'Split Lokal Ekonomis', spec: 'Dipilih untuk efisiensi biaya' },
    'Bata Merah': { brand: 'Bata Lokal Pilihan', spec: 'Dipilih yang tidak mudah pecah' },
    'Besi Beton': { brand: 'Besi Beton SNI Ekonomis', spec: 'Tetap wajib standar SNI tulangan' },
    'Kawat Beton': { brand: 'Kawat Ikat Standar', spec: 'Kualitas standar pekerjaan umum' },
    'Plamir': { brand: 'Plamir Lokal', spec: 'Ekonomis dengan kontrol aplikasi' },
    'Cat Dasar': { brand: 'Primer Lokal', spec: 'Primer ekonomis' },
    'Cat Penutup': { brand: 'Cat Ekonomis SNI', spec: 'Daya sebar menengah' },
    'Cat Kayu': { brand: 'Cat Kayu Lokal', spec: 'Ekonomis' },
    'Air': { brand: 'Air Bersih Lokal', spec: 'Tetap harus air bersih' },
    'Kayu Kusen': { brand: 'Kayu Lokal Kelas III', spec: 'Kelas kuat III, diawetkan' },
    'Kayu Rangka Atap': { brand: 'Kayu Lokal Ekonomis', spec: 'Kelas kuat III' },
    'Daun Pintu Panel': { brand: 'Pintu HDF / Ekonomis', spec: 'HDF press, ekonomis' },
    'Daun Pintu PVC': { brand: 'PVC Lokal', spec: 'Anti air ekonomis' },
    'Engsel Pintu': { brand: 'Engsel Lokal', spec: 'Besi standar' },
    'Kunci Tanam': { brand: 'Kunci Lokal', spec: 'Kunci tanam ekonomis' },
    'Daun Jendela': { brand: 'Jendela Kayu Lokal', spec: 'Kayu lokal ekonomis' },
    'Engsel Jendela': { brand: 'Lokal', spec: 'Besi standar' },
    'Grendel': { brand: 'Lokal', spec: 'Besi standar' },
    'Kaca Polos 5mm': { brand: 'Kaca Lokal', spec: 'Kaca 5mm ekonomis' },
    'Kusen Aluminium': { brand: 'Aluminium Lokal', spec: 'Profil standar ekonomis' },
    'Kunci Kamar Mandi': { brand: 'Lokal', spec: 'Kunci ekonomis' },
    'Pipa PVC 1/2"': { brand: 'Pralon / Lokal SNI', spec: 'AW class ekonomis' },
    'Pipa PVC 3"': { brand: 'Pralon / Lokal SNI', spec: 'AW class ekonomis' },
    'Pipa PVC 4"': { brand: 'Pralon / Lokal SNI', spec: 'AW class ekonomis' },
    'Pipa PPR 1/2"': { brand: 'Lokal SNI', spec: 'PN10 ekonomis' },
    'Fitting PVC': { brand: 'Lokal SNI', spec: 'Standar ekonomis' },
    'Fitting PPR': { brand: 'Lokal', spec: 'Standar ekonomis' },
    'Lem PVC': { brand: 'Lokal', spec: 'Solvent cement ekonomis' },
    'Stop Kran': { brand: 'Lokal', spec: 'Standar ekonomis' },
    'Selang Fleksibel': { brand: 'Lokal', spec: 'PVC standar' },
    'Kloset Duduk': { brand: 'Lokal / Economis', spec: 'Standar ekonomis' },
    'Kloset Jongkok': { brand: 'Lokal', spec: 'Porselen ekonomis' },
    'Kabel NYM 2x1.5mm': { brand: 'Lokal SNI', spec: 'SNI ekonomis' },
    'Kabel NYM 3x2.5mm': { brand: 'Lokal SNI', spec: 'SNI ekonomis' },
    'Kabel NYY 4x6mm': { brand: 'Lokal SNI', spec: 'SNI ekonomis' },
    'Pipa Conduit': { brand: 'Lokal', spec: 'PVC standar' },
    'Fitting Lampu': { brand: 'Lokal', spec: 'E27 ekonomis' },
    'Saklar': { brand: 'Lokal', spec: 'Standar ekonomis' },
    'Stop Kontak': { brand: 'Lokal', spec: 'Standar ekonomis' },
    'Box Panel MCB': { brand: 'Lokal', spec: 'Standar ekonomis' },
    'MCB 1 Phase': { brand: 'Lokal SNI', spec: 'Standar ekonomis' },
    'Genteng Beton': { brand: 'Lokal', spec: 'Beton press ekonomis' },
    'Genteng Keramik': { brand: 'Lokal', spec: 'Keramik ekonomis' },
    'Spandek/Galvalum': { brand: 'Lokal', spec: 'Galvalum ekonomis' },
  },
};

export const getCitiesByProvince = (provinceId: string) =>
  CITIES.filter((city) => city.provinceId === provinceId);

export const getCityById = (cityId: string) => CITIES.find((city) => city.id === cityId);

export const getCityDisplayName = (cityId: string) => {
  const city = getCityById(cityId);
  if (!city) return cityId;
  return `${city.name}, ${city.provinceName}`;
};

export const getMaterialPricesByGrade = (cityId: string, grade: MaterialGrade) => {
  const city = getCityById(cityId) || CITIES[0];
  if (!city) return { ...defaultMaterials };
  const multiplier = GRADE_MULTIPLIER[grade] || 1;

  return Object.fromEntries(
    Object.entries(city.materials).map(([materialName, basePrice]) => [
      materialName,
      Math.round(basePrice * multiplier),
    ])
  ) as Record<string, number>;
};

export const getMaterialTransparency = (
  materialName: string,
  cityId: string,
  grade: MaterialGrade
): MaterialTransparency => {
  const city = getCityById(cityId);
  const defaultProfile = MATERIAL_BRANDS_BY_GRADE[grade][materialName] || {
    brand: 'Material Lokal Tersertifikasi',
    spec: 'Mengikuti standar teknis yang berlaku',
  };

  return {
    materialName,
    brand: defaultProfile.brand,
    spec: defaultProfile.spec,
    standardRef: `SNI/AHSP referensi setempat - ${city ? `${city.name}, ${city.provinceName}` : 'Indonesia'}`,
  };
};

const REGIONAL_PRICE_OVERRIDE_KEY = 'regional-price-overrides-v1';

let regionalPriceOverrides: Record<string, RegionalPriceOverride> = (() => {
  try {
    const raw = localStorage.getItem(REGIONAL_PRICE_OVERRIDE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, RegionalPriceOverride>) : {};
  } catch {
    return {};
  }
})();

export const getRegionalPriceOverride = (cityId: string): RegionalPriceOverride | undefined =>
  regionalPriceOverrides[cityId];

export const setRegionalPriceOverrides = (overrides: Record<string, RegionalPriceOverride>) => {
  regionalPriceOverrides = overrides;
  localStorage.setItem(REGIONAL_PRICE_OVERRIDE_KEY, JSON.stringify(overrides));
};

export const mergeRegionalPriceOverride = (cityId: string, patch: RegionalPriceOverride) => {
  regionalPriceOverrides[cityId] = {
    materials: {
      ...(regionalPriceOverrides[cityId]?.materials || {}),
      ...(patch.materials || {}),
    },
    labor: {
      ...(regionalPriceOverrides[cityId]?.labor || {}),
      ...(patch.labor || {}),
    },
  };
  localStorage.setItem(REGIONAL_PRICE_OVERRIDE_KEY, JSON.stringify(regionalPriceOverrides));
};

export const clearRegionalPriceOverrides = () => {
  regionalPriceOverrides = {};
  localStorage.removeItem(REGIONAL_PRICE_OVERRIDE_KEY);
};
