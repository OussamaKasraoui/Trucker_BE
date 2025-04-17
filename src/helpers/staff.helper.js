'use strict';
const Staff = require('../models/staff.model');

exports.create = async function (staff, session) {
  let returnStaff = {
    error: false,
    payload: null,
    code: 200
  };

  // Check if 'staff' data is provided
  if (!staff) {
    returnStaff.error = true;
    returnStaff.payload = "noStaffDataProvided";  // Consistent payload for missing data
    returnStaff.code = 400;  // Bad request
    return returnStaff;  // Early return on error
  }

  try {
    // Create a new Staff document
    const /* newStaff */ populatedStaff = await Staff.create(staff, session ? { session } : undefined);
    //const populatedStaff = await newStaff.populateAndTransform('staffUser staffContractor staffRole');

    // Check if the document was created successfully
    if (!populatedStaff) {
      returnStaff.error = true;
      returnStaff.payload = "staffCreationFailed";  // Creation failure
      returnStaff.code = 500;  // Internal server error
    } else {
      returnStaff.payload = populatedStaff;
      returnStaff.code = 201;  // Resource created successfully
    }

    // Return the result
    return returnStaff;

  } catch (err) {
    console.error("Error creating staff:", err);

    // Handle validation or unexpected errors
    returnStaff.error = true;

    if (err?.errors && Object.keys(err.errors).length) {
      const errorMessages = {};

      // Handle specific validation errors
      for (const key in err.errors) {
        if (err.errors.hasOwnProperty(key)) {
          errorMessages[key] = `${key}Error`;
        }
      }
      returnStaff.payload = errorMessages;
      returnStaff.code = 400;  // Bad request for validation errors

    } else {
      returnStaff.payload = err.message;  // General error message
      returnStaff.code = 500;  // Internal server error
    }

    return returnStaff;
  }
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
    // Find the document by ID and populate the necessary fields
    const foundStaff = await Staff.findById(id)
      .populate('staffUser')        // Populate the 'staffUser' field
      .populate('staffContractor')  // Populate the 'staffContractor' field
      .populate('staffRole');       // Populate the 'staffRole' field

    // Check if the document was found
    if (!foundStaff) {
      returnResult.error = true;
      returnResult.payload = "staffNotFound";  // Document not found
      returnResult.code = 404;  // Not found
    } else {
      returnResult.payload = foundStaff;
      returnResult.code = 200;  // OK
    }

  } catch (error) {
    console.error("Error finding document by ID:", error);

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
    // Find the document by the query and populate the necessary fields
    const foundStaff = await Staff.findOne(query);
    const populatedStaff = await foundStaff.populateAndTransform(whoIsDemanding);

    // Check if the document was found and populated
    if (!populatedStaff) {
      returnResult.error = true;
      returnResult.payload = "staffUnfound";  // Document not found
      returnResult.code = 404;  // Not found
    } else {
      returnResult.payload = populatedStaff;
      returnResult.code = 200;  // OK
    }

    // Return the result
    return returnResult;

  } catch (error) {
    console.error("Error finding document:", error);

    // Handle errors
    returnResult.error = true;
    returnResult.payload = error.message;
    returnResult.code = 500;  // Internal server error

    return returnResult;
  }
};


/* exports.findAll = function (req, res) {
    Staff.findAll(function (err, stf) {
        if (err) {
            console.log('staff.controller.js\tFind All\tError:\n', err);
            res.send({ error: true, message: "Error while finding all Staff", data: err });
        }
        else {
            console.log('staff.controller.js\tFind All\tResponse:\n', stf);
            res.send({ error: false, message: "Staff Found successfully!", data: stf });
        }
    });
};

exports.update = function (req, res) {
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
        res.status(400).send({ error: true, message: 'Please provide all required field' });
    } else {
        Staff.updateOne(req.params.id, new Staff(req.body), function (err, stf) {
            if (err) {
                console.log('staff.controller.js\tUpdate\tError:\n', err);
                res.send({ error: true, message: "Error while updating a Staff", data: err });
            }
            else {
                console.log('staff.controller.js\tUpdate\tResponse:\n', stf);
                res.json({ error: false, message: "Staff updated successfully", data: stf });
            }
        });
    }
};

exports.delete = function (req, res) {
    Staff.delete(req.params.id, function (err, stf) {
        if (err) {
            console.log('staff.controller.js\tDelete\tError:\n', err);
            res.send({ error: true, message: "Error while deleting a Staff", data: err });
        }
        else {
            console.log('staff.controller.js\tDelete\tResponse:\n', stf);
            res.json({ error: false, message: "Staff deleted successfully", data: stf });
        }
    });
}; */
