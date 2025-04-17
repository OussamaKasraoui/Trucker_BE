'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { formatRole } = require('../utils/formatters.utils'); // Assuming this is the correct path
const { populationSettingsContractors, populationSettingsPermissions, populationSettingsRoles } = require("../utils/consts.utils");


// --- Role Schema (This should be active) ---
const RoleSchema = new Schema({
  roleOrganization:     { type: Schema.Types.ObjectId, required: true, refPath: 'roleOrganizationType'},
  roleOrganizationType: { type: String, required: true, enum: ['Packs', 'Contracts'] }, // Ensure 'Packs' matches case used in db.helper.js

  roleName:             { type: String, required: true },
  roleStatus:           { type: String, enum: ['Active', 'Inactive', 'Suspended'], default: 'Active' }, // Added default
  roleType:             { type: String, enum: ['Basic', 'Custom', 'Advanced'], default: 'Basic' }, // Added default

  rolePermissions:      [{ type: mongoose.Schema.Types.ObjectId, ref: "Permissions" }],
  roleInheritsFrom:     [{ type: mongoose.Schema.Types.ObjectId, ref: "Roles" }], // Hierarchical roles
  roleContractor:      { type: mongoose.Schema.Types.ObjectId, ref: "Contractors", required: true }
}, { timestamps: true });

// --- Role Schema Methods ---

// Custom toJSON method to modify the response structure
RoleSchema.method("toJSON", function (whoIsDemanding = 'USER') {
  const object = this.toObject();
  return formatRole(object, whoIsDemanding);
});

// Custom populateAndTransform method for custom populated structure
RoleSchema.method("populateAndTransform", async function(whoIsDemanding = 'USER') {
  const populatePaths = [
    // populationSettingsXXXXXXX('roleOrganization', 'USER'), // Populate assignedContractor with specific fields
    populationSettingsContractors('roleContractor', 'USER'), // Populate assignedContractor with specific fields
    populationSettingsPermissions('rolePermissions', 'USER'), // Populate assignedContractor with specific fields
    populationSettingsRoles('roleInheritsFrom', 'USER'), // Populate assignedContractor with specific fields
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

  // if (!this.populated(populatePaths[3].path)) {
  //   await this.populate(populatePaths[3]).execPopulate();
  // }


  // Return the transformed object using toJSON
  return this.toJSON(whoIsDemanding);
});


// Static method to count records by criteria
RoleSchema.statics.Count = async function (criteria = {}, limit = null, whoIsDemanding = 'USER') { // Added default filter, allow null limit
  try {
    const query = this.find(criteria);
    if (limit !== null) {
      query.limit(limit);
    }
    // Often countDocuments is more efficient if you only need the count
    // const count = await this.countDocuments(criteria);
    // return { count };
    const documents = await query.exec();
    const populated = await Promise.all(documents.map(doc =>
      doc.populateAndTransform(whoIsDemanding) // Use toJSON for list performance
    ));
    return populated;
  } catch (error) {
    console.error('Error in Roles.Count:', error);
    throw error; // Re-throw error for higher-level handling
  }
};

// Static method to update by ID
RoleSchema.statics.UpdateById = function (id, update, options = { new: true, runValidators: true }) { // Added runValidators default
  return this.findByIdAndUpdate(id, update, options);
};

// --- Export the Correct Model ---
module.exports = mongoose.model('Roles', RoleSchema);