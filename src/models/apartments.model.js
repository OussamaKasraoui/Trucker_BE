'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;
const { populationSettingsUsers, populationSettingsBuildings } = require('../utils/consts.utils');
const { formatApartment } = require('../utils/formatters.utils');

// Define the apartment schema with required fields
const apartmentsSchema = new Schema({
  apartmentNumber: { type: Number, required: true },
  apartmentEtage: { type: Number, required: true },
  apartmentType: { type: String, enum: ['Rental', 'Property'], default: "Property" },
  apartmentStatus: { type: String, enum: ['Active', 'Inactive', 'Suspended'], default: "Inactive" },
  apartmentOwner: { type: Schema.Types.ObjectId, ref: "Users", required: true },
  apartmentUser: {
    type: Schema.Types.ObjectId, ref: "Users", required: false, default: function () {
      // Default to owner if user is not provided
      return this.apartmentOwner;
    }
  },
  apartmentBuilding: { type: Schema.Types.ObjectId, ref: "Buildings", required: true },
  apartmentSite: { type: Schema.Types.ObjectId, ref: "Sites", required: true },
  apartmentContract: { type: Schema.Types.ObjectId, ref: "Contracts", required: true },
  ownershipPercentage: {
    type: Number,
    required: true,
    default: 0, // Default to 0, migration script will populate existing ones
    min: 0,
    max: 100,
    validate: {
      validator: (v) => v === 0 || (v > 0 && v <= 100 && v % 0.5 === 0), // Allow 0 or positive 0.5% increments up to 100
      message: props => `${props.value} is not a valid ownership percentage. Must be 0 or a positive value in 0.5% increments up to 100.`
    }
  },
  commonAreasContribution: { type: Number, default: 0, min: 0 }, // Represents the calculated share for common areas

}, { timestamps: true });

// --- Instance Methods ---

// Custom toJSON method: Controls the output when document is converted to JSON
apartmentsSchema.method("toJSON", function () {
  const object = this.toObject();
  return formatApartment(object);
});

// Custom populateAndTransform method: Populates specified fields and then transforms the output using toJSON
apartmentsSchema.method("populateAndTransform", async function () {
  // Define population paths
  const populatePaths = [
    populationSettingsBuildings('apartmentBuilding', 'USER'), // Building name and other details
    populationSettingsUsers('apartmentOwner', 'USER'), // Owner details
    populationSettingsUsers('apartmentUser', 'USER'), // User details
  ]

  

  if (!this.populated(populatePaths[0].path)) {
    this.populate(populatePaths[0]).execPopulate();
  }

  if (!this.populated(populatePaths[1].path)) {
    this.populate(populatePaths[1]).execPopulate();
  }

  if (!this.populated(populatePaths[2].path)) {
    this.populate(populatePaths[2]).execPopulate();
  }


  return this.toJSON(); // Return the transformed document
});

// --- Static Methods ---

// Static method Count: Finds documents, populates, transforms, and returns them
apartmentsSchema.statics.Count = async function (filter = {}, limit = 10) {
  try {
    const documents = await this.find(filter).limit(limit);
    // Populate and transform each document
    const populated = await Promise.all(documents.map(doc =>
      doc.populateAndTransform() // Use the instance method
    ));
    return populated;
  } catch (error) {
    console.error('Error in Apartments.Count:', error);
    throw error; // Rethrow the error for the caller to handle
  }
};

// Static method UpdateById: Finds by ID and updates
apartmentsSchema.statics.UpdateById = function (id, update, options = { new: true }) {
    // Returns the query, not the document directly, unless awaited
    return this.findByIdAndUpdate(id, update, options);
};


// --- Middleware ---

// Middleware to potentially trigger recalculations when ownership changes
apartmentsSchema.pre('save', function (next) {
  if (this.isModified('ownershipPercentage')) {
    console.log(`Ownership percentage modified for apartment ${this._id}. Recalculation needed.`);
    // TODO: Implement logic to trigger recalculation of financial obligations
    // This might involve:
    // - Updating related Cotisation schedules based on the new percentage
    // - Recalculating common area contributions for all apartments in the building
    // - Emitting an event (e.g., using EventEmitter or a message queue) for other services
  }
  next();
});

module.exports = mongoose.model("Apartments", apartmentsSchema);