const mongoose = require('mongoose');
require('dotenv').config();
const Loan = require('../models/Loan');
const User = require('../models/User');

async function createTestLoan() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a user to assign the loan to
    const user = await User.findOne({});
    if (!user) {
      console.log('No users found. Please create a user first.');
      process.exit(1);
    }

    console.log(`Creating loan for user: ${user.email}`);

    // Create a new loan with complete data
    const loanData = {
      user: user._id,
      loanType: 'car',
      loanName: 'Test Car Loan',
      principalAmount: 500000, // 5 Lakh
      interestRate: 8.5,
      tenureMonths: 60, // 5 years
      lender: 'HDFC Bank',
      startDate: new Date('2024-01-01'),
      installmentDueDay: 5, // 5th of each month
      loanAccountNumber: 'CAR123456789',
      paymentFrequency: 'monthly',
      description: 'Test car loan for payment functionality',
      tags: ['test', 'car'],
      prepaymentAllowed: true,
      prepaymentCharges: 2,
      insuranceAmount: 25000,
      processingFee: 5000,
      otherCharges: 1000
    };

    const loan = new Loan(loanData);
    await loan.save();

    console.log('Test loan created successfully!');
    console.log(`Loan ID: ${loan._id}`);
    console.log(`Loan Name: ${loan.loanName}`);
    console.log(`EMI Amount: ₹${loan.emiAmount}`);
    console.log(`Total EMIs: ${loan.emiSchedule.length}`);
    console.log(`Next EMI Date: ${loan.nextEmiDate}`);
    console.log(`Monthly Due Day: ${loan.installmentDueDay}`);

    // Show first few EMIs
    console.log('\nFirst 3 EMIs:');
    loan.emiSchedule.slice(0, 3).forEach(emi => {
      console.log(`EMI #${emi.emiNumber}: Due ${emi.dueDate.toDateString()} (${emi.dueDateDay}th) - ₹${emi.emiAmount} - Status: ${emi.status}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error creating test loan:', error);
    process.exit(1);
  }
}

createTestLoan();