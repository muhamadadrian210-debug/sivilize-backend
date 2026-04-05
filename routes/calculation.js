const express = require('express');
const { calculateRAB, getAHSPData } = require('../controllers/calculation');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protected routes - require authentication
router.post('/', protect, calculateRAB);
router.get('/ahsp', protect, getAHSPData);

module.exports = router;
