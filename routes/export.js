const express = require('express');
const { exportPDF, exportExcel } = require('../controllers/export');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All export routes are protected

router.post('/pdf', exportPDF);
router.post('/excel', exportExcel);

module.exports = router;
