const express = require('express');
const {
  getLogs,
  createLog,
  upload,
} = require('../controllers/logs');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All Log routes are protected

router.route('/:projectId')
  .get(getLogs);

router.route('/')
  .post(upload.array('photos', 5), createLog);

module.exports = router;
