const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

dotenv.config();

const app = express();

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// CORS
const corsOptions = {
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.options('/{*path}', cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Terlalu banyak request, coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Connect MongoDB
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.log('⚠️ MONGODB_URI tidak ada, pakai in-memory storage');
      return;
    }
    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.log('⚠️ MongoDB gagal, pakai in-memory storage:', err.message);
  }
};

connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/ahsp', require('./routes/ahsp'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/calculate-rab', require('./routes/calculation'));
app.use('/api/export', require('./routes/export'));

// Root
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Sivilize Hub Pro API',
    version: '1.0.0',
    status: 'running',
    db: mongoose.connection.readyState === 1 ? 'MongoDB' : 'In-Memory',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    db: mongoose.connection.readyState === 1 ? 'MongoDB Connected' : 'In-Memory',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404
app.use('/{*path}', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Terjadi kesalahan pada server',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = app;
