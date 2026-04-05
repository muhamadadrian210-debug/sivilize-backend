const mockStorage = require('../utils/mockStorage');

// @desc    Get all materials
// @route   GET /api/materials
// @access  Private
exports.getMaterials = async (req, res, next) => {
  try {
    const materials = mockStorage.find('materials');

    res.status(200).json({
      success: true,
      count: materials.length,
      data: materials,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new material
// @route   POST /api/materials
// @access  Private (Admin)
exports.createMaterial = async (req, res, next) => {
  try {
    const material = mockStorage.create('materials', req.body);

    res.status(201).json({
      success: true,
      data: material,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update material
// @route   PUT /api/materials/:id
// @access  Private (Admin)
exports.updateMaterial = async (req, res, next) => {
  try {
    let material = mockStorage.findById('materials', req.params.id);

    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }

    material = mockStorage.update('materials', req.params.id, req.body);

    res.status(200).json({
      success: true,
      data: material,
    });
  } catch (err) {
    next(err);
  }
};
