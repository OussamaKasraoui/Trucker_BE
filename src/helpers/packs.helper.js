'use strict';
const Pack = require('../models/packs.model');

exports.initPacks = [
    {
        packName: "Administrator",
        packType: "Basic",
        packStatus: "Active",
        packDesc: [{
            DOM: 'p',
            text: "Descriptions goes here"
        }],
        packPrice: {
            price: 100,
            discount: 0
        },
        packOptions: {
            contracts: 1,
            agreements: 5,

            sites: 1,
            buildings: 12,
            apartments: 6,
            
            staff: 0,
            support: true,
            features: [{ type: "Mixed"}]
        },
        packContexts: [
            "users",
            "contractors",
            "staff",
            "contracts",
            "agreements",
            "services",
            "tasks",
            "deliveries",
            "payments",
            "reports",
        ]
    },
    {
        packName: "Customer",
        packType: "Basic",
        packStatus: "Active",
        packDesc: [{
            DOM: 'p',
            text: "Descriptions goes here"
        }],
        packPrice: {
            price: 100,
            discount: 0
        },
        packOptions: {
            contracts: 1,
            agreements: 5,

            sites: 1,
            buildings: 12,
            apartments: 6,
            
            staff: 0,
            support: true,
            features: [{ type: "Mixed"}]
        },
        packContexts: [
            "users",
            "contractors",
            "staff",
            "contracts",
            "agreements",
            "services",
            "tasks",
            "deliveries",
            "payments",
            "reports",
        ]
    },
    {
        packName: "Contractor",
        packType: "Basic",
        packStatus: "Active",
        packDesc: [{
            DOM: 'p',
            text: "Descriptions goes here"
        }],
        packPrice: {
            price: 100,
            discount: 0
        },
        packOptions: {
            contracts: 1,
            agreements: 5,

            sites: 1,
            buildings: 12,
            apartments: 6,
            
            staff: 0,
            support: true,
            features: [{ type: "Mixed"}]
        },
        packContexts: [
            "users",
            "contractors",
            "staff",
            "contracts",
            "agreements",
            "services",
            "tasks",
            "deliveries",
            "payments",
            "reports",
        ]
    },
]

// Create or insert multiple packs into the database
exports.create = async function (packs) {
    let returnPacks = {
        error: false,
        payload: null,
        code: 200
    }; 

    // Check if packs is null or undefined
    if (!packs) {
        returnPacks.error = true;
        returnPacks.payload = "noPacksProvided";
        returnPacks.code = 400;
        return returnPacks; // Early return when packs is not provided
    }

    // If 'packs' is a JSON object, wrap it in an array to handle as a single pack
    if (typeof packs === 'object' && packs !== null && !Array.isArray(packs)) {
        packs = [packs];  // Convert single JSON object to an array
    }

    // Check if 'packs' is an array and is empty
    if (Array.isArray(packs) && packs.length === 0) {
        returnPacks.error = true;
        returnPacks.payload = "noPacksProvided";
        returnPacks.code = 400;
        return returnPacks; // Early return for invalid input
    }

    try {
        // Insert a single pack or multiple packs based on the length of the array
        if (packs.length === 1) {
            const savedPack = await Pack.create(packs[0]);  // Use packs[0] for single document creation
            returnPacks.payload = savedPack;
        } else {
            const savedPacks = await Pack.insertMany(packs); // Insert multiple packs
            returnPacks.payload = savedPacks;
        }
        returnPacks.code = 201; // Resource created

    } catch (err) {
        console.error("An error occurred while adding items to Packs collection: Error:", err);

        returnPacks.error = true;
        returnPacks.payload = err;
        returnPacks.code = 500; // Internal server error
    }

    return returnPacks; // Final return
};


exports.findById = async function (id) {
    let returnResult = {
        error: false,
        payload: null,
        code: 200
    };

    // Check if 'id' is provided
    if (!id) {
        returnResult.error = true;
        returnResult.payload = "packIDNotProvided";
        returnResult.code = 400;
        return returnResult; // Early return on error
    }

    try {
        // Find the document by ID
        const foundDocument = await Pack.findById(id);

        // Check if the document was found
        if (!foundDocument) {
            returnResult.error = true;
            returnResult.payload = "packUnfound";
            returnResult.code = 404;
        } else {
            returnResult.payload = foundDocument.toJSON();
            returnResult.code = 200;
        }

    } catch (err) {
        console.error("Error finding document by ID:", err);
        // Handle errors
        if (err.path){
            returnResult.error = true;
            returnResult.payload = "packUnfound"; //err;
            returnResult.code = 400;
        }
        else{
            returnResult.error = true;
            returnResult.payload = err;
            returnResult.code = 500;
        }
    }

    // Return the result
    return returnResult;
};


exports.findAll = async function (params) {

    let returnContext = {
        error: false, 
        payload: null, 
        code: 200 
    };

    /* // Check if 'params' data is provided 
    if (!params || !Array.isArray(params)) {
        returnContext.error = true;
        returnContext.payload = "noParamsProvided"; // Consistent payload for missing user data 
        returnContext.code = Array.isArray(params) ? 400 : 500; // Bad request 
        return returnContext; // Early return on error 
    }  */
     
    const results = [];

    try {
        // find all document 
        const allPacks = await Pack.find();

        returnContext.error = false;
        returnContext.payload = await Promise.all(allPacks.map(async (pack) => {
            return await pack.populateAndTransform("MANAGER"); // Populate and transform the document
        }));         //allPacks; // Return all results, success or failure 
        returnContext.code = 200; // Resource created, with some possible failures 
        
        // // Loop over each site in the array and attempt to insert it 
        // for (const [index, pack] of allPacks.entries()) {
        //     if (pack.id == '') {
                
        //     } else {
        //         results.push({ code: 200, error: false, data: pack });
        //     }
        // }
        
        
        // results.push({ code: 200, error: false, data: allPacks });
    } 
    catch (error) {
        console.error("Error creating document:", error);

        returnContext.error = true;
        returnContext.payload = error;// Detailed errors 
        returnContext.code = 404; // Bad request for validation errors

        // const errorDetails = { code: 400, error: true, };

        // // Handle validation errors specifically 
        // if (error?.errors && Object.keys(error.errors).length) {
        //     const validationErrors = {};

        //     for (const key in error.errors) {
        //         if (error.errors.hasOwnProperty(key)) {
        //             validationErrors[key] = `${ key }Error`;
        //         } 
                
        //         if (key === 'some foreign key ID') {
        //             errorDetails.code = 422;// Bad request for Invalid dependency ID 
        //         }
        //     } 
            
        //     errorDetails.data = validationErrors;
        // } else { 
        //     errorDetails.code = 500 
        //     errorDetails.data = error 
        // } 
        
        // results.push(errorDetails);
    }    

    // // Check if all sites failed 
    // const allFailed = results.every(result => result.error === true);
    // const allSuccess = results.every(result => result.error === false);
    
    // if (allFailed) {
    //     returnContext.error = true;
    //     returnContext.payload = results;// Detailed errors 
    //     returnContext.code = 400; // Bad request for validation errors 
    // } else if (allSuccess) {
    //     returnContext.error = false;
    //     returnContext.payload = results; // Return all results, success or failure 
    //     returnContext.code = 201; // Resource created, with some possible failures 
    // } else { 
    //     returnContext.error = true;
    //     returnContext.payload = results; // Detailed errors 
    //     returnContext.code = 207; // Bad request for validation errors 
    // } 
    
    return returnContext;
};

/* exports.update = function (req, res) {
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
        res.status(400).send({ error: true, message: 'Please provide all required field' });
    } else {
        Pack.updateOne(req.params.id, new Pack(req.body), function (err, typ) {
            if (err) {
                console.log('packs.controller.js\tUpdate\tError:\n', err);
                res.send({ error: true, message: "Error while updating a Pack", data: err });
            }
            else {
                console.log('packs.controller.js\tUpdate\tResponse:\n', typ);
                res.json({ error: false, message: "Pack updated successfully", data: typ });
            }
        });
    }
};

exports.delete = function (req, res) {
    Pack.delete(req.params.id, function (err, typ) {
        if (err) {
            console.log('packs.controller.js\tDelete\tError:\n', err);
            res.send({ error: true, message: "Error while deleting a Pack", data: err });
        }
        else {
            console.log('packs.controller.js\tDelete\tResponse:\n', typ);
            res.json({ error: false, message: "Pack deleted successfully", data: typ });
        }
    });
};
 */