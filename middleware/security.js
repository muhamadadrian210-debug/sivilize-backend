/**
 * Security Middleware Tambahan untuk SIVILIZE HUB PRO
 * Lapisan pertahanan ekstra terhadap serangan umum
 */

// ── 1. Brute Force Login Protection ─────────────────────────
// Track percobaan login gagal per IP
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000; // 15 menit

exports.loginBruteForce = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (record) {
    // Reset jika window sudah lewat
    if (now - record.firstAttempt > LOGIN_LOCKOUT_MS) {
      loginAttempts.delete(ip);
    } else if (record.count >= MAX_LOGIN_ATTEMPTS) {
      const waitMinutes = Math.ceil((record.firstAttempt + LOGIN_LOCKOUT_MS - now) / 60000);

      // Kirim alert ke admin
      try {
        const { sendSecurityAlert } = require('../utils/alertService');
        sendSecurityAlert('brute_force', {
          ip,
          endpoint: req.path,
          method: req.method,
          userAgent: req.headers['user-agent'],
          email: req.body?.email,
          attempts: record.count,
        });
      } catch {}

      return res.status(429).json({
        success: false,
        message: `Terlalu banyak percobaan login. Coba lagi dalam ${waitMinutes} menit.`
      });
    }
  }

  // Intercept response untuk track login gagal
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode === 401 && req.path.includes('login')) {
      const current = loginAttempts.get(ip) || { count: 0, firstAttempt: now };
      const newCount = current.count + 1;
      loginAttempts.set(ip, {
        count: newCount,
        firstAttempt: current.count === 0 ? now : current.firstAttempt
      });

      // Alert setelah 3x gagal
      if (newCount === 3) {
        try {
          const { sendSecurityAlert } = require('../utils/alertService');
          sendSecurityAlert('brute_force', {
            ip,
            endpoint: req.path,
            method: req.method,
            userAgent: req.headers['user-agent'],
            email: req.body?.email,
            attempts: newCount,
          });
        } catch {}
      }
    } else if (res.statusCode === 200 && req.path.includes('login')) {
      loginAttempts.delete(ip);
    }
    return originalJson(body);
  };

  next();
};

// ── 2. Request Size Limiter ──────────────────────────────────
exports.requestSizeLimiter = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || '0');
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  if (contentLength > MAX_SIZE) {
    return res.status(413).json({
      success: false,
      message: 'Request terlalu besar. Maksimal 5MB.'
    });
  }
  next();
};

// ── 3. SQL/NoSQL Injection Pattern Detector ──────────────────
const INJECTION_PATTERNS = [
  /(\$where|\$regex|\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin|\$or|\$and|\$not|\$nor)/i,
  /(union\s+select|drop\s+table|insert\s+into|delete\s+from|update\s+set)/i,
  /(<script[\s\S]*?>[\s\S]*?<\/script>)/i,
  /(javascript\s*:)/i,
  /(on\w+\s*=)/i, // onclick=, onload=, etc
];

const checkInjection = (value) => {
  if (typeof value === 'string') {
    return INJECTION_PATTERNS.some(p => p.test(value));
  }
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).some(v => checkInjection(v));
  }
  return false;
};

exports.injectionDetector = (req, res, next) => {
  const suspicious = checkInjection(req.body) || checkInjection(req.query) || checkInjection(req.params);
  if (suspicious) {
    console.warn(`🚨 INJECTION ATTEMPT: ${req.method} ${req.path} from ${req.ip}`);
    return res.status(400).json({
      success: false,
      message: 'Request tidak valid.'
    });
  }
  next();
};

// ── 4. Security Headers Tambahan ────────────────────────────
exports.securityHeaders = (req, res, next) => {
  // Cegah browser cache data sensitif
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  // Cegah MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Cegah clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Permissions policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
};

// ── 5. API Key / Token Format Validator ─────────────────────
exports.validateTokenFormat = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    // JWT harus format: Bearer xxxxx.yyyyy.zzzzz
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Format token tidak valid.'
      });
    }
    // JWT harus punya 3 bagian dipisah titik
    const tokenParts = parts[1].split('.');
    if (tokenParts.length !== 3) {
      return res.status(401).json({
        success: false,
        message: 'Format token tidak valid.'
      });
    }
  }
  next();
};

// ── 6. IP Whitelist untuk Admin Routes ──────────────────────
// Kosongkan untuk disable, isi IP untuk enable
const ADMIN_IP_WHITELIST = process.env.ADMIN_IP_WHITELIST
  ? process.env.ADMIN_IP_WHITELIST.split(',').map(ip => ip.trim())
  : [];

exports.adminIPGuard = (req, res, next) => {
  if (ADMIN_IP_WHITELIST.length === 0) return next(); // disabled
  const ip = req.ip || req.connection.remoteAddress || '';
  if (!ADMIN_IP_WHITELIST.includes(ip)) {
    console.warn(`🚫 Admin access blocked from IP: ${ip}`);
    return res.status(403).json({ success: false, message: 'Akses ditolak.' });
  }
  next();
};
