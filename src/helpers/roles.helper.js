'use strict';
const Role = require('../models/roles.model');
const mongoose = require('mongoose');

// Function to create a role
exports.create = async function (roles, session = null) {
  let returnRoles = {
    error: false,
    payload: null,
    code: 201 // Default code for successful creation
  };

  // Validate input: Ensure 'roles' is provided and is an array
  if (!roles || !Array.isArray(roles) || roles.length === 0) {
    returnRoles.error = true;
    returnRoles.payload = "noRolesDataProvided"; // Consistent payload for missing data
    returnRoles.code = 400; // Bad request
    return returnRoles; // Early return on error
  }

  // Start a new session if not provided
  const shouldStartSession = !session;
  if (shouldStartSession) {
    session = await mongoose.startSession();
    session.startTransaction();
  }

  const results = [];

  try {
    for (const role of roles) {
      try {
        // Create a new Role document
        const docRole = await Role.create([role], { session });

        // Push success result
        results.push({ code: 201, error: false, data: docRole[0] });

      } catch (error) {
        console.error("Error creating role:", error);

        const errorDetails = {
          code: 400,
          error: true
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

    // Determine transaction outcome
    const allFailed = results.every(result => result.error === true);
    const allSuccess = results.every(result => result.error === false);

    if (allFailed) {
      returnRoles.error = true;
      returnRoles.payload = results;
      returnRoles.code = 400;
      if (shouldStartSession) await session.abortTransaction();
    } else if (allSuccess) {
      returnRoles.error = false;
      returnRoles.payload = results;
      returnRoles.code = 201;
      if (shouldStartSession) await session.commitTransaction();
    } else {
      returnRoles.error = true;
      returnRoles.payload = results;
      returnRoles.code = 207;
      if (shouldStartSession) await session.abortTransaction();
    }

  } catch (err) {
    console.error("Error processing roles:", err);
    returnRoles.error = true;
    returnRoles.payload = err.message;
    returnRoles.code = 500;
    if (shouldStartSession) await session.abortTransaction();
  } finally {
    if (shouldStartSession) session.endSession();
  }

  return returnRoles;
};

// Function to find a role by ID
exports.findById = async function (id) {
  let returnResult = {
    error: false,
    payload: null,
    statusCode: 200, // Default success status code
  };

  if (!id) {
    returnResult.error = true;
    returnResult.payload = "No ID provided";
    returnResult.statusCode = 400; // Bad Request
    return returnResult;
  }

  try {
    const foundRole = await Role.findById(id)
      .populate('rolePermissions')  // Populate permissions
      .populate('roleInheritsFrom') // Populate inherited roles
      .populate('reoleContractor'); // Populate contractor details

    if (!foundRole) {
      returnResult.error = true;
      returnResult.payload = "Role not found";
      returnResult.statusCode = 404; // Not Found
    } else {
      returnResult.payload = foundRole;
    }

  } catch (err) {
    console.error("Error finding role by ID:", err);
    returnResult.error = true;
    returnResult.payload = "Role retrieval failed: " + err.message;
    returnResult.statusCode = 500; // Internal Server Error
  }

  return returnResult;
};

// Function to find a role by name
exports.findByName = async function (roleName) {
  let returnResult = {
    error: false,
    payload: null,
    statusCode: 200,
  };

  if (!roleName) {
    returnResult.error = true;
    returnResult.payload = "No role name provided";
    returnResult.statusCode = 400;
    return returnResult;
  }

  try {
    const foundRole = await Role.findOne({ roleName })
      .populate('rolePermissions')
      .populate('roleInheritsFrom')
      .populate('reoleContractor');

    if (!foundRole) {
      returnResult.error = true;
      returnResult.payload = "Role not found";
      returnResult.statusCode = 404;
    } else {
      returnResult.payload = foundRole;
    }

  } catch (err) {
    console.error("Error finding role by name:", err);
    returnResult.error = true;
    returnResult.payload = "Role retrieval failed: " + err.message;
    returnResult.statusCode = 500;
  }

  return returnResult;
};

// Function to find roles by organization
exports.findByOrganization = async function (organizationId) {
  let returnResult = {
    error: false,
    payload: null,
    statusCode: 200,
  };

  if (!organizationId) {
    returnResult.error = true;
    returnResult.payload = "No organization ID provided";
    returnResult.statusCode = 400;
    return returnResult;
  }

  try {
    const foundRoles = await Role.find({ roleOrganization: organizationId })
      .populate('rolePermissions')
      .populate('roleInheritsFrom')
      .populate('reoleContractor');

    if (!foundRoles.length) {
      returnResult.error = true;
      returnResult.payload = "No roles found for this organization";
      returnResult.statusCode = 404;
    } else {
      returnResult.payload = foundRoles;
    }

  } catch (err) {
    console.error("Error finding roles by organization:", err);
    returnResult.error = true;
    returnResult.payload = "Role retrieval failed: " + err.message;
    returnResult.statusCode = 500;
  }

  return returnResult;
};