'use strict';
const Cotisation = require('../models/cotisations.model');


exports.findAll = function(req, res) {
    Cotisation.findAll(function(err, ctst) {
        if (err){
            console.log('cotisation.controller.js\tFind All\tError:\n', err);
            res.send({error:true,message:"Error while finding all Cotisation", data: err});
        }
        else{
            console.log('cotisation.controller.js\tFind All\tResponse:\n', ctst);
            res.send({error:false,message:"Cotisation Found successfully!", data: ctst});
        }  
    });
};

exports.create = function(req, res) {
    const ctst = new Cotisation(req.query);
    //handles null error
    if(req.body.constructor === Object && Object.keys(req.query).length === 0){
        res.status(400).send({ error:true, message: 'Please provide all required field' });
    }else{
        Cotisation.create(ctst, function(err, ctst) {
            if (err){
                console.log('cotisation.controller.js\tCreate\tError:\n', err);
                res.send({error:true,message:"Error while creating a Cotisation", data: err});
            }
            else{
                console.log('cotisation.controller.js\tCreate\tResponse:\n', ctst);
                res.json({error:false,message:"Cotisation created successfully!", data: ctst});
            }
        });
    }
};

exports.findById = function(req, res) {
    Cotisation.findById(req.params.id, function(err, ctst) {
        if (err){
            console.log('cotisation.controller.js\tFind By Id\tError:\n', err);
            res.send({error:true,message:"Error while finding a Cotisation", data: err});
        }
        else{
            console.log('cotisation.controller.js\tFind By Id\tResponse:\n', ctst);
            res.json({error:false,message:"Cotisation found successfully!", data: ctst});
        }
    });
};

exports.update = function(req, res) {
    if(req.body.constructor === Object && Object.keys(req.body).length === 0){
        res.status(400).send({ error:true, message: 'Please provide all required field' });
    }else{
        Cotisation.updateOne(req.params.id, new Cotisation(req.body), function(err, ctst) {
            if (err){
                console.log('cotisation.controller.js\tUpdate\tError:\n', err);
                res.send({error:true,message:"Error while updating a Cotisation", data: err});
            }
            else{
                console.log('cotisation.controller.js\tUpdate\tResponse:\n', ctst);
                res.json({error:false,message:"Cotisation updated successfully", data: ctst});
            }
        });
    }
};

exports.delete = function(req, res) {
    Cotisation.delete( req.params.id, function(err, ctst) {
        if (err){
            console.log('cotisation.controller.js\tDelete\tError:\n', err);
            res.send({error:true,message:"Error while deleting a Cotisation", data: err});
        }
        else{
            console.log('cotisation.controller.js\tDelete\tResponse:\n', ctst);
            res.json({error:false,message:"Cotisation deleted successfully", data: ctst});
        }
    });
};
