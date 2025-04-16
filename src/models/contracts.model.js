'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { populationSettingsUsers, populationSettingsContractors } = require('../utils/consts.utils');
const { formatContract } = require('../utils/formatters.utils');


// Define the contracts schema with required fields
const contractsSchema = new Schema({
  contractUser: { type: Schema.Types.ObjectId, ref: "Users", required: true }, // User who owns/manages this contract
  contractContractors: [{ type: Schema.Types.ObjectId, ref: "Contractors", required: true }], // The contractor company/entity
  contractStatus: { type: String, required: true, enum: ['Pending', 'OnHold', 'Active', 'Inactive', 'Suspended', 'Completed', 'Stopped'], default: "Pending" },
  contractVotingMechanism: {
      type: String,
      enum: ['Manual', 'Automatic'], // Manual (e.g., physical meeting), Automatic (e.g., calculated based on ownership %)
      default: 'Manual'
    }
  }, { timestamps: true });

// --- Instance Methods ---

// Custom toJSON method to modify the response structure
contractsSchema.method("toJSON", function () {
  const object = this.toObject();
  return formatContract(object);
});

// Custom populateAndTransform method for custom populated structure
contractsSchema.method("populateAndTransform", async function () {
  
  const populatePaths = [
    populationSettingsUsers('contractUser', 'USER'), // Populate contractUser with specific fields
    populationSettingsContractors('contractContractors', 'USER'), // Populate contractContractors with specific fields
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

// Static method to count records by contractor and limit
contractsSchema.statics.Count = async function (filter = {}, limit = 10) {
  try {
    const documents = await this.find(filter).limit(limit);
    // Decide whether to return raw docs, toJSON docs, or fully transformed docs
    // Using populateAndTransform here can be slow for lists. Consider toJSON only.
    const populated = await Promise.all(documents.map(doc =>
        // doc.toJSON() // Using simpler toJSON for lists might be more performant
        doc.populateAndTransform() // Use this if the full transformation is always needed
    ));
    return populated;
  } catch (error) {
    console.error('Error in Contracts.Count:', error);
    throw error; // Rethrow the error
  }
};

// Static method UpdateById: Finds by ID and updates
contractsSchema.statics.UpdateById = function (id, update, options = { new: true }) {
    return this.findByIdAndUpdate(id, update, options);
};


module.exports = mongoose.model("Contracts", contractsSchema);
