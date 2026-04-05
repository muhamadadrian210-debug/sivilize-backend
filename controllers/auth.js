const mockStorage = require('../utils/mockStorage');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validateRegister, validateLogin } = require('../validators/authValidator');
const { sanitizeObject } = require('../utils/sanitizer');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    // Validate input
    const { error, value: validatedData } = validateRegister(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validasi data gagal',
        errors: error.details.map(e => ({ field: e.path[0], message: e.message }))
      });
    }

    const { name, email, password, role } = validatedData;

    // Check if user already exists
    const existingUser = mockStorage.findOne('users', { email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
    }

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in mock storage
    const user = mockStorage.create('users', {
      name: sanitizeObject({ name }).name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'user'
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    // Validate input
    const { error, value: validatedData } = validateLogin(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validasi data gagal',
        errors: error.details.map(e => ({ field: e.path[0], message: e.message }))
      });
    }

    const { email, password } = validatedData;

    // Check for user
    const user = mockStorage.findOne('users', { email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Kredensial tidak valid' });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Kredensial tidak valid' });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = mockStorage.findById('users', req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

    // Don't return password
    delete user.password;

    res.status(200).json({
      success: true,
      data: user,
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
