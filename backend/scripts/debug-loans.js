const mongoose = require('mongoose');
require('dotenv').config();
const Loan = require('../models/Loan');
const User = require('../models/User');

async function debugLoans() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('=== DEBUGGING LOAN VISIBILITY ===');
    
    // Check all users
    const users = await User.find({});
    console.log('\nUsers in database:');
    users.forEach(user => {
      console.log(`- ${user.email} (ID: ${user._id})`);
    });
    
    // Check all loans
    const loans = await Loan.find({}).populate('user', 'email');
    console.log(`\nLoans in database (${loans.length} total):`);
    loans.forEach(loan => {
      console.log(`- ${loan.loanName} (Owner: ${loan.user?.email || 'Unknown'}, User ID: ${loan.user?._id || loan.user})`);
    });
    
    // Check if there are loans without proper user association
    const orphanLoans = await Loan.find({ user: { $exists: false } });
    if (orphanLoans.length > 0) {
      console.log(`\nOrphan loans (no user association): ${orphanLoans.length}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugLoans();