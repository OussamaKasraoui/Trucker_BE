const ObjectId = require('mongoose').Types.ObjectId;
const Validator = require("validator");
const isEmpty = require("is-empty");

function isValidObjectId(id){
     
  if(ObjectId.isValid(id)){
      if((String)(new ObjectId(id)) === id)
          return true;        
      return false;
  }
  return false;
}

module.exports = validateSiteInput = (_data) => {
  let isValid   = true;

  if(Array.isArray(_data)){
    let retErrors = _data.map((data) =>{
    let errors = {};

      // Convert empty fields to an empty string so we can use validator functions
      data.siteName     = !isEmpty(data.siteName) ?     data.siteName : "";
      data.siteDetails  = !isEmpty(data.siteDetails) ?  data.siteDetails : "";
      data.siteAddress  = !isEmpty(data.siteAddress) ?  data.siteAddress : "";
      data.siteCity     = !isEmpty(data.siteCity) ?     data.siteCity : "";
      data.siteType     = !isEmpty(data.siteType) ?     data.siteType : "";
      data.sitePrefix   = !isEmpty(data.sitePrefix) ?   data.sitePrefix : "";
      data.siteContract = !isEmpty(data.siteContract) ?   data.siteContract : "";
      

      //siteName checks
      if (Validator.isEmpty(data.siteName)) {
        errors.siteName = "Site name field is required";
      }

      //siteDetails checks
      if (Validator.isEmpty(data.siteDetails)) {
        errors.siteDetails = "Site details field is required";
      }

      //siteAddress checks
      if (Validator.isEmpty(data.siteAddress)) {
        errors.siteAddress = "Site address field is required";
      }

      //siteCity checks
      if (Validator.isEmpty(data.siteCity)) {
        errors.siteCity = "Site city field is required";
      }

      //siteType checks ['Simple', 'Complex']
      if (Validator.isEmpty(data.siteType)) {
        errors.siteType = "Site type field is required";
      }else if(!['Simple', 'Complex'].includes(data.siteType)){
        errors.siteType = "Site type value is not valid";
      }

      //sitePrefix checks
      if(Validator.isEmpty(data.sitePrefix)){
        errors.sitePrefix = "Site Prefix number is required"
      }

      // //siteContract checks
      // if(Validator.isEmpty(data.siteContract)){
      //   errors.siteContract = "site Contract ID is required"
      // } else if(!isValidObjectId(data.siteContract) || data.siteContract === "InvalidContratct"){
      //   errors.siteContract = "site Contract ID is not valid"
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