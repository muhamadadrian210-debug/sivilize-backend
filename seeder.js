const mongoose = require('mongoose');
const dotenv = require('dotenv');
const AHSP = require('./models/AHSP');
const Material = require('./models/Material');

dotenv.config();

const ahspData = [
  {
    id: 'str-001',
    category: 'Struktur',
    name: 'Galian Tanah Pondasi',
    unit: 'm3',
    materials: [],
    labor: [
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
    labor: [
      { name: 'Pekerja', coeff: 1.65, unit: 'OH' },
      { name: 'Tukang Batu', coeff: 0.275, unit: 'OH' },
      { name: 'Kepala Tukang', coeff: 0.028, unit: 'OH' },
      { name: 'Mandor', coeff: 0.083, unit: 'OH' },
    ],
    productivity: 0.6,
  },
];

const materialData = [
  {
    name: 'Semen PC',
    unit: 'kg',
    category: 'Material',
    prices: [
      { location: 'jakarta', price: 1250 },
      { location: 'surabaya', price: 1150 },
      { location: 'bandung', price: 1200 }
    ]
  },
  {
    name: 'Pasir Beton',
    unit: 'm3',
    category: 'Material',
    prices: [
      { location: 'jakarta', price: 350000 },
      { location: 'surabaya', price: 310000 },
      { location: 'bandung', price: 330000 }
    ]
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB for seeding...');

    await AHSP.deleteMany({});
    await AHSP.insertMany(ahspData);
    console.log('AHSP Seeded!');

    await Material.deleteMany({});
    await Material.insertMany(materialData);
    console.log('Materials Seeded!');

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedDB();
