const mongoose = require('mongoose');

const AHSPSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  category: {
    type: String,
    enum: ['Struktur', 'Arsitektur', 'Finishing', 'MEP'],
    required: true,
  },
  name: { type: String, required: true },
  unit: { type: String, required: true },
  materials: [{
    name: String,
    coeff: Number,
    unit: String
  }],
  laborCoefficients: [{
    name: String,
    coeff: Number,
    unit: String
  }],
  productivity: { type: Number, required: false },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('AHSP', AHSPSchema);
