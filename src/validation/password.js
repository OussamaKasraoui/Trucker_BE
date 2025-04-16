const Validator = require("validator");
const isEmpty = require("is-empty");
var m = new Date();

module.exports = validatePasswordInput = (data) => {
  let errors = {};

  data.password = !isEmpty(data.password) ? data.password : "";
  
  // Password checks
  if (Validator.isEmpty(data.password)) {
    errors.password = "Password field is required";
  }

  if (!Validator.isLength(data.password, { min: 6, max: 30 })) {
      errors.password = "Password must be at least 6 characters";
  }

  return {
      errors,
      isValid: isEmpty(errors)
  };
};