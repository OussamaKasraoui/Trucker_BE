'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const { formatAgreement } = require('../utils/formatters.utils'); // Self-reference not usually needed here
const { populationSettingsContracts, populationSettingsSites, populationSettingsContractors, populationSettingsStaff, populationSettingsServices } = require('../utils/consts.utils');

const agreementsSchema = new Schema(
  {
    agreementContract: { type: Schema.Types.ObjectId, ref: 'Contracts', required: true },
    agreementSite: { type: Schema.Types.ObjectId, ref: 'Sites', required: true },

    agreementContractor: [{ type: Schema.Types.ObjectId, ref: 'Contractors', required: true }],
    agreementTerm: { type: String, required: true, enum: ['half-yearly', 'quarterly', 'annually', 'custom'], default: 'annually' },

    // --- Updated Date Types ---
    agreementStart: { type: Date, required: true }, // Changed from String to Date
    agreementEnd: { type: Date, required: true },   // Changed from String to Date
    // --- End Update ---

    agreementBoardMembers: {
      syndic: { type: Schema.Types.ObjectId, ref: 'Staff', default: null },
      adjoint: { type: Schema.Types.ObjectId, ref: 'Staff', default: null },
      tresorier: { type: Schema.Types.ObjectId, ref: 'Staff', default: null },
      members: [{ type: Schema.Types.ObjectId, ref: 'Staff', default: null }],
    },

    agreementServicesIncluded: { type: Boolean, required: true, default: false },
    agreementServices: [{ type: Schema.Types.ObjectId, ref: 'Services' }],

    agreementBudget: { type: Number, default: null },

    agreementStatus: { type: Boolean, required: true, default: true },

    // New fields for Law 18.00 compliance
    reserveFundSettings: {
     contributionRate: { type: Number, default: 5, min: 0, max: 100 }, // Default 5% contribution rate towards reserve fund
     minBalance: { type: Number, default: 0, min: 0 } // Minimum required balance for the reserve fund
    },

    legalDocuments: [{
      name: String,
      type: { type: String, enum: ['MeetingMinutes', 'VoteResult'] }, // Added enum for clarity
      url: String // Consider validation for URL format
    }],


    quorumRules: {
       ordinary: { type: Number, default: 50, min: 0, max: 100 }, // Default 50% quorum for ordinary decisions
       extraordinary: { type: Number, default: 75, min: 0, max: 100 } // Default 75% quorum for extraordinary decisions
     }
  }, { timestamps: true });

// --- Middleware ---
// Example: Add pre-save validation for dates if needed
agreementsSchema.pre('save', function(next) {
  if (this.agreementEnd && this.agreementStart && this.agreementEnd < this.agreementStart) {
    next(new Error('Agreement end date cannot be before the start date.'));
  } else {
    next();
  }
});


// --- Instance Methods ---

// Custom toJSON method (simplified, relies on populateAndTransform for complex formatting)
agreementsSchema.method("toJSON", function (whoIsDemanding = 'USER') {
  const object = this.toObject();
  return formatAgreement(object, whoIsDemanding);
});

// Custom populateAndTransform method (kept complex population logic)
agreementsSchema.method('populateAndTransform', async function () {
    const populatePaths = [
      populationSettingsContracts ('agreementContract', 'USER'), 
      populationSettingsSites('agreementSite', 'USER'),
      populationSettingsContractors('agreementContractor', 'USER'),
      populationSettingsStaff('agreementBoardMembers.syndic', 'USER'),
      populationSettingsStaff('agreementBoardMembers.adjoint', 'USER'),
      populationSettingsStaff('agreementBoardMembers.tresorier', 'USER'),
      populationSettingsStaff('agreementBoardMembers.members', 'USER'),
      populationSettingsServices('agreementServices', 'USER'),
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

    if (!this.populated(populatePaths[6].path)) {
      await this.populate(populatePaths[6]).execPopulate();
    }

    if (!this.populated(populatePaths[7].path)) {
      await this.populate(populatePaths[7]).execPopulate();
    }

    return this.toJSON(whoIsDemanding);
});

// --- Static Methods ---

// Static method for counting and populating Agreements (using populateAndTransform)
agreementsSchema.statics.Count = async function (filter = {}, limit = null, whoIsDemanding = 'USER') { // Added defaults
  try {
    const query = this.find(filter);
    if (limit !== null) {
      query.limit(limit);
    }
    const agreements = await query.exec();

    // Use populateAndTransform for each agreement
    const populatedAgreements = await Promise.all(
        agreements.map(agreement => agreement.populateAndTransform(whoIsDemanding))
    );

    return populatedAgreements;
  } catch (error) {
    console.error('Error during Agreement population in Count:', error);
    throw error; // Re-throw for controller handling
  }
};

// Static method to update by ID
agreementsSchema.statics.UpdateById = function (id, update, options = { new: true, runValidators: true }) { // Added defaults
  return this.findByIdAndUpdate(id, update, options);
};

// Agreements Model
module.exports = mongoose.model('Agreements', agreementsSchema);