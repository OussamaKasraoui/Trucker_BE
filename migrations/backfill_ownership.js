// Migration script to backfill ownershipPercentage and create initial OwnershipShares
const mongoose = require('mongoose');
const Apartments = require('../src/models/apartments.model'); // Adjust path
const Buildings = require('../src/models/buildings.model'); // Adjust path
const OwnershipShares = require('../src/models/ownershipShares.model'); // Adjust path
const dbConfig = require('../src/config/db.config'); // Adjust path

async function backfillOwnership() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(dbConfig.url, dbConfig.options);
  console.log('Connected.');

  // Get all distinct building IDs from apartments
  const buildingIds = await Apartments.distinct('apartmentBuilding');
  console.log(`Found ${buildingIds.length} distinct buildings with apartments.`);

  let apartmentsUpdated = 0;
  let sharesCreated = 0;
  let errorCount = 0;

  for (const buildingId of buildingIds) {
    if (!buildingId) {
        console.warn("Skipping null buildingId.");
        continue;
    }
    console.log(`Processing building: ${buildingId}`);
    try {
      // Find all apartments in the current building
      const apartmentsInBuilding = await Apartments.find({ apartmentBuilding: buildingId });
      const totalUnits = apartmentsInBuilding.length;

      if (totalUnits === 0) {
        console.log(`  Building ${buildingId} has no apartments. Skipping.`);
        continue;
      }

      // Calculate percentage - handle division by zero just in case
      const percentagePerUnit = totalUnits > 0 ? (100 / totalUnits) : 0;
      // Round to nearest 0.5% increment if needed, or adjust calculation logic
      // Simple rounding for now:
      const calculatedPercentage = Math.round(percentagePerUnit * 2) / 2;

      console.log(`  Building ${buildingId} has ${totalUnits} units. Calculated % per unit: ${calculatedPercentage}%`);

      for (const apartment of apartmentsInBuilding) {
        try {
          let shareNeedsUpdate = false;
          // Update apartment's ownershipPercentage if it's not already set or differs
          if (apartment.ownershipPercentage !== calculatedPercentage) {
             apartment.ownershipPercentage = calculatedPercentage;
             // Set a default commonAreasContribution based on percentage? Or leave as 0?
             // apartment.commonAreasContribution = calculatedPercentage; // Example: directly proportional
             await apartment.save({ validateBeforeSave: false });
             apartmentsUpdated++;
             console.log(`    Updated apartment ${apartment._id} percentage to ${calculatedPercentage}%`);
             shareNeedsUpdate = true; // Mark that share needs check/creation
          }

          // Create/Update OwnershipShares record for the owner
          if (apartment.apartmentOwner) {
             const existingShare = await OwnershipShares.findOne({
                apartment: apartment._id,
                owner: apartment.apartmentOwner,
                endDate: null // Find the currently active share
             });

             if (!existingShare) {
                // Create new share record
                await OwnershipShares.create({
                   apartment: apartment._id,
                   owner: apartment.apartmentOwner,
                   percentage: calculatedPercentage,
                   effectiveDate: apartment.createdAt || new Date(), // Use apartment creation date or now
                   endDate: null,
                   historicalVersions: [] // Start fresh history
                });
                sharesCreated++;
                console.log(`      Created OwnershipShare for apartment ${apartment._id}, owner ${apartment.apartmentOwner}`);
             } else if (existingShare.percentage !== calculatedPercentage && shareNeedsUpdate) {
                // If share exists but percentage differs from calculation, update it
                // Add current state to history before updating
                existingShare.historicalVersions.push({
                    percentage: existingShare.percentage,
                    modifiedAt: new Date()
                });
                existingShare.percentage = calculatedPercentage;
                existingShare.effectiveDate = new Date(); // Mark update time
                await existingShare.save({ validateBeforeSave: false });
                console.log(`      Updated existing OwnershipShare for apartment ${apartment._id}, owner ${apartment.apartmentOwner}`);
             }
          } else {
             console.warn(`    Apartment ${apartment._id} has no owner. Cannot create OwnershipShare.`);
          }

        } catch (aptError) {
          errorCount++;
          console.error(`    Error processing apartment ${apartment._id}:`, aptError.message);
        }
      }
    } catch (buildError) {
      errorCount++;
      console.error(`  Error processing building ${buildingId}:`, buildError.message);
    }
  }

  console.log(`\nOwnership Backfill Summary:`);
  console.log(`- Updated percentage for ${apartmentsUpdated} apartments.`);
  console.log(`- Created ${sharesCreated} new OwnershipShares records.`);
  console.log(`- Encountered errors for ${errorCount} operations.`);
  console.log('Ownership backfill process finished.');
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

backfillOwnership().catch(err => {
  console.error("Migration script failed:", err);
  mongoose.disconnect();
  process.exit(1);
});
// const mongoose = require('mongoose');