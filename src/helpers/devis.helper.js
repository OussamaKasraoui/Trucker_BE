'use strict';
const Devis = require('../models/devis.model');

exports.findAll = function(req, res) {
    Devis.findAll(function(err, dvs) {
        if (err){
            console.log('devis.controller.js\tFind All\tError:\n', err);
            res.send({error:true,message:"Error while finding all Devis", data: err});
        }
        else{
            console.log('devis.controller.js\tFind All\tResponse:\n', dvs);
            res.send({error:false,message:"Devis Found successfully!", data: dvs});
        }  
    });
};

exports.create = function(req, res) {
    const dvs = new Devis(req.query);
    //handles null error
    if(req.body.constructor === Object && Object.keys(req.query).length === 0){
        res.status(400).send({ error:true, message: 'Please provide all required field' });
    }else{
        Devis.create(dvs, function(err, dvs) {
            if (err){
                console.log('devis.controller.js\tCreate\tError:\n', err);
                res.send({error:true,message:"Error while creating a Devis", data: err});
            }
            else{
                console.log('devis.controller.js\tCreate\tResponse:\n', dvs);
                res.json({error:false,message:"Devis created successfully!", data: dvs});
            }
        });
    }
};

exports.findById = function(req, res) {
    Devis.findById(req.params.id, function(err, dvs) {
        if (err){
            console.log('devis.controller.js\tFind By Id\tError:\n', err);
            res.send({error:true,message:"Error while finding a Devis", data: err});
        }
        else{
            console.log('devis.controller.js\tFind By Id\tResponse:\n', dvs);
            res.json({error:false,message:"Devis found successfully!", data: dvs});
        }
    });
};

exports.update = function(req, res) {
    if(req.body.constructor === Object && Object.keys(req.body).length === 0){
        res.status(400).send({ error:true, message: 'Please provide all required field' });
    }else{
        Devis.updateOne(req.params.id, new Devis(req.body), function(err, dvs) {
            if (err){
                console.log('devis.controller.js\tUpdate\tError:\n', err);
                res.send({error:true,message:"Error while updating a Devis", data: err});
            }
            else{
                console.log('devis.controller.js\tUpdate\tResponse:\n', dvs);
                res.json({error:false,message:"Devis updated successfully", data: dvs});
            }
        });
    }
};

exports.delete = function(req, res) {
    Devis.delete( req.params.id, function(err, dvs) {
        if (err){
            console.log('devis.controller.js\tDelete\tError:\n', err);
            res.send({error:true,message:"Error while deleting a Devis", data: err});
        }
        else{
            console.log('devis.controller.js\tDelete\tResponse:\n', dvs);
            res.json({error:false,message:"Devis deleted successfully", data: dvs});
        }
    });
};
