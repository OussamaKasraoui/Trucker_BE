// Migration script to create initial ReserveFunds documents for existing Agreements
const mongoose = require('mongoose');
const Agreements = require('../src/models/agreements.model'); // Adjust path
const ReserveFunds = require('../src/models/reserveFunds.model'); // Adjust path
const dbConfig = require('../src/config/db.config'); // Adjust path

async function initializeReserveFunds() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(dbConfig.url, dbConfig.options);
  console.log('Connected.');

  // Find agreements that don't have a corresponding ReserveFunds document yet
  const agreementsWithoutFunds = await Agreements.aggregate([
    {
      $lookup: {
        from: ReserveFunds.collection.name, // Use collection name for lookup
        localField: '_id',
        foreignField: 'agreement',
        as: 'reserveFundDoc'
      }
    },
    {
      $match: {
        'reserveFundDoc': { $size: 0 } // Find agreements with no matching reserve fund
      }
    }
  ]);

  console.log(`Found ${agreementsWithoutFunds.length} agreements needing reserve fund initialization.`);
  let fundsCreated = 0;
  let errorCount = 0;

  for (const agreementData of agreementsWithoutFunds) {
    const agreementId = agreementData._id;
    console.log(`Processing agreement: ${agreementId}`);
    try {
      // Retrieve the full agreement document if needed (e.g., for budget)
      // const agreement = await Agreements.findById(agreementId); // Optional: if you need more fields
      // if (!agreement) {
      //   console.warn(`  Agreement ${agreementId} not found during retrieval. Skipping.`);
      //   continue;
      // }

      // Calculate initial balance (e.g., 5% of budget or based on contributionRate)
      const contributionRate = agreementData.reserveFundSettings?.contributionRate ?? 5; // Use agreement's rate or default 5%
      const budget = agreementData.agreementBudget ?? 0; // Use agreement's budget or default 0
      const initialBalance = (budget * contributionRate) / 100;

      console.log(`  Agreement Budget: ${budget}, Contribution Rate: ${contributionRate}%, Initial Balance: ${initialBalance}`);

      // Create the ReserveFunds document
      await ReserveFunds.create({
        agreement: agreementId,
        currentBalance: initialBalance,
        transactions: initialBalance > 0 ? [{ // Add initial transaction if balance > 0
          type: 'Adjustment', // Or 'Contribution' if it represents initial seed money
          amount: initialBalance,
          description: 'Initial reserve fund balance based on agreement budget.',
          refModel: 'ManualAdjustment', // Indicate it's not from a specific cotisation/depense
          date: agreementData.createdAt || new Date() // Use agreement creation date or now
        }] : []
      });

      fundsCreated++;
      console.log(`  Created ReserveFunds document for agreement ${agreementId} with balance ${initialBalance}`);

    } catch (error) {
      errorCount++;
      console.error(`  Error initializing reserve fund for agreement ${agreementId}:`, error.message);
      // Check for duplicate key error (E11000) in case the script is run twice
      if (error.code === 11000) {
         console.warn(`    Reserve fund likely already exists for agreement ${agreementId}. Skipping.`);
         errorCount--; // Don't count duplicate errors if we are just skipping
      }
    }
  }

  console.log(`\nReserve Fund Initialization Summary:`);
  console.log(`- Created ${fundsCreated} new ReserveFunds documents.`);
  console.log(`- Encountered errors for ${errorCount} agreements.`);
  console.log('Reserve fund initialization process finished.');
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

initializeReserveFunds().catch(err => {
  console.error("Migration script failed:", err);
  mongoose.disconnect();
  process.exit(1);
});
// Note: This script assumes that the ReserveFunds model has been defined with the necessary fields.