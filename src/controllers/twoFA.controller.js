'use strict';

const dayjs = require('dayjs')

const validateTwoFAInput = require('./../validation/twoFA');
const TwoFAHelpers = require('../helpers/twoFA.helper');
const EmailsHelpers = require('../helpers/emails.helper');
const UserHelpers = require('../helpers/users.helper');
const ContractHelpers = require('../helpers/contracts.helper');

const { Count, Notify } = require('./../middelware/helper')


exports.create = async function (req, res) {
  // Check if request body is empty
  if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: true, message: 'Field required', data: req.body });
  }

  // Form validation (assuming validateTwoFAInput validates req.body)
  const { errors, isValid } = validateTwoFAInput(req.body);

  if (!isValid) {
    return res.status(400).json({ error: true, message: "Validation failed", data: errors.map(element => {
      if(element.isValid) return {}
      if(!element.isValid) return element.errors
  }) });
  }

  try {
    // Create Two-Factor Authentication using the helper function
    const generated = TwoFAHelpers.generate()

    const twoFACreationResult = await TwoFAHelpers.create({
        twoFAUser: user.id,
        twoFAFailedAttempts:  0,
        twoFALastGeneratedAt: generated.generatedAt,
        
        twoFAPassCode: [{
          passCodeSecret: generated.secret,
          passCodeExpiresAt: generated.expiresAt,
          passCodeGeneratedAt: generated.generatedAt,
        }],
    });
    const twoFA = twoFACreationResult.payload

    // Send Email to User with Two-Factor Authentication id
    const emailCreationResult = await EmailsHelpers.create({
      emailSubject:     "Account Verification",
      emailBody:        `copy past this: ${generated.secret} 
      expires at: ${generated.expiresAt}
      `,
      emailRecipient:   user,
      emailSender:      "activation@syndikit.app",
      emailStatus:      'pending',
      // sentAt:      req.body.sentAt || null,
      // scheduledAt: req.body.scheduledAt || null,
      // retryCount:  req.body.retryCount || 0,
      // attachments: req.body.attachments || []
    });

    // Handle TwoFA creation errors
    if (twoFACreationResult.error) {
      return res.status(500).json({ error: true, message: twoFACreationResult.error, data: twoFA });
    }

    // Return successful response
    return res.status(200).json({ error: false, message: "TwoFA created successfully", data: twoFA });

  } catch (err) {
    console.error("Error in TwoFA creation process:", err);
    return res.status(500).json({ error: true, message: "Internal server error", data: err.message });
  }
};


exports.verify = async function (req, res) {
  // Check if request body is empty
  if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: true, message: 'Field required', data: req.body });
  }

  // Form validation (assuming validateTwoFAInput validates req.body)
  const { errors, isValid } = validateTwoFAInput(req.body.formData);

  if (!isValid) {
    return res.status(400).json({ error: true, message: "Validation failed", data: errors });
  }

  try {
    const userId = req.body.formData.twoFAUser
    const secret = req.body.formData.secret
    const whoIsDemanding = userId === req.decoded.id ? "MANAGER" : "USER"

    const twoFADocResult = await TwoFAHelpers.findById(userId, whoIsDemanding); 
    
    // Handle TwoFA creation errors
    if (twoFADocResult.error) {
        return res.status(404).json({ error: true, message: twoFADocResult.error, data: twoFADocResult.payload });
    }

    const twoFADoc = [twoFADocResult.payload.twoFAPassCode[twoFADocResult.payload.twoFAPassCode.length - 1]]
    // const expiresAt = dayjs(twoFADoc[0].passCodeExpiresAt)  
    const generatedAt = dayjs(twoFADoc[0].passCodeGeneratedAt) 
    const diff = dayjs().diff(generatedAt, 'hour')

    if( secret !== twoFADoc[0].passCodeSecret){
        return res.status(200).json({ error: true, message: twoFADoc[0].passCodeSecret, data: [{secret: "secretWrong"}] });
    }
    else if(diff >= 2 || twoFADoc[0].passCodeStatus === 'Expired'){

        // Call the helper function to update the TwoFA document
        const twoFAUpdateResult = await TwoFAHelpers.resend(userId);
        const twoFA = [twoFAUpdateResult.payload.twoFAPassCode[twoFAUpdateResult.payload.twoFAPassCode.length - 1]]
    
        // Send Email to User with Two-Factor Authentication id
        const emailCreationResult = await EmailsHelpers.create({
          emailSubject:     "Account Verification",
          emailBody:        `\tcopy past this: ${twoFA[0].passCodeSecret}\n\n\texpires at: ${twoFA[0].passCodeExpiresAt}`,
          emailRecipient:   req.decoded.user,
          emailSender:      "activation@syndikit.app",
          emailStatus:      'pending',
        });

        // Create Notification
        const notifications = await Notify(
            userId,
            "info",
            "Confirmation Code Sent",
            `[${req.decoded.user.userEmail}] Check your email address`,
            [userId],
        );

        return res.status(422).json({ error: true, message: notifications, data: [{ secret: "secretExpired"}] });
    }

    // Create TwoFA using the helper function
    const twoFAActivationResult = await TwoFAHelpers.verify(userId, whoIsDemanding);

    // Handle TwoFA creation errors
    if (twoFAActivationResult.error) {
      return res.status(500).json({ error: true, message: twoFAActivationResult.error, data: twoFAActivationResult.payload });
    }  

    // // set userStatus & ContractStatus to OnHold
    const userResult = await UserHelpers.update(userId, { userStatus: 'OnHold' }, false, whoIsDemanding);
    // const contractResult = await ContractHelpers.update(userId, { contractStatus: 'OnHold' }, false);

    // Handle user errors
    if (userResult.error) {
        return res.status(500).json({ error: true, message: userResult.error, data: userResult.payload });
    }
    const user = userResult.payload

    // Generate a new Token
    const tokenizeResult = await UserHelpers.tokenize(user, whoIsDemanding);
    
    // Handle Token creation errors
    if (tokenizeResult.error) {
      return res.status(500).json({ error: true, message: tokenizeResult.error, data: tokenizeResult.payload });
    }
    
    const token = tokenizeResult.payload.token

    // Create Notification
    const notifications = await Notify(
      userId,
      "success",
      "Email address has been Verified",
      `[${req.decoded.user.userEmail}] has been Verified`,
      [userId],
    );

    const twoFA = [twoFAActivationResult.payload.twoFAPassCode[twoFAActivationResult.payload.twoFAPassCode.length - 1]] 

    // Return successful response
    return res.status(200).json({ error: false, message: notifications, data: { user: user, token: token, values: twoFA} });

  } catch (err) {
    console.error("Error in TwoFA creation process:", err);
    return res.status(500).json({ error: true, message: "Internal server error", data: err.message });
  }
};


exports.update = async function (req, res) {
    // Check if request body contains the fieldName and newValue
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: true, message: 'No data provided for update', data: req.body });
    }

    try {
        const { id } = req.body || req.params; // Assuming the TwoFA ID is passed in the URL params
        const updates = req.body;  // Object containing dynamic fields to be updated

        // Call the helper function to update the TwoFA document
        const twoFAUpdateResult = await TwoFAHelpers.update(id, updates);

        // Handle errors from the helper function
        if (twoFAUpdateResult.error) {
            return res.status(500).json({ error: true, message: twoFAUpdateResult.payload, data: twoFAUpdateResult.payload });
        }

        // Return successful response with updated data
        return res.status(200).json({ error: false, message: "TwoFA updated successfully", data: twoFAUpdateResult.payload });

    } catch (err) {
        console.error("Error in TwoFA update process:", err);
        return res.status(500).json({ error: true, message: "Internal server error", data: err.message });
    }
};


exports.resend = async function (req, res) {
  // Check if request query contains the userId
  if (!req.query || !req.query.twoFAUser) { // Check specifically for twoFAUser
      return res.status(400).json({ error: true, message: 'User ID (twoFAUser) required in query parameters.', data: req.query });
  }

  try {
      const userId = req.query.twoFAUser;

      // Call the helper function to update the TwoFA document
      const twoFAUpdateResult = await TwoFAHelpers.resend(userId, userId === req.decoded.id ? "MANAGER" : "USER"); 

      // *** ADD CHECK HERE: Handle errors from the helper function ***
      if (twoFAUpdateResult.error) {
          // Use the code and payload from the helper's result
          return res.status(twoFAUpdateResult.code).json({
              error: true,
              message: "Failed to resend 2FA code.", // Generic message
              data: twoFAUpdateResult.payload // Detailed error from helper
          });
      }

      // *** FIX HERE: Access data from the RAW payload ***
      // twoFAUpdateResult.payload is now the raw Mongoose document
      const rawTwoFADocument = twoFAUpdateResult.payload;

      // Check if twoFAPassCode exists and is an array before accessing
      if (!rawTwoFADocument || !Array.isArray(rawTwoFADocument.twoFAPassCode) || rawTwoFADocument.twoFAPassCode.length === 0) {
           console.error("Error in resend controller: twoFAPassCode array is missing or empty in the document returned by helper.", rawTwoFADocument);
           return res.status(500).json({ error: true, message: "Internal error processing 2FA data after resend.", data: null });
      }

      // Get the latest passcode details directly from the raw document
      const latestPassCode = rawTwoFADocument.twoFAPassCode[rawTwoFADocument.twoFAPassCode.length - 1];

      // Send Email to User with Two-Factor Authentication id
      // Ensure req.decoded.user is available and correct, or use fetched user details
      const emailRecipient = req.decoded?.user; // Or use 'user' fetched earlier
      if (!emailRecipient) {
           console.error("Error sending 2FA email: Recipient user details not found in req.decoded.user");
           // Decide how to handle this - maybe skip email or return error
      } else {
          try {
              await EmailsHelpers.create({
                  emailSubject: "Account Verification Code", // Clearer subject
                  emailBody: `Your verification code is: ${latestPassCode.passCodeSecret}\n\nIt expires at: ${dayjs(latestPassCode.passCodeExpiresAt).format('YYYY-MM-DD HH:mm:ss')}`, // Use dayjs for formatting
                  emailRecipient: emailRecipient, // Use the correct user object/ID
                  emailSender: "activation@syndikit.app",
                  emailStatus: 'pending',
              });
          } catch (emailError) {
               console.error("Error sending 2FA email:", emailError);
               // Decide if this should cause the request to fail or just log the error
          }
      }


      // Create Notification
      // Ensure req.decoded.user.userEmail is available
      const notificationMessage = req.decoded?.user?.userEmail
          ? `[${req.decoded.user.userEmail}] Check your email address`
          : "Check your email address for the verification code";

      const notifications = await Notify(
          userId,
          "info",
          "Confirmation Code Sent",
          notificationMessage,
          [userId], // Target user
      );

      // Return successful response - maybe return limited data, not the full secret
      return res.status(200).json({
          error: false,
          message: notifications, // Or a simpler success message like "Verification code sent."
          data: latestPassCode.passCodeSecret, // TODO: Consider removing this in PRODUCTION
      });

  } catch (err) {
      console.error("Error in TwoFA resend process:", err); // Log the actual error
      return res.status(500).json({ error: true, message: "Internal server error during 2FA resend.", data: err.message });
    }
};
  