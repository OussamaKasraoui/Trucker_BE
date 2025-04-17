'use strict';
const mongoose = require("mongoose");
const { Schema } = mongoose; // Use Schema
const { formatPack } = require("../utils/formatters.utils"); // Import formatPack for formatting

const PackSchema = Schema({ // Use Schema constructor
  packName : {type: String, required: true, unique: true }, // Added unique constraint

  packDesc :    [{
    DOM: {type: String, required: true, default : 'p'},
    text: {type: String, required: true, default : 'Lorem Ipsum Manda Cabana ... etc'}
  }],
  packOptions:  { // Consider defining sub-schema for better structure/validation
    contracts:  { type: Number, required: false, min: 0 },
    agreements: { type: Number, required: false, min: 0 },
    sites:      { type: Number, required: false, min: 0 },
    buildings:  { type: Number, required: false, min: 0 },
    apartments: { type: Number, required: false, min: 0 },
    staff:      { type: Number, required: false, min: 0 },
    support:    { type: Boolean, default: true, required: false },
    features:   { type: Schema.Types.Mixed, required: false } // Use Mixed with caution
  },
  packPrice:    { // Consider defining sub-schema
    price: {type: Number, required: true, min: 0 }, // Made price required
    discount: {type: Number, required: false, default: 0, min: 0, max: 100 } // Discount as percentage 0-100
  },
  packStatus:   {type: String, enum: ['Active', 'Inactive', 'OnHold'], default: 'Active'}, // Added default
  packType:     {type: String, enum: ['Basic', 'Business', 'Premium'], required: true }, // Made type required

  // packContexts seems to store permission context names? Consider linking to Permissions model if applicable
  packContexts: [{ type: String, default: null }]
}, {timestamps: true});

// --- Instance Methods ---

PackSchema.method("toJSON", function (whoIsDemanding="USER") {
  const object = this.toObject();
  return formatPack(object, whoIsDemanding);
});

// Added populateAndTransform (currently no refs to populate)
PackSchema.method("populateAndTransform", function (whoIsDemanding="USER") {
    // No population needed based on current schema refs
    return this.toJSON(whoIsDemanding);
});

// --- Static Methods ---

// Added Count static method
PackSchema.statics.Count = async function (filter = {}, limit = 10) {
  try {
    const documents = await this.find(filter).limit(limit);
    const populated = await Promise.all(documents.map(doc =>
      doc.populateAndTransform(whoIsDemanding) // Use toJSON for list performance
    ));
    return populated;
  } catch (error) {
    console.error('Error in Packs.Count:', error);
    throw error;
  }
};

// Added UpdateById static method
PackSchema.statics.UpdateById = function (id, update, options = { new: true }) {
    return this.findByIdAndUpdate(id, update, options);
};


module.exports= mongoose.model('Packs', PackSchema);