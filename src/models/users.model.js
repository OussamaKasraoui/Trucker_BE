'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;
const { populationSettingsPacks, populationSettingsRoles } = require('../utils/consts.utils');
const { formatUser } = require('../utils/formatters.utils');
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing

// Define the users schema with required fields
const usersSchema = new Schema({
  userFirstName:  { type: String, required: true, trim: true },
  userLastName:   { type: String, required: true, trim: true },
  userAddress:    { type: String, required: false },
  userPhone:      { type: String, required: false }, // Consider validation
  userEmail:      {
      type: String,
      required: true,
      unique: true,
      lowercase: true, // Store emails consistently
      trim: true,
      match: [/\S+@\S+\.\S+/, 'is invalid'] // Basic email format validation
  },
  userPassword:   { type: String, required: true, minlength: 8, select: false }, // select: false hides by default
  userStatus:     { type: String, enum: ['Pending', 'OnHold', 'Active', 'Inactive', 'Suspended'], default: "Pending" },
  userRoles:      [{ type: Schema.Types.ObjectId, ref: "Roles", default: null }], // Reference to Role
  userPack:       { type: Schema.Types.ObjectId, ref: "Packs", required: true }, // Reference to Pack
  lastLogin:      { type: Date }, // Track last login time
}, { timestamps: true });

// --- Middleware ---

// Hash password before saving
usersSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('userPassword')) return next();

  // --- Add Logs Here ---
  console.log(`[Pre-Save Hook] Hashing password for user: ${this.userEmail}`);
  console.log(`[Pre-Save Hook] Plain text password received: '${this.userPassword}'`); // Log the plain text
  // --- End Logs ---

  try {
    const salt = await bcrypt.genSalt(10);
    this.userPassword = await bcrypt.hash(this.userPassword, salt);

    // --- Add Log Here ---
    console.log(`[Pre-Save Hook] Hashed password generated: ${this.userPassword}`); // Log the generated hash
    // --- End Log ---

    next();
  } catch (err) {
// --- Add Log Here ---
    console.error(`[Pre-Save Hook] Error hashing password for ${this.userEmail}:`, err);
    // --- End Log ---
    next(err);
  }
});

// --- Instance Methods ---

// Method to compare password for login
usersSchema.methods.comparePassword = async function (candidatePassword) {
    // Need to fetch the password explicitly since it's select: false
    const userWithPassword = await this.constructor.findById(this._id).select('+userPassword').exec();
    if (!userWithPassword) {
        throw new Error('User not found during password comparison.');
    }
    
  // --- Add Logs Here ---
  console.log(`[ComparePassword] Comparing for user: ${this.userEmail}`);
  console.log(`[ComparePassword] Candidate password received: '${candidatePassword}'`);
  console.log(`[ComparePassword] Stored hash from DB: ${userWithPassword.userPassword}`);
  // --- End Logs ---

  const isMatch = await bcrypt.compare(candidatePassword, userWithPassword.userPassword);

  // --- Add Log Here ---
  console.log(`[ComparePassword] bcrypt.compare result: ${isMatch}`);
  // --- End Log ---

  return isMatch;
};

// Custom toJSON method to modify the response structure
usersSchema.method("toJSON", function (whoIsDemanding = 'USER') {
  const object = this.toObject();
  return formatUser(object, whoIsDemanding);
});

// Custom populateAndTransform method for custom populated structure
usersSchema.method("populateAndTransform", async function (whoIsDemanding = 'USER') {
  
  // Populate related fields
  const populatePaths = [
    populationSettingsPacks('userPack', 'USER'), // Populate userPack with specific fields
    populationSettingsRoles('userRoles', whoIsDemanding), // Populate userRoles with specific fields
  ];

  // Populate related fields
  if (!this.populated(populatePaths[0].path)) {
    await this.populate(populatePaths[0]).execPopulate();
  }

  if (!this.populated(populatePaths[1].path)) {
    await this.populate(populatePaths[1]).execPopulate();
  }

  // Return the transformed document using toJSON
  return this.toJSON(whoIsDemanding);
});

// --- Static Methods ---

// Static method to count records by criteria
usersSchema.statics.Count = async function (filter = {}, limit = 10) { // Made async
  try {
    const documents = await this.find(filter).limit(limit);
    const populated = await Promise.all(documents.map(doc =>
      doc.populateAndTransform() // Use toJSON for list performance
    ));
    return populated;
  } catch (error) {
    console.error('Error in Users.Count:', error);
    throw error;
  }
};

// Static method to update by ID
usersSchema.statics.UpdateById = function (id, update, options = { new: true }) {
  // Be careful about updating passwords directly here, pre-save hook won't run on findByIdAndUpdate by default
  // If updating password, fetch the user, set password, then save() or handle hashing manually.
  return this.findByIdAndUpdate(id, update, options);
};

// Static method to find by email
usersSchema.statics.FindByEmail = function (email) {
    return this.findOne({ userEmail: email.toLowerCase() });
};


module.exports = mongoose.model('Users', usersSchema);