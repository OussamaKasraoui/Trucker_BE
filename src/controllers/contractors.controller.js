'use strict';
const Contractor = require('../models/contractors.model');
const ContractorHelpers = require('../helpers/contractors.helper');

exports.create = async function (req, res) {
    // Check if request body is empty
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: true, message: 'Field required', data: req.body });
    }

    // Extract contractors data from request body
    const contractorsData = Array.isArray(req.body) ? req.body : [req.body];

    try {
        // Create contractors using the helper function
        const contractorCreationResult = await ContractorHelpers.create(contractorsData, req.session);

        // Handle all-failed case
        if (contractorCreationResult.error && contractorCreationResult.code === 400) {
            return res.status(400).json({
                error: true,
                message: "All contractors failed to create",
                data: contractorCreationResult.payload
            });
        }

        // Handle all-success case
        if (!contractorCreationResult.error && contractorCreationResult.code === 201) {
            return res.status(201).json({
                error: false,
                message: "All contractors created successfully",
                data: contractorCreationResult.payload
            });
        }

        // Handle partial-success case
        return res.status(207).json({
            error: true,
            message: "Partial success in creating contractors",
            data: contractorCreationResult.payload
        });

    } catch (err) {
        console.error("Error in Contractor creation process:", err);
        return res.status(500).json({
            error: true,
            message: "Internal server error",
            data: err.message
        });
    }
};

exports.findAll = function(req, res) {
    Contractor.findAll(function(err, cntrctr) {
        if (err){
            console.log('contractor.controller.js\tFind All\tError:\n', err);
            res.send({error:true,message:"Error while finding all Contractor", data: err});
        }
        else{
            console.log('contractor.controller.js\tFind All\tResponse:\n', cntrctr);
            res.send({error:false,message:"Contractor Found successfully!", data: cntrctr});
        }  
    });
};

exports.findById = function(req, res) {
    Contractor.findById(req.params.id, function(err, cntrctr) {
        if (err){
            console.log('contractor.controller.js\tFind By Id\tError:\n', err);
            res.send({error:true,message:"Error while finding a Contractor", data: err});
        }
        else{
            console.log('contractor.controller.js\tFind By Id\tResponse:\n', cntrctr);
            res.json({error:false,message:"Contractor found successfully!", data: cntrctr});
        }
    });
};

exports.update = function(req, res) {
    if(req.body.constructor === Object && Object.keys(req.body).length === 0){
        res.status(400).send({ error:true, message: 'Please provide all required field' });
    }else{
        Contractor.updateOne(req.params.id, new Contractor(req.body), function(err, cntrctr) {
            if (err){
                console.log('contractor.controller.js\tUpdate\tError:\n', err);
                res.send({error:true,message:"Error while updating a Contractor", data: err});
            }
            else{
                console.log('contractor.controller.js\tUpdate\tResponse:\n', cntrctr);
                res.json({error:false,message:"Contractor updated successfully", data: cntrctr});
            }
        });
    }
};

exports.delete = function(req, res) {
    Contractor.delete( req.params.id, function(err, cntrctr) {
        if (err){
            console.log('contractor.controller.js\tDelete\tError:\n', err);
            res.send({error:true,message:"Error while deleting a Contractor", data: err});
        }
        else{
            console.log('contractor.controller.js\tDelete\tResponse:\n', cntrctr);
            res.json({error:false,message:"Contractor deleted successfully", data: cntrctr});
        }
    });
};
