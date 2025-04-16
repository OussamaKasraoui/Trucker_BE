const Validator = require("validator");
const isEmpty = require("is-empty");
const dayjs = require("dayjs"); // Importing Dayjs for date validation

module.exports = function validateEmailInput(data) {
  let errors = {};

  // Convert empty fields to strings to standardize checks
  data.emailSubject = !isEmpty(data.emailSubject) ? data.emailSubject : "";
  data.emailBody = !isEmpty(data.emailBody) ? data.emailBody : "";
  data.emailRecipient = !isEmpty(data.emailRecipient) ? data.emailRecipient : "";
  data.emailSender = !isEmpty(data.emailSender) ? data.emailSender : "";
  data.emailSentAt = !isEmpty(data.emailSentAt) ? data.emailSentAt : "";
  data.emailScheduledAt = !isEmpty(data.emailScheduledAt) ? data.emailScheduledAt : "";

  // Email Subject checks
  if (Validator.isEmpty(data.emailSubject)) {
    errors.emailSubject = "Email subject is required";
  }

  // Email Body checks
  if (Validator.isEmpty(data.emailBody)) {
    errors.emailBody = "Email body is required";
  }

  // Email Recipient checks (should be a valid ObjectId)
  if (Validator.isEmpty(data.emailRecipient)) {
    errors.emailRecipient = "Email recipient is required";
  }

  // Email Sender checks
  if (Validator.isEmpty(data.emailSender)) {
    errors.emailSender = "Email sender is required";
  }

  // Email Sent At checks using Dayjs
  if (Validator.isEmpty(data.emailSentAt)) {
    errors.emailSentAt = "Email sent date is required";
  } else if (!dayjs(data.emailSentAt).isValid()) {
    errors.emailSentAt = "Email sent date must be a valid date";
  }

  // Email Scheduled At checks using Dayjs
  if (Validator.isEmpty(data.emailScheduledAt)) {
    errors.emailScheduledAt = "Email scheduled date is required";
  } else if (!dayjs(data.emailScheduledAt).isValid()) {
    errors.emailScheduledAt = "Email scheduled date must be a valid date";
  }

  // Validate email attachments if they exist
  if (data.emailAttachments && Array.isArray(data.emailAttachments)) {
    data.emailAttachments.forEach((attachment, index) => {
      if (Validator.isEmpty(attachment.fileName)) {
        errors[`emailAttachments[${index}].fileName`] = "File name is required";
      }
      if (Validator.isEmpty(attachment.fileType)) {
        errors[`emailAttachments[${index}].fileType`] = "File type is required";
      }
      if (Validator.isEmpty(attachment.fileUrl)) {
        errors[`emailAttachments[${index}].fileUrl`] = "File URL is required";
      }
    });
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};
