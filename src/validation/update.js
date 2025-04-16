const Validator = require("validator");
const isEmpty = require("is-empty");
//var m = new Date();

module.exports = validateEditInput = (data) => {

  console.log('validation/update.js   data:\n'+ JSON.stringify(data))
  let errors = {};

  // Convert empty fields to an empty string so we can use validator functions
  data.firstName = !isEmpty(data.firstName) ? data.firstName : "";
  data.lastName = !isEmpty(data.lastName) ? data.lastName : "";
  //data.address = !isEmpty(data.address) ? data.address : "";
  data.email = !isEmpty(data.email) ? data.email : "";
  //data.password = !isEmpty(data.password) ? data.password : "";
  data.phone = !isEmpty(data.phone) ? data.phone : "";
  //data.date_inscription = m.getUTCFullYear() + "-" +("0" + (m.getUTCMonth()+1)).slice(-2) + "-" +("0" + m.getUTCDate()).slice(-2)

  // firstName checks
  if (Validator.isEmpty(data.firstName)) {
    errors.firstName = "First name field is required";
  }

  // lastName checks
  if (Validator.isEmpty(data.lastName)) {
    errors.lastName = "Last name field is required";
  }

  // Email checks
  if (Validator.isEmpty(data.email)) {
    errors.email = "Email field is required";
  } else if (!Validator.isEmail(data.email)) {
    errors.email = "Email is invalid";
  }

  // Phone Validator
  if(Validator.isEmpty(data.phone)){
      console.log("type of Phone: " + typeof data.phone)
    errors.phone = "Phone number is required"
  }else if(!Validator.isLength(data.phone, {min: 10, max: 10})){
    errors.phone = "Phone number must be 10 Digits";
  }

  return {
      errors,
      isValid: isEmpty(errors)
  };
};