const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  unit: { type: String, required: true },
  prices: [{
    location: { type: String, required: true },
    price: { type: Number, required: true }
  }],
  category: {
    type: String,
    enum: ['Material', 'Upah'],
    default: 'Material'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Material', MaterialSchema);
