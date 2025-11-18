const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['success', 'warning', 'danger', 'info'],
    default: 'info'
  },
  category: {
    type: String,
    enum: ['transaction', 'budget', 'tax', 'loan', 'goal', 'savings', 'general'],
    default: 'general'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
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
  read: {
    type: Boolean,
    default: false
  },
  dismissed: {
    type: Boolean,
    default: false
  },
  actionUrl: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ userId: 1, read: 1, dismissed: 1, createdAt: -1 });

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  return this.save();
};

// Method to dismiss
notificationSchema.methods.dismiss = function() {
  this.dismissed = true;
  return this.save();
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ userId, read: false, dismissed: false });
};

// Static method to get recent notifications
notificationSchema.statics.getRecent = function(userId, limit = 20) {
  return this.find({ userId, dismissed: false })
    .sort({ createdAt: -1 })
    .limit(limit);
};

module.exports = mongoose.model('Notification', notificationSchema);
