const mongoose = require('mongoose');
require('dotenv').config();
const Loan = require('../models/Loan');

async function fixExistingLoans() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const loans = await Loan.find({});
    console.log(`Found ${loans.length} loans to fix`);

    for (const loan of loans) {
      let needsUpdate = false;

      // Fix missing installmentDueDay
      if (!loan.installmentDueDay) {
        loan.installmentDueDay = new Date(loan.startDate).getDate();
        needsUpdate = true;
        console.log(`Fixed installmentDueDay for loan ${loan._id}: ${loan.installmentDueDay}`);
      }

      // Fix EMI schedule dueDateDay
      if (loan.emiSchedule && loan.emiSchedule.length > 0) {
        for (const emi of loan.emiSchedule) {
          if (!emi.dueDateDay) {
            emi.dueDateDay = loan.installmentDueDay || new Date(loan.startDate).getDate();
            needsUpdate = true;
          }
        }
      }

      // Regenerate EMI schedule if needed
      if (!loan.emiSchedule || loan.emiSchedule.length === 0) {
        console.log(`Regenerating EMI schedule for loan ${loan._id}`);
        // The pre-validate middleware will regenerate the schedule
        needsUpdate = true;
      }

      if (needsUpdate) {
        await loan.save();
        console.log(`Updated loan ${loan._id}: ${loan.loanName}`);
      }
    }

    console.log('All loans fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing loans:', error);
    process.exit(1);
  }
}

fixExistingLoans();