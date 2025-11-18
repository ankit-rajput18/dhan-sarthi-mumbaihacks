const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  metadata: {
    // Store context used for this message
    financialSnapshot: {
      income: Number,
      expenses: Number,
      savings: Number,
      topCategories: [{ category: String, amount: Number }]
    },
    // Track which data was used
    dataUsed: {
      transactions: Boolean,
      goals: Boolean,
      loans: Boolean,
      budgets: Boolean
    }
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient user chat history queries
chatMessageSchema.index({ user: 1, timestamp: -1 });

// Method to get recent chat history for context
chatMessageSchema.statics.getRecentHistory = async function(userId, limit = 10) {
  return this.find({ user: userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('role content timestamp')
    .lean();
};

// Method to clear old messages (keep last 50 per user)
chatMessageSchema.statics.cleanupOldMessages = async function(userId) {
  const messages = await this.find({ user: userId })
    .sort({ timestamp: -1 })
    .skip(50)
    .select('_id');
  
  if (messages.length > 0) {
    const idsToDelete = messages.map(m => m._id);
    await this.deleteMany({ _id: { $in: idsToDelete } });
  }
};

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
