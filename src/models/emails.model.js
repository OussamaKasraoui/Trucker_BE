'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

// Email Schema
const emailSchema = new Schema(
  {
    emailSubject:      { type: String, required: true, trim: true },
    emailBody:         { type: String, required: true },
    emailRecipient:    [{ type: String, required: true }], // Assuming recipients are email strings
    emailSender:       { type: String, default: 'system', trim: true }, // Could be an email or system identifier
    emailStatus:       { type: String, enum: ['pending', 'sent', 'failed', 'scheduled'], default: 'pending' },
    emailSentAt:       { type: Date, required: false }, // Changed to Date
    emailScheduledAt:  { type: Date, required: false }, // Changed to Date
    emailRetryCount:   { type: Number, default: 0, min: 0 },
    emailLastError:    { type: String }, // Store last error message on failure
    emailAttachments:  [{
        fileName: { type: String, required: true },
        fileType: { type: String, required: true }, // MIME type
        fileUrl: { type: String, required: true } // URL or path to the attachment
    }]
  }, { timestamps: true });

// --- Instance Methods ---

// Custom toJSON method to modify the response structure
emailSchema.method("toJSON", function (whoIsDemanding = 'USER') {
  const object = this.toObject();
  return object  //formatEmail(object);
});

// Custom populateAndTransform method - No refs to populate in this schema currently
emailSchema.method("populateAndTransform", async function(whoIsDemanding = 'USER') {
  // No population needed based on current schema refs
  // If refs were added (e.g., to a User who triggered the email), populate here:
  // if (!this.populated('triggeringUser')) {
  //     await this.populate({ path: 'triggeringUser', select: 'userEmail' });
  // }
  return this.toJSON(whoIsDemanding); // Return the transformed document
});

// --- Static Methods ---

// Static method for counting and retrieving emails
emailSchema.statics.Count = async function (filter = {}, limit = 10, whoIsDemanding = 'USER') {
  try {
    // Fetch emails based on filter and limit
    const emails = await this.find(filter).limit(limit).sort({ createdAt: -1 }); // Example sort
    // Use toJSON for each email as populateAndTransform is basic here
    const populated = await Promise.all(emails.map(doc =>
      doc.populateAndTransform(whoIsDemanding) // Use toJSON for list performance
    ));
    return populated;
  } catch (error) {
    console.error('Error in Email.Count:', error);
    throw error; // Rethrow error
  }
};

// Static method UpdateById: Finds by ID and updates
emailSchema.statics.UpdateById = function (id, update, options = { new: true }) {
    return this.findByIdAndUpdate(id, update, options);
};


module.exports = mongoose.model('Emails', emailSchema); // Use plural 'Emails' for consistency