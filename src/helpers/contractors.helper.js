'use strict';
const Contractor = require('../models/contractors.model');

exports.create = async function (contractors, session) {
    let returnContractors = {
        error: false,
        payload: null,
        code: 201 // Default code for successful creation
    };

    // Validate input: Ensure 'contractors' is provided and is an array
    if (!contractors || !Array.isArray(contractors)) {
        returnContractors.error = true;
        returnContractors.payload = "noContractorDataProvided"; // Consistent payload for missing data
        returnContractors.code = Array.isArray(contractors) ? 400 : 500; // Bad request or internal server error
        return returnContractors; // Early return on error
    }

    const results = [];

    // Loop through each contractor and attempt to insert
    for (const contractor of contractors) {
        try {
            // Create a new Contractor document
            const docContractor = await Contractor.create(contractor, session ? { session } : undefined);

            // Transform the created contractor
            const populatedContractor = await docContractor.populateAndTransform('contractorUser');

            // Push success result
            results.push({
                code: 201,
                error: false,
                data: populatedContractor
            });

        } catch (error) {
            console.error("Error creating contractor:", error);

            const errorDetails = {
                code: 400,
                error: true,
            };

            // Handle validation errors specifically
            if (error?.errors && Object.keys(error.errors).length) {
                const validationErrors = {};
                for (const key in error.errors) {
                    if (error.errors.hasOwnProperty(key)) {
                        validationErrors[key] = `${key}Error`;
                    }
                }
                errorDetails.data = validationErrors;
            } else {
                errorDetails.code = 500;
                errorDetails.data = error.message; // General error message
            }

            // Push error result
            results.push(errorDetails);
        }
    }

    // Evaluate results for overall success/failure
    const allFailed = results.every(result => result.error === true);
    const allSuccess = results.every(result => result.error === false);

    if (allFailed) {
        returnContractors.error = true;
        returnContractors.payload = results; // Return detailed errors
        returnContractors.code = 400; // Bad request for validation errors
    } else if (allSuccess) {
        returnContractors.error = false;
        returnContractors.payload = results; // Return all successful results
        returnContractors.code = 201; // Resource created successfully
    } else {
        returnContractors.error = true;
        returnContractors.payload = results; // Mixed results (successes and failures)
        returnContractors.code = 207; // Partial success
    }

    return returnContractors;
};


exports.findById = async function (id) {
    let returnResult = {
        error: false,
        payload: null,
        code: 200
    };

    // Check if 'id' is provided
    if (!id) {
        returnResult.error = true;
        returnResult.payload = "noIdProvided";  // Consistent payload for missing ID
        returnResult.code = 400;  // Bad request
        return returnResult;  // Early return on error
    }

    try {
        // Find the document by ID and populate necessary fields
        const foundContractor = await Contractor.findById(id)
            .populate('contractorUser');  // Populate the 'contractorUser' field if needed

        // Check if the document was found
        if (!foundContractor) {
            returnResult.error = true;
            returnResult.payload = "contractorNotFound";  // Document not found
            returnResult.code = 404;  // Not found
        } else {
            returnResult.payload = foundContractor;
            returnResult.code = 200;  // OK
        }

    } catch (error) {
        console.error("Error finding contractor by ID:", error);

        // Handle errors
        returnResult.error = true;
        returnResult.payload = error.message;
        returnResult.code = 500;  // Internal server error
    }

    // Return the result
    return returnResult;
};


exports.findOne = async function (query, whoIsDemanding = "USER") {
    let returnResult = {
        error: false,
        payload: null,
        code: 200
    };

    // Check if 'query' is provided
    if (!query) {
        returnResult.error = true;
        returnResult.payload = "noQueryProvided";  // Consistent payload for missing query
        returnResult.code = 400;  // Bad request
        return returnResult;  // Early return on error
    }

    try {
        // Find the document by the query and populate necessary fields
        const foundContractor = await Contractor.findOne(query);
        const populatedContractor = await foundContractor.populateAndTransform(whoIsDemanding);

        // Check if the document was found and populated
        if (!populatedContractor) {
            returnResult.error = true;
            returnResult.payload = "contractorUnfound";  // Document not found
            returnResult.code = 404;  // Not found
        } else {
            returnResult.payload = populatedContractor;
            returnResult.code = 200;  // OK
        }

    } catch (error) {
        console.error("Error finding contractor by query:", error);

        // Handle errors
        returnResult.error = true;
        returnResult.payload = error.message;
        returnResult.code = 500;  // Internal server error
    }

    // Return the result
    return returnResult;
};