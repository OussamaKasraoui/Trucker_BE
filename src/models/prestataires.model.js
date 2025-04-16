'use strict';

const mongoose = require("mongoose");
const { populationSettingsUsers } = require("../utils/consts.utils");
const { Schema } = mongoose;
const { formatPrestataire } = require('../utils/formatters.utils'); // Assuming this helper exists


// Note: This model seems very similar to 'Contractors'. Consider merging or clarifying the distinction.
const prestataireSchema = Schema(
    {
        prestataireUser :            {type: Schema.Types.ObjectId,ref: "Users", required: true }, // Made required
        prestataireType :            {type: String, enum: ['Individual', 'Company'], default: 'Individual'}, // Changed enum values
        // Changed Numbers to Strings, added sparse index for uniqueness allowing nulls
        prestataireNumRC :           {type: String, required: false, unique: true, sparse: true },
        prestataireNumPatente:       {type: String, required: false, unique: true, sparse: true },
        prestataireNumICE:           {type: String, required: false, unique: true, sparse: true },
        prestataireDenomination :    {type: String, required: function() { return this.prestataireType === 'Company'; } }, // Required if Company
        prestataireFormeJuridique:   {type: String, required: false}, // Consider enum
        prestataireStatus:           {type: String, required: true, enum: ['Active', 'Inactive', 'Pending'], default: 'Pending'}, // Changed to String enum
    },
    { timestamps: true }
);

// --- Instance Methods ---

prestataireSchema.method("toJSON", function () {
  const object = this.toObject();
  return formatPrestataire(object);
});

prestataireSchema.method("populateAndTransform", async function () {
    const populatePaths = [
        populationSettingsUsers('prestataireUser', 'USER'), // Populate prestataireUser with specific fields
    ];



    if (!this.populated(populatePaths[0].path)) {
        await this.populate(populatePaths[0]).execPopulate();
      }
    
    return this.toJSON();
});

// --- Static Methods ---

prestataireSchema.statics.Count = async function (filter = {}, limit = 10) {
  try {
    const documents = await this.find(filter).limit(limit);
    const populated = await Promise.all(documents.map(doc =>
        doc.populateAndTransform() // Use toJSON for list performance
    ));
    return populated;
  } catch (error) {
    console.error('Error in Prestataires.Count:', error);
    throw error;
  }
};

prestataireSchema.statics.UpdateById = function (id, update, options = { new: true }) {
    return this.findByIdAndUpdate(id, update, options);
};


module.exports = mongoose.model("Prestataires", prestataireSchema);