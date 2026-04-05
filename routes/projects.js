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

module.exports = router;
