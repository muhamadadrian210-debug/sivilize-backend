const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const mockStorage = require('../utils/mockStorage');

// Token blacklist (in-memory, untuk logout)
const tokenBlacklist = new Set();

exports.blacklistToken = (token) => {
  tokenBlacklist.add(token);
  // Auto-hapus setelah 30 hari (sesuai expiry JWT)
  setTimeout(() => tokenBlacklist.delete(token), 30 * 24 * 60 * 60 * 1000);
};

exports.protect = async (req, res, next) => {
  let token;

  // Ambil token dari header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token tidak ditemukan.'
    });
  }

  // Cek apakah token sudah di-blacklist (logout)
  if (tokenBlacklist.has(token)) {
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid. Silakan login ulang.'
    });
  }

  try {
    // Verifikasi token
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'] // paksa algoritma spesifik
    });

    // Cek apakah token sudah expired
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return res.status(401).json({
        success: false,
        message: 'Token sudah expired. Silakan login ulang.'
      });
    }

    // Ambil user dari DB atau in-memory
    let user;
    if (mongoose.connection.readyState === 1) {
      const User = require('../models/User');
      user = await User.findById(decoded.id);
    } else {
      user = mockStorage.findById('users', decoded.id);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User tidak ditemukan. Silakan login ulang.'
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Token tidak valid.' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token sudah expired. Silakan login ulang.' });
    }
    return res.status(401).json({ success: false, message: 'Autentikasi gagal.' });
  }
};

// Role-based access control
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak. Role '${req.user?.role}' tidak diizinkan.`
      });
    }
    next();
  };
};
