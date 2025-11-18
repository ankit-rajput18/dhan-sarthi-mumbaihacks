// Script to check onboarding status of all users

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function checkOnboardingStatus() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dhan-sarthi', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const users = await User.find({}, 'name email onboardingCompleted profile.profession profile.annualIncome');

    console.log(`📊 Total Users: ${users.length}\n`);

    if (users.length === 0) {
      console.log('No users found in database');
      process.exit(0);
    }

    // Count completed vs not completed
    const completed = users.filter(u => u.onboardingCompleted).length;
    const notCompleted = users.filter(u => !u.onboardingCompleted).length;

    console.log(`✅ Onboarding Completed: ${completed}`);
    console.log(`❌ Onboarding Not Completed: ${notCompleted}\n`);

    // Show details for each user
    console.log('User Details:');
    console.log('─'.repeat(80));

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Onboarding: ${user.onboardingCompleted ? '✅ Completed' : '❌ Not Completed'}`);
      
      if (user.onboardingCompleted && user.profile) {
        console.log(`   Profession: ${user.profile.profession || 'Not set'}`);
        console.log(`   Annual Income: ₹${user.profile.annualIncome?.toLocaleString('en-IN') || 'Not set'}`);
      }
      
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkOnboardingStatus();
