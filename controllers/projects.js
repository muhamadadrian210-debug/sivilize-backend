const mockStorage = require('../utils/mockStorage');
const { validateProject } = require('../validators/projectValidator');
const { sanitizeObject } = require('../utils/sanitizer');

// @desc    Get all projects with pagination
// @route   GET /api/projects?page=1&limit=20
// @access  Private
exports.getProjects = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    let allProjects;

    if (req.user.role === 'admin') {
      allProjects = mockStorage.find('projects');
    } else {
      allProjects = mockStorage.find('projects', { user: String(req.user._id || req.user.id) });
    }

    const total = allProjects.length;
    const projects = allProjects.slice(skip, skip + limit);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res, next) => {
  try {
    const project = mockStorage.findById('projects', req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project tidak ditemukan' });
    }

    if (project.user !== String(req.user._id || req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Tidak authorized' });
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res, next) => {
  try {
    // Validate input
    const { error, value: validatedData } = validateProject(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validasi data gagal',
        errors: error.details.map(e => ({ field: e.path[0], message: e.message }))
      });
    }

    validatedData.user = String(req.user._id || req.user.id);
    const sanitized = sanitizeObject(validatedData);
    const project = mockStorage.create('projects', sanitized);

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = async (req, res, next) => {
  try {
    let project = mockStorage.findById('projects', req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project tidak ditemukan' });
    }

    if (project.user !== String(req.user._id || req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Tidak authorized' });
    }

    // Validate updated data
    const { error, value: validatedData } = validateProject(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validasi data gagal',
        errors: error.details.map(e => ({ field: e.path[0], message: e.message }))
      });
    }

    const sanitized = sanitizeObject(validatedData);
    project = mockStorage.update('projects', req.params.id, sanitized);

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
exports.deleteProject = async (req, res, next) => {
  try {
    const project = mockStorage.findById('projects', req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project tidak ditemukan' });
    }

    if (project.user !== String(req.user._id || req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Tidak authorized' });
    }

    mockStorage.delete('projects', req.params.id);

    res.status(200).json({
      success: true,
      message: 'Project berhasil dihapus',
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add a new version to a project
// @route   POST /api/projects/:id/versions
// @access  Private
exports.addProjectVersion = async (req, res, next) => {
  try {
    const project = mockStorage.findById('projects', req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project tidak ditemukan' });
    }

    if (project.user !== String(req.user._id || req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Tidak authorized' });
    }

    const versions = project.versions || [];
    const newVersionNum = versions.length + 1;
    const newVersion = {
      ...sanitizeObject(req.body),
      versionNum: newVersionNum,
      timestamp: new Date()
    };

    versions.push(newVersion);
    const updatedProject = mockStorage.update('projects', req.params.id, { versions });

    res.status(200).json({
      success: true,
      data: updatedProject,
    });
  } catch (err) {
    next(err);
  }
};
