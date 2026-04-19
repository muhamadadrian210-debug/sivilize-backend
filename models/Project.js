const mongoose = require('mongoose');

const RABItemSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['Struktur', 'Arsitektur', 'Finishing', 'MEP'],
    required: true,
  },
  name: { type: String, required: true },
  volume: { type: Number, required: true },
  unit: { type: String, required: true },
  unitPrice: { type: Number, required: true },
  total: { type: Number, required: true },
  analysis: {
    materials: [{
      name: String,
      coeff: Number,
      price: Number,
      unit: String
    }],
    labor: [{
      name: String,
      coeff: Number,
      wage: Number,
      unit: String
    }]
  }
});

const VersionSchema = new mongoose.Schema({
  versionNum: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  rabItems: [RABItemSchema],
  financialSettings: {
    overhead: { type: Number, default: 5 },
    profit: { type: Number, default: 10 },
    tax: { type: Number, default: 11 },
    contingency: { type: Number, default: 0 }
  },
  summary: {
    subtotal: Number,
    overheadAmount: Number,
    profitAmount: Number,
    contingencyAmount: Number,
    taxAmount: Number,
    grandTotal: Number
  }
});

const ProjectSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Please add a project name'],
    trim: true,
  },
  location: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['rumah', 'ruko', 'gedung'],
    required: true,
  },
  floors: {
    type: Number,
    required: true,
    default: 1,
  },
  dimensions: [{
    length: Number,
    width: Number,
    height: Number,
  }],
  status: {
    type: String,
    enum: ['draft', 'ongoing', 'completed'],
    default: 'draft',
  },
  versions: [VersionSchema],
  // Share RAB fields
  shareToken: {
    type: String,
    default: null,
    index: true,
  },
  shareTokenExpiry: {
    type: Date,
    default: null,
  },
  shareEnabled: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Project', ProjectSchema);
