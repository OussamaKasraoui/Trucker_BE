'use strict';
const Apartment = require('../models/apartments.model');
const { Count, Notify } = require('../middelware/helper')


exports.create = async function (apartments) {
    let returnApartments = {
        error: false,
        payload: null,
        code: 201 // Default code for successful creation
    };

    // Check if 'apartments' data is provided and is an array
    if (!apartments || !Array.isArray(apartments)) {
        returnApartments.error = true;
        returnApartments.payload = "noApartmentDataProvided"; // Consistent payload for missing data
        returnApartments.code = Array.isArray(apartments) ? 400 : 500; // Bad request or internal server error
        return returnApartments; // Early return on error
    }

    const results = [];

    // Loop through each apartment and attempt to insert
    for (const [index, apartment] of apartments.entries()) {
        if (apartment.id == '') {

            try {
                // Create a new apartment document
                const docApartment = await Apartment.create(apartment);

                results.push({ code: 201, error: false, data: await docApartment.populateAndTransform() });

            } catch (error) {
                console.error("Error creating apartment:", error);

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

                        if (key === 'apartmentBuilding') {
                            errorDetails.code = 422;  // Bad request for Invalid dependency ID
                        }
                    }

                    errorDetails.data = validationErrors;

                } else {
                    errorDetails.code = 500;
                    errorDetails.data = error; // General error message
                }

                results.push(errorDetails);
            }
        } else {
            results.push({ code: 201, error: false, data: apartment });
        }
    }

    // Check if all apartments failed or succeeded
    const allFailed = results.every(result => result.error === true);
    const allSuccess = results.every(result => result.error === false);

    if (allFailed) {
        returnApartments.error = true;
        returnApartments.payload = results; // Return detailed errors
        returnApartments.code = 400; // Bad request for validation errors
    } 
    else if (allSuccess) {
        returnApartments.error = false;
        returnApartments.payload = results; // Return all successful results
        returnApartments.code = 201; // Resource created successfully
    } 
    else {
        returnApartments.error = true;
        returnApartments.payload = results; // Mixed results (successes and failures)
        returnApartments.code = 207; // Partial success
    }

    return returnApartments;
};  

/* exports.update = function(req, res) {
    if(req.body.constructor === Object && Object.keys(req.body).length === 0){
        res.status(400).send({ error:true, message: 'Please provide all required field' });
    }else{
        Apartment.updateOne(req.params.id, new Apartment(req.body), function(err, apt) {
            if (err){
                console.log('apartments.controller.js\tUpdate\tError:\n', err);
                res.send({error:true,message:"Error while updating a Apartments", data: err});
            }
            else{
                console.log('apartments.controller.js\tUpdate\tResponse:\n', apt);
                res.json({error:false,message:"Apartments updated successfully", data: apt});
            }
        });
    }
};

exports.delete = function(req, res) {
    Apartment.delete( req.params.id, function(err, apt) {
        if (err){
            console.log('apartments.controller.js\tDelete\tError:\n', err);
            res.send({error:true,message:"Error while deleting a Apartments", data: err});
        }
        else{
            console.log('apartments.controller.js\tDelete\tResponse:\n', apt);
            res.json({error:false,message:"Apartments deleted successfully", data: apt});
        }
    });
};

exports.findAll = function(req, res) {
    Apartment.findAll(function(err, apt) {
        if (err){
            console.log('apartments.controller.js\tFind All\tError:\n', err);
            res.send({error:true,message:"Error while finding all Apartments", data: err});
        }
        else{
            console.log('apartments.controller.js\tFind All\tResponse:\n', apt);
            res.send({error:false,message:"Apartments Found successfully!", data: apt});
        }  
    });
};

exports.findById = function(req, res) {
    Apartment.findById(req.params.id, function(err, apt) {
        if (err){
            console.log('apartments.controller.js\tFind By Id\tError:\n', err);
            res.send({error:true,message:"Error while finding a Apartments", data: err});
        }
        else{
            console.log('apartments.controller.js\tFind By Id\tResponse:\n', apt);
            res.json({error:false,message:"Apartments found successfully!", data: apt});
        }
    });
}; */

exports.check = async function(req, res) {
    //handles null error
    if (req.decoded.constructor === Object && Object.keys(req.decoded).length === 0) {
        res.status(400).json({ error: true, message: 'invalidToken', data: 'invalidToken' });
    }else{
        // Buildings info
        const dependency    = Object.entries(req.query).map(([ index, element]) => {
            return {
                id: element.id,
                name: element.name
            }
        });

        if(!Array.isArray(dependency) || !dependency.length){

            res.status(400).json({ error: true, message: 'Invalid query', data: {
                context: "apartments",
                name: "Apartments Setup",
                values: [],
                dependency: [],
                done: false,
                action: "create"
            }});

        }else{
            // Check if Apartments are there
            const dependencies = dependency.map((item, index) => {
                return item.id
            })
                
            const existApartments = await Count(Apartment, {
                "apartmentBuilding": {
                    "$in" : dependencies
            }}, null)


            if(existApartments.length){

                res.status(200).json({ error: false, message: "read", data: {
                    context: "apartments",
                    name: "Apartments Setup",
                    values: existApartments,
                    dependency: dependency,
                    done: true,
                    action: "read"
                }});
            }else{

                res.status(200).json({ error: false, message: "create", data: {
                    context: "apartments",
                    name: "Apartments Setup",
                    values: [],
                    dependency: dependency,
                    done: false,
                    action: "create"
                }});
            }
        }
    };
};
