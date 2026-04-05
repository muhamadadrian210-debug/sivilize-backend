/**
 * Backend RAB Auto-Classifier
 * Mirrors frontend classifier for consistent grouping
 */

const CLASSIFICATION_RULES = {
  'Pekerjaan Struktur': [
    'galian', 'penggalian', 'pondasi', 'caisson', 'tiang', 'pasak',
    'beton', 'pengecoran', 'bekisting', 'pembesian', 'baja', 'tulangan',
    'kolom', 'balok', 'plat', 'dek', 'struktur'
  ],
  'Pekerjaan Persiapan': [
    'persiapan', 'pembersihan', 'survey', 'marking', 'pemasangan', 'mobilisasi',
    'akses', 'jalan kerja', 'gudang', 'kantor', 'pagar', 'signage'
  ],
  'Pekerjaan Tanah': [
    'urugan', 'timbunan', 'tanah', 'lempung', 'pasir', 'batu',
    'pemadatan', 'grading', 'drainase', 'saluran', 'sump pit'
  ],
  'Pekerjaan Dinding': [
    'pasangan', 'bata', 'bak', 'plesteran', 'plester', 'adukan',
    'dinding', 'tembok', 'mor', 'spesi', 'mortar'
  ],
  'Pekerjaan Lantai': [
    'keramik', 'granit', 'marmer', 'ubin', 'lantai', 'penutup lantai',
    'quarry tile', 'homogenous', 'vinyl', 'wooden', 'kayu'
  ],
  'Pekerjaan Finishing': [
    'pengecatan', 'cat', 'finishing', 'polish', 'coating', 'waterproof',
    'membrane', 'sealant', 'kaca', 'pintu', 'jendela', 'kusen',
    'saniter', 'fixture', 'lampu', 'elektrik', 'pipa', 'instalasi'
  ],
  'Pekerjaan Atap': [
    'atap', 'genteng', 'roofing', 'rangka atap', 'talang', 'gutter',
    'downspout', 'shingles', 'aspal', 'membran', 'metal'
  ]
};

/**
 * Classify single RAB item
 */
const classifyRABItem = (description) => {
  if (!description) return 'Lain-lain';

  const lowerDesc = description.toLowerCase().trim();

  for (const [category, keywords] of Object.entries(CLASSIFICATION_RULES)) {
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword)) {
        return category;
      }
    }
  }

  return 'Lain-lain';
};

/**
 * Group RAB items by category
 */
const groupRABItems = (items) => {
  const grouped = new Map();

  // Initialize all categories
  const allCategories = [
    'Pekerjaan Persiapan',
    'Pekerjaan Tanah',
    'Pekerjaan Struktur',
    'Pekerjaan Dinding',
    'Pekerjaan Lantai',
    'Pekerjaan Finishing',
    'Pekerjaan Atap',
    'Lain-lain'
  ];

  allCategories.forEach(cat => grouped.set(cat, []));

  // Classify and group items
  if (Array.isArray(items)) {
    items.forEach(item => {
      const category = item.category || classifyRABItem(item.name);
      const itemsInCategory = grouped.get(category) || [];
      itemsInCategory.push(item);
      grouped.set(category, itemsInCategory);
    });
  }

  // Convert to array format with subtotals
  const groupedArray = Array.from(grouped.entries())
    .filter(([, items]) => items.length > 0)
    .map(([kategori, items]) => ({
      kategori,
      items: items.map((item, idx) => ({
        ...item,
        no: idx + 1
      })),
      subtotal: items.reduce((sum, item) => sum + (item.total || 0), 0),
      totalItems: items.length
    }));

  return groupedArray;
};

/**
 * Calculate totals from grouped items
 */
const calculateGroupedTotals = (grouped) => {
  const subtotal = grouped.reduce((sum, group) => sum + group.subtotal, 0);
  return {
    subtotal,
    totalItems: grouped.reduce((sum, group) => sum + group.totalItems, 0),
    totalCategories: grouped.length
  };
};

module.exports = {
  classifyRABItem,
  groupRABItems,
  calculateGroupedTotals
};
