/**
 * In-Memory Storage untuk Vercel Serverless
 * 
 * CATATAN: Data ini akan reset setiap kali serverless function cold start.
 * Untuk production yang persistent, gunakan MongoDB Atlas atau database cloud lainnya.
 * Set MONGODB_URI di environment variables Vercel untuk data yang persisten.
 */

let db = {
  users: [],
  projects: [],
  ahsp: [],
  materials: [],
  logs: []
};

// Coba load dari file jika ada (untuk development lokal)
try {
  const fs = require('fs');
  const path = require('path');
  const DB_FILE = path.join(__dirname, '../localDb.json');
  if (fs.existsSync(DB_FILE)) {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    db = JSON.parse(data);
    console.log('✅ Loaded data from localDb.json');
  }
} catch (e) {
  // Di Vercel serverless, filesystem read-only — pakai in-memory saja
  console.log('ℹ️ Using in-memory storage (Vercel serverless mode)');
}

const saveToFile = () => {
  try {
    const fs = require('fs');
    const path = require('path');
    const DB_FILE = path.join(__dirname, '../localDb.json');
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (e) {
    // Ignore write errors in serverless environment
  }
};

const mockStorage = {
  find: (collection, query = {}) => {
    const items = db[collection] || [];
    return items.filter(item => {
      for (let key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  },

  findOne: (collection, query = {}) => {
    const items = mockStorage.find(collection, query);
    return items.length > 0 ? items[0] : null;
  },

  findById: (collection, id) => {
    const items = db[collection] || [];
    return items.find(item => item._id === id || item.id === id) || null;
  },

  create: (collection, data) => {
    if (!db[collection]) db[collection] = [];
    const newItem = {
      _id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...data,
      createdAt: new Date().toISOString()
    };
    db[collection].push(newItem);
    saveToFile();
    return newItem;
  },

  update: (collection, id, updates) => {
    const items = db[collection] || [];
    const index = items.findIndex(item => item._id === id || item.id === id);
    if (index !== -1) {
      db[collection][index] = { ...db[collection][index], ...updates };
      saveToFile();
      return db[collection][index];
    }
    return null;
  },

  delete: (collection, id) => {
    db[collection] = (db[collection] || []).filter(item => item._id !== id && item.id !== id);
    saveToFile();
    return true;
  }
};

module.exports = mockStorage;
