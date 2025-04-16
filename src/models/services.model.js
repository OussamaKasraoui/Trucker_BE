'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;
const { populationSettingsContractors } = require('../utils/consts.utils');
const { formatService } = require('../utils/formatters.utils'); // Assuming this helper exists


// Services Schema (Represents a type of service offered, potentially by a contractor)
const servicesSchema = new Schema(
  {
    // Link to the default or primary provider, can be overridden in Agreement
    servicesProvider: { type: Schema.Types.ObjectId, ref: "Contractors", default: null },
    servicesName: { type: String, required: true, unique: true }, // Service name should be unique
    servicesType: { type: String, required: false }, // e.g., 'Cleaning', 'Maintenance', 'Security'
    servicesCost: { type: Number, required: false, min: 0 }, // Default cost, can be overridden
    description: { type: String } // Added description
  },
  { timestamps: true }
);

// --- Instance Methods ---

// Custom toJSON method for structured output
servicesSchema.method("toJSON", function () {
  const object = this.toObject();
  return formatService(object);
});

// Custom populateAndTransform method
servicesSchema.method('populateAndTransform', async function () {
  const populatePaths = [
    populationSettingsContractors('servicesProvider', 'USER'), // Populate assignedContractor with specific fields
  ];

  if (!this.populated(populatePaths[0].path)) {
    await this.populate(populatePaths[0]).execPopulate();
  }
  return this.toJSON(); // Reuse the structured output
});

// --- Static Methods ---

// Static method for counting and retrieving services
servicesSchema.statics.Count = async function (filter = {}, limit = 10) {
  try {
    const services = await this.find(filter).limit(limit);
    
    return Promise.all(services.map(service => service.populateAndTransform()));
  } catch (error) {
    console.error('Error in Services.Count:', error);
    throw error; // Rethrow error
  }
};

// Added UpdateById static method
servicesSchema.statics.UpdateById = function (id, update, options = { new: true }) {
    return this.findByIdAndUpdate(id, update, options);
};


// Export Services model
module.exports = mongoose.model("Services", servicesSchema);