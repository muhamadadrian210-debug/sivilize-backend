const express = require('express');
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addProjectVersion,
} = require('../controllers/projects');
const { protect } = require('../middleware/auth');
const { generateShareLink } = require('./share');

const router = express.Router();

router.use(protect); // All project routes are protected

router.route('/')
  .get(getProjects)
  .post(createProject);

router.route('/:id')
  .get(getProject)
  .put(updateProject)
  .delete(deleteProject);

router.route('/:id/versions')
  .post(addProjectVersion);

router.route('/:id/share')
  .post(generateShareLink);

module.exports = router;
