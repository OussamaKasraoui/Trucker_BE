'use strict';
const ServiceRequest = require('../models/serviceRequests.model');

exports.findAll = function(req, res) {
    ServiceRequest.findAll(function(err, srvcReq) {
        if (err){
            console.log('serviceRequest.controller.js\tFind All\tError:\n', err);
            res.send({error:true,message:"Error while finding all ServiceRequest", data: err});
        }
        else{
            console.log('serviceRequest.controller.js\tFind All\tResponse:\n', srvcReq);
            res.send({error:false,message:"ServiceRequest Found successfully!", data: srvcReq});
        }  
    });
};

exports.create = function(req, res) {
    const srvcReq = new ServiceRequest(req.query);
    //handles null error
    if(req.body.constructor === Object && Object.keys(req.query).length === 0){
        res.status(400).send({ error:true, message: 'Please provide all required field' });
    }else{
        ServiceRequest.create(srvcReq, function(err, srvcReq) {
            if (err){
                console.log('serviceRequest.controller.js\tCreate\tError:\n', err);
                res.send({error:true,message:"Error while creating a ServiceRequest", data: err});
            }
            else{
                console.log('serviceRequest.controller.js\tCreate\tResponse:\n', srvcReq);
                res.json({error:false,message:"ServiceRequest created successfully!", data: srvcReq});
            }
        });
    }
};

exports.findById = function(req, res) {
    ServiceRequest.findById(req.params.id, function(err, srvcReq) {
        if (err){
            console.log('serviceRequest.controller.js\tFind By Id\tError:\n', err);
            res.send({error:true,message:"Error while finding a ServiceRequest", data: err});
        }
        else{
            console.log('serviceRequest.controller.js\tFind By Id\tResponse:\n', srvcReq);
            res.json({error:false,message:"ServiceRequest found successfully!", data: srvcReq});
        }
    });
};

exports.update = function(req, res) {
    if(req.body.constructor === Object && Object.keys(req.body).length === 0){
        res.status(400).send({ error:true, message: 'Please provide all required field' });
    }else{
        ServiceRequest.updateOne(req.params.id, new ServiceRequest(req.body), function(err, srvcReq) {
            if (err){
                console.log('serviceRequest.controller.js\tUpdate\tError:\n', err);
                res.send({error:true,message:"Error while updating a ServiceRequest", data: err});
            }
            else{
                console.log('serviceRequest.controller.js\tUpdate\tResponse:\n', srvcReq);
                res.json({error:false,message:"ServiceRequest updated successfully", data: srvcReq});
            }
        });
    }
};

exports.delete = function(req, res) {
    ServiceRequest.delete( req.params.id, function(err, srvcReq) {
        if (err){
            console.log('serviceRequest.controller.js\tDelete\tError:\n', err);
            res.send({error:true,message:"Error while deleting a ServiceRequest", data: err});
        }
        else{
            console.log('serviceRequest.controller.js\tDelete\tResponse:\n', srvcReq);
            res.json({error:false,message:"ServiceRequest deleted successfully", data: srvcReq});
        }
    });
};
