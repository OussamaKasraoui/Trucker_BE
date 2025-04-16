'use strict'; // Added strict mode
const mongoose = require('mongoose');
const { Schema } = mongoose; // Use Schema
const { ObjectId } = Schema.Types; // Destructure ObjectId
const { populationSettingsAgreements, populationSettingsOwnershipShares } = require('../utils/consts.utils');
const { formatVote } = require('../utils/formatters.utils'); // Assuming this is the correct path


const voteDecisionSchema = new Schema({ // Subdocument for decisions
    _id: { type: ObjectId, auto: true },
    description: { type: String, required: true },
    // Store votes based on OwnershipShares for weighted voting
    votesFor: [{
        share: { type: ObjectId, ref: 'OwnershipShares', required: true },
        votedAt: { type: Date, default: Date.now }
    }],
    votesAgainst: [{
        share: { type: ObjectId, ref: 'OwnershipShares', required: true },
        votedAt: { type: Date, default: Date.now }
    }],
    abstentions: [{ // Added abstentions
        share: { type: ObjectId, ref: 'OwnershipShares', required: true },
        votedAt: { type: Date, default: Date.now }
    }],
    // Calculated fields (can be updated via methods or hooks)
    percentageFor: { type: Number, default: 0 },
    percentageAgainst: { type: Number, default: 0 },
    percentageAbstained: { type: Number, default: 0 },
    totalVotedPercentage: { type: Number, default: 0 },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Tied'], default: 'Pending' }
});

const votingSchema = new Schema({ // Main schema
    agreement: { type: ObjectId, ref: 'Agreements', required: true, index: true },
    title: { type: String, required: true },
    description: String,
    type: { type: String, enum: ['Ordinary', 'Extraordinary'], required: true }, // Type determines quorum/majority rules
    decisions: [voteDecisionSchema], // Array of decisions being voted on
    // Quorum/Majority rules (can be fetched from Agreement or set specifically for the vote)
    quorumRequired: { type: Number, required: true, min: 0, max: 100 }, // e.g., 50%
    majorityRequired: { type: Number, required: true, min: 0, max: 100 }, // e.g., 50% + 1 vote, or 75%
    meetingDate: { type: Date }, // Date of the meeting where vote occurred/will occur
    votingStartDate: { type: Date }, // For electronic voting
    votingEndDate: { type: Date }, // For electronic voting
    status: { type: String, enum: ['Scheduled', 'Open', 'Closed', 'Cancelled'], default: 'Scheduled' },
    documents: [{ // Related documents (e.g., meeting minutes, proposals)
        name: String,
        url: String,
        type: { type: String, enum: ['Minutes', 'Proposal', 'Resolution'] }
    }],
    // Calculated overall results
    finalQuorumPercentage: { type: Number }, // Actual quorum achieved
    overallResult: { type: String, enum: ['Passed', 'FailedQuorum', 'FailedMajority', 'Pending'] }
}, { timestamps: true }); // Added timestamps

// Index for faster queries by agreement and status/date
votingSchema.index({ agreement: 1, status: 1 });
votingSchema.index({ agreement: 1, meetingDate: -1 });

// --- Instance Methods ---

votingSchema.method("toJSON", async function () {
  const object = this.toObject();
  return formatVote(object);
});

votingSchema.method("populateAndTransform", async function () {
    const populatePaths = [
        populationSettingsAgreements('agreement', 'USER'), // Populate agreement with specific fields
        populationSettingsOwnershipShares('decisions.votesFor.share', 'USER'), // Populate votesFor with specific fields
        populationSettingsOwnershipShares('decisions.votesAgainst.share', 'USER'), // Populate votesAgainst with specific fields
        populationSettingsOwnershipShares('decisions.abstentions.share', 'USER'), // Populate abstentions with specific fields
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
    

    return this.toJSON();
});

// --- Static Methods ---

votingSchema.statics.Count = async function (filter = {}, limit = 10) {
  try {
    const documents = await this.find(filter).limit(limit);
    const populated = await Promise.all(documents.map(doc =>
        doc.populateAndTransform() // Use toJSON for list performance
    ));
    return populated;
  } catch (error) {
    console.error('Error in Votes.Count:', error);
    throw error;
  }
};

votingSchema.statics.UpdateById = function (id, update, options = { new: true }) {
    // Be careful updating votes array, might need $push/$pull or application logic
    return this.findByIdAndUpdate(id, update, options);
};

// Method to calculate results (example - implement actual logic based on rules)
// This could be an instance method or triggered after votes are cast
// votingSchema.methods.calculateResults = async function() { ... }


module.exports = mongoose.model("Votes", votingSchema); // Use plural 'Votes'