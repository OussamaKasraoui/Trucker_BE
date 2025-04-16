const Validator = require("validator");
const isEmpty = require("is-empty");
var m = new Date();

module.exports = validateSiteInput = (_data) => {
  let isValid   = true;
  if (Array.isArray(_data)){
    let retErrors = _data.map((data) =>{
      
      let errors = {};

      // Convert empty fields to an empty string so we can use validator functions
      data.apartmentNumber    = !isEmpty(data.apartmentNumber.toString()) ?  data.apartmentNumber : "";
      data.apartmentEtage     = !isEmpty(data.apartmentEtage.toString())  ?  data.apartmentEtage  : "";
      data.apartmentType      = !isEmpty(data.apartmentType)              ?  data.apartmentType   : "";
      

      //siteName checks
      if (typeof data.apartmentNumber !== "number" && Validator.isEmpty(data.apartmentNumber.toString())) {
        errors.apartmentNumber = "Apartment Number field is required";
      } else if (!Validator.isNumeric(data.apartmentNumber.toString())) {
        errors.apartmentNumber = "Apartment Number field must be a number";
      }

      //siteDetails checks
      if (typeof data.apartmentEtage !== "number" && Validator.isEmpty(data.apartmentEtage.toString())) {
        errors.apartmentEtage = "Apartment Etage field is required";
      } else if (!Validator.isNumeric(data.apartmentEtage.toString())) {
        errors.apartmentEtage = "Apartment Etage field must be a number";
      }

      //siteAddress checks
      if (Validator.isEmpty(data.apartmentType)) {
        errors.apartmentType = "Apartment Type field is required";
      }else if(!['Rental', 'Property'].includes(data.apartmentType)){
        errors.apartmentType = "Apartment type value is not valid";
      }

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