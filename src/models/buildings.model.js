'use strict';
const mongoose = require('mongoose');
const { populationSettingsSites, populationSettingsContracts } = require('../utils/consts.utils');
const { Schema } = mongoose;
const { formatBuilding } = require('../utils/formatters.utils');

// Define the building schema with required fields
const buildingSchema = new Schema({
  buildingName:         { type: String, required: true },
  buildingAddress:      { type: String, required: false },
  buildingPrefix:       { type: String, required: false },
  buildingFloors:       { type: Number, required: true, min: 0 },
  buildingAptPerFloor:  { type: Number, required: false, min: 0 },
  buildingStatus:       { type: String, enum: ['Active', 'Inactive', 'OnHold'], default: "OnHold" },

  buildingSite:         { type: Schema.Types.ObjectId, ref: "Sites", required: true },
  buildingContract:     { type: Schema.Types.ObjectId, ref: "Contracts", required: true },
}, { timestamps: true });

// --- Instance Methods ---

// Custom toJSON method to modify the response structure
buildingSchema.method("toJSON", function () {
  const object = this.toObject();
  return formatBuilding(object);
});

// Custom populateAndTransform method for custom populated structure
buildingSchema.method("populateAndTransform", async function () {

  // Populate related fields
  const populatePaths = [
    populationSettingsSites('buildingSite', 'USER'), // Populate buildingSite with specific fields
    populationSettingsContracts('buildingContract', 'USER'), // Populate buildingContract with specific fields
  ];

  // Populate the buildingSite field if not already populated
    if (!this.populated(populatePaths[0].path)) {
      await this.populate(populatePaths[0]).execPopulate();
    }

    if (!this.populated(populatePaths[1].path)) {
      await this.populate(populatePaths[1]).execPopulate();
    }

  return this.toJSON(); // Return the transformed document
});

// --- Static Methods ---

// Static method to count records by site and limit
buildingSchema.statics.Count = async function (filter = {}, limit = 10) {
  try {
    const documents = await this.find(filter).limit(limit);
    // Populate and transform each document
    const populated = await Promise.all(documents.map(doc =>
      doc.populateAndTransform()
    ));
    return populated;
  } catch (error) {
    console.error('Error in Buildings.Count:', error);
    throw error; // Rethrow the error
  }
};

// Static method UpdateById: Finds by ID and updates
buildingSchema.statics.UpdateById = function (id, update, options = { new: true }) {
    return this.findByIdAndUpdate(id, update, options);
};


module.exports = mongoose.model("Buildings", buildingSchema);