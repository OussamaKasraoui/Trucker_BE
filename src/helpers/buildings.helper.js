'use strict';
const Building = require('../models/buildings.model');
const { Count, Notify } = require('../middelware/helper')

exports.create = async function (buildings) {
    let returnBuildings = {
        error: false,
        payload: null,
        code: 201 // Default code for successful creation
    };

    // Check if 'buildings' data is provided and is an array
    if (!buildings || !Array.isArray(buildings)) {
        returnBuildings.error = true;
        returnBuildings.payload = "noBuildingDataProvided"; // Consistent payload for missing data
        returnBuildings.code = Array.isArray(buildings) ? 400 : 500; // Bad request for missing data
        return returnBuildings; // Early return on error
    }

    const results = [];

    // Loop through each building in the array and attempt to insert it
    for (const [index, building] of buildings.entries()) {
        if (building.id == '') {

            try {
                // Create new building document
                const docBuilding = await Building.create(building);

                results.push({ code: 201, error: false, data: await docBuilding.populateAndTransform() });

            } catch (error) {
                console.error("Error creating building:", error);

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

                        if (key === 'buildingSite'){
                            errorDetails.code = 422;  // Bad request for Invalid dependency ID
                        }
                    }

                    errorDetails.data = validationErrors;

                } else {
                    errorDetails.code = 500;
                    errorDetails.data = error.message; // General error message
                }

                results.push(errorDetails);
            }
        } else {
            results.push({ code: 201, error: false, data: building });
        }
    }

    // Check if all buildings failed
    const allFailed  = results.every(result => result.error === true);
    const allSuccess = results.every(result => result.error === false);

    if (allFailed) {
        returnBuildings.error = true;
        returnBuildings.payload = results; // Detailed errors
        returnBuildings.code = 400; // Bad request for validation errors
    }
    else if (allSuccess) {
        returnBuildings.error = false;
        returnBuildings.payload = results; // Return all successful results
        returnBuildings.code = 201; // Resource created successfully
    }
    else {
        returnBuildings.error = true;
        returnBuildings.payload = results; // Mixed results (successes and failures)
        returnBuildings.code = 207; // Partial success
    }

    return returnBuildings;
};

exports.findAll = function(req, res) {
    Building.findAll(function(err, building) {
        if (err){
            console.log('building.controller.js\tFind All\tError:\n', err);
            res.send({error:true,message:"Error while finding all Building", data: err});
        }
        else{
            console.log('building.controller.js\tFind All\tResponse:\n', building);
            res.send({error:false,message:"Building Found successfully!", data: building});
        }  
    });
};

exports.findById = function(req, res) {
    Building.findById(req.params.id, function(err, building) {
        if (err){
            console.log('building.controller.js\tFind By Id\tError:\n', err);
            res.send({error:true,message:"Error while finding a Building", data: err});
        }
        else{
            console.log('building.controller.js\tFind By Id\tResponse:\n', building);
            res.json({error:false,message:"Building found successfully!", data: building});
        }
    });
};

exports.update = function(req, res) {
    if(req.body.constructor === Object && Object.keys(req.body).length === 0){
        res.status(400).send({ error:true, message: 'Please provide all required field' });
    }else{
        Building.updateOne(req.params.id, new Building(req.body), function(err, building) {
            if (err){
                console.log('building.controller.js\tUpdate\tError:\n', err);
                res.send({error:true,message:"Error while updating a Building", data: err});
            }
            else{
                console.log('building.controller.js\tUpdate\tResponse:\n', building);
                res.json({error:false,message:"Building updated successfully", data: building});
            }
        });
    }
};

exports.delete = function(req, res) {
    Building.delete( req.params.id, function(err, building) {
        if (err){
            console.log('building.controller.js\tDelete\tError:\n', err);
            res.send({error:true,message:"Error while deleting a Building", data: err});
        }
        else{
            console.log('building.controller.js\tDelete\tResponse:\n', building);
            res.json({error:false,message:"Building deleted successfully", data: building});
        }
    });
};

exports.check = async function(req, res) {
    //handles null error
    if (req.decoded.constructor === Object && Object.keys(req.decoded).length === 0) {
        res.status(400).json({ error: true, message: 'invalidToken', data: 'invalidToken' });
    }else{
        // Site Info
        const dependency    = Object.entries(req.query).map(([ index, element]) => {
            return {
                id: element.id,
                name: element.name
            }
        });

        if(!Array.isArray(dependency) || !dependency.length){

            res.status(400).json({ error: true, message: 'Invalid query', data: {
                context: "buildings",
                name: "Buildings Setup",
                values: [],
                dependency: [],
                done: false   ,
                action: "create"
            }});

        }else{
            // Check if Buildings are there
            const dependencies = dependency.map((item, index) => {
                return item.id
            })
                
            const existBuildings = await Count(Building, {
                "buildingSite": {
                    "$in" : dependencies
            }}, null)


            if(existBuildings.length){

                res.status(200).json({ error: false, message: "read", data: {
                    context: "buildings",
                    name: "Buildings Setup",
                    values: existBuildings,
                    dependency: dependency,
                    done: true,
                    action: "read"
                }});
            }else{

                res.status(200).json({ error: false, message: "create", data: {
                    context: "buildings",
                    name: "Buildings Setup",
                    values: [],
                    dependency: dependency,
                    done: false,
                    action: "create"
                } });
            }
        }
    };
};

