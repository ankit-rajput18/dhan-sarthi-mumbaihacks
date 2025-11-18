const mongoose = require('mongoose');
require('dotenv').config();
const Loan = require('../models/Loan');

async function addTestPayments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the test loan we just created
    const loan = await Loan.findOne({ loanName: 'Test Car Loan' });
    if (!loan) {
      console.log('Test loan not found');
      process.exit(1);
    }

    console.log(`Adding payments to loan: ${loan.loanName} (${loan._id})`);

    // Add some sample payments
    const payments = [
      {
        paymentDate: new Date('2024-02-05'),
        amount: 10258,
        emiNumber: 1,
        principalPaid: 6758,
        interestPaid: 3500,
        lateFee: 0,
        paymentMethod: 'auto-debit',
        notes: 'First EMI payment'
      },
      {
        paymentDate: new Date('2024-03-05'),
        amount: 10258,
        emiNumber: 2,
        principalPaid: 6806,
        interestPaid: 3452,
        lateFee: 0,
        paymentMethod: 'upi',
        notes: 'Second EMI payment'
      },
      {
        paymentDate: new Date('2024-04-05'),
        amount: 10258,
        emiNumber: 3,
        principalPaid: 6854,
        interestPaid: 3404,
        lateFee: 0,
        paymentMethod: 'netbanking',
        notes: 'Third EMI payment'
      }
    ];

    // Add payments to the loan
    loan.payments.push(...payments);

    // Update loan statistics
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalPrincipalPaid = payments.reduce((sum, p) => sum + p.principalPaid, 0);
    const totalInterestPaid = payments.reduce((sum, p) => sum + p.interestPaid, 0);

    loan.totalPaid += totalPaid;
    loan.principalPaid += totalPrincipalPaid;
    loan.interestPaid += totalInterestPaid;
    loan.remainingBalance -= totalPrincipalPaid;

    // Update EMI statuses
    payments.forEach(payment => {
      const emi = loan.emiSchedule.find(e => e.emiNumber === payment.emiNumber);
      if (emi) {
        emi.status = 'paid';
        emi.paidDate = payment.paymentDate;
        emi.paidAmount = payment.amount;
      }
    });

    // Update next EMI
    const nextUnpaidEmi = loan.emiSchedule.find(e => e.status === 'pending' || e.status === 'overdue');
    if (nextUnpaidEmi) {
      loan.nextEmiDate = nextUnpaidEmi.dueDate;
      loan.nextEmiAmount = nextUnpaidEmi.emiAmount;
    }

    await loan.save();

    console.log('Test payments added successfully!');
    console.log(`Total payments: ${loan.payments.length}`);
    console.log(`Total paid: ₹${loan.totalPaid}`);
    console.log(`Remaining balance: ₹${loan.remainingBalance}`);
    console.log(`Next EMI: ${nextUnpaidEmi ? `#${nextUnpaidEmi.emiNumber} on ${nextUnpaidEmi.dueDate.toDateString()}` : 'None'}`);

    process.exit(0);
  } catch (error) {
    console.error('Error adding test payments:', error);
    process.exit(1);
  }
}

addTestPayments();