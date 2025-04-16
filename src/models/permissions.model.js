'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;
const { formatPermission } = require('../utils/formatters.utils');

const PermissionSchema = new Schema({
  // permissionRoles seems redundant if Roles link to Permissions. Keep removed.
  permissionName:             { type: String, required: true, unique: true },
  permissionDescription:      { type: String, default: null },
  permissionContext:          { type: String, required: true, index: true }, // e.g., 'Apartments', 'Billing', 'Users'
  permissionAction:           { type: String, required: true, index: true }, // e.g., 'Create', 'Read', 'Update', 'Delete', 'Approve'
  // --- Add this field back ---
  permissionPayload:          { type: String, required: true, index: true }, // Crucial for role assignment logic
  // --- End of added field ---
}, { timestamps: true }); // Added timestamps

// Compound index for faster lookups
PermissionSchema.index({ permissionContext: 1, permissionAction: 1 });

// --- Instance Methods ---

PermissionSchema.method("toJSON", function () {
  const object = this.toObject();
  return formatPermission(object);
});

PermissionSchema.method("populateAndTransform", async function () {
    // No population needed based on current schema refs
    return this.toJSON();
});

// --- Static Methods ---

PermissionSchema.statics.Count = async function (filter = {}, limit = 100) { // Higher limit for permissions?
  try {
    const documents = await this.find(filter).limit(limit);
    const populated = await Promise.all(documents.map(doc =>
      doc.populateAndTransform() // Use toJSON for list performance
    ));
    return populated;
  } catch (error) {
    console.error('Error in Permissions.Count:', error);
    throw error;
  }
};

PermissionSchema.statics.UpdateById = function (id, update, options = { new: true }) {
    return this.findByIdAndUpdate(id, update, options);
};

// Helper static method to find permissions by context/action
PermissionSchema.statics.FindByContextAction = function (context, action) {
    return this.find({ permissionContext: context, permissionAction: action });
};


module.exports = mongoose.model("Permissions", PermissionSchema);