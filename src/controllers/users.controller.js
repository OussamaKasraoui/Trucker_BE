'use strict';

const bcrypt      = require('bcrypt');
const jwt         = require('jsonwebtoken');
const dayjs       = require('dayjs');
// const querystring = require('querystring');
// const qs = require('qs');


const keys        = require('../../config/keys');
const mongoose    = require('mongoose');

// Load input validation
const validateRegisterInput = require("../validation/register");
const validateLoginInput    = require("../validation/login");
const validateEditInput     = require("../validation/update");
const validatePasswordInput = require("../validation/password");

const User        = require('../models/users.model');
const Staff       = require('../models/staff.model');
const Role        = require('../models/roles.model');
const Pack        = require('../models/packs.model');
const Contractor  = require('../models/contractors.model');
const Contract    = require('../models/contracts.model');
const Site        = {} //require('../models/sites.model');
const Building    = {} //require('../models/buildings.model');
const Apartment   = {} //require('../models/apartments.model');

const UserHelpers       = require('../helpers/users.helper');
const ContractorHelpers = require('../helpers/contractors.helper');
const StaffHelpers      = require('../helpers/staff.helper');
const PackHelpers       = require('../helpers/packs.helper');
const RoleHelpers       = require('../helpers/roles.helper');
const TwoFAHelpers      = require('../helpers/twoFA.helper');
const EmailsHelpers     = require('../helpers/emails.helper');

// const User        = require('../models/users.model');
const { Count, UpdateById, Notify } = require('../middelware/helper')
// const UpdateById = require('./../middelware/helper')

exports.create = async function (req, res) {
  const formData = req.body?.formData?.users;
  const userPack = req.body?.formData?.userPack;

  if (!formData || !Array.isArray(formData) || formData.length === 0) {
    return res.status(400).json({ error: true, message: "Invalid or empty user list." });
  }

  const { errors, isValid } = validateRegisterInput(formData);
  if (!isValid) {
    return res.status(400).json({ error: true, message: "Validation failed", data: errors,});
  }

  try {

    const packResult = await PackHelpers.findById(userPack);
    if (packResult.error || !packResult.payload) {
      return res.status(packResult.code).json({ error: true, message: packResult.error ? packResult.payload : "packIDNotProvided", data: [{ error: true, data: { userPack: "userPackError" } }],});
    }
    const pack = packResult.payload;


    const userCreationResult = await UserHelpers.create(formData, req.body.login);
    if (userCreationResult.error){
      return res.status(userCreationResult.code).json({ error: true, message: userCreationResult.payload, data: userCreationResult.payload });

    } else if (!userCreationResult.payload) {

      return res.status(422).json({ error: true, message: "PackUnfound", data: { userPack: "userPackUnfound" } });
    }
    const createdUsers = userCreationResult.payload;
    
    if (req.body.login) {
      return exports.login(req, res); // Ensure login function is defined or adjust as necessary
    } else {
      return res.status(200).json({
        error: false, 
        message: createdUsers[0].data.notificationCreation[0], 
        data: {
          redirect: {
            replace: true,
            redirect: true,
            to: '/login',
            data: { userEmail: createdUsers[0].userEmail },
          }
        }
      });
    }
    
    
  } catch (error) {
    console.error("Error in batch user creation:", error);
    return res.status(500).json({ error: true, message: "Internal server error", data: error.message,});
  }
};

exports.findAll   = function (req, res) {
  User.find({})// ,function(err, users) {
    // .populate("roles", "-__v")
    .exec((err, users) => {
      if (err) {
        res.status(500).json({ message: err });
        return;
      }

      const _users = users.map(user => {
        // var roles = [];
        var usr = {};

        // for (let i = 0; i < user.roles.length; i++) {
        //   roles.push("ROLE_" + user.roles[i].name.toUpperCase());
        // }

        usr.id = user.id;
        usr.email = user.email;
        usr.firstName = user.firstName;
        usr.lastName = user.lastName;
        usr.phone = user.phone;
        usr.createdAt = user.createdAt;
        usr.updatedAt = user.updatedAt;
        //usr.roles = roles;

        return usr;
      })

      res.status(200).json({
        status: "success",
        message: "Found users",
        data: _users
      });
    });
};

exports.update = async function (req, res) {
  const userId = req.params.id; // Assume user ID is provided as a route parameter

  if (!userId || req.body.constructor === Object && Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: true, message: 'Invalid input' });
  }

  try {
    // Update the user using the helper method
    const userUpdateResult = await UserHelpers.update(userId, req.body.formData, req.body.login);

    if (userUpdateResult.error) {
      return res.status(500).json({ error: true, message: userUpdateResult.payload, data: userUpdateResult.payload });
    }

    return res.status(200).json({ error: false, message: "User updated successfully", data: userUpdateResult.payload });

  } catch (err) {
    console.error("Error updating user:", err);
    return res.status(500).json({ error: true, message: "Internal server error", data: err.message });
  }
};

exports.delete    = function (req, res) {
  User.deleteOne({ email: req.body.formData.email }, function (err, user) {
    if (err)
      res.json(err);
    res.json({ status: "success", message: 'user deleted successfully', data: {} });
  });
};

// update Password
exports.security  = function (req, res) {
  // Form validation
  const { errors, isValid } = validatePasswordInput(req.body.formData);
  // Check validation
  if (!isValid) {
    return res.status(400).json({
      error: errors,
      message: "adding user failed!",
      data: {
        user: null,
        status: 'fail'
      }
    });
  }

  const new_user = req.body.formData;
  if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
    res.status(400).json({ error: true, message: 'Please provide all required field' });
  } else {
    User.updateOne(new_user.id, new User(new_user), function (err, user) {
      if (err)
        res.json(err);
      res.json({ error: false, message: 'Password successfully updated' });
    });
  }
};

exports.check     = async function (req, res) {
  // Handles null error
  if (req.body.constructor === Object && Object.keys(req.decoded).length === 0) {
    return res.status(400).json({ error: true, message: 'Field required', data: req.body });
  }else{

    /* const userResult = await UserHelpers.findById(req.decoded.id);

    if (userResult.error){
      return res.status(userResult.code).json({ error: true, message: userResult.payload, data: { userPack: "userLoginError" } });

    }
    else if (!userResult.payload) {
      return res.status(userResult.code).json({ error: true, message: "userEmailUnfound", data: { userEmail: "userEmailUnfound" } });

    } */

    const checkResult = await UserHelpers.check({
      headers: req.headers,
      decoded: {
        id: req.decoded.user.id,
        token: req.headers["x-access-token"],
        ... req.decoded,
        // contractor: req.decoded.contractor,
        // staff: req.decoded.staff,
        // user: req.decoded.user,

        // id: req.decoded.user.id,
        // pack: {
        //   id: req.decoded.user.userPack.id,
        //   packName: req.decoded.user.userPack.packName,
        //   packOptions: req.decoded.user.userPack.packOptions
        // }
      },
      pathname: req.headers["origin-referrer"]
    }, res)



    return res.status(checkResult.code).json({
      error: checkResult.error,
      message : true,
      data: checkResult.payload
    });
  }
}

exports.login = async function (req, res) {
  // Check for empty request body
  if (!req.body || Object.keys(req.body).length === 0 || !req.body.formData?.users) {
    return res.status(400).json({
      error: true,
      message: 'Field required', // Or be more specific: "Request body or user data missing"
      data: req.body
    });
  }

  const formData = req.body.formData.users; // Assuming users is an array, login uses the first element

  // Form validation
  const { errors, isValid, code } = validateLoginInput(formData);
  if (!isValid) {
    return res.status(code || 400).json({ // Use code from validation if available
      error: true,
      message: "ValidationFailed",
      data: errors // Send back the validation errors
    });
  }

  try {
    // Step 1: Attempt login using the helper (finds user, compares password)
    const loginResult = await UserHelpers.login(formData); // Pass only formData

    // Handle login failure (user not found, wrong password)
    if (loginResult.error || !loginResult.payload) {
      // Use the code and payload from the helper's result
      return res.status(loginResult.code || 401).json({
        error: true,
        // Use a generic message or inspect payload for specifics
        message: loginResult.code === 404 ? "User not found" : "Invalid credentials",
        data: loginResult.payload // Contains specific error like { userEmail: '...' } or { userPassword: '...' }
      });
    }

    // Step 2: Login successful, get the user document
    const userDocument = loginResult.payload;

    // Step 3: Generate token and prepare payload
    const tokenizeResult = await UserHelpers.tokenize(userDocument, "MANAGER"); // Pass the user document

    // Handle token generation errors
    if (tokenizeResult.error || !tokenizeResult.payload) {
      console.error("Tokenization failed:", tokenizeResult.payload);
      return res.status(tokenizeResult.code || 500).json({
          error: true,
          message: "Token generation failed",
          data: tokenizeResult.payload
      });
    }

    // Step 4: Perform final checks and prepare response structure
    // Construct the 'req' object expected by 'check'
    const checkRequestData = {
        headers: req.headers,
        decoded: tokenizeResult.payload, // Pass the entire payload from tokenize
        pathname: req.headers["origin-referrer"] // Or determine pathname as needed
    };
    const checkResult = await UserHelpers.check(checkRequestData, "MANAGER"); // Pass constructed data and res

    // Step 5: Send the final response from the check result
    // The checkResult payload should contain everything needed (token, user, menu, redirect, etc.)
    return res.status(checkResult.code || 200).json({
      error: checkResult.error,
      message: checkResult.error ? "Login check failed" : "Login successful", // Adjust message based on error status
      data: checkResult.payload // This payload is structured by the 'check' helper
    });

  } catch (error) {
      // Catch any unexpected errors during the process
      console.error("Unexpected error during login:", error);
      return res.status(500).json({
          error: true,
          message: "Internal server error during login",
          data: { system: "unexpectedError", details: error.message }
      });
  }
};


/* exports.login = async function (req, res) {
  // Handles empty request body (Field required)
  if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
    return res.status(400).json({
      error: true,
      message: 'Field required',
      data: req.body
    });
  } else {
    const formData = req.body?.formData?.users;
    // Form validation
    const { errors, isValid, code } = validateLoginInput(formData);

    // Validation failed (Bad request)
    if (!isValid) {
      return res.status(code).json({
        error: true,
        message: "ValidationFailed",
        data: errors
      });
    }

    // Attempt to log in the user
    const userResult = await UserHelpers.login(formData, res);

    // User not found (Server error: Potential database or internal issue)
    if (userResult.error) {
      return res.status(userResult.code).json({
        error: true,
        message: req?.body?.formData?.userEmail,
        data: userResult.payload
      }); // TODO: fix the syntax of the error {users: [{ errors ... }]}

    } else if (!userResult.payload) {
      
      return res.status(userResult.code).json({
        error: true,
        message: req?.body?.formData?.userEmail,
        data: { userEmail: "userEmailUnfound" }
      });
    }

    // Generate a new Token
    const tokenizeResult = await UserHelpers.tokenize(userResult.payload, false)
    
    // Handle Token creation errors
    if (tokenizeResult.error) {
      return res.status(500).json({ error: true, message: tokenizeResult.error, data: tokenizeResult.payload });
    }

    // delete tokenizeResult.payload.id


    const checkResult = await UserHelpers.check({
      headers: req.headers,
      decoded: tokenizeResult.payload,
      pathname: req.headers["origin-referrer"]
    }, res)



    return res.status(checkResult.code).json({
      error: checkResult.error,
      message : true,
      data: checkResult.payload
    });


    // // User found (Success)
    // return res.status(200).json({
    //   error: false,
    //   message: 'Login successful',
    //   data: {
    //     ...tokenizeResult.payload,
    //     redirect: {
    //       replace: true, 
    //       redirect: true, 
    //       to: `/${tokenizeResult.payload?.pack?.packName?.toLowerCase()}/dashboard`
    //     }
    //   }
    //   //userResult.payload // returning the user details or token
    // });
  }
}; */

exports.activate     = async function (req, res) {
  // Handles null error
  if (req.body.constructor === Object && Object.keys(req.decoded).length === 0) {
    return res.status(400).json({ error: true, message: 'Field required', data: req.body });
  }else{

    const activationResult = await UserHelpers.activate(req.decoded.id, req.decoded.user);

    if (activationResult.error){
      return res.status(500).json({ error: true, message: activationResult.payload, data: { user: "userError" } });
    }
    else if (!activationResult.payload) {
      return res.status(404).json({ error: true, message: "userUnfound", data: { userEmail: "userUnfound" } });
    }

    // Generate a new Token
    const tokenizeResult = await UserHelpers.tokenize(activationResult.payload, false)
      
    // Handle Token creation errors
    if (tokenizeResult.error) {
      return res.status(500).json({ error: true, message: tokenizeResult.error, data: tokenizeResult.payload });
    }

    // Run any helper checks
    const checkResult = await UserHelpers.check({
      headers: req.headers,
      decoded: tokenizeResult.payload,
      redirect: "dashboard",
    }, res);

    // Handle check result errors
    if (checkResult.error) {
      returnUser.error = true;
      returnUser.payload = checkResult.payload;
      returnUser.code = 403;  // Forbidden
      return returnUser;
    }

    // If no payload returned from the check
    if (!checkResult.payload) {
      returnUser.error = true;
      returnUser.payload = "userCheckFailed";
      returnUser.code = 403;  // Forbidden
      return returnUser;
    }

    res.status(200).json({
      error: checkResult.error,
      message : true,
      data: checkResult.payload,
    });
  }
}

exports.verify     = async function (req, res) {
  // Handles null error
  if (req.body.constructor === Object && Object.keys(req.decoded).length === 0) {
    return res.status(400).json({ error: true, message: 'Field required', data: req.body });
  }else{

    const activationResult = await UserHelpers.verify(req.decoded.id, req.decoded.user);

    if (activationResult.error){
      return res.status(500).json({ error: true, message: activationResult.payload, data: { user: "userError" } });
    }
    else if (!activationResult.payload) {
      return res.status(404).json({ error: true, message: "userUnfound", data: { userEmail: "userUnfound" } });
    }

    // Generate a new Token
    const tokenizeResult = await UserHelpers.tokenize(activationResult.payload, false)
      
    // Handle Token creation errors
    if (tokenizeResult.error) {
      return res.status(500).json({ error: true, message: tokenizeResult.error, data: tokenizeResult.payload });
    }

    // Run any helper checks
    const checkResult = await UserHelpers.check({
      headers: req.headers,
      decoded: tokenizeResult.payload,
      redirect: "dashboard",
    }, res);

    // Handle check result errors
    if (checkResult.error) {
      returnUser.error = true;
      returnUser.payload = checkResult.payload;
      returnUser.code = 403;  // Forbidden
      return returnUser;
    }

    // If no payload returned from the check
    if (!checkResult.payload) {
      returnUser.error = true;
      returnUser.payload = "userCheckFailed";
      returnUser.code = 403;  // Forbidden
      return returnUser;
    }

    res.status(200).json({
      error: checkResult.error,
      message : true,
      data: checkResult.payload,
    });
  }
}
