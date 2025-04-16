const Validator = require("validator");
const isEmpty = require("is-empty");
var m = new Date();

module.exports = validatePacksInput = (data) => {
  let errors = {};

  // Convert empty fields to an empty string so we can use validator functions
  data.pack_name = !isEmpty(data.pack_name) ? data.pack_name : "";
  data.details = !isEmpty(data.details) ? data.details : "";
  data.price_y = !isEmpty(data.price_y) ? data.price_y : "";
  data.price_m = !isEmpty(data.price_m) ? data.price_m : "";
  data.dicount = !isEmpty(data.dicount) ? data.dicount : "";
  //data.media = !isEmpty(data.media) ? data.media : "";
  //data.videos = !isEmpty(data.videos) ? data.videos : "";
  data.category = !isEmpty(data.category) ? data.category : "";
  //data.date_idnscription = m.getUTCFullYear() + "-" +("0" + (m.getUTCMonth()+1)).slice(-2) + "-" +("0" + m.getUTCDate()).slice(-2)

  // pack_name checks
  if (Validator.isEmpty(data.pack_name)) {
    errors.pack_name = "Pack Name field is required";
  }

  // details checks
  if (Validator.isEmpty(data.details)) {
    errors.details = "Details field is required";
  }

  // price_y checks
  if (Validator.isEmpty(data.price_y)) {
    errors.price_y = "Annual Price field is required";
  }

  // price_m checks
  if (Validator.isEmpty(data.price_m)) {
    errors.price_m = "Monthly Price field is required";
  }

// dicount checks
  if (Validator.isEmpty(data.dicount)) {
    errors.dicount = "Discount field is required";
  }

  
  // if (Validator.isEmpty(data.category)) {
  //     errors.category = "field is required";
  // }

  // if(Validator.isEmpty(data.media)){
  //   errors.media = "Media number is required"
  // }else if(!Validator.isLength(data.media)){
  //   errors.media = "Media number must be 10 Digits";
  // }


  return {
      errors,
      isValid: isEmpty(errors)
  };
};