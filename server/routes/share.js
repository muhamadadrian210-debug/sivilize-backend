const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const mockStorage = require('../utils/mockStorage');
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');

// @desc    Generate share link untuk project
// @route   POST /api/projects/:id/share
// @access  Private
const generateShareLink = async (req, res, next) => {
  try {
    const { expiresInDays = 30 } = req.body;
    const projectId = req.params.id;

    const shareToken = crypto.randomBytes(16).toString('hex');
    const shareTokenExpiry = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    let project;
    if (mongoose.connection.readyState === 1) {
      const Project = require('../models/Project');
      project = await Project.findById(projectId);
      if (!project) return res.status(404).json({ success: false, message: 'Project tidak ditemukan' });
      if (project.user.toString() !== String(req.user._id || req.user.id) && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Tidak authorized' });
      }
      project.shareToken = shareToken;
      project.shareTokenExpiry = shareTokenExpiry;
      project.shareEnabled = true;
      await project.save();
    } else {
      project = mockStorage.findById('projects', projectId);
      if (!project) return res.status(404).json({ success: false, message: 'Project tidak ditemukan' });
      if (project.user !== String(req.user._id || req.user.id) && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Tidak authorized' });
      }
      mockStorage.update('projects', projectId, {
        shareToken,
        shareTokenExpiry: shareTokenExpiry.toISOString(),
        shareEnabled: true,
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://sivilize-hub-pro.vercel.app';
    const shareUrl = `${frontendUrl}/share/${shareToken}`;

    res.status(200).json({
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

// @desc    Get shared project (public, no auth)
// @route   GET /api/share/:token
// @access  Public
const getSharedProject = async (req, res, next) => {
  try {
    const { token } = req.params;
    let project;

    if (mongoose.connection.readyState === 1) {
      const Project = require('../models/Project');
      const User = require('../models/User');
      project = await Project.findOne({
        shareToken: token,
        shareEnabled: true,
        shareTokenExpiry: { $gt: new Date() },
      });
      if (project) {
        const user = await User.findById(project.user).select('name');
        return res.status(200).json({
          success: true,
          data: {
            projectName: project.name,
            location: project.location,
            type: project.type,
            floors: project.floors,
            status: project.status,
            versions: project.versions,
            createdAt: project.createdAt,
            sharedBy: user?.name || 'Kontraktor',
          },
        });
      }
    } else {
      const projects = mockStorage.find('projects');
      project = projects.find(p =>
        p.shareToken === token &&
        p.shareEnabled === true &&
        p.shareTokenExpiry &&
        new Date(p.shareTokenExpiry) > new Date()
      );
      if (project) {
        const user = mockStorage.findById('users', project.user);
        return res.status(200).json({
          success: true,
          data: {
            projectName: project.name,
            location: project.location,
            type: project.type,
            floors: project.floors,
            status: project.status,
            versions: project.versions,
            createdAt: project.createdAt,
            sharedBy: user?.name || 'Kontraktor',
          },
        });
      }
    }

    return res.status(404).json({
      success: false,
      message: 'Link tidak valid atau sudah kedaluwarsa',
    });
  } catch (err) {
    next(err);
  }
};

// Routes
router.get('/:token', getSharedProject);

// Export generateShareLink untuk dipakai di projects router
module.exports = router;
module.exports.generateShareLink = generateShareLink;
module.exports.protect = protect;
