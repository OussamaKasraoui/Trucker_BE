'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { populationSettingsRoles, populationSettingsUsers } = require('../utils/consts.utils');
const { formatContractor } = require('../utils/formatters.utils');

// Define the contractors schema with required fields
const contractorsSchema = new Schema({
  contractorUser:           { type: Schema.Types.ObjectId, ref: "Users", required: true },
  contractorTitle:          { type: String, required: true, default: "NaturalPerson" }, // Consider enum if values are fixed

  contractorPhone:          { type: String, required: false }, // Consider validation (e.g., regex)
  // Ensure these unique fields handle null/empty strings appropriately if not always required
  contractorNumRC:          { type: String, required: false, unique: true, sparse: true }, // sparse allows multiple nulls
  contractorNumPatente:     { type: String, required: false, unique: true, sparse: true },
  contractorNumICE:         { type: String, required: false, unique: true, sparse: true },
  contractorDenomination:   { type: String, required: false },
  contractorFormeJuridique: { type: String, required: false }, // Consider enum
  contractorCapital:        { type: Number, required: false, min: 0 },
  contractorType:           { type: String, enum: ['Natural', 'Legal'], required: true, default: "Natural" },
  contractorStatus:         { type: String, enum: ['Pending', 'OnHold', 'Active', 'Inactive', 'Suspended'], default: "OnHold" },

  contractorRoles:          [{ type: Schema.Types.ObjectId, ref: "Roles", default: null }],
}, { timestamps: true });

// --- Instance Methods ---

// Custom toJSON method to modify the response structure
contractorsSchema.method("toJSON", function () {
  const object = this.toObject();
  return formatContractor(object);
});

// Custom populateAndTransform method for custom populated structure
contractorsSchema.method("populateAndTransform", async function () {
  
  const populatePaths = [
    populationSettingsUsers('contractorUser', 'USER'), // Populate contractorUser with specific fields
    populationSettingsRoles('contractorRoles', 'USER'), // Populate contractorRoles with specific fields
  ];

  if (!this.populated(populatePaths[0].path)) {
    await this.populate(populatePaths[0]).execPopulate();
  }

  if (!this.populated(populatePaths[1].path)) {
    await this.populate(populatePaths[1]).execPopulate();
  }

  return this.toJSON(); // Return the transformed document
});

// --- Static Methods ---

// Static method to count records by status and limit
contractorsSchema.statics.Count = async function (filter = {}, limit = 10) {
  try {
    const documents = await this.find(filter).limit(limit);
    // Populate and transform each document
    const populated = await Promise.all(documents.map(doc =>
      doc.populateAndTransform()
    ));
    return populated;
  } catch (error) {
    console.error('Error in Contractors.Count:', error);
    throw error; // Rethrow the error
  }
};

// Static method to update by ID
contractorsSchema.statics.UpdateById = function (id, update, options = { new: true }) {
  return this.findByIdAndUpdate(id, update, options);
};

module.exports = mongoose.model('Contractors', contractorsSchema);