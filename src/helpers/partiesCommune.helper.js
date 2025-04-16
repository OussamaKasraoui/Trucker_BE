'use strict';
const PartiesCommune = require('../models/partiesCommune.model');

exports.findAll = function(req, res) {
    PartiesCommune.findAll(function(err, prtCmn) {
        if (err){
            console.log('partiesCommune.controller.js\tFind All\tError:\n', err);
            res.send({error:true,message:"Error while finding all PartiesCommune", data: err});
        }
        else{
            console.log('partiesCommune.controller.js\tFind All\tResponse:\n', prtCmn);
            res.send({error:false,message:"PartiesCommune Found successfully!", data: prtCmn});
        }  
    });
};

exports.create = function(req, res) {
    const prtCmn = new PartiesCommune(req.query);
    //handles null error
    if(req.body.constructor === Object && Object.keys(req.query).length === 0){
        res.status(400).send({ error:true, message: 'Please provide all required field' });
    }else{
        PartiesCommune.create(prtCmn, function(err, prtCmn) {
            if (err){
                console.log('partiesCommune.controller.js\tCreate\tError:\n', err);
                res.send({error:true,message:"Error while creating a PartiesCommune", data: err});
            }
            else{
                console.log('partiesCommune.controller.js\tCreate\tResponse:\n', prtCmn);
                res.json({error:false,message:"PartiesCommune created successfully!", data: prtCmn});
            }
        });
    }
};

exports.findById = function(req, res) {
    PartiesCommune.findById(req.params.id, function(err, prtCmn) {
        if (err){
            console.log('partiesCommune.controller.js\tFind By Id\tError:\n', err);
            res.send({error:true,message:"Error while finding a PartiesCommune", data: err});
        }
        else{
            console.log('partiesCommune.controller.js\tFind By Id\tResponse:\n', prtCmn);
            res.json({error:false,message:"PartiesCommune found successfully!", data: prtCmn});
        }
    });
};

exports.update = function(req, res) {
    if(req.body.constructor === Object && Object.keys(req.body).length === 0){
        res.status(400).send({ error:true, message: 'Please provide all required field' });
    }else{
        PartiesCommune.updateOne(req.params.id, new PartiesCommune(req.body), function(err, prtCmn) {
            if (err){
                console.log('partiesCommune.controller.js\tUpdate\tError:\n', err);
                res.send({error:true,message:"Error while updating a PartiesCommune", data: err});
            }
            else{
                console.log('partiesCommune.controller.js\tUpdate\tResponse:\n', prtCmn);
                res.json({error:false,message:"PartiesCommune updated successfully", data: prtCmn});
            }
        });
    }
};

exports.delete = function(req, res) {
    PartiesCommune.delete( req.params.id, function(err, prtCmn) {
        if (err){
            console.log('partiesCommune.controller.js\tDelete\tError:\n', err);
            res.send({error:true,message:"Error while deleting a PartiesCommune", data: err});
        }
        else{
            console.log('partiesCommune.controller.js\tDelete\tResponse:\n', prtCmn);
            res.json({error:false,message:"PartiesCommune deleted successfully", data: prtCmn});
        }
    });
};
