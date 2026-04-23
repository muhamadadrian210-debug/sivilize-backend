const express = require('express');
const { register, login, getMe, logout, updateProfile, forgotPassword, resetPassword, uploadAvatar, sendOtp, verifyOtp } = require('../controllers/auth');
const { protect } = require('../middleware/auth');

const router = express.Router();

// OTP endpoints
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/profile', protect, updateProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/avatar', protect, uploadAvatar);

module.exports = router;
