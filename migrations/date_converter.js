// Migration script to convert agreementStart and agreementEnd from String to ISODate
const mongoose = require('mongoose');
const Agreements = require('../src/models/agreements.model'); // Adjust path as needed
const dbConfig = require('../src/config/db.config'); // Adjust path as needed

async function convertDates() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(dbConfig.url, dbConfig.options);
  console.log('Connected.');

  const agreements = await Agreements.find({
    $or: [
      { agreementStart: { $type: 'string' } }, // Find documents where start is still a string
      { agreementEnd: { $type: 'string' } }    // Find documents where end is still a string
    ]
  });

  console.log(`Found ${agreements.length} agreements with string dates to convert.`);
  let convertedCount = 0;
  let errorCount = 0;

  for (const agreement of agreements) {
    try {
      let needsSave = false;
      // Convert start date if it's a string
      if (typeof agreement.agreementStart === 'string') {
        const startDate = new Date(agreement.agreementStart);
        if (!isNaN(startDate.getTime())) { // Check if conversion was successful
          agreement.agreementStart = startDate;
          needsSave = true;
        } else {
          console.warn(`Invalid date string for agreementStart (${agreement.agreementStart}) in agreement ${agreement._id}. Skipping conversion for this field.`);
        }
      }

      // Convert end date if it's a string
      if (typeof agreement.agreementEnd === 'string') {
        const endDate = new Date(agreement.agreementEnd);
        if (!isNaN(endDate.getTime())) { // Check if conversion was successful
          agreement.agreementEnd = endDate;
          needsSave = true;
        } else {
          console.warn(`Invalid date string for agreementEnd (${agreement.agreementEnd}) in agreement ${agreement._id}. Skipping conversion for this field.`);
        }
      }

      // Save only if a conversion happened
      if (needsSave) {
        await agreement.save({ validateBeforeSave: false }); // Skip validation during migration if needed
        convertedCount++;
        console.log(`Converted dates for agreement ${agreement._id}`);
      }
    } catch (error) {
      errorCount++;
      console.error(`Error converting dates for agreement ${agreement._id}:`, error.message);
      // Decide if you want to stop on error or continue
    }
  }

  console.log(`\nDate Conversion Summary:`);
  console.log(`- Successfully converted fields in ${convertedCount} agreements.`);
  console.log(`- Encountered errors for ${errorCount} agreements.`);
  console.log('Date conversion process finished.');
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

convertDates().catch(err => {
  console.error("Migration script failed:", err);
  mongoose.disconnect(); // Ensure disconnection on error
  process.exit(1);
});
// Note: Always backup your database before running migration scripts.