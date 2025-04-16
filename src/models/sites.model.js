'use strict';

const mongoose = require("mongoose");
const { Schema } = mongoose;
const { populationSettingsContractors } = require("../utils/consts.utils");
const { formatSite } = require("../utils/formatters.utils"); // Assuming this helper exists for formatting sites

// Define the sites schema with required fields
const sitesSchema = new Schema({
  siteName: { type: String, required: true },
  siteDetails: { type: String, required: false }, // Made optional
  siteAddress: { type: String, required: true },
  siteCity: { type: String, required: true },
  siteType: { type: String, enum: ['Simple', 'Complex'], required: true, default: "Simple" },
  siteStatus: { type: String, enum: ['Active', 'Inactive', 'OnHold'], default: "OnHold" },
  sitePrefix: { type: String, required: false }, // Often used for generating IDs/codes

  siteContract: { type: Schema.Types.ObjectId, ref: "Contracts", required: true },
}, { timestamps: true });

// --- Instance Methods ---

// Custom toJSON method to modify the response structure
sitesSchema.method("toJSON", function () {
  const object = this.toObject();
  return formatSite(object);
});

// Custom populateAndTransform method for custom populated structure
sitesSchema.method("populateAndTransform", async function () {
  // Populate user if not already done
    const populatePaths = [
        populationSettingsContractors('siteContract', 'USER'), // Populate assignedContractor with specific fields
      ];
    
      if (!this.populated(populatePaths[0].path)) {
        await this.populate(populatePaths[0]).execPopulate();
      }

  // Return the transformed document using the updated toJSON logic
  return this.toJSON();
});

// --- Static Methods ---

// Static method to count records by contract and limit
sitesSchema.statics.Count = async function (filter = {}, limit = 10) {
  try {
    const documents = await this.find(filter).limit(limit);
    // Use toJSON for list performance, as populateAndTransform can be heavy
    const transformed = await Promise.all(documents.map(doc =>
        // doc.toJSON()
        doc.populateAndTransform() // Use only if full transformation is essential for the list view
    ));
    return transformed;
  } catch (error) {
    console.error('Error in Sites.Count:', error);
    throw error; // Rethrow the error
  }
};

// Added UpdateById static method
sitesSchema.statics.UpdateById = function (id, update, options = { new: true }) {
    return this.findByIdAndUpdate(id, update, options);
};


module.exports = mongoose.model("Sites", sitesSchema);