'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const mongoose = require('mongoose');

// Load input validation
const validatePasswordInput = require("../validation/password");

const User                = require('../models/users.model');
const Contractor          = require('../models/contractors.model');
const ContractorHelpers   = require('./contractors.helper');
const RoleHelpers         = require('./roles.helper');
const Staff               = require('../models/staff.model');
const StaffHelpers        = require('./staff.helper');
const TwoFA               = require('../models/twoFA.model');
const TwoFAHelpers        = require('./twoFA.helper');
const Email               = require('../models/emails.model');
const Notification        = require('../models/notifications.model')
const Contract            = require('../models/contracts.model');
const ContractHelpers     = require('./contracts.helper')

const { Count, UpdateById, Notify } = require('../middelware/helper');

exports.create = async function (users, login) {
  let returnUser = {
    error: false,
    payload: null,
    code: 200
  };

  // Check if 'users' data is provided
  if (!users) {
    returnUser.error = true;
    returnUser.payload = "noUserProvided";
    returnUser.code = 400; // Bad request
    return returnUser;
  }

  try {
    const salt = await bcrypt.genSalt(10);

    const usersCreationResults = await Promise.all(
      users.map(async (user) => {
        const session = await mongoose.startSession(); // Start transaction session
        session.startTransaction();

        try {
          // Generate unique IDs
          const userId = new mongoose.Types.ObjectId();
          const contractorId = new mongoose.Types.ObjectId();
          const userRoles = await RoleHelpers.findByOrganization(user.userPack);

          // Clone user object and hash password
          const userObject = { 
            ...user, 
            _id: userId,
            // userPassword: await bcrypt.hash(user.userPassword, salt),
            userRoles: userRoles.error ? [] : userRoles.payload.filter(role => role.roleName === 'USER').map(role => role.id),
          };

          // Generate 2FA details
          const generated2FA = TwoFAHelpers.generate();

          // Prepare dependent data (without contractor references yet)
          const dependentData = {
            contractor: {
              _id: contractorId,
              contractorUser: userId,
              contractorTitle: userObject.userEmail,
              contractorPhone: userObject.userPhone,
              contractorNumRC: userId,
              contractorNumPatente: userId,
              contractorNumICE: userId,
              contractorType: "Natural",
              contractorStatus: "Active",
              contractorRoles: userRoles.error ? [] : userRoles.payload.filter(role => role.roleName === 'ADMIN').map(role => role.id),
            },
            twoFA: {
              twoFAUser: userId,
              twoFAFailedAttempts: 0,
              twoFALastGeneratedAt: generated2FA.generatedAt,
              twoFAPassCode: [{
                passCodeSecret: generated2FA.secret,
                passCodeExpiresAt: generated2FA.expiresAt,
                passCodeGeneratedAt: generated2FA.generatedAt,
              }],
            },
            email: {
              emailSubject: "Account Verification",
              emailBody: `Copy-paste this: ${generated2FA.secret}\nExpires at: ${generated2FA.expiresAt}`,
              emailRecipient: [userObject.userEmail],
              emailSender: "activation@syndikit.app",
              emailStatus: "pending",
            },
            notification: {
              notificationCreator: userId,
              notificationTitle: "Create User",
              notificationType: "info",
              notificationText: `[${userObject.userEmail}] account created successfully`,
              notificationTarget: [{ targetUser: userId, targetRead: false }],
            }
          };

          // Step 1: Create User first
          const userCreation = await User.create([userObject], { session });

          // Step 2: Create Contractor before dependent collections
          const contractorCreation = await Contractor.create([dependentData.contractor], { session });

          // Step 3: Use contractorId in Staff and Contract after ensuring Contractor exists
          const staffData = {
            staffUser: userId,
            staffStatus: "Active",
            staffContractor: contractorId, // Ensuring contractor exists
            staffRoles: userRoles.error ? [] : userRoles.payload.filter(role => role.roleName === 'MANAGER').map(role => role.id),
          };
          const staffCreation = await Staff.create([staffData], { session });

          const contractData = {
            contractUser: userId,
            contractContractors: [contractorId], // Ensuring contractor exists
            contractAgreements: [],
            contractStatus: 'Pending',
          };
          const contractCreation = await Contract.create([contractData], { session });

          // Step 4: Create other dependent data in parallel
          const [twoFACreation, emailCreation, notificationCreation] = await Promise.all([
            TwoFA.create([dependentData.twoFA], { session }),
            Email.create([dependentData.email], { session }),
            Notification.create([dependentData.notification], { session })
          ]);

          // Ensure all creations succeeded
          if (!userCreation || !contractorCreation || !staffCreation || !twoFACreation || !emailCreation || !notificationCreation || !contractCreation) {
            throw new Error("One or more dependent creations failed");
          }

          // Commit transaction if all operations succeed
          await session.commitTransaction();
          session.endSession();

          return {
            code: 201,
            error: false,
            data: {
              userCreation,
              contractorCreation,
              staffCreation,
              twoFACreation,
              emailCreation,
              notificationCreation,
              contractCreation,
            },
          };
        } catch (error) {
          await session.abortTransaction(); // Rollback transaction on failure
          session.endSession();
          return { error: true, message: error.message, code: 500 };
        }
      })
    );

    // Handle response based on results
    const allFailed = usersCreationResults.every(result => result.error === true);
    const allSuccess = usersCreationResults.every(result => result.error === false);

    if (allFailed) {
      returnUser.error = true;
      returnUser.payload = usersCreationResults;
      returnUser.code = 400;
    } else if (allSuccess) {
      returnUser.error = false;
      returnUser.payload = usersCreationResults;
      returnUser.code = 201;
    } else {
      returnUser.error = true;
      returnUser.payload = usersCreationResults;
      returnUser.code = 207;
    }

    return returnUser;

  } catch (error) {
    console.error("Error creating user:", error);

    returnUser.error = true;

    if (error?.errors && Object.keys(error?.errors).length) {
      const errorMessages = {};
      for (const key in error.errors) {
        if (error.errors.hasOwnProperty(key)) {
          errorMessages[key] = `${key}Error`;
        }
      }
      returnUser.payload = errorMessages;
      returnUser.code = 400;

    } else if (error.code === 11000) {
      returnUser.payload = [{ error: true, data: { userEmail: "userEmailError" } }];
      returnUser.code = 409;
    } else {
      returnUser.payload = error;
      returnUser.code = 500;
    }

    return returnUser;
  }
};

exports.findById = async function (id, whoIsDemanding = 'USER') {
  let returnUser = {
    error: false,
    payload: null,
    code: 200
  };

  // Check if 'id' is provided
  if (!id) {
    returnUser.error = true;
    returnUser.payload = "noUserIdProvided";  // Consistent payload for missing ID
    returnUser.code = 400;  // Bad request
    return returnUser;  // Early return on error
  }

  try {
    // Find the document by ID
    const foundUser = await User.findById(id);

    // If no user is found
    if (!foundUser) {
      returnUser.error = true;
      returnUser.payload = "userIdUnfound";  // No user found
      returnUser.code = 403;  // Not found
    } else {
      // Populate and transform the found user
      const populatedUser = await foundUser.populateAndTransform(whoIsDemanding);

      // Return populated user data if available
      returnUser.payload = populatedUser;
      returnUser.code = 200;  // OK
    }

  } catch (error) {
    console.error("Error finding document by ID:", error);

    // Handle any errors that occur, returning the whole error object
    returnUser.error = true;
    returnUser.payload = error;  // Return the full error object
    returnUser.code = 500;  // Internal server error
  }

  // Return the result
  return returnUser;
};

exports.findOne = async function (query, sensitive = false) {
  let returnUser = {
    error: false,
    payload: null,
    code: 200
  };

  // Check if 'query' is provided
  if (!query || Object.keys(query).length === 0) {
    returnUser.error = true;
    returnUser.payload = "noUserQueryProvided";  // Consistent payload for missing query
    returnUser.code = 400;  // Bad request
    return returnUser;  // Early return on error
  }

  try {
    // Find the document by the query
    const foundUser = await User.findOne(query);

    // Check if the document was found
    if (!foundUser) {
      returnUser.error = true;
      returnUser.payload = { userEmail: "userEmailUnfound" };  // No user found with the provided query
      returnUser.code = 404;  // Not found
      return returnUser;
    }

    // Populate and transform the found user
    const populatedUser = await foundUser.populateAndTransform(sensitive);

    // If population or transformation fails
    if (!populatedUser) {
      returnUser.error = true;
      returnUser.payload = "userEmailUnfound";
      returnUser.code = 404;  // Not found
    } else {
      returnUser.payload = populatedUser;
      returnUser.code = 200;  // OK
    }

  } catch (error) {
    console.error("Error finding document by query:", error);

    // Handle any errors that occur, returning the whole error object
    returnUser.error = true;
    returnUser.payload = error;  // Return the full error object
    returnUser.code = 500;  // Internal server error
  }

  // Return the result
  return returnUser;
};

/* exports.findAll   = function (req, res) {
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
}; */

exports.update = async function (id, updateData, login, whoIsDemanding = 'USER') {
  let returnUser = {
    error: false,
    payload: null,
    code: 200
  };

  // Check if 'id' and 'updateData' are provided
  if (!id || !updateData) {
    returnUser.error = true;
    returnUser.payload = !id ? "noUserIdProvided" : "noUserUpdateDataProvided";  // Consistent payload for missing ID or data
    returnUser.code = 400;  // Bad request
    return returnUser;  // Early return on error
  }

  try {
    const updatedUserData = { ...updateData };

    // If password is being updated, hash it
    if (updateData.userPassword) {
      const salt = await bcrypt.genSalt(10);
      updatedUserData.userPassword = await bcrypt.hash(updateData.userPassword, salt);
    }

    // Use the static UpdateById method from the model
    const updatedUser = await User.UpdateById(id, updatedUserData, { 
      new: true,
      runValidators: true 
    });

    // Check if the user was updated
    if (!updatedUser) {
      returnUser.error = true;
      returnUser.payload = "userUpdateFailed";  // Consistent payload for update failure
      returnUser.code = 404;  // Not found
      return returnUser;
    }

    // Populate and transform the updated user
    const populatedUser = await updatedUser.populateAndTransform(whoIsDemanding);

    // Return populated user
    returnUser.payload = populatedUser;
    returnUser.code = 200;  // Success

  } catch (error) {
    console.error("Error updating user:", error);

    // Handle any errors that occur, returning the full error object
    returnUser.error = true;
    returnUser.payload = error;  // Return the full error object
    returnUser.code = 500;  // Internal server error
  }

  // Return the result
  return returnUser;
};

/* exports.delete    = function (req, res) {
  User.deleteOne({ email: req.body.formData.email }, function (err, user) {
    if (err)
      res.json(err);
    res.json({ status: "success", message: 'user deleted successfully', data: {} });
  });
}; */

// generate Token // TODO: remove senseitive data from output
exports.tokenize = async function (user, whoIsDemanding = 'USER') {
  let returnUser = {
    error: false,
    payload: null,
    code: 200,
  };

  // Check if 'user' data is provided
  if (!user) {
    returnUser.error = true;
    returnUser.payload = "No user data provided";
    return returnUser; // Early return on error
  }

  try {
    const tokenize = {};

    if (!user) {
      returnUser.error = true;
      returnUser.payload = { userEmail: "userEmailUnfound" };
      return returnUser;

    }
    else {
      delete user.userPassword
      delete user.userRoles

      tokenize.pack = user.userPack;
      tokenize.id = user.id; /* Todo:   replace with ID of login ( add Login/Activity collection to track user )*/
      tokenize.user = user;
    }

    // Find Contractor by user id
    const contractor = await ContractorHelpers.findOne({ contractorUser: user.id }, whoIsDemanding);

    if (contractor.error) {
      tokenize.contractor = {};
    } else {
      delete contractor.payload.contractorRoles // TODO:deal with this later
      tokenize.contractor = contractor.payload;
    }

    // Find Staff by user id and contractor id
    const staff = await StaffHelpers.findOne({ staffUser: user.id, staffContractor: contractor.payload.id }, whoIsDemanding)

    if (staff.error) {
      tokenize.staff = {}
    } else {
      delete staff.payload.staffRoles // TODO:deal with this later
      tokenize.staff = staff.payload;
    }

    // Find Contracts by contractor id
    const contracts = await ContractHelpers.findAll([contractor.payload.id], user.userPack)

    if (contracts.error) {
      tokenize.contracts = {}
    } else {
      tokenize.contracts = contracts.payload;
    }

    // Generate JWT token
    const token = jwt.sign(tokenize, keys.secretOrKey, {
      expiresIn: 86400 // 24 hours
    });

    returnUser.payload = {
      id: user.id,
      token: token,
      pack: {
        id: user.userPack.id.toString(),
        packName: user.userPack.packName,
        packOptions: user.userPack.packOptions
      },

      user: user,
      contractor: contractor.payload,
      staff: staff.payload,
      contracts: contracts.payload.map(contract => contract.id),
    }

    return returnUser

  } catch (error) {
    console.error("Error generating Token:", error);
    // Handle errors
    returnUser.error = true;
    returnUser.payload = error.message;

    // Return the result
    return returnUser;
  }
}

// update Password
exports.security = function (req, res) {
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

exports.login = async function (formData, res) {
  let returnUser = {
    error: false,
    payload: null,
    code: 200
  };

  // Check if 'userEmail' and 'userPassword' are provided
  if (!formData[0].userEmail || !formData[0].userPassword) {
    returnUser.error = true;
    returnUser.payload = "noUserDataProvided";
    returnUser.code = 400;  // Bad request
    return returnUser; // Early return on error
  }

  const userEmail = formData[0].userEmail; //TODO: set to lowerCase()
  const userPassword = formData[0].userPassword;

  try {
    // Find user by email
    const userResult = await User.FindByEmail(userEmail); // Find the user document

    // Handle missing user .payload
    if (!userResult) {
      returnUser.error = true;
      returnUser.payload = [{ 
        error: true,
        data: {userEmail: "userEmailUnfound"} 
      }];
      returnUser.code = 404;  // Not found
      return returnUser;
    }

    // Check if password matches
    const passwordIsValid = await userResult.comparePassword(userPassword);
    if (!passwordIsValid) {
      returnUser.error = true;
      returnUser.payload = { userPassword: "userPasswordWrong" };
      returnUser.code = 401;  // Unauthorized
      return returnUser; // Early return on error
    }

    // Find contractor by user ID
    const contractorResult = await ContractorHelpers.findOne({ contractorUser: userResult.id }, 'MANAGER');
    if (!passwordIsValid) {
      returnUser.error = true;
      returnUser.payload = { userEmail: "SUWW-Contractor" };
      returnUser.code = 401;  // Unauthorized
      return returnUser; // Early return on error
    }


    returnUser.payload = await userResult.populateAndTransform('MANAGER'); /* contractor ID to compare with roleContractor */

    // Return success payload
    return returnUser;

  } catch (error) {
    // Handle any unexpected errors
    returnUser.error = true;
    returnUser.payload = error;  // Return full error object
    returnUser.code = 500;  // Internal server error
    return returnUser;
  }
};

exports.check = async function (req, whoIsDemanding = 'USER') {
  let returnResult = {
    error: false,
    payload: null,
    code: 200
  };

  // Check if 'user' data is available in the token
  if (!req.decoded.user) {
    returnResult.error = true;
    returnResult.payload = "userDataUnavailable";
    returnResult.code = 400;  // Bad request
    return returnResult;  // Early return on error
  }

  try {

    // Find User by ID
    const userResult = await exports.findById(req.decoded.id, whoIsDemanding);

    // Handle errors in finding user
    if (userResult.error) {
      returnResult.error = true;
      returnResult.payload = userResult.payload;
      returnResult.code = 404;  // User not found
      return returnResult;
    } else if (!userResult.payload) {
      returnResult.error = true;
      returnResult.payload = "userUnfound";
      returnResult.code = 404;  // Not found
      return returnResult;
    }

    // Check User's Pack
    if (mongoose.Types.ObjectId(userResult.payload.id).equals(mongoose.Types.ObjectId(req.decoded.user.id))) {

      let user = userResult.payload;
      let contract = undefined;

      /* // Find Contractor by user ID
      const contractorResult = await ContractorHelpers.findOne({ contractorUser: req.decoded.user.id });
      if (contractorResult.error) {
        returnResult.error = true;
        returnResult.payload = contractorResult.payload;
        returnResult.code = 404;  // Contractor not found
        return returnResult;
      } else if (!contractorResult.payload) {
        returnResult.error = true;
        returnResult.payload = "contractorUnfound";
        returnResult.code = 404;  // Not found
        return returnResult;
      } */

      const contractor = req.decoded.contractor //contractorResult.payload;

      /* // Find Staff by user ID and contractor ID
      const staffResult = await StaffHelpers.findOne({ staffUser: req.decoded.user.id, staffContractor: contractor.id });
      if (staffResult.error) {
        returnResult.error = true;
        returnResult.payload = staffResult.payload;
        returnResult.code = 404;  // Staff not found
        return returnResult;
      } else if (!staffResult.payload) {
        returnResult.error = true;
        returnResult.payload = "staffUnfound";
        returnResult.code = 404;  // Not found
        return returnResult;
      } */

      const staff = req.decoded.staff //staffResult.payload

      let resData = req.decoded      

      const [ defaultUserStatus, defaultUserStatusPayload, defaultUser ] = await exports.checkStatus(user, contractor, staff, whoIsDemanding)

      if(defaultUserStatus !== user.userStatus) {
        
        user = defaultUser

        const token = await exports.tokenize(user, false)

        if(token.error || !token.payload) {
          user.userStatus = "Suspended"
        } else {
          resData = token.payload
        }

      }

      const { existContracts, existAgreements, existSites, existBuildings, existApartments } = defaultUserStatusPayload;


      const packId = req.decoded.pack.id
      const packName = req.decoded.pack.packName
      const packOptions = req.decoded.pack.packOptions
      

      const syndicateContext = {
        Pending: [
          {
            name: "UserActivate",
            context: "twofas",
            display: [{
              name: "form",

              values: [],
              bulk: false,
              dependency: { users: [{ id: user.id, name: user.userEmail }] },
              done: user.userStatus !== "Pending",
              get action() {
                return this.done ? ["next"] : ["verify"]
              }
            }],
            get done() {
              return this.display.every(displ => displ.done === true);
            },
          },
        ],

        onHold: [
          /* {
            name: "Site Setup",
            context: "sites",
            display: [{
              name: "form",

              values: existSites,
              bulk: packOptions.sites > 1,
              dependency: {
                contracts: [{ id: existContracts[0].id, name: existContracts[0], item: existContracts[0] }],
              },
              done: Boolean(existSites.length),
              get action() {
                return this.done ? ["next"] : ["create"]
              }
            }],
            get done() {
              return this.display.every(displ => displ.done === true);
            },
          },
          {
            name: "Buildings Setup",
            context: "buildings",
            display: [{
              name: "form",

              values: existBuildings,
              bulk: packOptions.buildings > 1,
              dependency: {
                contracts: [{ id: existContracts[0].id, name: existContracts[0], item: existContracts[0] }],
                sites: existSites.map((item, index) => {
                  return { id: item.id, name: item.siteName, item: item }
                }),
              },
              done: Boolean(existBuildings.length),
              get action() {
                return this.done ? ["next"] : ["create"]
              }
            }],
            get done() {
              return this.display.every(displ => displ.done === true);
            },
          },
          {
            name: "Apartments Setup",
            context: "apartments",
            display: [{
              name: "form",

              values: existApartments,
              bulk: packOptions.apartments > 1,
              dependency: {
                contracts: [{ id: existContracts[0].id, name: existContracts[0], item: existContracts[0] }],
                sites: existSites.map((item, index) => {
                  return { id: item.id, name: item.siteName, item: item }
                }),
                buildings: existBuildings.map((item, index) => {
                  return { id: item.id, name: item.buildingName, item: item }
                })
              },
              done: Boolean(existApartments.length),
              get action() {
                return this.done ? ["next"] : ["create"]
              }
            }],
            get done() {
              return this.display.every(displ => displ.done === true);
            },
          }, */
        ],
        
        Active: [
          /* {
            name: "Dashboard",
            icon: "HomeOutlined",
            items: [
              {
                name: "Overview",
                context: {
                  name: "Overview Management",
                  context: "overview",
                  display: ["form"],

                  values: [],
                  bulk: false,
                  dependency: [],
                  done: false,
                  action: ["create"],
                },
              },
              {
                name: "Notifications",
                context: {
                  name: "Notifications Management",
                  context: "notifications",
                  display: ["form"],

                  values: [],
                  bulk: false,
                  dependency: [],
                  done: false,
                  action: ["create"],
                },
              },
              {
                name: "Quick Actions",
                context: {
                  name: "Quick Actions Management",
                  context: "quickActions",
                  display: ["form"],

                  values: [],
                  bulk: false,
                  dependency: [],
                  done: false,
                  action: ["create"],
                },
              },
            ],
          }, */
          {
            name: "Property Management",
            icon: "RoofingIcon",
            items: [
              {
                name: "Sites",
                context: {
                  name: "Sites Management",
                  context: "sites",
                  display: ["form"],

                  values: [],
                  bulk: false,
                  dependency: [],
                  done: false,
                  action: ["create"],
                },
              },
              {
                name: "Buildings",
                context: {
                  name: "Buildings Management",
                  context: "buildings",
                  display: ["form"],

                  values: [],
                  bulk: true,
                  dependency: [],
                  done: false,
                  action: ["create"],
                },
              },
              {
                name: "Apartments",
                context: {
                  name: "Apartments Management",
                  context: "apartments",
                  display: ["form"],

                  values: [],
                  bulk: false,
                  dependency: [],
                  done: false,
                  action: ["create"],
                },
              },
              {
                name: "Common Areas",
                context: {
                  name: "Common Areas Management",
                  context: "commonAreas",
                  display: ["form"],

                  values: [],
                  bulk: true,
                  dependency: [],
                  done: false,
                  action: ["create"],
                },
              },
            ],
          },
          {
            name: "Administrative Management",
            icon: "AdminPanelSettingsOutlinedIcon",
            items: [
              {
                name: "Contracts",
                context: {
                  name: "Contracts Management",
                  context: "contracts",
                  display: ["main"],

                  values: [],
                  bulk: true,
                  dependency: [],
                  done: false,
                  action: ["create"],
                },
              },
              {
                name: "Agreements",
                context: {
                  name: "Agreements Management",
                  context: "agreements",
                  display: ["main",],

                  values: [],
                  bulk: true,
                  dependency: [],
                  done: false,
                  action: ["create"],
                },
              },
              {
                name: "Services",
                context: {
                  name: "Services Management",
                  context: "services",
                  display: ["main",],

                  values: [],
                  bulk: true,
                  dependency: [],
                  done: false,
                  action: ["create"],
                },
              },
              /* {
                name: "Owners",
                context: {
                  name: "Owners Management",
                  context: "owners",
                  display: ["form"],

                  values: [],
                  bulk: false,
                  dependency: [],
                  done: false,
                  action: ["create"],
                },
              },
              {
                name: "Members",
                context: {
                  name: "Members Management",
                  context: "members",
                  display: ["form"],

                  values: [],
                  bulk: true,
                  dependency: [],
                  done: false,
                  action: ["create"],
                },
              },
              {
                name: "Staff",
                context: {
                  name: "Staff Management",
                  context: "staff",
                  display: ["form"],

                  values: [],
                  bulk: true,
                  dependency: [],
                  done: false,
                  action: ["create"],
                },
              }, */
            ],
          },
          /* {
            name: "Financial Management",
            items: [
              {
                name: "Invoices",
                context: {
                  name: "Invoices Management",
                  context: "invoices",
                  display: ["form"],

                  values: [],
                  bulk: false,
                  dependency: [],
                  done: false,
                  action: ["create"],
                },
              },
              {
                name: "Payments",
                context: {
                  name: "Payments Management",
                  context: "payments",
                  display: ["form"],

                  values: [],
                  bulk: false,
                  dependency: [],
                  done: false,
                  action: ["create"],
                },
              },
              {
                name: "Reports",
                context: {
                  name: "Reports Management",
                  context: "reports",
                  display: ["form"],

                  values: [],
                  bulk: true,
                  dependency: [],
                  done: false,
                  action: ["create"],
                },
                subItems: [
                  {
                    name: "Income",
                    context: {
                      name: "Income Management",
                      context: "income",
                      display: ["form"],

                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"],
                    },
                  },
                  {
                    name: "Expenses",
                    context: {
                      name: "Expenses Management",
                      context: "expenses",
                      display: ["form"],

                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"],
                    },
                  },
                ],
              },
            ],
          }, */
        ],
      }

      /* const syndicateMenu = {
        active: [
          {
            name: "Dashboard",
            icon: "HomeOutlined",
            context: undefined,
            items: [
              {
                name: "Overview",
                icon: "DashboardOutlinedIcon",
                context: {
                  name: "Overview Management",
                  context: "overview",
                  display: ["form"],
                  values: [],
                  bulk: false,
                  dependency: [],
                  done: false,
                  action: ["create"],
                },
              },
              {
                name: "Notifications",
                icon: "NotificationsNoneOutlinedIcon",
                context: {
                  name: "Notifications Management",
                  context: "notifications",
                  display: ["form"],
                  values: [],
                  bulk: false,
                  dependency: [],
                  done: false,
                  action: ["create"],
                },
              },
              {
                name: "Quick Actions",
                icon: "FlashOnOutlinedIcon",
                context: {
                  name: "Quick Actions Management",
                  context: "quickActions",
                  display: ["form"],
                  values: [],
                  bulk: false,
                  dependency: [],
                  done: false,
                  action: ["create"],
                },
              },
            ],
          },
          {
            name: "Property Management",
            icon: "RoofingIcon",
            context: undefined,
            items: [
              {
                name: "Sites",
                icon: "LocationCityIcon",
                context: {
                  name: "Sites Management",
                  context: "sites",
                  display: ["form"],

                  values: [],
                  bulk: false,
                  dependency: [],
                  done: false,
                  action: ["create"],
                },
              },
              {
                name: "Buildings",
                icon: "HomeIcon",
                context: {
                  name: "Buildings Management",
                  context: "buildings",
                  display: ["form"],

                  values: [],
                  bulk: true,
                  dependency: [],
                  done: false,
                  action: ["create"],
                },
              },
              {
                name: "Apartments",
                icon: "ApartmentOutlined",
                context: {
                  name: "Apartments Management",
                  context: "apartments",
                  display: ["form"],
                  values: [],
                  bulk: false,
                  dependency: [],
                  done: false,
                  action: ["create"],
                },
              },
              {
                name: "Common Areas",
                icon: "GroupWorkOutlined",
                context: {
                  name: "Common Areas Management",
                  context: "commonAreas",
                  display: ["form"],
                  values: [],
                  bulk: true,
                  dependency: [],
                  done: false,
                  action: ["create"],
                },
              },
            ],
          },
          {
            name: "Administrative Management",
            icon: "AdminPanelSettingsOutlinedIcon",
            context: undefined,
            items: [
              {
                name: "Contracts",
                icon: "HandshakeIcon",
                context: {
                  name: "Contracts Management",
                  context: "contracts",
                  display: ["main"],

                  values: [],
                  bulk: true,
                  dependency: [],
                  done: false,
                  action: ["create"],
                },
              },
              {
                name: "Agreements",
                icon: "HandshakeIcon",
                context: {
                  name: "Agreements Management",
                  context: "agreements",
                  display: ["main",],

                  values: [],
                  bulk: true,
                  dependency: [],
                  done: false,
                  action: ["create"],
                },
              },
              {
                name: "Services",
                icon: "HandshakeIcon",
                context: {
                  name: "Services Management",
                  context: "services",
                  display: ["main",],

                  values: [],
                  bulk: true,
                  dependency: [],
                  done: false,
                  action: ["create"],
                },
              },
              {
                name: "Owners",
                icon: "PersonOutlined",
                context: {
                  name: "Owners Management",
                  context: "owners",
                  display: ["form"],
                  values: [],
                  bulk: false,
                  dependency: [],
                  done: false,
                  action: ["create"],
                },
              },
              {
                name: "Members",
                icon: "Diversity3OutlinedIcon",
                context: {
                  name: "Members Management",
                  context: "members",
                  display: ["form"],
                  values: [],
                  bulk: true,
                  dependency: [],
                  done: false,
                  action: ["create"],
                },
              },
              {
                name: "Staff",
                icon: "Groups3Icon",
                context: {
                  name: "Staff Management",
                  context: "staff",
                  display: ["form"],
                  values: [],
                  bulk: true,
                  dependency: [],
                  done: false,
                  action: ["create"],
                },
              },
            ],
          },
          {
            name: "Financial Management",
            icon: "AccountBalanceWalletIcon",
            context: undefined,
            items: [
              {
                name: "Invoices",
                icon: "RequestQuoteIcon",
                context: {
                  name: "Invoices Management",
                  context: "invoices",
                  display: ["form"],
                  values: [],
                  bulk: false,
                  dependency: [],
                  done: false,
                  action: ["create"],
                },
              },
              {
                name: "Payments",
                icon: "AttachMoneyIcon",
                context: {
                  name: "Payments Management",
                  context: "payments",
                  display: ["form"],
                  values: [],
                  bulk: false,
                  dependency: [],
                  done: false,
                  action: ["create"],
                },
              },
              {
                name: "Reports",
                icon: "BalanceOutlinedIcon",
                context: {
                  name: "Reports Management",
                  context: "reports",
                  display: ["form"],
                  values: [],
                  bulk: true,
                  dependency: [],
                  done: false,
                  action: ["create"],
                },
                subItems: [
                  {
                    name: "Income",
                    icon: "MonetizationOnOutlinedIcon",
                    context: {
                      name: "Income Management",
                      context: "income",
                      display: ["form"],
                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"],
                    },
                  },
                  {
                    name: "Expenses",
                    icon: "MoneyOffIcon",
                    context: {
                      name: "Expenses Management",
                      context: "expenses",
                      display: ["form"],
                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"],
                    },
                  },
                ],
              },
            ],
          },
          // Additional sections follow the same pattern.
        ]
      } */

        const syndicateMenu = {
          active: [
            /* Dashboard */
            {
              name: "Dashboard",
              icon: "HomeOutlined",
              context: undefined,
              items: [
                {
                  name: "Overview",
                  icon: "DashboardOutlinedIcon",
                  context: {
                    name: "Overview Management",
                    context: "overview",
                    display: [{
                      name: "Overview Management",
                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"]
                    }],
                    get done() {
                      return this.display.every(displ => displ.done === true);
                    }
                  }
                },
                {
                  name: "Announcements",
                  icon: "AnnouncementOutlinedIcon",
                  context: {
                    name: "Announcements Management",
                    context: "announcements",
                    display: [{
                      name: "Announcements Management",
                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"]
                    }],
                    get done() {
                      return this.display.every(displ => displ.done === true);
                    }
                  }
                },
                {
                  name: "Quick Stats",
                  icon: "TrendingUpOutlined",
                  context: {
                    name: "Quick Stats Management",
                    context: "quickStats",
                    display: [{
                      name: "Quick Stats Management",
                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"]
                    }],
                    get done() {
                      return this.display.every(displ => displ.done === true);
                    }
                  }
                },
                {
                  name: "Custom Widgets",
                  icon: "WidgetsOutlinedIcon",
                  context: {
                    name: "Custom Widgets Management",
                    context: "customWidgets",
                    display: [{
                      name: "Custom Widgets Management",
                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"]
                    }],
                    get done() {
                      return this.display.every(displ => displ.done === true);
                    }
                  }
                }
              ]
            },
            /* Property Management */
            {
              name: "Property Management",
              icon: "RoofingIcon",
              context: undefined,
              items: [
                {
                  name: "Sites",
                  icon: "LocationCityIcon",
                  context: {
                    name: "Sites Management",
                    context: "sites",
                    display: [{
                      name: "main",

                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"]
                    }],
                    get done() {
                      return this.display.every(displ => displ.done === true);
                    }
                  }
                },
                {
                  name: "Buildings",
                  icon: "HomeIcon",
                  context: {
                    name: "Buildings Management",
                    context: "buildings",
                    display: [{
                      name: "main",

                      values: [],
                      bulk: true,
                      dependency: [],
                      done: false,
                      action: ["create"]
                    }],
                    get done() {
                      return this.display.every(displ => displ.done === true);
                    }
                  }
                },
                {
                  name: "Apartments",
                  icon: "ApartmentOutlined",
                  context: {
                    name: "Apartments Management",
                    context: "apartments",
                    display: [{
                      name: "main",

                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"]
                    }],
                    get done() {
                      return this.display.every(displ => displ.done === true);
                    }
                  }
                },
                {
                  name: "Common Areas",
                  icon: "GroupWorkOutlined",
                  context: {
                    name: "Common Areas Management",
                    context: "commonAreas",
                    display: [{
                      name: "main",

                      values: [],
                      bulk: true,
                      dependency: [],
                      done: false,
                      action: ["create"]
                    }],
                    get done() {
                      return this.display.every(displ => displ.done === true);
                    }
                  }
                }
              ]
            },
            /* Financial Management */
            {
              name: "Financial Management",
              icon: "AccountBalanceWalletIcon",
              context: undefined,
              items: [
                {
                  name: "Dues & Payments",
                  icon: "AttachMoneyIcon",
                  context: {
                    name: "Dues & Payments Management",
                    context: "duesPayments",
                    display: [{
                      name: "main",

                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"]
                    }],
                    get done() {
                      return this.display.every(displ => displ.done === true);
                    }
                  }
                },
                {
                  name: "Invoicing & Receipts",
                  icon: "ReceiptOutlinedIcon",
                  context: {
                    name: "Invoicing & Receipts Management",
                    context: "invoicingReceipts",
                    display: [{
                      name: "main",

                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"]
                    }],
                    get done() {
                      return this.display.every(displ => displ.done === true);
                    }
                  }
                },
                {
                  name: "Budgeting & Forecasts",
                  icon: "TrendingUpOutlined",
                  context: {
                    name: "Budgeting & Forecasts Management",
                    context: "budgetingForecasts",
                    display: [{
                      name: "main",

                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"]
                    }],
                    get done() {
                      return this.display.every(displ => displ.done === true);
                    }
                  }
                },
                {
                  name: "Financial Reports",
                  icon: "AssessmentOutlinedIcon",
                  context: {
                    name: "Financial Reports Management",
                    context: "financialReports",
                    display: [{
                      name: "main",

                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"]
                    }],
                    get done() {
                      return this.display.every(displ => displ.done === true);
                    }
                  }
                },
                {
                  name: "Recurring Payments",
                  icon: "AutorenewOutlinedIcon",
                  context: {
                    name: "Recurring Payments Management",
                    context: "recurringPayments",
                    display: [{
                      name: "main",

                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"]
                    }],
                    get done() {
                      return this.display.every(displ => displ.done === true);
                    }
                  }
                }
              ]
            },
            /* Maintenance & Operations */
            {
              name: "Maintenance & Operations",
              icon: "HandymanOutlinedIcon",
              context: undefined,
              items: [
                {
                  name: "Maintenance Requests",
                  icon: "BuildOutlinedIcon",
                  context: {
                    name: "Maintenance Requests Management",
                    context: "maintenanceRequests",
                    display: [{
                      name: "main",

                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"]
                    }],
                    get done() {
                      return this.display.every(displ => displ.done === true);
                    }
                  }
                },
                {
                  name: "Work Order Tracking",
                  icon: "AssignmentOutlinedIcon",
                  context: {
                    name: "Work Order Tracking Management",
                    context: "workOrderTracking",
                    display: [{
                      name: "main",

                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"]
                    }],
                    get done() {
                      return this.display.every(displ => displ.done === true);
                    }
                  }
                },
                {
                  name: "Vendor & Asset Management",
                  icon: "BusinessOutlinedIcon",
                  context: {
                    name: "Vendor & Asset Management",
                    context: "vendorAssetManagement",
                    display: [{
                      name: "main",

                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"]
                    }],
                    get done() {
                      return this.display.every(displ => displ.done === true);
                    }
                  }
                },
                {
                  name: "Preventive Maintenance",
                  icon: "PrecisionManufacturingOutlinedIcon",
                  context: {
                    name: "Preventive Maintenance Management",
                    context: "preventiveMaintenance",
                    display: [{
                      name: "main",

                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"]
                    }],
                    get done() {
                      return this.display.every(displ => displ.done === true);
                    }
                  }
                }
              ]
            },
            /* Communication Hub */
            {
              name: "Communication Hub",
              icon: "ChatOutlinedIcon",
              context: undefined,
              items: [
                {
                  name: "Broadcast Messaging",
                  icon: "CampaignOutlinedIcon",
                  context: {
                    name: "Broadcast Messaging Management",
                    context: "broadcastMessaging",
                    display: [{
                      name: "main",

                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"]
                    }],
                    get done() {
                      return this.display.every(displ => displ.done === true);
                    }
                  }
                },
                {
                  name: "Push Notifications",
                  icon: "NotificationsActiveOutlinedIcon",
                  context: {
                    name: "Push Notifications Management",
                    context: "pushNotifications",
                    display: [{
                      name: "main",

                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"]
                    }],
                    get done() {
                      return this.display.every(displ => displ.done === true);
                    }
                  }
                },
                {
                  name: "Resident Chat",
                  icon: "ForumOutlinedIcon",
                  context: {
                    name: "Resident Chat Management",
                    context: "residentChat",
                    display: [{
                      name: "main",

                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"]
                    }],
                    get done() {
                      return this.display.every(displ => displ.done === true);
                    }
                  }
                }
              ]
            },
            /* Community Portal */
            {
              name: "Community Portal",
              icon: "PeopleOutlined",
              context: undefined,
              items: [
                {
                  name: "Resident Directory",
                  icon: "PersonOutlined",
                  context: {
                    name: "Resident Directory Management",
                    context: "residentDirectory",
                    display: [{
                      name: "main",

                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"]
                    }],
                    get done() {
                      return this.display.every(displ => displ.done === true);
                    }
                  }
                },
                {
                  name: "Event Calendar",
                  icon: "CalendarTodayOutlinedIcon",
                  context: {
                    name: "Event Calendar Management",
                    context: "eventCalendar",
                    display: [{
                      name: "main",

                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"]
                    }],
                    get done() {
                      return this.display.every(displ => displ.done === true);
                    }
                  }
                },
                {
                  name: "Document Library",
                  icon: "LibraryBooksOutlinedIcon",
                  context: {
                    name: "Document Library Management",
                    context: "documentLibrary",
                    display: [{
                      name: "main",

                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"]
                    }],
                    get done() {
                      return this.display.every(displ => displ.done === true);
                    }
                  }
                },
                {
                  name: "Community Forum",
                  icon: "ForumOutlinedIcon",
                  context: {
                    name: "Community Forum Management",
                    context: "communityForum",
                    display: [{
                      name: "main",

                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"]
                    }],
                    get done() {
                      return this.display.every(displ => displ.done === true);
                    }
                  }
                },
                {
                  name: "Community Marketplace",
                  icon: "StorefrontOutlinedIcon",
                  context: {
                    name: "Community Marketplace Management",
                    context: "communityMarketplace",
                    display: [{
                      name: "main",

                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"]
                    }],
                    get done() {
                      return this.display.every(displ => displ.done === true);
                    }
                  }
                }
              ]
            },
            /* Security & Access */
            {
              name: "Security & Access",
              icon: "SecurityOutlinedIcon",
              context: undefined,
              items: [
                {
                  name: "Visitor Pre-Approval",
                  icon: "HowToRegOutlinedIcon",
                  context: {
                    name: "Visitor Pre-Approval Management",
                    context: "visitorPreApproval",
                    display: [{
                      name: "main",

                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"]
                    }],
                    get done() {
                      return this.display.every(displ => displ.done === true);
                    }
                  }
                },
                {
                  name: "Digital Visitor Passes",
                  icon: "QrCodeOutlinedIcon",
                  context: {
                    name: "Digital Visitor Passes Management",
                    context: "digitalVisitorPasses",
                    display: [{
                      name: "main",

                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"]
                    }],
                    get done() {
                      return this.display.every(displ => displ.done === true);
                    }
                  }
                },
                {
                  name: "Emergency Alerts",
                  icon: "EmergencyOutlinedIcon",
                  context: {
                    name: "Emergency Alerts Management",
                    context: "emergencyAlerts",
                    display: [{
                      name: "main",

                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"]
                    }],
                    get done() {
                      return this.display.every(displ => displ.done === true);
                    }
                  }
                }
              ]
            },
            /* Settings */
            {
              name: "Settings",
              icon: "SettingsOutlinedIcon",
              context: undefined,
              items: [
                {
                  name: "User & Role Management",
                  icon: "ManageAccountsOutlinedIcon",
                  context: {
                    name: "User & Role Management",
                    context: "userRoleManagement",
                    display: [{
                      name: "main",

                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"]
                    }],
                    get done() {
                      return this.display.every(displ => displ.done === true);
                    }
                  }
                },
                {
                  name: "Association Profile",
                  icon: "BusinessOutlinedIcon",
                  context: {
                    name: "Association Profile Management",
                    context: "associationProfile",
                    display: [{
                      name: "main",

                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"]
                    }],
                    get done() {
                      return this.display.every(displ => displ.done === true);
                    }
                  }
                },
                {
                  name: "Notifications & Preferences",
                  icon: "NotificationsNoneOutlinedIcon",
                  context: {
                    name: "Notifications & Preferences Management",
                    context: "notificationsPreferences",
                    display: [{
                      name: "main",

                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"]
                    }],
                    get done() {
                      return this.display.every(displ => displ.done === true);
                    }
                  }
                },
                {
                  name: "Language Selector",
                  icon: "LanguageOutlinedIcon",
                  context: {
                    name: "Language Selector Management",
                    context: "languageSelector",
                    display: [{
                      name: "main",

                      values: [],
                      bulk: false,
                      dependency: [],
                      done: false,
                      action: ["create"]
                    }],
                    get done() {
                      return this.display.every(displ => displ.done === true);
                    }
                  }
                }
              ]
            }
          ]
        };


      // 2 - Check User's Status
      switch (user.userStatus) {

        case "Pending":
          if (user.userPack.packName === "Administrator") {

            resData.menu    = []
            resData.context = syndicateContext.Pending

            resData.redirect = {
              replace: true,
              redirect: true,
              to: `/registering`,
              data: [],
            }
          }
          break

        case "OnHold":
          // [ Contractor ] Basic User must fulfill the requirements (Create Site & Buildings + Sets his Aprt ) : redirect to `/welcome`,
          if (user.userPack.packName === "Administrator") {

            // const shareUrl = `${req.headers.origin}/register?packName=Syndicate&contractId=${existContracts[0].id}&referrer=${user.id}`

            resData.context = syndicateContext.onHold

            resData.redirect = {
              replace: true,
              redirect: true,
              to: `/${user.userPack.packName}/dashboard`.toLowerCase(),
              data: [],
            }

            resData.menu = []
          }
          break

        case "Active":
          
          if (user.userPack.packName === "Administrator") {

            resData.context = syndicateContext.Active
            resData.menu = syndicateMenu.active;
            resData.redirect = {
              replace: true,
              redirect: true,
              to: `/${user.userPack.packName}/dashboard`.toLowerCase(),
              data: [],
            }

          }
        
          break

        case "Inactive":
          // user should be a STAFF
          break

        case "Suspended":
          // user doesn't meet the requirments
          returnResult.error = true;
          returnResult.payload = "userStatusCompatibilityError";
          returnResult.code = 403;  // Bad request
          break

        default:
          // Status is uncompatible
          returnResult.error = true;
          returnResult.payload = "statusCompatibilityError";
          returnResult.code = 500;  // Bad request
          break
      }

      returnResult.payload = resData

    } else {

      returnResult.error = true;
      returnResult.payload = "userpackCompatibilityError";
      returnResult.code = 403;  // Bad request
    }

  } catch (error) {
    console.error("Error in check function:", error);
    // Handle unexpected errors
    returnResult.error = true;
    returnResult.payload = error;  // Return the full error object
    returnResult.code = 500;  // Internal server error
  }

  return returnResult
};

exports.activate = async function (id, reqUser) {
  let returnResult = {
    error: false,
    payload: null,
    code: 200
  };

  // Check if 'user' data is available in the token
  if (!id && !reqUser) {
    returnResult.error = true;
    returnResult.payload = "userDataUnavailable";
    returnResult.code = 400;  // Bad request
    return returnResult;  // Early return on error
  }

  try {

    // Find User by ID
    const userResult = await exports.findById(id);

    // Handle errors in finding user
    if (userResult.error) {
      returnResult.error = true;
      returnResult.payload = userResult.payload;
      returnResult.code = 404;  // User not found
      return returnResult;

    } else if (!userResult.payload) {
      
      returnResult.error = true;
      returnResult.payload = "userUnfound";
      returnResult.code = 404;  // Not found
      return returnResult;
    }

    // const isTheSame = exports.compare(reqUser, userResult.payload)
    /* isTheSame && */
    if( userResult.payload.userStatus === "OnHold"){

      const activationResult = await exports.update(id, {userStatus: "Active"}, false)

      // Handle errors in Activating user
      if (activationResult.error) {
        returnResult.error = true;
        returnResult.payload = activationResult.payload;
        returnResult.code = 404;  // User not found
        return returnResult;

      } else if (!activationResult.payload) {

        returnResult.error = true;
        returnResult.payload = "userUnfound";
        returnResult.code = 404;  // Not found
        return returnResult;
      }

      returnResult.payload = activationResult.payload
    }
    else {}


  } catch (error) {
    console.error("Error in activate function:", error);
    // Handle unexpected errors
    returnResult.error = true;
    returnResult.payload = error;  // Return the full error object
    returnResult.code = 500;  // Internal server error
  }

  return returnResult
};

exports.verify = async function (id, reqUser) {
  let returnResult = {
    error: false,
    payload: null,
    code: 200
  };

  // Check if 'user' data is available in the token
  if (!id && !reqUser) {
    returnResult.error = true;
    returnResult.payload = "userDataUnavailable";
    returnResult.code = 400;  // Bad request
    return returnResult;  // Early return on error
  }

  try {

    // Find User by ID
    const userResult = await exports.findById(id);

    // Find Contractor by ID
    const contractorResult = await exports.findById(id);

    // Find Staff by ID
    const staffResult = await exports.findById(id);

    // Find Contract by ID
    const contractResult = await exports.findById(id);

    // Handle errors in finding user
    if (userResult.error) {
      returnResult.error = true;
      returnResult.payload = userResult.payload;
      returnResult.code = 404;  // User not found
      return returnResult;

    } else if (!userResult.payload) {
      
      returnResult.error = true;
      returnResult.payload = "userUnfound";
      returnResult.code = 404;  // Not found
      return returnResult;
    }

    // const isTheSame = exports.compare(reqUser, userResult.payload)
    /* isTheSame && */
    if( userResult.payload.userStatus === "Pending"){

      const activationResult = await exports.update(id, {userStatus: "OnHold"}, false)

      // Handle errors in Activating user
      if (activationResult.error) {
        returnResult.error = true;
        returnResult.payload = activationResult.payload;
        returnResult.code = 404;  // User not found
        return returnResult;

      } else if (!activationResult.payload) {

        returnResult.error = true;
        returnResult.payload = "userUnfound";
        returnResult.code = 404;  // Not found
        return returnResult;
      }

      returnResult.payload = activationResult.payload
    }
    else {}


  } catch (error) {
    console.error("Error in activate function:", error);
    // Handle unexpected errors
    returnResult.error = true;
    returnResult.payload = error;  // Return the full error object
    returnResult.code = 500;  // Internal server error
  }

  return returnResult
};

// Function to compare reqUser and docUser objects
exports.compare = function (reqUser, docUser) {
  // Iterate through all the keys in reqUser
  
  for (const key in reqUser) {
    // If the key doesn't exist in docUser or the types don't match
    if (!(key in docUser) || typeof reqUser[key] !== typeof docUser[key]) {
      return false; // Return false immediately
    }

    // Handle case where the value is an array
    if (Array.isArray(reqUser[key])) {
      // Check if both arrays have the same length
      if (reqUser[key].length !== docUser[key].length) {
        return false; // If not, return false
      }
      // Compare arrays recursively
      for (let i = 0; i < reqUser[key].length; i++) {
        if (!exports.compare(reqUser[key][i], docUser[key][i])) {
          return false; // If array elements are not the same, return false
        }
      }
    }
    // Handle case where the value is an object
    else if (typeof reqUser[key] === 'object' && reqUser[key] !== null) {
      // Recursively compare the two objects
      if (!exports.compare(reqUser[key], docUser[key])) {
        return false; // Return false if object values are not equal
      }
    }
    // Handle case where the value is a primitive (string, number, etc.)
    else {
      // If the values are not the same, return false
      if (reqUser[key] !== docUser[key]) {
        return false;
      }
    }
  }
  // If all checks pass, return true
  return true;
}

exports.shouldRedirect = function (commingFrom, whereToGo){
  
  const parseURL = (url) => {
    const [path, query] = url.split("?"); // Split path and query string
    return {
      uris: path.split("/"), //.slice(1), // Remove empty first element (domain placeholder)
      params: query ? query.split("&").map(q => {
        const [key, value] = q.split("=");
        return { queryName: key, queryValue: value };
      }) : []
    };
  };

}

exports.checkStatus = async function (_user, contractor, staff, whoIsDemanding = 'USER') {
  let user = _user
  let defaultUserStatus = undefined;
  let defaultUserStatusPayload = undefined;
  
  let defaultContractStatus = undefined;

  // grab: "* Status Requirments" : [Contracts]
  const existContracts = await Count(Contract, { "contractContractors": contractor.id }, user.userPack.packOptions.contracts, whoIsDemanding)

  
  // at this point User status should be "Suspended"
  if( 
      existContracts.length < 1 &&
      existContracts.length > user.userPack.packOptions.contracts 
  ){
      defaultUserStatus = "Suspended"
  }
  // at this point User status should be 'OnHold', 'Active', 'Inactive'
  else {

    const [contractStatus, contractPayload] = await ContractHelpers.checkStatus(existContracts[0], user, contractor, staff, whoIsDemanding)

    switch (user.userPack.packName) {

      case 'Syndicate':      

        if( contractStatus !== user.userStatus && !['Inactive', 'Completed', 'Stopped'].includes(contractStatus) ){
          
          const userUpdated = await exports.update(user.id, { userStatus: contractStatus }, false);

          if (userUpdated.error || !userUpdated.payload) {
                    
            defaultContractStatus = "Suspended"
            user = {}

          } else {
            user = userUpdated.payload;
            console.log('userUpdated:', userUpdated)
          }
        }
            
        defaultUserStatus = user.userStatus;
        defaultUserStatusPayload = contractPayload

        /* switch (user.userStatus) {
          case "Suspended":

          break;

          case "Pending":
            
            defaultUserStatus = "Pending"
            defaultUserStatusPayload = contractPayload
            
          break;

          case "OnHold":

            defaultUserStatus = "OnHold"
            defaultUserStatusPayload = contractPayload
            
          break;

          case "Active":

          break;

          case "Inactive":

          break;
        
          default:
            break;
        } */
        

      break;

      default:
        defaultUserStatus = user.userStatus;
        defaultUserStatusPayload = contractPayload
      break;
    }
  }

  return [ defaultUserStatus, defaultUserStatusPayload, user ];

}