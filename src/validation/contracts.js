const ObjectId = require('mongoose').Types.ObjectId;
const Validator = require("validator");
const isEmpty = require("is-empty");
const dayjs = require("dayjs");

// Validator function
function isValidObjectId(id) {
  if (ObjectId.isValid(id)) {
    return String(new ObjectId(id)) === id;
  }
  return false;
}

module.exports = validateContractsInput = (_data) => {
  let isValid = true;

  if (Array.isArray(_data)){
    let retErrors = _data.map((data) => {
      let errors = {};

      // Convert empty fields to empty string or array
      data.contractContractor = isValidObjectId(data.contractContractor) ? data.contractContractor : "";
      data.contractCreator = isValidObjectId(data.contractCreator) ? data.contractCreator : "";

      // Contract Contractor checks
      if (Validator.isEmpty(data.contractContractor)) {
        errors.contractContractor = "contractContractor field is required";
      } else if (!isValidObjectId(data.contractContractor)) {
        errors.contractContractor = "contractContractor field is not valid";
      }

      // Contract Creator checks
      if (Validator.isEmpty(data.contractCreator)) {
        errors.contractCreator = "contractCreator field is required";
      } else if (!isValidObjectId(data.contractCreator)) {
        errors.contractCreator = "contractCreator field is not valid";
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