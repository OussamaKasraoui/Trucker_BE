const Email = require('../models/emails.model'); // Adjust the path if needed
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  }
});


exports.create = async function (emailData, session) {
  let returnEmail = {
    error: false,
    payload: null,
    code: 200
  };

  // Check if 'emailData' is provided
  if (!emailData) {
    returnEmail.error = true;
    returnEmail.payload = "noEmailDataProvided";  // Consistent payload for missing data
    returnEmail.code = 400;  // Bad request
    return returnEmail;  // Early return on error
  }

  try {
    // Clone the email data object to avoid mutating the original data
    const emailObject = { ...emailData };

    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: process.env.SMTP_SENDER,              // sender address
      to: emailObject.emailRecipient,   // list of receivers
      subject: emailObject.emailSubject,          // Subject line
      text: emailObject.emailBody,                // plain text body
      html: `<b>${emailObject.emailBody}</b>`,    // HTML body
    });

    // Update email object with sender/recipient info and email status
    emailObject.emailSender = info.envelope.from;
    emailObject.emailRecipient = info.envelope.to;

    // Set email status based on the result of sending
    if (info.rejected.length === info.envelope.to.length) {
      emailObject.emailStatus = "failed";
    } else if (info.accepted.length && info.envelope.to.length) {
      emailObject.emailStatus = "sent";
    }

    // Create a new Email document
    const /* newEmail */ populatedEmail = await Email.create(emailObject, session ? { session } : undefined);

    // Populate and transform the result
    //const populatedEmail = await newEmail.populateAndTransform(whoIsDemanding);

    // Check if the document was created successfully
    if (!populatedEmail) {
      returnEmail.error = true;
      returnEmail.payload = "emailCreationFailed";  // Creation failure
      returnEmail.code = 500;  // Internal server error
    } else {
      returnEmail.payload = populatedEmail;
      returnEmail.code = 201;  // Resource created successfully
    }

    return returnEmail;

  } catch (error) {
    console.error("Error creating email:", error);

    // Handle errors
    returnEmail.error = true;

    if (error?.errors && Object.keys(error.errors).length) {
      const errorMessages = {};

      // Handle validation errors
      for (const key in error.errors) {
        if (error.errors.hasOwnProperty(key)) {
          errorMessages[key] = `${key}Error`;
        }
      }
      returnEmail.payload = errorMessages;
      returnEmail.code = 400;  // Bad request for validation errors

    } else {
      returnEmail.payload = error.message;  // General error message
      returnEmail.code = 500;  // Internal server error
    }

    return returnEmail;
  }
};

