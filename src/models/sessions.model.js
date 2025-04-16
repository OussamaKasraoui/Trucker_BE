'use strict';

const mongoose = require("mongoose");
const { Schema } = mongoose;
const { populationSettingsContractors } = require("../utils/consts.utils");
const { formatSession } = require("../utils/formatters.utils"); // Assuming this helper exists for formatting sessions

// Define the session schema
const sessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "Users", required: true, index: true }, // Reference to the user, indexed
    ipAddress: { type: String, required: true }, // IP address of the user
    deviceInfo: { type: String, required: false }, // Device information (User Agent, etc.), made optional
    loginTime: { type: Date, default: Date.now }, // Login timestamp
    logoutTime: { type: Date, default: null }, // Logout timestamp
    lastActivityTime: { type: Date, default: Date.now, index: true }, // Added timestamp for last activity, indexed
    status: {
      type: String,
      enum: ["Active", "Inactive", "Expired"], // Added Expired status
      default: "Active",
      index: true // Indexed for finding active sessions
    },
  },{ timestamps: true });

// --- Instance Methods ---

// Custom toJSON method
sessionSchema.method("toJSON", function () {
  const object = this.toObject();
  return formatSession(object);
});

// Custom populateAndTransform method
sessionSchema.method("populateAndTransform", async function () {
  // Populate user if not already done
  const populatePaths = [
      populationSettingsContractors('userId', 'USER'), // Populate assignedContractor with specific fields
    ];
  
    if (!this.populated(populatePaths[0].path)) {
      await this.populate(populatePaths[0]).execPopulate();
    }

  return this.toJSON();
});

// --- Static Methods ---

// Static method to count active sessions for a user
sessionSchema.statics.FindActiveSessions = async function (userId) { // Renamed from CountActiveSessions
  try {
    const sessions = await this.find({ userId, status: "Active" });
    // Use toJSON for list performance
    return sessions.map(session => session.toJSON());
    // Or use populateAndTransform if needed:
    // const populatedSessions = await Promise.all(
    //   sessions.map((session) => session.populateAndTransform())
    // );
    // return populatedSessions;
  } catch (error) {
    console.error("Error finding active sessions:", error);
    throw error; // Rethrow error
  }
};

// Added standard Count static method
sessionSchema.statics.Count = async function (filter = {}, limit = 10) {
  try {
    // Count usually doesn't need population
    const count = await this.countDocuments(filter);
    return { count };
  } catch (error) {
    console.error('Error in Sessions.Count:', error);
    throw error;
  }
};

// Added standard UpdateById static method
sessionSchema.statics.UpdateById = function (id, update, options = { new: true }) {
    return this.findByIdAndUpdate(id, update, options);
};

// Static method to expire old sessions
sessionSchema.statics.ExpireInactiveSessions = async function (inactiveThresholdDate) {
    try {
        const result = await this.updateMany(
            { status: "Active", lastActivityTime: { $lt: inactiveThresholdDate } },
            { $set: { status: "Expired", logoutTime: new Date() } }
        );
        console.log(`Expired ${result.modifiedCount} inactive sessions.`);
        return result;
    } catch (error) {
        console.error("Error expiring inactive sessions:", error);
        throw error;
    }
};


module.exports = mongoose.model("Sessions", sessionSchema); // Use plural 'Sessions'