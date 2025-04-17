'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;
const { populationSettingsUsers } = require('../utils/consts.utils');
const { formatTwoFA } = require('../utils/formatters.utils'); // Assuming you have a helper for formatting TwoFA

// 2FA Schema
const twoFASchema = new Schema(
  {
    twoFAUser:            { type: Schema.Types.ObjectId, ref: 'Users', required: true, unique: true, index: true }, // User should be unique
    twoFAPassCode:        [{ // Store history of passcodes
      _id: { type: Schema.Types.ObjectId, auto: true }, // Ensure subdocs have IDs
      passCodeSecret:           { type: String, required: true }, // The hashed secret or reference
      passCodeExpiresAt:        { type: Date, required: true },
      passCodeGeneratedAt:      { type: Date, required: true, default: Date.now },
      passCodeStatus:           { type: String, enum: ['Pending', 'Verified', 'Expired'], default: 'Pending', required: true },
      verificationAttempts:     { type: Number, default: 0 } // Track attempts for a specific code
    }],
    twoFAFailedAttempts:  { type: Number, default: 0 }, // Overall failed attempts counter (consider resetting logic)
    twoFALastGeneratedAt: { type: Date, required: false }, // When the last *active* code was generated
    twoFAStatus:          { type: String, enum: ['Pending', 'Verified', 'Disabled'], default: 'Pending', required: true }, // Added 'Disabled'
    twoFAMethod:          { type: String, enum: ['Email', 'SMS', 'App'], default: 'Email' } // Added method type
  }, { timestamps: true });

// --- Instance Methods ---

// Custom toJSON method to modify the response structure
twoFASchema.method("toJSON", function (whoIsDemanding = 'USER') {
  const object = this.toObject();
  return formatTwoFA(object, whoIsDemanding);
});

// Custom populateAndTransform method to handle population
twoFASchema.method("populateAndTransform", async function(whoIsDemanding = 'USER') {
  // Populate user if not already done
  const populatePaths = [
    populationSettingsUsers('twoFAUser', 'USER'), // Populate taskStuff with specific fields
  ];

  if (!this.populated(populatePaths[0].path)) {
    await this.populate(populatePaths[0]).execPopulate();
  }

  return this.toJSON(whoIsDemanding);
});

// --- Static Methods ---

// Static method for counting TwoFA entries
twoFASchema.statics.Count = async function (filter = {}, limit = 10, whoIsDemanding = 'USER') {
  try {
    const documents = await this.find(filter).limit(limit);
    const populated = await Promise.all(documents.map(doc =>
      doc.populateAndTransform(whoIsDemanding) // Use toJSON for list performance
    ));
    return populated;
  } catch (error) {
    console.error('Error in TwoFA.Count:', error);
    throw error; // Rethrow error
  }
};

// Static method to update by User ID (more common than updating by TwoFA doc ID)
twoFASchema.statics.UpdateByUser = async function (userId, update, options = { new: true, upsert: false }) { // Added upsert option
  try {
    const twoFA = await this.findOneAndUpdate({ twoFAUser: userId }, update, options);
    return twoFA; // Return the updated document (or null if not found and upsert is false)
  } catch (error) {
    console.error(`Error updating TwoFA for user ${userId}:`, error);
    throw error; // Rethrow error
  }
}

// Static method to find by User ID
twoFASchema.statics.FindByUser = async function (userId) {
  try {
    const twoFA = await this.findOne({ twoFAUser: userId }); //.exec(); // exec() is optional with await
    return twoFA; // Return the raw document or null
  } catch (error) {
    console.error(`Error finding TwoFA for user ${userId}:`, error);
    throw error; // Rethrow error
  }
}

// 2FA Model
module.exports = mongoose.model('TwoFA', twoFASchema);