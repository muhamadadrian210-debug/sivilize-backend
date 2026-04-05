const mockStorage = require('../utils/mockStorage');

// @desc    Get all AHSP
// @route   GET /api/ahsp
// @access  Private
exports.getAHSPs = async (req, res, next) => {
  try {
    const ahsps = mockStorage.find('ahsp');

    res.status(200).json({
      success: true,
      count: ahsps.length,
      data: ahsps,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single AHSP
// @route   GET /api/ahsp/:id
// @access  Private
exports.getAHSP = async (req, res, next) => {
  try {
    const ahsp = mockStorage.findById('ahsp', req.params.id);

    if (!ahsp) {
      return res.status(404).json({ success: false, message: 'AHSP not found' });
    }

    res.status(200).json({
      success: true,
      data: ahsp,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new AHSP
// @route   POST /api/ahsp
// @access  Private (Admin/User)
exports.createAHSP = async (req, res, next) => {
  try {
    req.body.createdBy = req.user._id;
    const ahsp = mockStorage.create('ahsp', req.body);

    res.status(201).json({
      success: true,
      data: ahsp,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update AHSP
// @route   PUT /api/ahsp/:id
// @access  Private (Admin/User)
exports.updateAHSP = async (req, res, next) => {
  try {
    let ahsp = mockStorage.findById('ahsp', req.params.id);

    if (!ahsp) {
      return res.status(404).json({ success: false, message: 'AHSP not found' });
    }

    ahsp = mockStorage.update('ahsp', req.params.id, req.body);

    res.status(200).json({
      success: true,
      data: ahsp,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete AHSP
// @route   DELETE /api/ahsp/:id
// @access  Private (Admin)
exports.deleteAHSP = async (req, res, next) => {
  try {
    const ahsp = mockStorage.findById('ahsp', req.params.id);

    if (!ahsp) {
      return res.status(404).json({ success: false, message: 'AHSP not found' });
    }

    mockStorage.delete('ahsp', req.params.id);

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
