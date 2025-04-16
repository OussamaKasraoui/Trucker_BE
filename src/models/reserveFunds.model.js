'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;
const { populationSettingsAgreements } = require('../utils/consts.utils');
const { formatReserveFunds } = require('../utils/formatters.utils'); // Assuming this helper exists

const reserveFundsSchema = new Schema({
  agreement: { type: Schema.Types.ObjectId, ref: 'Agreements', required: true, unique: true, index: true }, // Each agreement has one reserve fund
  currentBalance: { type: Number, default: 0, min: 0 },
  transactions: [{
    _id: { type: Schema.Types.ObjectId, auto: true }, // Ensure transactions have IDs
    type: {
        type: String,
        enum: ['Contribution', 'Withdrawal', 'Interest', 'Adjustment'], // Added Adjustment type
        required: true
    },
    amount: { type: Number, required: true }, // Positive for Contribution/Interest/Adjustment, Negative for Withdrawal
    description: { type: String, required: false }, // Optional description for clarity
    reference: { type: Schema.Types.ObjectId, refPath: 'transactions.refModel' }, // Links to Cotisations/Depenses/etc.
    refModel: { type: String, enum: ['Cotisations', 'Depenses', 'ManualAdjustment'] }, // Added ManualAdjustment
    date: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// --- Middleware ---

// Pre-save hook to update balance and validate withdrawals
reserveFundsSchema.pre('save', async function(next) {
  // Only recalculate if transactions are modified
  if (this.isModified('transactions')) {
    // Recalculate balance based on all transactions
    let calculatedBalance = 0;
    this.transactions.forEach(tx => {
      // Ensure amount sign is correct based on type logic
      if ((tx.type === 'Contribution' || tx.type === 'Interest' || tx.type === 'Adjustment') && tx.amount < 0) {
         console.warn(`Reserve Fund ${this._id}, Tx (${tx._id}): Positive transaction type ${tx.type} has negative amount ${tx.amount}. Using absolute value.`);
         calculatedBalance += Math.abs(tx.amount);
      } else if (tx.type === 'Withdrawal' && tx.amount > 0) {
         console.warn(`Reserve Fund ${this._id}, Tx (${tx._id}): Withdrawal transaction type has positive amount ${tx.amount}. Using negative value.`);
         calculatedBalance -= Math.abs(tx.amount);
      } else if (tx.type === 'Withdrawal' && tx.amount < 0) {
         calculatedBalance += tx.amount; // Amount is already negative
      } else if (tx.type !== 'Withdrawal' && tx.amount >= 0) {
         calculatedBalance += tx.amount; // Amount is positive or zero
      } else {
         // Should not happen with enum validation, but good to log
         console.error(`Reserve Fund ${this._id}, Tx (${tx._id}): Unexpected amount ${tx.amount} for type ${tx.type}. Ignoring transaction in balance calculation.`);
      }
    });
    // Round to avoid floating point issues (e.g., to 2 decimal places)
    this.currentBalance = Math.round(calculatedBalance * 100) / 100;

    // --- Minimum Balance Validation ---
    // This validation is tricky in pre-save because it requires the related Agreement.
    // Option 1: Populate here (less performant, done below).
    // Option 2: Perform validation in the service layer *before* saving. (Recommended)
    // Option 3: Pass the minBalance value during the operation that modifies transactions.

    // Option 1 Implementation (use with caution):
    try {
      // Populate agreement only if needed and not already populated

      if (!this.populated('agreement')) {
        await this.populate({ path: 'agreement', select: 'reserveFundSettings.minBalance' }).execPopulate();
      }

      // Use nullish coalescing for safety
      const minBalance = this.agreement?.reserveFundSettings?.minBalance ?? 0;

      if (this.currentBalance < minBalance) {
        // Use a more specific error message
        return next(new Error(`Operation failed: Resulting reserve fund balance (${this.currentBalance}) would be below the minimum required (${minBalance}).`));
      }
    } catch (err) {
      console.error(`Error populating agreement for reserve fund validation (${this._id}):`, err);
      // Fail safe: prevent save if validation couldn't occur
      return next(new Error('Could not validate minimum balance due to an internal error. Please try again.'));
    }
  }
  next(); // Proceed with saving
});

// --- Instance Methods ---

reserveFundsSchema.method("toJSON", function () {
  const object = this.toObject();
  return formatReserveFunds(object);
});

reserveFundsSchema.method("populateAndTransform", async function () {
    const populatePaths = [
        populationSettingsAgreements('agreement', 'USER'), // Populate agreement with specific fields
    ];

    

    if (!this.populated(populatePaths[0].path)) {
      await this.populate(populatePaths[0]).execPopulate();
    }

    return this.toJSON();
});

// --- Static Methods ---

reserveFundsSchema.statics.Count = async function (filter = {}, limit = 10) {
  try {
    // // Count usually doesn't need population
    // const count = await this.countDocuments(filter);
    // If you need documents:
    const documents = await this.find(filter).limit(limit);
    const populated = await Promise.all(documents.map(doc =>
      doc.populateAndTransform() // Use toJSON for list performance
    ));
    return populated;
  } catch (error) {
    console.error('Error in ReserveFunds.Count:', error);
    throw error;
  }
};

reserveFundsSchema.statics.UpdateById = function (id, update, options = { new: true }) {
    // Note: Updating transactions array might require $push, $pull, or fetching and modifying in application logic
    return this.findByIdAndUpdate(id, update, options);
};

// Static method to find by Agreement ID
reserveFundsSchema.statics.FindByAgreementId = function (agreementId) {
    return this.findOne({ agreement: agreementId });
};


module.exports = mongoose.model('ReserveFunds', reserveFundsSchema);