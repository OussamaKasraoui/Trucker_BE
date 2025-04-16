'use strict';
const Depense = require('../models/depenses.model');

exports.findAll = function(req, res) {
    Depense.findAll(function(err, dpns) {
        if (err){
            console.log('depense.controller.js\tFind All\tError:\n', err);
            res.send({error:true,message:"Error while finding all Depense", data: err});
        }
        else{
            console.log('depense.controller.js\tFind All\tResponse:\n', dpns);
            res.send({error:false,message:"Depense Found successfully!", data: dpns});
        }  
    });
};

exports.create = function(req, res) {
    const dpns = new Depense(req.query);
    //handles null error
    if(req.body.constructor === Object && Object.keys(req.query).length === 0){
        res.status(400).send({ error:true, message: 'Please provide all required field' });
    }else{
        Depense.create(dpns, function(err, dpns) {
            if (err){
                console.log('depense.controller.js\tCreate\tError:\n', err);
                res.send({error:true,message:"Error while creating a Depense", data: err});
            }
            else{
                console.log('depense.controller.js\tCreate\tResponse:\n', dpns);
                res.json({error:false,message:"Depense created successfully!", data: dpns});
            }
        });
    }
};

exports.findById = function(req, res) {
    Depense.findById(req.params.id, function(err, dpns) {
        if (err){
            console.log('depense.controller.js\tFind By Id\tError:\n', err);
            res.send({error:true,message:"Error while finding a Depense", data: err});
        }
        else{
            console.log('depense.controller.js\tFind By Id\tResponse:\n', dpns);
            res.json({error:false,message:"Depense found successfully!", data: dpns});
        }
    });
};

exports.update = function(req, res) {
    if(req.body.constructor === Object && Object.keys(req.body).length === 0){
        res.status(400).send({ error:true, message: 'Please provide all required field' });
    }else{
        Depense.updateOne(req.params.id, new Depense(req.body), function(err, dpns) {
            if (err){
                console.log('depense.controller.js\tUpdate\tError:\n', err);
                res.send({error:true,message:"Error while updating a Depense", data: err});
            }
            else{
                console.log('depense.controller.js\tUpdate\tResponse:\n', dpns);
                res.json({error:false,message:"Depense updated successfully", data: dpns});
            }
        });
    }
};

exports.delete = function(req, res) {
    Depense.delete( req.params.id, function(err, dpns) {
        if (err){
            console.log('depense.controller.js\tDelete\tError:\n', err);
            res.send({error:true,message:"Error while deleting a Depense", data: err});
        }
        else{
            console.log('depense.controller.js\tDelete\tResponse:\n', dpns);
            res.json({error:false,message:"Depense deleted successfully", data: dpns});
        }
    });
};
