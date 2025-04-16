const Validator = require("validator");
const isEmpty = require("is-empty");
const dayjs = require("dayjs"); // Importing Dayjs for date validation

module.exports = function validateTwoFAInput(data) {
  let errors = {};

  // Convert empty fields to strings to standardize checks
  data.twoFAUser = !isEmpty(data.twoFAUser) ? data.twoFAUser : "";
  data.secret = !isEmpty(data.secret) ? data.secret : "";
//   data.tempCode = !isEmpty(data.tempCode) ? data.tempCode : "";
//   data.expiresAt = !isEmpty(data.expiresAt) ? data.expiresAt : "";

  // User checks (should be a valid ObjectId)
  if (Validator.isEmpty(data.twoFAUser)) {
    errors.user = "User Email is required";
  }

  // Secret checks
  if (Validator.isEmpty(data.secret)) {
    errors.secret = "Secret field is required";
  }

//   // TempCode checks
//   if (Validator.isEmpty(data.tempCode)) {
//     errors.tempCode = "Temporary code is required";
//   }

//   // ExpiresAt checks using Dayjs (must be a valid date and in the future)
//   if (Validator.isEmpty(data.expiresAt)) {
//     errors.expiresAt = "Expiration date is required";
//   } else if (!dayjs(data.expiresAt).isValid()) {
//     errors.expiresAt = "Expiration date must be a valid date";
//   } else if (dayjs(data.expiresAt).isBefore(dayjs())) {
//     errors.expiresAt = "Expiration date must be in the future";
//   }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};
