const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const TransactionSummary = require('../models/TransactionSummary');
require('dotenv').config();

async function generateSummaries() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dhan-sarthi', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');
    
    // Get all unique user-month combinations
    console.log('Finding all user-month combinations...');
    const combinations = await Transaction.aggregate([
      {
        $group: {
          _id: {
            user: '$user',
            year: { $year: '$date' },
            month: { $month: '$date' }
          }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      }
    ]);
    
    console.log(`Found ${combinations.length} monthly summaries to generate\n`);
    
    if (combinations.length === 0) {
      console.log('No transactions found. Nothing to do.');
      process.exit(0);
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const combo of combinations) {
      try {
        await TransactionSummary.updateMonthlySummary(
          combo._id.user,
          combo._id.year,
          combo._id.month
        );
        successCount++;
        console.log(`✓ Generated summary for ${combo._id.year}-${String(combo._id.month).padStart(2, '0')} (User: ${combo._id.user})`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Failed for ${combo._id.year}-${combo._id.month} (User: ${combo._id.user}):`, error.message);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('Summary Generation Complete!');
    console.log('='.repeat(50));
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total: ${combinations.length}`);
    
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
console.log('='.repeat(50));
console.log('Transaction Summary Generator');
console.log('='.repeat(50));
console.log('');

generateSummaries();
