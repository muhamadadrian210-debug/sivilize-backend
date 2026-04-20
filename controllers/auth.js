const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { validateRegister, validateLogin } = require('../validators/authValidator');
const { sanitizeObject } = require('../utils/sanitizer');

// Helper: pakai MongoDB atau in-memory
const getStorage = () => {
  if (mongoose.connection.readyState === 1) {
    return require('../models/User');
  }
  return null;
};

const mockStorage = require('../utils/mockStorage');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { error, value: validatedData } = validateRegister(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validasi data gagal',
        errors: error.details.map(e => ({ field: e.path[0], message: e.message }))
      });
    }

    const { name, email, password, role } = validatedData;
    const UserModel = getStorage();

    if (UserModel) {
      // MongoDB mode
      const existing = await UserModel.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
      }
      const user = await UserModel.create({
        name: sanitizeObject({ name }).name,
        email: email.toLowerCase(),
        password,
        role: role || 'user'
      });
      return sendTokenResponse({ _id: user._id, name: user.name, email: user.email, role: user.role }, 201, res);
    } else {
      // In-memory mode
      const existing = mockStorage.findOne('users', { email: email.toLowerCase() });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const user = mockStorage.create('users', {
        name: sanitizeObject({ name }).name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role || 'user'
      });
      return sendTokenResponse(user, 201, res);
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { error, value: validatedData } = validateLogin(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validasi data gagal',
        errors: error.details.map(e => ({ field: e.path[0], message: e.message }))
      });
    }

    const { email, password } = validatedData;
    const UserModel = getStorage();

    if (UserModel) {
      // MongoDB mode
      const user = await UserModel.findOne({ email: email.toLowerCase() }).select('+password');
      if (!user) {
        return res.status(401).json({ success: false, message: 'Kredensial tidak valid' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Kredensial tidak valid' });
      }
      return sendTokenResponse({ _id: user._id, name: user.name, email: user.email, role: user.role }, 200, res);
    } else {
      // In-memory mode
      const user = mockStorage.findOne('users', { email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({ success: false, message: 'Kredensial tidak valid' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Kredensial tidak valid' });
      }
      return sendTokenResponse(user, 200, res);
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const UserModel = getStorage();
    let user;

    if (UserModel) {
      user = await UserModel.findById(req.user._id || req.user.id);
    } else {
      user = mockStorage.findById('users', req.user._id || req.user.id);
    }

    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

    res.status(200).json({
      success: true,
      data: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (err) {
    next(err);
  }
};

const sendTokenResponse = (user, statusCode, res) => {
  const userId = user._id || user.id;
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  res.status(statusCode).json({
    success: true,
    token,
    data: {
      id: userId,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

// @desc    Logout user (blacklist token)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    const { blacklistToken } = require('../middleware/auth');
    blacklistToken(req.token);
    res.status(200).json({ success: true, message: 'Logout berhasil.' });
  } catch (err) {
    next(err);
  }
};

// @desc    Update profile (name, email, password)
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const UserModel = getStorage();
    const userId = req.user._id || req.user.id;

    if (UserModel) {
      const user = await UserModel.findById(userId).select('+password');
      if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

      if (name) user.name = sanitizeObject({ name }).name;
      if (email) user.email = email.toLowerCase();

      if (newPassword) {
        if (!currentPassword) return res.status(400).json({ success: false, message: 'Password lama diperlukan' });
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: 'Password lama salah' });
        user.password = newPassword;
      }

      await user.save();
      return res.status(200).json({ success: true, data: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } else {
      const user = mockStorage.findById('users', userId);
      if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

      const updates = {};
      if (name) updates.name = sanitizeObject({ name }).name;
      if (email) updates.email = email.toLowerCase();

      if (newPassword) {
        if (!currentPassword) return res.status(400).json({ success: false, message: 'Password lama diperlukan' });
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: 'Password lama salah' });
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(newPassword, salt);
      }

      const updated = mockStorage.update('users', userId, updates);
      return res.status(200).json({ success: true, data: { id: updated._id || updated.id, name: updated.name, email: updated.email, role: updated.role } });
    }
  } catch (err) {
    next(err);
  }
};

// ── Rate limit store untuk forgot password ──────────────────
const resetRateLimits = new Map();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 jam

function checkResetRateLimit(email) {
  const now = Date.now();
  const record = resetRateLimits.get(email);

  if (!record || (now - record.firstRequest) > RATE_LIMIT_WINDOW_MS) {
    resetRateLimits.set(email, { count: 1, firstRequest: now });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    const resetAt = record.firstRequest + RATE_LIMIT_WINDOW_MS;
    const waitMinutes = Math.ceil((resetAt - now) / 60000);
    return { allowed: false, waitMinutes };
  }

  record.count++;
  return { allowed: true };
}

// @desc    Forgot password — generate reset token dan kirim email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email diperlukan' });

    // Rate limit check
    const rateCheck = checkResetRateLimit(email.toLowerCase());
    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: `Terlalu banyak permintaan. Coba lagi dalam ${rateCheck.waitMinutes} menit.`
      });
    }

    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const resetExpiry = Date.now() + 60 * 60 * 1000; // 1 jam

    const UserModel = getStorage();
    let userName = 'Pengguna';

    if (UserModel) {
      const user = await UserModel.findOne({ email: email.toLowerCase() });
      if (!user) {
        // Jangan expose apakah email terdaftar atau tidak
        return res.status(200).json({ success: true, message: `Email reset password telah dikirim ke ${email}` });
      }
      userName = user.name;
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpiry = new Date(resetExpiry);
      await user.save({ validateBeforeSave: false });
    } else {
      const user = mockStorage.findOne('users', { email: email.toLowerCase() });
      if (!user) {
        return res.status(200).json({ success: true, message: `Email reset password telah dikirim ke ${email}` });
      }
      userName = user.name;
      mockStorage.update('users', user._id || user.id, {
        resetPasswordToken: resetToken,
        resetPasswordExpiry: resetExpiry
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://sivilize-hub-pro.vercel.app';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Kirim email di production, log di development
    if (process.env.NODE_ENV === 'production' && (process.env.SMTP_HOST || process.env.RESEND_API_KEY)) {
      try {
        const { sendResetPasswordEmail } = require('../utils/emailService');
        await sendResetPasswordEmail(email, userName, resetUrl);
      } catch (emailErr) {
        console.error('❌ Gagal kirim email reset:', emailErr.message);
        return res.status(500).json({
          success: false,
          message: 'Gagal mengirim email. Silakan coba lagi.'
        });
      }
    } else {
      // Development mode: tampilkan token di response
      console.log('🔑 Reset URL (dev mode):', resetUrl);
    }

    res.status(200).json({
      success: true,
      message: `Email reset password telah dikirim ke ${email}`,
      // Hanya tampilkan di development
      ...(process.env.NODE_ENV !== 'production' && { resetToken, resetUrl })
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reset password dengan token
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token dan password baru diperlukan' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password minimal 8 karakter' });
    }

    const UserModel = getStorage();
    if (UserModel) {
      const user = await UserModel.findOne({
        resetPasswordToken: token,
        resetPasswordExpiry: { $gt: Date.now() }
      }).select('+password');
      if (!user) {
        return res.status(400).json({ success: false, message: 'Token tidak valid atau sudah kedaluwarsa. Silakan minta link reset baru.' });
      }
      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpiry = undefined;
      await user.save();
      return sendTokenResponse({ _id: user._id, name: user.name, email: user.email, role: user.role }, 200, res);
    } else {
      const users = mockStorage.find('users');
      const user = users.find(u => u.resetPasswordToken === token && u.resetPasswordExpiry > Date.now());
      if (!user) {
        return res.status(400).json({ success: false, message: 'Token tidak valid atau sudah kedaluwarsa. Silakan minta link reset baru.' });
      }
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(newPassword, salt);
      mockStorage.update('users', user._id || user.id, {
        password: hashed,
        resetPasswordToken: null,
        resetPasswordExpiry: null
      });
      return sendTokenResponse(user, 200, res);
    }
  } catch (err) {
    next(err);
  }
};

// ── Upload Avatar ────────────────────────────────────────────
const multer = require('multer');

// Vercel serverless: filesystem read-only, pakai memory storage
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipe file tidak valid. Hanya JPEG, PNG, WebP yang diizinkan.'));
    }
  },
});

// @desc    Upload avatar
// @route   POST /api/auth/avatar
// @access  Private
exports.uploadAvatar = [
  avatarUpload.single('avatar'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'File avatar diperlukan' });
      }

      // Simpan sebagai base64 data URL (Vercel tidak punya persistent filesystem)
      const base64 = req.file.buffer.toString('base64');
      const avatarUrl = `data:${req.file.mimetype};base64,${base64}`;
      const userId = req.user._id || req.user.id;
      const UserModel = getStorage();

      if (UserModel) {
        await UserModel.findByIdAndUpdate(userId, { avatarUrl });
      } else {
        mockStorage.update('users', userId, { avatarUrl });
      }

      return res.status(200).json({
        success: true,
        data: { avatarUrl },
      });
    } catch (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Ukuran file maksimal 2MB' });
      }
      next(err);
    }
  },
];
