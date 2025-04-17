'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose; // Import Schema
const { populationSettingsUsers } = require('../utils/consts.utils');
const { formatNotification } = require('../utils/formatters.utils'); // Assuming this is the correct path


const notificationSchema = new Schema( // Use Schema constructor
  {
    notificationCreator:  { type: Schema.Types.ObjectId, ref: "Users", required: true },
    notificationTitle:    { type: String, required: true }, // Fixed 'require'
    notificationType:     { type: String, required: true, enum: ["success", "info", "warning", "error"]}, // Fixed 'require'
    notificationText:     { type: String, required: true }, // Fixed 'require'
    notificationTarget: [{
      targetUser:     { type: Schema.Types.ObjectId, ref: "Users", required: true },
      targetRead:     { type: Boolean, default: false },
      readAt:         { type: Date } // Added timestamp for when it was read
    }],
    notificationLink:     { type: String } // Optional link for navigation
  }, {timestamps: true,})

// --- Instance Methods ---

notificationSchema.method("toJSON", function (whoIsDemanding = 'USER') {
  const object = this.toObject();
  
  return formatNotification(object, whoIsDemanding);
});

// Added populateAndTransform
notificationSchema.method("populateAndTransform", async function(whoIsDemanding = 'USER') {
    const populatePaths = [
        populationSettingsUsers('notificationCreator', 'USER'), // Populate notificationCreator with specific fields
        // populationSettingsUsers('notificationTarget.targetUser', 'USER'), // Populate targetUser with specific fields
    ];
    


    if (!this.populated(populatePaths[0].path)) {
      await this.populate(populatePaths[0]).execPopulate();
    }

    // if (!this.populated(populatePaths[1].path)) {
    //   await this.populate(populatePaths[1]).execPopulate();
    // }


    return this.toJSON(whoIsDemanding);
});


// --- Static Methods ---

// FindNotifications remains largely the same, but improved error handling and uses toJSON
notificationSchema.statics.FindNotifications = async function(userId, limit = 10, skip = 0){
  try{
    const notifications = await this.find({ 'notificationTarget.targetUser': userId })
      .populate({ path: 'notificationCreator', select: 'userFirstName userLastName' })
      .sort({ createdAt: -1 }) // Sort by creation date descending
      .skip(skip)
      .limit(limit);
      // Removed .lean() to allow use of instance methods like toJSON

    // Map results using toJSON, filtering target array for the specific user
    return notifications.map(element => {
        const jsonElement = element.toJSON();
        // Find the specific target entry for the current user
        const userTarget = element.notificationTarget.find(t => t.targetUser.toString() === userId.toString());
        jsonElement.currentUserTarget = { // Add specific info for the requesting user
            targetRead: userTarget ? userTarget.targetRead : false,
            readAt: userTarget ? userTarget.readAt : null
        };
        // Optionally remove the full target array if not needed by frontend
        // delete jsonElement.notificationTarget;
        return jsonElement;
    });

  } catch(err){
    console.error("Error in Notification.FindNotifications:", err);
    throw err; // Rethrow the error
  }
}

// MarkNotifications - Added readAt timestamp
notificationSchema.statics.MarkNotifications = async function(notificationId, targetUserId){
  try {
      return await this.findOneAndUpdate(
        {
          '_id': notificationId,
          'notificationTarget.targetUser': targetUserId,
          'notificationTarget.targetRead': false // Only update if not already read
        },
        {
            $set: {
                'notificationTarget.$.targetRead': true,
                'notificationTarget.$.readAt': new Date() // Set read timestamp
            }
        },
        { new: true } // Return the updated document
      );
  } catch (err) {
      console.error("Error in Notification.MarkNotifications:", err);
      throw err;
  }
}

// unsubscribeNotifications remains the same, added error handling
notificationSchema.statics.unsubscribeNotifications = async function(notificationId, targetUserId){
  try {
      return await this.findOneAndUpdate(
        {
          '_id': notificationId,
          'notificationTarget.targetUser': targetUserId
        },
        { $pull: { 'notificationTarget': { 'targetUser': targetUserId } } },
        { new: true }
      );
  } catch (err) {
      console.error("Error in Notification.unsubscribeNotifications:", err);
      throw err;
  }
}

// Added standard Count static method
notificationSchema.statics.Count = async function (filter = {}, limit = 10, whoIsDemanding = 'USER') {
  try {
    // Count typically doesn't need population/transformation
    // const count = await this.countDocuments(filter);
    // If you need the documents:
    const documents = await this.find(filter).limit(limit);
    const populated = await Promise.all(documents.map(doc =>
      doc.populateAndTransform(whoIsDemanding) // Use toJSON for list performance
    ));
    return populated;
  } catch (error) {
    console.error('Error in Notifications.Count:', error);
    throw error;
  }
};

// Added standard UpdateById static method
notificationSchema.statics.UpdateById = function (id, update, options = { new: true }) {
    return this.findByIdAndUpdate(id, update, options);
};


module.exports = mongoose.model('Notifications', notificationSchema); // Use plural 'Notifications'