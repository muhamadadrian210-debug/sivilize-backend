const express = require('express');
const {
  getAHSPs,
  getAHSP,
  createAHSP,
  updateAHSP,
  deleteAHSP,
} = require('../controllers/ahsp');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All AHSP routes are protected

router.route('/')
  .get(getAHSPs)
  .post(authorize('admin', 'user'), createAHSP);

router.route('/:id')
  .get(getAHSP)
  .put(authorize('admin', 'user'), updateAHSP)
  .delete(authorize('admin'), deleteAHSP);

module.exports = router;
