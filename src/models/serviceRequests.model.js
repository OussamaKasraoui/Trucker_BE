'use strict';

const mongoose = require("mongoose");
const { Schema } = mongoose;
const { populationSettingsDevis,
        populationSettingsUsers,
        populationSettingsMissions,
        populationSettingsSites,
        populationSettingsContractors, } = require("../utils/consts.utils");
const { formatServiceRequest } = require("../utils/formatters.utils"); // Assuming this helper exists


const ServiceRequestsSchema = Schema(
    {
      // Changed serviceRequestUser to single user who made the request
      serviceRequestUser:     {type: Schema.Types.ObjectId, ref: "Users", required: true },
      serviceRequestMission:  {type: Schema.Types.ObjectId, ref: "Missions" },              // Optional link to a specific mission
      serviceRequestSite:     {type: Schema.Types.ObjectId, ref: "Sites", required: true }, // Site the request pertains to
      assignedContractor:     {type: Schema.Types.ObjectId, ref: "Contractors" },           // Contractor assigned to handle it
      relatedDevis:           {type: Schema.Types.ObjectId, ref: "Devis" },                 // Link to a related quote/devis
      serviceRequestState:    {type: String, required: true, enum: ['New', 'Assigned', 'InProgress', 'Completed', 'Cancelled', 'OnHold'], default: 'New'}, // Changed to String enum
      requestTitle:           {type: String, required: true }, // Added title
      requestDetails:         {type: String, required: true }, // Added details
    },
    { timestamps: true }
);

// --- Instance Methods ---

ServiceRequestsSchema.method("toJSON", function () {
  const object = this.toObject();
  return formatServiceRequest(object);
});

ServiceRequestsSchema.method("populateAndTransform", async function () {
    const populatePaths = [
        populationSettingsUsers('serviceRequestUser', 'USER'), // Populate serviceRequestUser with specific fields
        populationSettingsMissions('serviceRequestMission', 'USER'), // Populate serviceRequestMission with specific fields
        populationSettingsSites('serviceRequestSite', 'USER'), // Populate serviceRequestSite with specific fields
        populationSettingsContractors('assignedContractor', 'USER'), // Populate assignedContractor with specific fields
        populationSettingsDevis('relatedDevis', 'USER'), // Populate relatedDevis with specific fields
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

    return this.toJSON();
});

// --- Static Methods ---

ServiceRequestsSchema.statics.Count = async function (filter = {}, limit = 10) {
  try {
    const documents = await this.find(filter).limit(limit);
    const populated = await Promise.all(documents.map(doc =>
        doc.populateAndTransform() // Use toJSON for list performance
    ));
    return populated;
  } catch (error) {
    console.error('Error in ServiceRequests.Count:', error);
    throw error;
  }
};

ServiceRequestsSchema.statics.UpdateById = function (id, update, options = { new: true }) {
    return this.findByIdAndUpdate(id, update, options);
};


module.exports = mongoose.model("ServiceRequests", ServiceRequestsSchema);