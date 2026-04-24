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

// Trust proxy untuk Vercel
app.set('trust proxy', 1);

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
// 2b. STATIC FILES â€” disabled di Vercel (filesystem read-only)
// ============================================================

// ============================================================
// 3. NOSQL INJECTION PROTECTION
// ============================================================
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`âš ï¸ NoSQL injection attempt blocked: ${key}`);
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
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow all Vercel origins (any .vercel.app domain)
    if (origin.includes('vercel.app')) return callback(null, true);
    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) return callback(null, true);
    // Allow explicitly listed origins
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return callback(null, true);
    // Log blocked origin for debugging
    console.warn(`âš ï¸ CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
// Handle preflight untuk semua route â€” pastikan selalu return 200
app.options('*', cors(corsOptions));

// ============================================================
// 6. RATE LIMITING - Berbeda per endpoint
// ============================================================
// Global limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Terlalu banyak request, coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Auth limiter - lebih ketat (cegah brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Export limiter - cegah scraping massal
const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 jam
  max: 20,
  message: { success: false, message: 'Batas export tercapai. Coba lagi dalam 1 jam.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================
// 6b. REQUEST LOGGING - Log semua request untuk debugging
// ============================================================
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`${req.method} ${req.path} - ${req.ip}`);
  }
  next();
});

// ============================================================
// 6c. SECURITY MIDDLEWARE TAMBAHAN
// ============================================================
const {
  requestSizeLimiter,
  injectionDetector,
  securityHeaders,
  validateTokenFormat,
} = require('./middleware/security');

const {
  firewallStack,
  authFirewallStack,
  getFirewallStatus,
} = require('./middleware/firewall');

// Firewall stack â€” urutan penting
app.use(firewallStack);
app.use(securityHeaders);
app.use(requestSizeLimiter);
app.use(injectionDetector);
app.use(validateTokenFormat);

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
    console.warn(`ðŸš¨ SUSPICIOUS REQUEST [${req.requestId}]: ${req.method} ${url} from ${req.ip}`);
  }
  next();
});

// ============================================================
// 9. MONGODB CONNECTION â€” Optimized untuk Vercel serverless
// ============================================================
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  console.log('ðŸ” MONGODB_URI exists:', !!uri);

  if (!uri) {
    console.log('âš ï¸ MONGODB_URI tidak ada, pakai in-memory storage');
    return;
  }

  // Retry logic â€” Vercel cold start kadang butuh beberapa detik
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`ðŸ”„ MongoDB connect attempt ${attempt}/3...`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 30000,
        connectTimeoutMS: 10000,
        // Connection pool â€” reuse koneksi antar invocations
        maxPoolSize: 10,
        minPoolSize: 1,
        maxIdleTimeMS: 270000, // 4.5 menit â€” sedikit di bawah Vercel timeout 5 menit
        heartbeatFrequencyMS: 30000,
      });
      console.log('âœ… MongoDB Connected!');
      return;
    } catch (err) {
      console.log(`âŒ Attempt ${attempt} failed: ${err.message}`);
      if (attempt < 3) await new Promise(r => setTimeout(r, 1500));
    }
  }
  console.log('âš ï¸ Semua attempt gagal, pakai in-memory storage');
};

// Connection event handlers
mongoose.connection.on('connected', () => {
  console.log('ðŸŸ¢ MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
  console.error('ðŸ”´ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('ðŸŸ¡ MongoDB disconnected');
});

// Singleton connection promise â€” reuse antar invocations
let dbConnectionPromise = null;

const ensureDBConnected = async () => {
  if (mongoose.connection.readyState === 1) return; // sudah konek
  if (!dbConnectionPromise) {
    dbConnectionPromise = connectDB().catch(() => { dbConnectionPromise = null; });
  }
  await dbConnectionPromise;
};

// Middleware: pastikan DB konek sebelum handle request
app.use(async (req, res, next) => {
  try {
    await ensureDBConnected();
  } catch {
    // Lanjut dengan in-memory jika gagal
  }
  next();
});

// ============================================================
// 10. ROUTES - Auth pakai rate limiter + firewall ketat
// ============================================================
app.use('/api/auth', authLimiter, authFirewallStack, require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/ahsp', require('./routes/ahsp'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/calculate-rab', require('./routes/calculation'));
app.use('/api/export', exportLimiter, require('./routes/export'));

// Share RAB route (public, no auth required)
try {
  app.use('/api/share', require('./routes/share'));
} catch (e) {
  console.warn('Share routes not available:', e.message);
}

// ============================================================
// 11. HONEYPOT ENDPOINTS â€” jebak hacker yang coba scan
// ============================================================
const HONEYPOT_PATHS = [
  '/admin', '/wp-admin', '/wp-login.php', '/phpmyadmin',
  '/config', '/.env', '/backup', '/db', '/database',
  '/shell', '/cmd', '/exec', '/api/admin/users',
];

HONEYPOT_PATHS.forEach(path => {
  app.all(path, (req, res) => {
    const ip = req.ip || 'unknown';
    console.warn(`ðŸ¯ HONEYPOT HIT: ${req.method} ${path} from ${ip}`);

    // Kirim alert ke admin
    try {
      const { sendSecurityAlert } = require('./utils/alertService');
      sendSecurityAlert('honeypot', {
        ip,
        endpoint: path,
        method: req.method,
        userAgent: req.headers['user-agent'],
      });
    } catch {}

    // Redirect ke halaman prank
    res.redirect(301, `${process.env.FRONTEND_URL || 'https://sivilize-frontend.vercel.app'}/prank`);
  });
});

// Root
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Sivilize Hub Pro API',
    version: '1.1.0',
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
    firewall: getFirewallStatus(),
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Ping endpoint â€” ringan, untuk keep-alive dari frontend & cron
app.get('/ping', (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  console.error(`âŒ Error [${req.requestId}]:`, err.message);
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
    console.log(`ðŸš€ Server running on port ${PORT}`);
    console.log(`ðŸ”’ Security: Helmet + Rate Limiting + NoSQL Protection aktif`);
  });
}

module.exports = app;
