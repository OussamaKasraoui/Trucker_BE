'use strict';
const Task = require('../models/tasks.model');

exports.findAll = function(req, res) {
    Task.findAll(function(err, tsk) {
        if (err){
            console.log('task.controller.js\tFind All\tError:\n', err);
            res.send({error:true,message:"Error while finding all Task", data: err});
        }
        else{
            console.log('task.controller.js\tFind All\tResponse:\n', tsk);
            res.send({error:false,message:"Task Found successfully!", data: tsk});
        }  
    });
};

exports.create = function(req, res) {
    const tsk = new Task(req.query);
    //handles null error
    if(req.body.constructor === Object && Object.keys(req.query).length === 0){
        res.status(400).send({ error:true, message: 'Please provide all required field' });
    }else{
        Task.create(tsk, function(err, tsk) {
            if (err){
                console.log('task.controller.js\tCreate\tError:\n', err);
                res.send({error:true,message:"Error while creating a Task", data: err});
            }
            else{
                console.log('task.controller.js\tCreate\tResponse:\n', tsk);
                res.json({error:false,message:"Task created successfully!", data: tsk});
            }
        });
    }
};

exports.findById = function(req, res) {
    Task.findById(req.params.id, function(err, tsk) {
        if (err){
            console.log('task.controller.js\tFind By Id\tError:\n', err);
            res.send({error:true,message:"Error while finding a Task", data: err});
        }
        else{
            console.log('task.controller.js\tFind By Id\tResponse:\n', tsk);
            res.json({error:false,message:"Task found successfully!", data: tsk});
        }
    });
};

exports.update = function(req, res) {
    if(req.body.constructor === Object && Object.keys(req.body).length === 0){
        res.status(400).send({ error:true, message: 'Please provide all required field' });
    }else{
        Task.updateOne(req.params.id, new Task(req.body), function(err, tsk) {
            if (err){
                console.log('task.controller.js\tUpdate\tError:\n', err);
                res.send({error:true,message:"Error while updating a Task", data: err});
            }
            else{
                console.log('task.controller.js\tUpdate\tResponse:\n', tsk);
                res.json({error:false,message:"Task updated successfully", data: tsk});
            }
        });
    }
};

exports.delete = function(req, res) {
    Task.delete( req.params.id, function(err, tsk) {
        if (err){
            console.log('task.controller.js\tDelete\tError:\n', err);
            res.send({error:true,message:"Error while deleting a Task", data: err});
        }
        else{
            console.log('task.controller.js\tDelete\tResponse:\n', tsk);
            res.json({error:false,message:"Task deleted successfully", data: tsk});
        }
    });
};
