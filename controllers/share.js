const crypto = require('crypto');
const mongoose = require('mongoose');
const mockStorage = require('../utils/mockStorage');

const getProjectModel = () => {
  if (mongoose.connection.readyState === 1) {
    return require('../models/Project');
  }
  return null;
};

// @desc    Generate share link untuk project
// @route   POST /api/projects/:id/share
// @access  Private
exports.generateShareLink = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { expiresInDays = 30 } = req.body;
    const userId = req.user._id || req.user.id;

    const shareToken = crypto.randomBytes(16).toString('hex');
    const shareTokenExpiry = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const ProjectModel = getProjectModel();
    let project;

    if (ProjectModel) {
      project = await ProjectModel.findOneAndUpdate(
        { _id: id, user: userId },
        { shareToken, shareTokenExpiry, shareEnabled: true },
        { new: true }
      );
    } else {
      const existing = mockStorage.findById('projects', id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Proyek tidak ditemukan' });
      }
      project = mockStorage.update('projects', id, { shareToken, shareTokenExpiry, shareEnabled: true });
    }

    if (!project) {
      return res.status(404).json({ success: false, message: 'Proyek tidak ditemukan' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://sivilize-frontend.vercel.app';
    const shareUrl = `${frontendUrl}/share/${shareToken}`;

    return res.status(200).json({
      success: true,
      data: {
        shareToken,
        shareUrl,
        expiresAt: shareTokenExpiry.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get shared project (public)
// @route   GET /api/share/:token
// @access  Public
exports.getSharedProject = async (req, res, next) => {
  try {
    const { token } = req.params;

    const ProjectModel = getProjectModel();
    let project;

    if (ProjectModel) {
      project = await ProjectModel.findOne({
        shareToken: token,
        shareEnabled: true,
        shareTokenExpiry: { $gt: new Date() },
      }).populate('user', 'name');
    } else {
      const projects = mockStorage.find('projects');
      project = projects.find(
        p => p.shareToken === token &&
             p.shareEnabled &&
             p.shareTokenExpiry &&
             new Date(p.shareTokenExpiry) > new Date()
      );
    }

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Link tidak valid atau sudah kedaluwarsa',
      });
    }

    // Return data read-only
    return res.status(200).json({
      success: true,
      data: {
        projectName: project.name,
        location: project.location,
        versions: project.versions || [],
        createdAt: project.createdAt,
        sharedBy: project.user?.name || 'Unknown',
      },
    });
  } catch (err) {
    next(err);
  }
};
