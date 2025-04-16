'use strict';

const mongoose = require("mongoose");
const { populationSettingsContractors, populationSettingsSites } = require("../utils/consts.utils");
const { Schema } = mongoose; // Use Schema
const { formatMission } = require("../utils/formatters.utils");


const missionsSchema = Schema(
    {
      missionName:        {type: String, required: true},
      missionDetails:     {type: String, required: false}, // Made optional
      missionType:        {type: String, required: true}, // Consider enum
      missionPrice:       {type: Number, required: false, min: 0},
      missionContractor:  {type: Schema.Types.ObjectId, ref: "Contractors", required: true},
      missionSite:        {type: Schema.Types.ObjectId, ref: "Sites", required: true },
      missionState:       {type: String, required: true, enum: ['Planned', 'InProgress', 'Completed', 'Cancelled', 'OnHold'], default: 'Planned'} // Changed to String enum
    },
    { timestamps: true }
);

// --- Instance Methods ---

missionsSchema.method("toJSON", function () {
  const object = this.toObject();
  return formatMission(object);
});

missionsSchema.method("populateAndTransform", async function () {

    const populatePaths = [
      populationSettingsContractors('missionContractor', 'USER'), // Populate missionContractor with specific fields
      populationSettingsSites('missionSite', 'USER'), // Populate missionSite with specific fields
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

missionsSchema.statics.Count = async function (filter = {}, limit = 10) {
  try {
    const documents = await this.find(filter).limit(limit);
    const populated = await Promise.all(documents.map(doc =>
        doc.populateAndTransform() // Use toJSON for list performance
    ));
    return populated;
  } catch (error) {
    console.error('Error in Missions.Count:', error);
    throw error;
  }
};

missionsSchema.statics.UpdateById = function (id, update, options = { new: true }) {
    return this.findByIdAndUpdate(id, update, options);
};


module.exports = mongoose.model("Missions", missionsSchema);