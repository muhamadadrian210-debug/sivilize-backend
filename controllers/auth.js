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
        id: user._id,
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
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  res.status(statusCode).json({
    success: true,
    token,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};
