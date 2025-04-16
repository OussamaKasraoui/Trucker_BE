'use strict';

const mongoose = require("mongoose");
const { Schema } = mongoose;
const { populationSettingsContractors, 
        populationSettingsMissions, 
        populationSettingsUsers, 
        populationSettingsAgreements, 
        populationSettingsTasks, 
        populationSettingsReserveFunds } = require("../utils/consts.utils");
const { formatDepense } = require('../utils/formatters.utils'); // Assuming this helper exists for depenses

const depensesSchema = Schema(
    {
      depenseName:          { type: String, required: true },
      // Removed duplicate depenseType field
      depenseType:          { // Use this definition
        type: String,
        enum: ['Ordinary', 'Extraordinary', 'Reserve'], // Added 'Reserve'
        required: true
      },
      depenseMontant:       { type: Number, required: true, min: 0 }, // Ensure non-negative
      depenseDate:          { type: Date, required: true },
      depenseStuff:         { type: Schema.Types.ObjectId, ref: "Users" }, // Changed ref to Users (assuming 'Stuff' means user)
      depenseDocuments:     [{ // Changed to array for multiple documents
          name: { type: String, required: true },
          url: { type: String, required: true },
          type: { type: String } // e.g., 'Invoice', 'Receipt'
      }],
      // depenseDocType:       { type: String, required: true }, // Removed, incorporated into depenseDocuments array
      depenseBenificiaire:  { type: Schema.Types.ObjectId, ref: "Contractors" }, // Changed ref to Contractors (assuming Prestataires maps to Contractors)
      depenseMission:       { type: Schema.Types.ObjectId, ref: "Missions" },
      depenseTask:          { type: Schema.Types.ObjectId, ref: "Tasks" },
      // New fields for Law 18.00 compliance
      reserveFundSource:    { type: Schema.Types.ObjectId, ref: 'ReserveFunds', required: function() { return this.depenseType === 'Reserve'; } }, // Required only if type is 'Reserve'
      agreement:            { type: Schema.Types.ObjectId, ref: 'Agreements', required: true } // Link expense to a specific agreement
    },
    { timestamps: true }
);

// --- Instance Methods ---

depensesSchema.method("toJSON", function () {
  const object = this.toObject();
  return formatDepense(object);
});

depensesSchema.method("populateAndTransform", async function () {
    const populatePaths = [
      populationSettingsUsers('depenseStuff', 'USER'), // Populate depenseStuff with specific fields
      populationSettingsContractors('depenseBenificiaire', 'USER'), // Populate depenseBenificiaire with specific fields
      populationSettingsMissions('depenseMission', 'USER'), // Populate depenseMission with specific fields
      populationSettingsTasks('depenseTask', 'USER'), // Populate depenseTask with specific fields
      populationSettingsReserveFunds('reserveFundSource', 'USER'), // Populate reserveFundSource with specific fields
      populationSettingsAgreements('agreement', 'USER'), // Populate agreement with specific fields
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
  
      if (!this.populated(populatePaths[5].path)) {
        await this.populate(populatePaths[5]).execPopulate();
      }
    

    return this.toJSON();
});

// --- Static Methods ---

depensesSchema.statics.Count = async function (filter = {}, limit = 10) {
  try {
    const documents = await this.find(filter).limit(limit);
    const populated = await Promise.all(documents.map(doc =>
        doc.populateAndTransform() // Use toJSON for list performance
    ));
    return populated;
  } catch (error) {
    console.error('Error in Depenses.Count:', error);
    throw error;
  }
};

depensesSchema.statics.UpdateById = function (id, update, options = { new: true }) {
    return this.findByIdAndUpdate(id, update, options);
};


module.exports = mongoose.model("Depenses", depensesSchema);