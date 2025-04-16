'use strict';

const mongoose = require("mongoose");
const { Schema } = mongoose;
const { populationSettingsUsers, populationSettingsMissions, populationSettingsSites, populationSettingsApartments } = require("../utils/consts.utils");
const { formatTask } = require("../utils/formatters.utils"); // Assuming this is the correct path


const tasksSchema = Schema(
    {
      taskName:     {type: String, required: true},
      taskDetail:   {type: String, required: false}, // Made optional
      taskType:     {type: String, required: true}, // Consider enum
      taskStart:    {type: Date, required: false}, // Made optional
      taskEnd:      {type: Date, required: false}, // Made optional
      taskSeverity: {type: String, required: true, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium'}, // Changed to String enum
      taskNotes:    [{ // Changed to object array for structure
          note: { type: String, required: true },
          author: { type: Schema.Types.ObjectId, ref: "Users" },
          createdAt: { type: Date, default: Date.now }
      }],
      taskPrice:    {type: Number, required: false, min: 0}, // Changed to Number
      // Assuming 'Stuffs' maps to 'Staff' model
      taskStuff:    [{ type: Schema.Types.ObjectId, ref: "Staff" }], // Changed ref to Staff
      taskMission:  { type: Schema.Types.ObjectId, ref: "Missions" }, // Optional link to mission
      taskSite:     { type: Schema.Types.ObjectId, ref: "Sites", required: true }, // Site is likely required
      taskState:    {type: String, required: true, enum: ['Todo', 'InProgress', 'Done', 'Cancelled', 'OnHold'], default: 'Todo'}, // Changed to String enum
      relatedApartment: { type: Schema.Types.ObjectId, ref: "Apartments" } // Optional link to specific apartment
    },
    { timestamps: true }
);

// --- Instance Methods ---

tasksSchema.method("toJSON", function () {
  const object = this.toObject();
  return formatTask(object);
});

tasksSchema.method("populateAndTransform", async function () {
    const pathsToPopulate = [
      populationSettingsUsers('taskNotes.author', 'USER'), // Populate taskStuff with specific fields
      populationSettingsUsers('taskStuff', 'USER'), // Populate taskStuff with specific fields
      populationSettingsMissions('taskMission', 'USER'), // Populate taskMission with specific fields
      populationSettingsSites('taskSite', 'USER'), // Populate taskSite with specific fields
      populationSettingsApartments('relatedApartment', 'USER'), // Populate relatedApartment with specific fields
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
  
      if (!this.populated(populatePaths[3].path)) {
        await this.populate(populatePaths[3]).execPopulate();
      }
  
      if (!this.populated(populatePaths[4].path)) {
        await this.populate(populatePaths[4]).execPopulate();
      }
      

    return this.toJSON();
});

// --- Static Methods ---

tasksSchema.statics.Count = async function (filter = {}, limit = 10) {
  try {
    const documents = await this.find(filter).limit(limit);
    const populated = await Promise.all(documents.map(doc =>
      doc.populateAndTransform() // Use toJSON for list performance
    ));
    return populated;
  } catch (error) {
    console.error('Error in Tasks.Count:', error);
    throw error;
  }
};

tasksSchema.statics.UpdateById = function (id, update, options = { new: true }) {
    return this.findByIdAndUpdate(id, update, options);
};


module.exports = mongoose.model("Tasks", tasksSchema);