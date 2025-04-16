'use strict';
const mongoose = require("mongoose");
const { Schema } = mongoose; // Use Schema
const { populationSettingsServiceRequests } = require("../utils/consts.utils");
const { formatDevis} = require('../utils/formatters.utils'); // Assuming this is the correct path

const devisSchema = Schema( // Corrected variable name
    {
        // Assuming 'Projects' is the correct ref, update if needed
        //devistMissions:     [{ type: Schema.Types.ObjectId, ref: "Missions" }], // Uncomment if needed
        //devisUser:          {type: Schema.Types.ObjectId, ref: "Users"}, // Uncomment and add ref if needed
        devisServiceRequest:  {type: Schema.Types.ObjectId, ref: "ServiceRequests" }, // Changed ref to ServiceRequests
        devisPrice:           {type: Number, required: true, min: 0 },
        devisState:           {type: String, required: true, enum: ['Draft', 'Sent', 'Approved', 'Rejected', 'Expired'], default: 'Draft'}, // Changed to String enum
        devisDetails:         {type: String }, // Optional details
        validUntil:           {type: Date } // Optional validity date
    },
    { timestamps: true }
);

// --- Instance Methods ---

devisSchema.method("toJSON", function () {
  const object = this.toObject();
  return formatDevis(object);
});

devisSchema.method("populateAndTransform", async function () {
  const populatePaths = [
    populationSettingsServiceRequests('devisServiceRequest', 'USER'), // Populate devisServiceRequest with specific fields
    { path: 'devisServiceRequest' /*, select: '...' */ } // Populate if needed
  ];


  if (!this.populated(populatePaths[0].path)) {
    await this.populate(populatePaths[0]).execPopulate();
  }
    

    return this.toJSON();
});

// --- Static Methods ---

devisSchema.statics.Count = async function (filter = {}, limit = 10) {
  try {
    const documents = await this.find(filter).limit(limit);
    const populated = await Promise.all(documents.map(doc =>
        doc.populateAndTransform() // Use toJSON for list performance
    ));
    return populated;
  } catch (error) {
    console.error('Error in Devis.Count:', error);
    throw error;
  }
};

devisSchema.statics.UpdateById = function (id, update, options = { new: true }) {
    return this.findByIdAndUpdate(id, update, options);
};


module.exports = mongoose.model("Devis", devisSchema); // Corrected variable name