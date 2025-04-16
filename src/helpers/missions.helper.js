'use strict';
const Mission = require('../models/missions.model');

exports.findAll = function (req, res) {
    Mission.findAll(function (err, msn) {
        if (err) {
            console.log('mission.controller.js\tFind All\tError:\n', err);
            res.send({ error: true, message: "Error while finding all Mission", data: err });
        }
        else {
            console.log('mission.controller.js\tFind All\tResponse:\n', msn);
            res.send({ error: false, message: "Mission Found successfully!", data: msn });
        }
    });
};

exports.create = function (req, res) {
    const msn = new Mission(req.query);
    //handles null error
    if (req.body.constructor === Object && Object.keys(req.query).length === 0) {
        res.status(400).send({ error: true, message: 'Please provide all required field' });
    } else {
        Mission.create(msn, function (err, msn) {
            if (err) {
                console.log('mission.controller.js\tCreate\tError:\n', err);
                res.send({ error: true, message: "Error while creating a Mission", data: err });
            }
            else {
                console.log('mission.controller.js\tCreate\tResponse:\n', msn);
                res.json({ error: false, message: "Mission created successfully!", data: msn });
            }
        });
    }
};

exports.findById = function (req, res) {
    Mission.findById(req.params.id, function (err, msn) {
        if (err) {
            console.log('mission.controller.js\tFind By Id\tError:\n', err);
            res.send({ error: true, message: "Error while finding a Mission", data: err });
        }
        else {
            console.log('mission.controller.js\tFind By Id\tResponse:\n', msn);
            res.json({ error: false, message: "Mission found successfully!", data: msn });
        }
    });
};

exports.update = function (req, res) {
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
        res.status(400).send({ error: true, message: 'Please provide all required field' });
    } else {
        Mission.updateOne(req.params.id, new Mission(req.body), function (err, msn) {
            if (err) {
                console.log('mission.controller.js\tUpdate\tError:\n', err);
                res.send({ error: true, message: "Error while updating a Mission", data: err });
            }
            else {
                console.log('mission.controller.js\tUpdate\tResponse:\n', msn);
                res.json({ error: false, message: "Mission updated successfully", data: msn });
            }
        });
    }
};

exports.delete = function (req, res) {
    Mission.delete(req.params.id, function (err, msn) {
        if (err) {
            console.log('mission.controller.js\tDelete\tError:\n', err);
            res.send({ error: true, message: "Error while deleting a Mission", data: err });
        }
        else {
            console.log('mission.controller.js\tDelete\tResponse:\n', msn);
            res.json({ error: false, message: "Mission deleted successfully", data: msn });
        }
    });
};
