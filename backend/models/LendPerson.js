const mongoose = require('mongoose');

const lendPersonSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Person name is required'],
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
lendPersonSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('LendPerson', lendPersonSchema);
