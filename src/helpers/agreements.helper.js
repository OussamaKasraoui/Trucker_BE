'use strict';
const Agreement = require('../models/agreements.model');

const { Count, Notify } = require('../middelware/helper')

exports.create = async function (params) {
    let returnContext = {
        error: false,
        payload: null,
        code: 200 // Default success code
    };

    // Validate input
    if (!params || !Array.isArray(params) || params.length === 0) {
        returnContext.error = true;
        returnContext.payload = "noAgreementDataProvided"; // Consistent payload for missing data
        returnContext.code = 400; // Bad request
        return returnContext; // Early return on error
    }

    const results = [];

    // Loop over each item in the input array and process
    for (const [index, param] of params.entries()) {
        try {
            // Create a new agreement document for each item
            const createdAgreement = await Agreement.create(param);

            // Add the successful result to the results array
            results.push({ code: 201, error: false, data: createdAgreement });

        } catch (error) {
            console.error(`Error creating agreement at index ${index}:`, error);

            const errorDetails = {
                code: error?.errors ? 400 : 500, // Bad request for validation errors
                error: true
            };

            if (error?.errors) {
                const validationErrors = {};
                for (const key in error.errors) {
                    if (error.errors.hasOwnProperty(key)) {
                        validationErrors[key] = `${key}Error`;
                    }
                }
                errorDetails.data = validationErrors;
            } else {
                errorDetails.data = error.message; // General error message
            }

            results.push(errorDetails);
        }
    }

    // Determine the overall status based on the results
    const allFailed = results.every(result => result.error === true);
    const allSuccess = results.every(result => result.error === false);

    if (allFailed) {
        returnContext.error = true;
        returnContext.payload = results;
        returnContext.code = 400; // Bad request for validation errors
    } else if (allSuccess) {
        returnContext.error = false;
        returnContext.payload = results;
        returnContext.code = 201; // All items created successfully
    } else {
        returnContext.error = true;
        returnContext.payload = results;
        returnContext.code = 207; // Multi-status for mixed results
    }

    return returnContext;
};

exports.findById = async function (id) {
    let returnContext = {
        error: false,
        payload: null,
        code: 200 // Default success code
    };

    if (!id) {
        returnContext.error = true;
        returnContext.payload = "noAgreementIdProvided";
        returnContext.code = 400; // Bad request
        return returnContext; // Early return on error
    }

    try {
        const agreement = await Agreement.findById(id).populate("agreementBoardMembers.syndic agreementBoardMembers.adjoint agreementBoardMembers.tresorier agreementBoardMembers.members agreementServices");

        if (!agreement) {
            returnContext.error = true;
            returnContext.payload = "agreementNotFound";
            returnContext.code = 404; // Not found
        } else {
            returnContext.payload = agreement;
            returnContext.code = 200; // Success
        }

    } catch (error) {
        console.error("Error finding agreement by ID:", error);

        returnContext.error = true;
        returnContext.payload = error.message;
        returnContext.code = 500; // Internal server error
    }

    return returnContext;
};

exports.findAll = async function (query) {
    let returnContext = {
        error: false,
        payload: null,
        code: 200 // Default success code
    };

    try {
        const agreements = await Agreement.find(query)

        returnContext.payload = await Promise.all(agreements.map(async (agreement) => {
            return await agreement.populateAndTransform(whoIsDemanding);
        }));

    } catch (error) {
        console.error("Error finding agreements:", error);

        returnContext.error = true;
        returnContext.payload = error.message;
        returnContext.code = 500; // Internal server error
    }

    return returnContext;
};

exports.update = async function (id, updateData) {
    let returnContext = {
        error: false,
        payload: null,
        code: 200 // Default success code
    };

    // Check if 'id' and 'updateData' are provided
    if (!id || Object.keys(updateData).length === 0) {
        returnContext.error = true;
        returnContext.payload = "noUpdateDataProvided";
        returnContext.code = 400; // Bad request
        return returnContext; // Early return on error
    }

    try {
        const updatedAgreement = await Agreement.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        });

        if (!updatedAgreement) {
            returnContext.error = true;
            returnContext.payload = "agreementNotFoundOrUpdateFailed";
            returnContext.code = 404; // Not found
        } else {
            returnContext.payload = updatedAgreement;
        }

    } catch (error) {
        console.error("Error updating agreement:", error);

        returnContext.error = true;
        returnContext.payload = error.message;
        returnContext.code = 500; // Internal server error
    }

    return returnContext;
};

exports.delete = async function (id) {
    let returnContext = {
        error: false,
        payload: null,
        code: 200 // Default success code
    };

    if (!id) {
        returnContext.error = true;
        returnContext.payload = "noAgreementIdProvided";
        returnContext.code = 400; // Bad request
        return returnContext; // Early return on error
    }

    try {
        const deletedAgreement = await Agreement.findByIdAndDelete(id);

        if (!deletedAgreement) {
            returnContext.error = true;
            returnContext.payload = "agreementNotFoundOrDeleteFailed";
            returnContext.code = 404; // Not found
        } else {
            returnContext.payload = deletedAgreement;
        }

    } catch (error) {
        console.error("Error deleting agreement:", error);

        returnContext.error = true;
        returnContext.payload = error.message;
        returnContext.code = 500; // Internal server error
    }

    return returnContext;
};