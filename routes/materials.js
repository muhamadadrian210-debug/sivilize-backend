const express = require('express');
const {
  getMaterials,
  createMaterial,
  updateMaterial,
} = require('../controllers/materials');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All Material routes are protected

router.route('/')
  .get(getMaterials)
  .post(authorize('admin'), createMaterial);

router.route('/:id')
  .put(authorize('admin'), updateMaterial);

module.exports = router;
