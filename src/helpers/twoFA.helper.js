'use strict';
const TwoFA = require('../models/twoFA.model'); // Adjust the path if necessary
const dayjs = require('dayjs'); // Adjust the path if necessary

// Create TwoFA Helper function
exports.create = async function (twoFAData, session) {
  let returnTwoFA = {
    error: false,
    payload: null,
    code: 200
  };

  // Check if 'twoFAData' is provided
  if (!twoFAData) {
    returnTwoFA.error = true;
    returnTwoFA.payload = "noTwoFADataProvided";  // Consistent payload for missing data
    returnTwoFA.code = 400;  // Bad request
    return returnTwoFA;  // Early return on error
  }

  try {
    // Clone the twoFAData object to avoid mutating the original data
    const twoFAObject = { ...twoFAData };

    // Create a new TwoFA document
    const /* newTwoFA */ populatedTwoFA = await TwoFA.create(twoFAObject, session ? { session } : undefined);

    // Populate and transform the result
    //const populatedTwoFA = await newTwoFA.populateAndTransform();

    // Check if the document was populated successfully
    if (!populatedTwoFA) {
      returnTwoFA.error = true;
      returnTwoFA.payload = "twoFACreationError";
      returnTwoFA.code = 422;  // Unprocessable entity (processing error)
    } else {
      returnTwoFA.payload = populatedTwoFA;
      returnTwoFA.code = 201;  // Resource created successfully
    }

    return returnTwoFA;

  } catch (error) {
    console.error("Error creating TwoFA:", error);

    // Handle validation errors and duplicate key errors
    returnTwoFA.error = true;

    if (error?.errors && Object.keys(error.errors).length) {
      const errorMessages = {};

      // Iterate over validation errors
      for (const key in error.errors) {
        if (error.errors.hasOwnProperty(key)) {
          errorMessages[key] = `${key}Error`;
        }
      }

      returnTwoFA.payload = errorMessages;
      returnTwoFA.code = 400;  // Bad request for validation errors

    } else if (error.code === 11000) {
      returnTwoFA.payload = { duplicate: "duplicateKeyError" };  // Duplicate key error
      returnTwoFA.code = 409;  // Conflict for duplicate key

    } else {
      returnTwoFA.payload = error;
      returnTwoFA.code = 500;  // Internal server error for unexpected issues
    }

    return returnTwoFA;
  }
};

// Find by ID TwoFA Helper function
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
    // Find the document by ID using a custom finder (e.g., FindByUser)
    const foundTwoFA = await TwoFA.FindByUser(id);

    // Check if the document was found
    if (!foundTwoFA) {
      returnResult.error = true;
      returnResult.payload = "documentNotFound";  // Document not found
      returnResult.code = 404;  // Not found
    } else {
      // If found, populate and transform the document
      returnResult.payload = await foundTwoFA.populateAndTransform();
      returnResult.code = 200;  // OK
    }

  } catch (err) {
    console.error("Error finding document by ID:", err);
    
    // Handle server errors
    returnResult.error = true;
    returnResult.payload = "documentRetrievalFailed: " + err.message;
    returnResult.code = 500;  // Internal server error
  }

  // Return the result
  return returnResult;
};

// Update TwoFA Helper function
exports.update = async function (id, updates) {
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

  // Check if 'updates' are provided
  if (!updates || Object.keys(updates).length === 0) {
    returnResult.error = true;
    returnResult.payload = "noUpdateDataProvided";  // Consistent payload for missing updates
    returnResult.code = 400;  // Bad request
    return returnResult;  // Early return on error
  }

  try {
    // Find the document by ID and update it with the new values
    const updatedTwoFA = await TwoFA.findByIdAndUpdate(
      id,
      { $set: updates },  // Set new field values dynamically
      { new: true, runValidators: true } // Return updated document and run validation
    );

    // Check if document was found and updated
    if (!updatedTwoFA) {
      returnResult.error = true;
      returnResult.payload = "documentNotFoundOrUpdateFailed";  // Document not found or update failed
      returnResult.code = 404;  // Not found
    } else {
      // Populate and transform the updated document
      returnResult.payload = await updatedTwoFA.populateAndTransform();
      returnResult.code = 200;  // OK
    }

  } catch (err) {
    console.error("Error updating TwoFA document:", err);

    // Handle validation or other errors
    returnResult.error = true;

    if (err?.errors && Object.keys(err.errors).length) {
      const errorMessages = {};

      // Handle specific validation errors
      for (const key in err.errors) {
        if (err.errors.hasOwnProperty(key)) {
          errorMessages[key] = `${key}Error`;
        }
      }
      returnResult.payload = errorMessages;
      returnResult.code = 400;  // Bad request for validation errors

    } else {
      returnResult.payload = err.message;  // General error message
      returnResult.code = 500;  // Internal server error
    }
  }

  return returnResult;
};


// Update TwoFA Helper function
exports.verify = async function (userID) {
  let returnTwoFA = {
    error: false,
    payload: null,
    code: 200
  };

  // Check if 'userID' is provided
  if (!userID) {
    returnTwoFA.error = true;
    returnTwoFA.payload = "noUserIdProvided";  // Consistent payload for missing userID
    returnTwoFA.code = 400;  // Bad request
    return returnTwoFA;  // Early return on error
  }

  try {
    // Prepare updates
    const updates = {
      $set: {
        "twoFAStatus": "Verified",
        "twoFAPassCode.$[last].passCodeStatus": "Verified" // Set last passCodeStatus to 'Verified'
      }
    };

    // Define options
    const options = {
      new: true,                       // Return the updated document
      runValidators: true,             // Run schema validators
      // useFindAndModify: false,      // Deprecated, Mongoose handles it
      arrayFilters: [{ "last.passCodeStatus": "Pending" }]  // Only target the last 'Pending' entry in twoFAPassCode
    };

    // *** FIX HERE: Use findOneAndUpdate instead of UpdateOne ***
    const updatedTwoFA = await TwoFA.findOneAndUpdate(
      { twoFAUser: userID },  // Filter by user ID
      updates,                // Apply the updates
      options
    );

    // Check if the document was updated (findOneAndUpdate returns null if no doc matches the filter)
    if (!updatedTwoFA) {
      returnTwoFA.error = true;
      // Could be that the user doesn't exist, or their last code wasn't 'Pending'
      returnTwoFA.payload = "twoFAUpdateFailedOrNotApplicable";
      returnTwoFA.code = 404;  // Not found or condition not met
    } else {
       // Populate and transform the updated document
      const populatedTwoFA = await updatedTwoFA.populateAndTransform(); // Ensure this method exists and works
      returnTwoFA.payload = populatedTwoFA;
      returnTwoFA.code = 200;  // OK: document updated successfully
    }

    return returnTwoFA;

  } catch (error) {
    console.error("Error activating TwoFA:", error);

    // Handle errors
    returnTwoFA.error = true;

    if (error?.errors && Object.keys(error.errors).length) {
      const errorMessages = {};
      // Handle specific validation errors
      for (const key in error.errors) {
        if (error.errors.hasOwnProperty(key)) {
          errorMessages[key] = `${key}Error`;
        }
      }
      returnTwoFA.payload = errorMessages;
      returnTwoFA.code = 400;  // Bad request for validation errors
    } else {
      returnTwoFA.payload = error.message;  // General error message
      returnTwoFA.code = 500;  // Internal server error
    }

    return returnTwoFA;
  }
};


// Update TwoFA Helper function
exports.resend = async function (userID, updates) {
  let returnResult = {
    error: false,
    payload: null,
    code: 200
  };

  // Check if 'userID' is provided
  if (!userID) {
    returnResult.error = true;
    returnResult.payload = "noUserIdProvided";  // Consistent payload for missing user ID
    returnResult.code = 400; // Changed to 400 Bad Request
    return returnResult;  // Early return on error
  }

  try {
    // Generate new passcode data
    const generated = exports.generate();

    // --- First update: Expire the previous passcode and increment failed attempts ---
    const updatesA = {
      $inc: { twoFAFailedAttempts: 1 }, // Increment failed attempts by 1
      $set: {
        // twoFALastGeneratedAt: generated.generatedAt, // Don't set this until the *new* code is pushed
        "twoFAPassCode.$[last].passCodeStatus": "Expired", // Expire the last pending passcode
      },
    };

    const filter = { twoFAUser: userID }; // Filter by user ID

    const optionsExpire = {
      // new: false, // Don't strictly need the result of this intermediate step
      runValidators: true,
      // useFindAndModify: false, // Deprecated option, Mongoose handles it
      arrayFilters: [{ "last.passCodeStatus": "Pending" }]  // Only target the last pending passcode
    };

    // Update the document: Set last passcode to expired and increment attempts
    // Using findOneAndUpdate directly instead of the non-existent UpdateOne
    const updatedTwoFA_A = await TwoFA.findOneAndUpdate(
      filter,
      updatesA,
      optionsExpire
    );

    // Check if a document was found to expire the code (optional but good practice)
    if (!updatedTwoFA_A) {
        // This might happen if there was no 'Pending' code for the user
        console.warn(`No pending 2FA code found to expire for user ${userID} during resend.`);
        // Decide if this is an error or just continue to push the new code
        // If continuing, the failed attempts counter won't be incremented here.
        // Consider adding the $inc directly to the $push update below if needed in this case.
    }

    // --- Second update: Push new passcode ---
    const updatesB = {
        $set: { // Set the last generated time now
            twoFALastGeneratedAt: generated.generatedAt,
        },
        $push: { // Push the new code details
          twoFAPassCode: {
            passCodeSecret: generated.secret,        // New passcode secret
            passCodeExpiresAt: generated.expiresAt,  // Expiration time
            passCodeGeneratedAt: generated.generatedAt,  // Generation timestamp
            passCodeStatus: "Pending",               // Set to 'Pending'
            // verificationAttempts: 0 // Reset attempts for the new code (already default)
          },
        },
    };

    const optionsPush = {
        new: true, // Return the final updated document
        runValidators: true,
    };

    // Using findOneAndUpdate directly instead of the non-existent UpdateOne
    const updatedTwoFA = await TwoFA.findOneAndUpdate(
      filter,
      updatesB,
      optionsPush
    );

    // Check if document was found and updated
    if (!updatedTwoFA) {
      returnResult.error = true;
      returnResult.payload = "documentNotFoundOrUpdateFailed";  // Update failed or document not found
      returnResult.code = 404;  // Not found
    } else {
      // Populate and transform the updated document
      // Ensure populateAndTransform exists and works as expected on the model
      returnResult.payload = await updatedTwoFA.populateAndTransform();
      returnResult.code = 200;  // OK
    }

  } catch (err) {
    console.error("Error updating TwoFA document during resend:", err); // More specific error message

    // Handle errors
    returnResult.error = true;

    if (err?.errors && Object.keys(err.errors).length) {
      const errorMessages = {};
      // Handle validation errors
      for (const key in err.errors) {
        if (err.errors.hasOwnProperty(key)) {
          errorMessages[key] = `${key}Error`;
        }
      }
      returnResult.payload = errorMessages;
      returnResult.code = 400;  // Bad request for validation errors
    } else {
      returnResult.payload = err.message;  // General error message
      returnResult.code = 500;  // Internal server error
    }
  }

  return returnResult;
};


// Generate Secret and Experation date
exports.generate = function () {
  
  const GeneratedAt = dayjs()
  const ExpiresAt   = dayjs(GeneratedAt).add(2, 'hours')
  const secret = Math.floor(100000 + Math.random() * 900000);

  return {
    generatedAt: GeneratedAt,
    expiresAt: ExpiresAt,
    secret: secret.toString(),
  }
}
