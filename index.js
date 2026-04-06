const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const crypto = require('crypto');

dotenv.config();

const app = express();

// ============================================================
// 1. HELMET - Security Headers (XSS, Clickjacking, MIME, dll)
// ============================================================
app.use(helmet({
  contentSecurityPolicy: false, // disabled agar API tidak block response
  crossOriginEmbedderPolicy: false,
}));
app.use(helmet.xssFilter());
app.use(helmet.noSniff());
app.use(helmet.frameguard({ action: 'deny' }));
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }));
app.use(helmet.hidePoweredBy());

// ============================================================
// 2. BODY PARSER
// ============================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============================================================
// 3. NOSQL INJECTION PROTECTION
// ============================================================
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`⚠️ NoSQL injection attempt blocked: ${key}`);
  }
}));

// ============================================================
// 4. HPP - Cegah HTTP Parameter Pollution
// ============================================================
app.use(hpp());

// ============================================================
// 5. CORS
// ============================================================
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ============================================================
// 6. RATE LIMITING - Berbeda per endpoint
// ============================================================
// Global limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100,
  message: { success: false, message: 'Terlalu banyak request, coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Auth limiter - lebih ketat (cegah brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // max 10 percobaan login per 15 menit
  message: { success: false, message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // hanya hitung yang gagal
});

// ============================================================
// 7. REQUEST ID - Tracking setiap request
// ============================================================
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// ============================================================
// 8. SECURITY LOGGING
// ============================================================
app.use((req, res, next) => {
  const suspicious = [
    '<script', 'javascript:', 'eval(', 'DROP TABLE',
    'SELECT *', 'UNION SELECT', '../', '..\\',
    'exec(', 'system(', 'passthru('
  ];
  const body = JSON.stringify(req.body || '');
  const url = req.originalUrl;
  
  if (suspicious.some(s => body.toLowerCase().includes(s.toLowerCase()) || url.toLowerCase().includes(s.toLowerCase()))) {
    console.warn(`🚨 SUSPICIOUS REQUEST [${req.requestId}]: ${req.method} ${url} from ${req.ip}`);
  }
  next();
});

// ============================================================
// 9. MONGODB CONNECTION
// ============================================================
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.log('⚠️ MONGODB_URI tidak ada, pakai in-memory storage');
      return;
    }
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.log('⚠️ MongoDB gagal, pakai in-memory storage:', err.message);
  }
};

connectDB();

// ============================================================
// 10. ROUTES - Auth pakai rate limiter ketat
// ============================================================
app.use('/api/auth', authLimiter, require('./routes/auth'));
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
    security: 'AES-256/TLS + Helmet + Rate Limiting + NoSQL Injection Protection',
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
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  console.error(`❌ Error [${req.requestId}]:`, err.message);
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Terjadi kesalahan pada server'
      : err.message,
    requestId: req.requestId
  });
});

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔒 Security: Helmet + Rate Limiting + NoSQL Protection aktif`);
  });
}

module.exports = app;
