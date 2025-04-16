'use strict';
const Pack = require('../models/packs.model');
const PackHelpers = require('./../helpers/packs.helper')
const validatePacksInput = require('./../validation/packs')

exports.create = async function (req, res) {
    const formData = req.body?.formData?.packs;

    if (!formData || !Array.isArray(formData) || formData.length === 0) {
        return res.status(400).json({ error: true, message: "noPacksProvided" });
    }
    
    try {

        // Validate input data 
        const { errors, isValid, code } = validatePacksInput(formData);
    
        if (!isValid) {
            return res.status(code).json({ error: true, message: "packsValidationFailed", data: errors, });
        }

        // Call the corresponding helper function 
        const contextResult = await PackHelpers.create(formData /*, args */);

        // Validate Action results data
        if (contextResult.error) {
            return res.status(contextResult.code).json({ error: true, message: "noPacksCreated", data: contextResult.payload });
        } else if (!contextResult.payload) {
            return res.status(contextResult.code).json({ error: true, message: "packsUnfound", data: { someContext: "someContextUnfound" } });
        }

        // Respond with the result from the helper function
        return res.status(400).json({ error: true, message: "packsCreated", code: contextResult.code, data: contextResult.payload });

    } catch (error) {
        console.error("Error in Action Context creation:", error);
        return res.status(500).json({ error: true, message: "InternalServerError", data: error.message, });
    }
};

// exports.findById = async function (req, res) {
//     const formData = req.body?.formData?.packs;

//     if (!formData || !Array.isArray(formData) || formData.length === 0) {
//         return res.status(400).json({ error: true, message: "noPacksProvided" });
//     }
    
//     try {

//         // Validate input data 
//         const { errors, isValid, code } = validatePacksInput(formData);
    
//         if (!isValid) {
//             return res.status(code).json({ error: true, message: "packsValidationFailed", data: errors, });
//         }

//         // Call the corresponding helper function 
//         const contextResult = await PackHelpers.action(formData /*, args */);

//         // Validate Action results data
//         if (contextResult.error) {
//             return res.status(contextResult.code).json({ error: true, message: contextResult.payload, data: contextResult.payload });
//         } else if (!contextResult.payload) {
//             return res.status(422).json({ error: true, message: "packsUnfound", data: { userContext: "someContextUnfound" } });
//         }

//         const createdContext = contextResult.payload;

//         // Respond with the result from the helper function
//         return res.status(400).json({ error: true, message: "validationFailed", code: 400, data: createdContext });

//     } catch (error) {
//         console.error("Error in Action Context creation:", error);
//         return res.status(500).json({ error: true, message: "InternalServerError", data: error.message, });
//     }
// };

exports.findAll = async function (req, res) {
    /* const formData = req.body?.formData?.packs;

    if (!formData || !Array.isArray(formData) || formData.length === 0) {
        return res.status(400).json({ error: true, message: "noPacksProvided" });
    } */
    
    try {

        /* // Validate input data 
        const { errors, isValid, code } = validatePacksInput(formData);
    
        if (!isValid) {
            return res.status(code).json({ error: true, message: "packsValidationFailed", data: errors, });
        } */

        // Call the corresponding helper function 
        const contextResult = await PackHelpers.findAll(/*formData , args */);

        // Validate Action results data
        if (contextResult.error) {
            return res.status(contextResult.code).json({ error: contextResult.error, message: "packsFindError", data: contextResult.payload });
        } else if (!contextResult.payload) {
            return res.status(contextResult.code).json({ error: contextResult.error, message: "packsUnfound", data: { userContext: "someContextUnfound" } });
        }

        // Respond with the result from the helper function
        return res.status(contextResult.code).json({ error: contextResult.error, message: "packsFound", code: 200, data: contextResult.payload });

    } catch (error) {
        console.error("Error in Action Context creation:", error);
        return res.status(500).json({ error: true, message: "InternalServerError", data: error.message, });
    }
};

// exports.update = async function (req, res) {
//     const formData = req.body?.formData?.packs;

//     if (!formData || !Array.isArray(formData) || formData.length === 0) {
//         return res.status(400).json({ error: true, message: "noPacksProvided" });
//     }
    
//     try {

//         // Validate input data 
//         const { errors, isValid, code } = validatePacksInput(formData);
    
//         if (!isValid) {
//             return res.status(code).json({ error: true, message: "packsValidationFailed", data: errors, });
//         }

//         // Call the corresponding helper function 
//         const contextResult = await PackHelpers.action(formData /*, args */);

//         // Validate Action results data
//         if (contextResult.error) {
//             return res.status(contextResult.code).json({ error: true, message: contextResult.payload, data: contextResult.payload });
//         } else if (!contextResult.payload) {
//             return res.status(422).json({ error: true, message: "packsUnfound", data: { userContext: "someContextUnfound" } });
//         }

//         const createdContext = contextResult.payload;

//         // Respond with the result from the helper function
//         return res.status(400).json({ error: true, message: "validationFailed", code: 400, data: createdContext });

//     } catch (error) {
//         console.error("Error in Action Context creation:", error);
//         return res.status(500).json({ error: true, message: "InternalServerError", data: error.message, });
//     }
// };

// exports.delete = async function (req, res) {
//     const formData = req.body?.formData?.packs;

//     if (!formData || !Array.isArray(formData) || formData.length === 0) {
//         return res.status(400).json({ error: true, message: "noPacksProvided" });
//     }
    
//     try {

//         // Validate input data 
//         const { errors, isValid, code } = validatePacksInput(formData);
    
//         if (!isValid) {
//             return res.status(code).json({ error: true, message: "packsValidationFailed", data: errors, });
//         }

//         // Call the corresponding helper function 
//         const contextResult = await PackHelpers.action(formData /*, args */);

//         // Validate Action results data
//         if (contextResult.error) {
//             return res.status(contextResult.code).json({ error: true, message: contextResult.payload, data: contextResult.payload });
//         } else if (!contextResult.payload) {
//             return res.status(422).json({ error: true, message: "packsUnfound", data: { userContext: "someContextUnfound" } });
//         }

//         const createdContext = contextResult.payload;

//         // Respond with the result from the helper function
//         return res.status(400).json({ error: true, message: "validationFailed", code: 400, data: createdContext });

//     } catch (error) {
//         console.error("Error in Action Context creation:", error);
//         return res.status(500).json({ error: true, message: "InternalServerError", data: error.message, });
//     }
// };
