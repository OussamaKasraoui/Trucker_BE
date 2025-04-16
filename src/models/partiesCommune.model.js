'use strict';
const mongoose = require("mongoose");
const { Schema } = mongoose; // Use Schema
const { populationSettingsBuildings, populationSettingsContractors } = require("../utils/consts.utils");
const { formatPartiesCommunes } = require('../utils/formatters.utils'); // Assuming this is the correct path


const partiesCommunesSchema = Schema( // Use Schema constructor
    {
      partiesCommuneName:         {type: String, required: true},
      partiesCommuneEtage:        {type: Number, required: false}, // Floor number
      partiesCommuneType:         {type: String, required: false}, // e.g., 'Hallway', 'Staircase', 'Roof', 'Garden'
      partiesCommuneState:        {type: String, required: false, enum: ['Good', 'Fair', 'Poor', 'NeedsRepair']}, // Changed to String enum
      // Assuming 'Immeubles' maps to 'Buildings' model
      // Assuming 'Prestataires' maps to 'Contractors' model
      partiesCommuneImmeuble:     {type: Schema.Types.ObjectId, ref:"Buildings", required: true },
      partiesCommunePrestataire:  {type: Schema.Types.ObjectId, ref:"Contractors"},
    },
    { timestamps: true }
);

// --- Instance Methods ---

partiesCommunesSchema.method("toJSON", function () {
  const object = this.toObject();
  return formatPartiesCommunes(object);
});

partiesCommunesSchema.method("populateAndTransform", async function () {
    const populatePaths = [
        populationSettingsBuildings('partiesCommuneImmeuble', 'USER'), // Populate partiesCommuneImmeuble with specific fields
        populationSettingsContractors('partiesCommunePrestataire', 'USER'), // Populate partiesCommunePrestataire with specific fields
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

partiesCommunesSchema.statics.Count = async function (filter = {}, limit = 10) {
  try {
    const documents = await this.find(filter).limit(limit);
    const populated = await Promise.all(documents.map(doc =>
        doc.populateAndTransform() // Use toJSON for list performance
    ));
    return populated;
  } catch (error) {
    console.error('Error in PartiesCommunes.Count:', error);
    throw error;
  }
};

partiesCommunesSchema.statics.UpdateById = function (id, update, options = { new: true }) {
    return this.findByIdAndUpdate(id, update, options);
};


module.exports = mongoose.model("PartiesCommunes", partiesCommunesSchema);