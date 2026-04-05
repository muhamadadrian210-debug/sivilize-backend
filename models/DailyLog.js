const mongoose = require('mongoose');

const DailyLogSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  text: {
    type: String,
    required: [true, 'Please add some text'],
  },
  photos: [String],
  status: {
    type: String,
    enum: ['Normal', 'Warning', 'Kendala'],
    default: 'Normal',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('DailyLog', DailyLogSchema);
