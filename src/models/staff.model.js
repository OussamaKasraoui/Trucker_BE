'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;
const { populationSettingsUsers, populationSettingsContractors, populationSettingsBuildings } = require('../utils/consts.utils');
const { formatStaff } = require('../utils/formatters.utils'); // Assuming this is the correct path


// Define the schema with required fields
const staffSchema = new Schema({
  staffUser:        { type: Schema.Types.ObjectId, ref: "Users", required: true, unique: true }, // Staff user should be unique
  staffContractor:  { type: Schema.Types.ObjectId, ref: "Contractors", required: true },         // Contractor the staff belongs to, made required
  staffRoles:       [{ type: Schema.Types.ObjectId, ref: "Roles", default: null }],              // Array of roles
  staffStatus:      { type: String, enum: ['Pending', 'OnHold', 'Active', 'Inactive', 'Suspended', 'OnLeave'], required: true, default: 'Pending' }, // Added default
  jobTitle:         { type: String } // Added job title
}, { timestamps: true });

// --- Instance Methods ---

// Custom toJSON method to modify the response structure
staffSchema.method("toJSON", function () {
  const object = this.toObject();
  return formatStaff(object);
});

// Custom populateAndTransform method for custom populated structure
staffSchema.method("populateAndTransform", async function () {
  // Populate related fields
  const populatePaths = [
      populationSettingsUsers('staffUser', 'USER'), // Populate staffUser with specific fields
      populationSettingsContractors('staffContractor', 'USER'), // Populate staffContractor with specific fields
      populationSettingsBuildings('staffRoles', 'USER'), // Populate staffRoles with specific fields
  ];

  

  if (!this.populated(populatePaths[0].path)) {
    await this.populate(populatePaths[0]).execPopulate();
  }

  if (!this.populated(populatePaths[1].path)) {
    await this.populate(populatePaths[1]).execPopulate();
  }

  if (!this.populated(populatePaths[2].path)) {
    await this.populate(populatePaths[2]).execPopulate();
  }

  return this.toJSON(); // Return the transformed document
});

// --- Static Methods ---

// Static method to count records by criteria
staffSchema.statics.Count = async function (filter = {}, limit = 10) { // Made async
  try {
      const documents = await this.find(filter).limit(limit);
      const populated = await Promise.all(documents.map(doc =>
        doc.populateAndTransform() // Use toJSON for list performance
      ));
      return populated;
  } catch (error) {
      console.error('Error in Staff.Count:', error);
      throw error;
  }
};

// Static method to update by ID
staffSchema.statics.UpdateById = function (id, update, options = { new: true }) {
  return this.findByIdAndUpdate(id, update, options);
};

// Static method to find by User ID
staffSchema.statics.FindByUserId = function (userId) {
    return this.findOne({ staffUser: userId });
};


module.exports = mongoose.model('Staff', staffSchema);