// Script to reset onboardingCompleted flag for all existing users
// This ensures all users see the onboarding modal

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function resetOnboardingFlag() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dhan-sarthi', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Update all users to set onboardingCompleted to false
    const result = await User.updateMany(
      {}, // All users
      { 
        $set: { 
          onboardingCompleted: false 
        } 
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} users`);
    console.log(`   Total users found: ${result.matchedCount}`);
    console.log('   All users will now see the onboarding modal on next login');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetOnboardingFlag();
