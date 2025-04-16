'use strict';
const Staff = require('../models/staff.model');

exports.findAll = function(req, res) {
    Staff.findAll(function(err, stf) {
        if (err){
            console.log('staff.controller.js\tFind All\tError:\n', err);
            res.send({error:true,message:"Error while finding all Staff", data: err});
        }
        else{
            console.log('staff.controller.js\tFind All\tResponse:\n', stf);
            res.send({error:false,message:"Staff Found successfully!", data: stf});
        }  
    });
};

exports.create = function(req, res) {
    const stf = new Staff(req.query);
    //handles null error
    if(req.body.constructor === Object && Object.keys(req.query).length === 0){
        res.status(400).send({ error:true, message: 'Please provide all required field' });
    }else{
        Staff.create(stf, function(err, stf) {
            if (err){
                console.log('staff.controller.js\tCreate\tError:\n', err);
                res.send({error:true,message:"Error while creating a Staff", data: err});
            }
            else{
                console.log('staff.controller.js\tCreate\tResponse:\n', stf);
                res.json({error:false,message:"Staff created successfully!", data: stf});
            }
        });
    }
};

exports.findById = function(req, res) {
    Staff.findById(req.params.id, function(err, stf) {
        if (err){
            console.log('staff.controller.js\tFind By Id\tError:\n', err);
            res.send({error:true,message:"Error while finding a Staff", data: err});
        }
        else{
            console.log('staff.controller.js\tFind By Id\tResponse:\n', stf);
            res.json({error:false,message:"Staff found successfully!", data: stf});
        }
    });
};

exports.update = function(req, res) {
    if(req.body.constructor === Object && Object.keys(req.body).length === 0){
        res.status(400).send({ error:true, message: 'Please provide all required field' });
    }else{
        Staff.updateOne(req.params.id, new Staff(req.body), function(err, stf) {
            if (err){
                console.log('staff.controller.js\tUpdate\tError:\n', err);
                res.send({error:true,message:"Error while updating a Staff", data: err});
            }
            else{
                console.log('staff.controller.js\tUpdate\tResponse:\n', stf);
                res.json({error:false,message:"Staff updated successfully", data: stf});
            }
        });
    }
};

exports.delete = function(req, res) {
    Staff.delete( req.params.id, function(err, stf) {
        if (err){
            console.log('staff.controller.js\tDelete\tError:\n', err);
            res.send({error:true,message:"Error while deleting a Staff", data: err});
        }
        else{
            console.log('staff.controller.js\tDelete\tResponse:\n', stf);
            res.json({error:false,message:"Staff deleted successfully", data: stf});
        }
    });
};
