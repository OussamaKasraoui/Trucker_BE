const Validator = require("validator");
const isEmpty = require("is-empty");
var m = new Date();

module.exports = validateRegisterInput = (_data) => {
  let isValid = true;
  
  if (Array.isArray(_data)){
    let retErrors = _data.map((data) =>{

      let errors = {};

      // // userFirstName checks
      // if (Validator.isEmpty(data.userFirstName)) {
      //   errors.userFirstName = "First name field is required";
      // }

      // // userLastName checks
      // if (Validator.isEmpty(data.userLastName)) {
      //   errors.userLastName = "Last name field is required";
      // }

      // //userAddress checks
      // if (Validator.isEmpty(data.userAddress)) {
      //   errors.userAddress = "Address field is required";
      // }

      // Email checks
      if (Validator.isEmpty(data.userEmail)) {
        errors.userEmail = "Email field is required";
      } else if (!Validator.isEmail(data.userEmail)) {
        errors.userEmail = "Email is invalid";
      }

    // Password checks
      if (Validator.isEmpty(data.userPassword)) {
        errors.userPassword = "Password field is required";
      }

      if (!Validator.isLength(data.userPassword, { min: 6, max: 30 })) {
          errors.userPassword = "Password must be at least 6 characters";
      }

      // // Phone checks
      // if(Validator.isEmpty(data.userPhone)){
      //   errors.userPhone = "Phone number is required"
      // }else if(!Validator.isLength(data.userPhone, {min: 10, max: 14})){
      //   errors.userPhone = "Phone number must be 10 Digits";
      // }


      const empty = isEmpty(errors)
      isValid = isValid * empty

      return {
        code: empty ? 200 : 400,
        data: errors,
        error: !empty
      };
    })

    return {
      code: 400,
      isValid: isValid,
      errors: retErrors
    }
  } else {
    return {
      code: 500,
      isValid: false,
      errors: []
    }
  }
};