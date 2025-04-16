const Validator = require("validator");
const isEmpty = require("is-empty");

module.exports = validateCategoryInput = (data) => {
  let errors = {};

  // Convert empty fields to an empty string so we can use validator functions
  data.category_name = !isEmpty(data.category_name) ? data.category_name : "";
  data.public = !isEmpty(data.public) ? data.public : "";
  data.details = !isEmpty(data.details) ? data.details : "";
  data.images = !isEmpty(data.images) ? data.images : "";
  data.videos = !isEmpty(data.videos) ? data.videos : "";
  
  // category_name checks
  if (Validator.isEmpty(data.category_name)) {
    errors.category_name = "Category Name field is required";
  }

  // category_name checks
  if (Validator.isEmpty(data.public)) {
    errors.public = "Public field is required";
  }

  // category_name checks
  if (Validator.isEmpty(data.details)) {
    errors.details = "Details field is required";
  }
  
  // videos checks
  if ((data.videos).length) {
    //errors.videos = "Annual Price field is required";
  }

  // images checks
  if ((data.images).length) {
    //errors.price_m = "Monthly Price field is required";
  }

  return {
      errors,
      isValid: isEmpty(errors)
  };
};