const express = require('express');
const { getSharedProject } = require('../controllers/share');

const router = express.Router();

router.get('/:token', getSharedProject);

module.exports = router;
