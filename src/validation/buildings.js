const Validator = require("validator");
const isEmpty = require("is-empty");
var m = new Date();


// Validator function
function isValidObjectId(id) {
  if (ObjectId.isValid(id)) {
    return String(new ObjectId(id)) === id;
  }
  return false;
}

module.exports = validateSiteInput = (_data) => {
  let isValid = true;
  
  if (Array.isArray(_data)){
    let retErrors = _data.map((data) =>{

      let errors = {};

      // Convert empty fields to an empty string so we can use validator functions
      data.buildingName         = !isEmpty(data.buildingName) ?     data.buildingName : "";
      data.buildingAddress      = !isEmpty(data.buildingAddress) ?  data.buildingAddress : "";
      data.buildingPrefix       = !isEmpty(data.buildingPrefix) ?  data.buildingPrefix : "";
      data.buildingFloors       = !isEmpty(data.buildingFloors) ?     data.buildingFloors : "";
      data.buildingAptPerFloor  = !isEmpty(data.buildingAptPerFloor) ?     data.buildingAptPerFloor : "";
      

      //siteName checks
      if (Validator.isEmpty(data.buildingName)) {
        errors.buildingName = "Building name field is required";
      }

      //siteDetails checks
      if (Validator.isEmpty(data.buildingAddress)) {
        errors.buildingAddress = "Building address field is required";
      }

      //siteAddress checks
      if (Validator.isEmpty(data.buildingPrefix)) {
        errors.buildingPrefix = "Building prefix field is required";
      }

      //siteCity checks
      if (typeof data.buildingFloors !== "number" && Validator.isEmpty(data.buildingFloors)) {
        errors.buildingFloors = "Building floors field is required";
      }else if (!Validator.isNumeric(data.buildingFloors.toString())) {
        errors.buildingFloors = "Building floors field must be a number";
      }

      //siteType checks ['Simple', 'Complex']
      if (typeof data.buildingAptPerFloor !== "number" && Validator.isEmpty(data.buildingAptPerFloor)) {
        errors.buildingAptPerFloor = "Building aptPerFloor field is required";
      } else if (!Validator.isNumeric(data.buildingAptPerFloor.toString())) {
        errors.buildingAptPerFloor = "Building aptPerFloor field must be a number";
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
    };

  } else {
    return {
      code: 500,
      isValid: false,
      errors: []
    }
  }
};