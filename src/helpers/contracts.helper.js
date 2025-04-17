'use strict';
const { Count, Notify } = require('./../middelware/helper')

const TwoFAs    = require('../models/twoFA.model');
const Contract  = require('./../models/contracts.model');
const Agreement = {}; // require('../models/agreements.model');
const Site      = {}; // require('../models/sites.model');
const Building  = {}; // require('../models/buildings.model');
const Apartment = {}; // require('../models/apartments.model');


exports.create = async function (contracts) {
    let returnContract = {
        error: false,
        payload: null,
        code: 201 // Set default code for successful creation
    };

    // Check if 'contract' data is provided
    if (!contracts || !Array.isArray(contracts)) {
        returnContract.error = true;
        returnContract.payload = "noContractDataProvided"; // Consistent payload for missing data
        returnContract.code = Array.isArray(contracts) ? 400 : 500; // Bad request
        return returnContract; // Early return on error
    }

    const results = [];

    // Loop over each site in the array and attempt to insert it
    for (const [index, contract] of contracts.entries()) {
        if (contract.id == '') {

            try {
                // Create new contract document
                const docContract = await Contract.create(contract);

                results.push({ code: 201, error: false, data: await docContract.populateAndTransform(whoIsDemanding) });

            } catch (error) {
                console.error("Error creating contract:", error);

                const errorDetails = {
                    code: 400,
                    error: true,
                };

                // Handle validation errors specifically
                if (error?.errors && Object.keys(error.errors).length) {

                    const validationErrors = {};
                    for (const key in error.errors) {

                        if (error.errors.hasOwnProperty(key)) {
                            validationErrors[key] = `${key}Error`;
                        }

                        if (key === 'contractContractor') {
                            errorDetails.code = 422;  // Bad request for Invalid dependency ID
                        }
                    }

                    errorDetails.data = validationErrors;

                } else {
                    errorDetails.code = 500
                    errorDetails.data = error
                }

                results.push(errorDetails);
            }
        } else {
            results.push({ code: 201, error: false, data: contract });
        }
    }

    // Check if all sites failed
    const allFailed = results.every(result => result.error === true);
    const allSuccess = results.every(result => result.error === false);

    if (allFailed) {
        returnContract.error = true;
        returnContract.payload = results;  // Detailed errors
        returnContract.code = 400;  // Bad request for validation errors
    }
    else if (allSuccess) {
        returnContract.error = false;
        returnContract.payload = results;  // Return all results, success or failure
        returnContract.code = 201;  // Resource created, with some possible failures
    }
    else {
        returnContract.error = true;
        returnContract.payload = results;  // Detailed errors
        returnContract.code = 207;  // Bad request for validation errors
    }

    return returnContract;
};

exports.findAll = async function (contractors, pack, whoIsDemanding = 'USER') {
    let returnContracts = {
        error: false,
        payload: null,
        code: 200, // Default HTTP status code for a successful operation
    };

    try {
        // Query all contracts and populate references
        const contracts = await Count(
            Contract,
            {
                contractContractors: {
                    "$in": contractors
                }
            },
            pack.packOptions?.sites,
            whoIsDemanding
        )

        if (!contracts || contracts.length === 0) {
            returnContracts.error = true;
            returnContracts.payload = "No contracts found";
            returnContracts.code = 404; // Not Found
        } else {
            returnContracts.payload = contracts;
        }
    } catch (err) {
        console.error("Error fetching contracts:", err);
        returnContracts.error = true;
        returnContracts.payload = err;
        returnContracts.code = 500; // Internal Server Error
    }

    return returnContracts;
};

exports.findById = async function (id) {
    let returnContext = {
        error: false,
        payload: null,
        code: 200 // Default success code
    };

    if (!id) {
        returnContext.error = true;
        returnContext.payload = "noContractIdProvided";
        returnContext.code = 400; // Bad request
        return returnContext; // Early return on error
    }

    try {
        const contract = await Contract.findById(id)
            .populateAndTransform("contractContractors");

        if (!contract) {
            returnContext.error = true;
            returnContext.payload = "contractNotFound";
            returnContext.code = 404; // Not found
        } else {
            returnContext.payload = contract;
            returnContext.code = 200; // Success
        }

    } catch (error) {
        console.error("Error finding contract by ID:", error);

        returnContext.error = true;
        returnContext.payload = error.message;
        returnContext.code = 500; // Internal server error
    }

    return returnContext;
};

exports.update = async function (userId, updateData) {
    let returnContext = {
        error: false,
        payload: null,
        code: 200 // Default success code
    };

    if (!userId || Object.keys(updateData).length === 0) {
        returnContext.error = true;
        returnContext.payload = "noUpdateDataProvided";
        returnContext.code = 400; // Bad request
        return returnContext; // Early return on error
    }

    try {
        const updatedContract = await Contract.findOneAndUpdate({ contractUser :userId }, updateData, {
            new: true,
            runValidators: true
        });

        if (!updatedContract) {
            returnContext.error = true;
            returnContext.payload = "contractNotFoundOrUpdateFailed";
            returnContext.code = 404; // Not found
        } else {
            returnContext.payload = updatedContract;
        }

    } catch (error) {
        console.error("Error updating contract:", error);

        returnContext.error = true;
        returnContext.payload = error.message;
        returnContext.code = 500; // Internal server error
    }

    return returnContext;
};

exports.delete = async function (id) {
    let returnContext = {
        error: false,
        payload: null,
        code: 200 // Default success code
    };

    if (!id) {
        returnContext.error = true;
        returnContext.payload = "noContractIdProvided";
        returnContext.code = 400; // Bad request
        return returnContext; // Early return on error
    }

    try {
        const deletedContract = await Contract.findByIdAndDelete(id);

        if (!deletedContract) {
            returnContext.error = true;
            returnContext.payload = "contractNotFoundOrDeleteFailed";
            returnContext.code = 404; // Not found
        } else {
            returnContext.payload = deletedContract;
        }

    } catch (error) {
        console.error("Error deleting contract:", error);

        returnContext.error = true;
        returnContext.payload = error.message;
        returnContext.code = 500; // Internal server error
    }

    return returnContext;
};

exports.checkStatus = async function (Contract, user, contractor, staff, whoIsDemanding = 'USER') {

    let contract = Contract;
    let defaultContractStatus = undefined;
    
    // grab: "Pending Status Requirments" : [TwoFAs]
    const existTwoFAs =     await Count(TwoFAs, { "twoFAUser": user.id }, user.userPack.packOptions.agreements || 0, whoIsDemanding)
            
    // // grab: "OnHold Status Requirments" : [Sites, Buildings, Apartments]
    // const existSites =      await Count(Site,       { "siteContract":      contract.id }, user.userPack.packOptions.agreements || 0)
    // const existBuildings =  await Count(Building,   { "buildingContract":  contract.id }, user.userPack.packOptions.agreements || 0)
    // const existApartments = await Count(Apartment,  { "apartmentContract": contract.id }, user.userPack.packOptions.agreements || 0)

    // // grab: "Active Status Requirments" : [Agreements]
    // const existAgreements = await Count(Agreement, { "agreementContract":  contract.id }, user.userPack.packOptions.agreements || 0)


    switch (user.userPack.packName) {
        case 'Administrator':
            
        // at this point Contract status should be "Active"
        if( Boolean(
                existTwoFAs.length === 1 && 
                existTwoFAs[0].twoFAStatus === "Verified" 
        )){
            defaultContractStatus = "Active"
        }

        // // at this point Contract status should be "OnHold"
        // else if( Boolean( 
        //         existTwoFAs.length === 1 && 
        //         existTwoFAs[0].twoFAStatus === "Verified" 
        // )){
        //     defaultContractStatus = "OnHold"
        // }
        
        // at this point Contract status should be "Pending"
        else if( Boolean( 
            existTwoFAs.length === 1 && 
            existTwoFAs[0].twoFAStatus === "Pending" 
        )){
            defaultContractStatus = "Pending"
        }

        else {
            defaultContractStatus = "Suspended"
        }

        

        if( defaultContractStatus !== contract.contractStatus &&
            !['Inactive', 'Completed', 'Stopped'].includes(contract.contractStatus)
        ){
            // const contractUpdated = await exports.update(user.id, { contractStatus: defaultContractStatus }, false);
            const contractUpdated = await exports.update(user.id, { contractStatus: defaultContractStatus }, false);

            if (contractUpdated.error || !contractUpdated.payload) {
                
                defaultContractStatus = "Suspended"
                contract = {}

            } else {
                contract = await contractUpdated.payload.toJSON();
                console.log('contractUpdated:', contractUpdated)
            }

        } else {
            defaultContractStatus = contract.contractStatus
        }

        break;

        case 'Customer':
            
            // at this point Contract status should be "Active"
            if( Boolean(
                    existTwoFAs.length === 1 && 
                    existTwoFAs[0].twoFAStatus === "Verified"  && 
                    false
                    // existSites.length && 
                    // existBuildings.length && 
                    // existApartments.length
            )){
                defaultContractStatus = "Active"
            }

            // at this point Contract status should be "OnHold"
            else if( Boolean( 
                    existTwoFAs.length === 1 && 
                    existTwoFAs[0].twoFAStatus === "Verified" 
            )){
                defaultContractStatus = "OnHold"
            }
            
            // at this point Contract status should be "Pending"
            else if( Boolean( 
                existTwoFAs.length === 1 && 
                existTwoFAs[0].twoFAStatus === "Pending" 
            )){
                defaultContractStatus = "Pending"
            }

            else {
                defaultContractStatus = "Suspended"
            }

            

            if( defaultContractStatus !== contract.contractStatus &&
                !['Inactive', 'Completed', 'Stopped'].includes(contract.contractStatus)
            ){
                const contractUpdated = await exports.update(user.id, { contractStatus: defaultContractStatus }, false);

                if (contractUpdated.error || !contractUpdated.payload) {
                    
                    defaultContractStatus = "Suspended"
                    contract = {}

                } else {
                    contract = await contractUpdated.payload.toJSON();
                    console.log('contractUpdated:', contractUpdated)
                }

            } else {
                defaultContractStatus = contract.contractStatus
            }

        break;

            
        case 'Contractor':
            
        // at this point Contract status should be "Active"
        if( Boolean(
                existTwoFAs.length === 1 && 
                existTwoFAs[0].twoFAStatus === "Verified"  && 
                false
                // existSites.length && 
                // existBuildings.length && 
                // existApartments.length
        )){
            defaultContractStatus = "Active"
        }

        // at this point Contract status should be "OnHold"
        else if( Boolean( 
                existTwoFAs.length === 1 && 
                existTwoFAs[0].twoFAStatus === "Verified" 
        )){
            defaultContractStatus = "OnHold"
        }
        
        // at this point Contract status should be "Pending"
        else if( Boolean( 
            existTwoFAs.length === 1 && 
            existTwoFAs[0].twoFAStatus === "Pending" 
        )){
            defaultContractStatus = "Pending"
        }

        else {
            defaultContractStatus = "Suspended"
        }

        

        if( defaultContractStatus !== contract.contractStatus &&
            !['Inactive', 'Completed', 'Stopped'].includes(contract.contractStatus)
        ){
            const contractUpdated = await exports.update(user.id, { contractStatus: defaultContractStatus }, false);

            if (contractUpdated.error || !contractUpdated.payload) {
                
                defaultContractStatus = "Suspended"
                contract = {}

            } else {
                contract = await contractUpdated.payload.toJSON();
                console.log('contractUpdated:', contractUpdated)
            }

        } else {
            defaultContractStatus = contract.contractStatus
        }

        break;


        default:
        break;
    }

    return [
        defaultContractStatus,
        {
            // existSites,
            // existBuildings,
            // existApartments,

            existContracts: [ contract ],
            // existAgreements,
        }
    ];

}