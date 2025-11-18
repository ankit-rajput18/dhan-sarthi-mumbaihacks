const mongoose = require('mongoose');

const taxRecommendationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recommendation: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['80C', '80D', 'HRA', 'home_loan', 'regime_switch', 'general', 'investment', 'deduction'],
    default: 'general'
  },
  potentialSaving: {
    type: Number,
    default: 0
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  actionable: {
    type: Boolean,
    default: true
  },
  metadata: {
    basedOn: {
      income: Number,
      currentDeductions: Number,
      regime: String,
      hasLoans: Boolean,
      hasGoals: Boolean
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
taxRecommendationSchema.index({ user: 1, createdAt: -1 });

// Get latest recommendation for user
taxRecommendationSchema.statics.getLatest = async function(userId) {
  return this.findOne({ user: userId }).sort({ createdAt: -1 });
};

// Clean up old recommendations (keep last 10)
taxRecommendationSchema.statics.cleanupOld = async function(userId) {
  const recommendations = await this.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(10);
  
  if (recommendations.length > 0) {
    const idsToDelete = recommendations.map(r => r._id);
    await this.deleteMany({ _id: { $in: idsToDelete } });
  }
};

module.exports = mongoose.model('TaxRecommendation', taxRecommendationSchema);
