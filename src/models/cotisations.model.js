'use strict';

const mongoose = require("mongoose");
const { Schema } = mongoose;
const { populationSettingsApartments, populationSettingsUsers, populationSettingsOwnershipShares } = require("../utils/consts.utils");
const { formatCotisation } = require('../utils/formatters.utils');


const cotisationsSchema = Schema(
    {
      cotisationType:         { type: String, required: true }, // e.g., 'Quarterly Dues', 'Special Assessment'
      cotisationAppartment:   { type: Schema.Types.ObjectId, ref: "Apartments", required: true }, // Corrected ref
      cotisationMoyPaiement:  { type: String, required: true }, // e.g., 'Bank Transfer', 'Cash'
      cotisationMontant:      { type: Number, required: true, min: 0 }, // Total amount, ensure non-negative
      cotisationStuff:        { type: Schema.Types.ObjectId, ref: "Users" }, // User/staff who recorded it
      cotisationMotif:        { type: String, required: false }, // Reason/Description (Made optional)
      paymentStatus:          { type: String, enum: ['Pending', 'Paid', 'Overdue', 'Cancelled'], default: 'Pending' }, // Added payment status
      dueDate:                { type: Date }, // Optional due date
      // New fields for Law 18.00 compliance
      breakdown: { // Breakdown of the total amount
        ordinary: { type: Number, required: true, default: 0, min: 0 }, // Portion for ordinary expenses
        extraordinary: { type: Number, default: 0, min: 0 }, // Portion for extraordinary expenses
        reserve: { type: Number, default: 0, min: 0 } // Portion contributed to the reserve fund
      },
      ownershipShare: { type: Schema.Types.ObjectId, ref: 'OwnershipShares', required: true } // Link to the specific ownership record
    },
    { timestamps: true }
);

// --- Middleware ---

// Validation to ensure breakdown sums to total amount
cotisationsSchema.pre('save', function (next) {
   // Only validate breakdown if the breakdown object itself or the total amount is modified
   if (this.isModified('breakdown') || this.isModified('cotisationMontant')) {
       const breakdownTotal = (this.breakdown.ordinary || 0) + (this.breakdown.extraordinary || 0) + (this.breakdown.reserve || 0);
       // Use a small tolerance for floating point comparisons
       if (Math.abs(breakdownTotal - this.cotisationMontant) > 0.001) {
           return next(new Error(`Cotisation breakdown (${breakdownTotal}) must sum up to the total cotisationMontant (${this.cotisationMontant}).`));
       }
       // If breakdown is all zero but amount is positive, default to ordinary (optional logic)
       // if (this.cotisationMontant > 0 && breakdownTotal === 0) {
       //    this.breakdown.ordinary = this.cotisationMontant;
       // }
   }
   next();
 });

// --- Instance Methods ---

cotisationsSchema.method("toJSON", function () {
  const object = this.toObject();
  return formatCotisation(object);
});

cotisationsSchema.method("populateAndTransform", async function () {
    const populatePaths = [
        populationSettingsApartments('cotisationAppartment', 'USER'),
        populationSettingsUsers('cotisationStuff', 'USER'), // Populate cotisationStuff with specific fields
        populationSettingsOwnershipShares('ownershipShare', 'USER'), // Populate ownershipShare with specific fields
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
      

    return this.toJSON();
});

// --- Static Methods ---

cotisationsSchema.statics.Count = async function (filter = {}, limit = 10) {
  try {
    const documents = await this.find(filter).limit(limit);
    const populated = await Promise.all(documents.map(doc =>
        // doc.toJSON() // Use toJSON for list performance
        doc.populateAndTransform() // Use if full transformation needed
    ));
    return populated;
  } catch (error) {
    console.error('Error in Cotisations.Count:', error);
    throw error;
  }
};

cotisationsSchema.statics.UpdateById = function (id, update, options = { new: true }) {
    return this.findByIdAndUpdate(id, update, options);
};


module.exports = mongoose.model("Cotisations", cotisationsSchema);