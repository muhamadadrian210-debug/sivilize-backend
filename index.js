const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Load env vars
dotenv.config();

// Create Express app
const app = express();

// Body parser with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// CORS configuration - Allow frontend origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all for now, restrict via ALLOWED_ORIGINS env
  },
  credentials: true,
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

// Static folder for uploads (only in non-serverless)
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/ahsp', require('./routes/ahsp'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/calculate-rab', require('./routes/calculation'));
app.use('/api/export', require('./routes/export'));

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Sivilize Hub Pro API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
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

// Start server for local development
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
    console.log(`🏥 Health: http://localhost:${PORT}/health`);
  });
}

// Export for Vercel serverless
module.exports = app;
