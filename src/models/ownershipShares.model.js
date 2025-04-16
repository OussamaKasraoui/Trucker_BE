'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { populationSettingsApartments, populationSettingsUsers } = require('../utils/consts.utils');
const { formatOwnershipShare} = require('../utils/formatters.utils');

// Define the ownership shares schema with required fields
const ownershipSharesSchema = new Schema({
  apartment: { type: Schema.Types.ObjectId, ref: 'Apartments', required: true, index: true },
  owner: { type: Schema.Types.ObjectId, ref: 'Users', required: true }, // The user who owns this share
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    validate: {
        // Basic range validation
        validator: (v) => v >= 0 && v <= 100,
        message: 'Percentage must be between 0 and 100.'
    }
    // Note: Validating sum to 100% per building is better done at service level
    // Note: Validating 0.5% increments is on the Apartment.ownershipPercentage field itself.
  },
  effectiveDate: { type: Date, default: Date.now }, // When this ownership share became effective
  endDate: { type: Date, default: null, index: true }, // When this ownership share ended (e.g., property sold), indexed
  historicalVersions: [{ // Track changes to the percentage over time
    percentage: { type: Number, required: true },
    modifiedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Compound index for efficient lookups based on apartment and owner
ownershipSharesSchema.index({ apartment: 1, owner: 1 });
// Index for finding current shares for an apartment (already defined via endDate index: true)
// ownershipSharesSchema.index({ apartment: 1, endDate: 1 }); // Redundant if endDate has index: true

// --- Middleware ---

// Method to add a historical version when percentage changes (Updated to async/await)
ownershipSharesSchema.pre('save', async function(next) {
  // Only run if percentage is modified and it's not a new document
  if (this.isModified('percentage') && !this.isNew) {
    try {
      // Find the original document to get the previous percentage using await
      const original = await this.constructor.findById(this._id).lean(); // Use lean for read-only

      // If original exists and percentage actually changed, add to history
      if (original && original.percentage !== this.percentage) {
        this.historicalVersions.push({
          percentage: original.percentage, // Store the *previous* percentage
          modifiedAt: new Date() // Record time of change
        });
      }
      next(); // Proceed with saving
    } catch (err) {
      console.error(`Error finding original document in ownershipShares pre-save hook for ${this._id}:`, err);
      next(err); // Pass error to Mongoose
    }
  } else {
    next(); // Proceed if not modified or is new
  }
});

// --- Instance Methods ---

ownershipSharesSchema.method("toJSON", function () {
  const object = this.toObject();
  return formatOwnershipShare(object);
});

ownershipSharesSchema.method("populateAndTransform", async function () {
    const populatePaths = [
        populationSettingsApartments('apartment', 'USER'), // Populate apartment with specific fields
        populationSettingsUsers('owner', 'USER'), // Populate owner with specific fields
    ];


    if (!this.populated(populatePaths[0].path)) {
      await this.populate(populatePaths[0]).execPopulate();
    }

    if (!this.populated(populatePaths[1].path)) {
      await this.populate(populatePaths[1]).execPopulate();
    }
    

    return this.toJSON();
});

// --- Static Methods ---

ownershipSharesSchema.statics.Count = async function (filter = {}, limit = 10) {
  try {
    const documents = await this.find(filter).limit(limit);
    const populated = await Promise.all(documents.map(doc =>
        doc.populateAndTransform() // Use toJSON for list performance
    ));
    return populated;
  } catch (error) {
    console.error('Error in OwnershipShares.Count:', error);
    throw error;
  }
};

ownershipSharesSchema.statics.UpdateById = function (id, update, options = { new: true }) {
    return this.findByIdAndUpdate(id, update, options);
};


module.exports = mongoose.model('OwnershipShares', ownershipSharesSchema);