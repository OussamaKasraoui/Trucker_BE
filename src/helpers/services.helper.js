'use strict';

const Service = require("../models/services.model");

// Create Service
exports.create = async function (params) {
    let returnContext = {
        error: false,
        payload: null,
        code: 200 // Default success code
    };

    if (!params || !Array.isArray(params) || params.length === 0) {
        returnContext.error = true;
        returnContext.payload = "noServiceDataProvided";
        returnContext.code = 400;
        return returnContext;
    }

    const results = [];

    for (const [index, param] of params.entries()) {
        try {
            const createdService = await Service.create(param);
            results.push({ code: 201, error: false, data: createdService });
        } catch (error) {
            console.error(`Error creating service at index ${index}:`, error);
            results.push({ code: error?.errors ? 400 : 500, error: true, data: error.message });
        }
    }

    const allFailed = results.every(result => result.error === true);
    const allSuccess = results.every(result => result.error === false);

    if (allFailed) {
        returnContext.error = true;
        returnContext.payload = results;
        returnContext.code = 400;
    } else if (allSuccess) {
        returnContext.error = false;
        returnContext.payload = results;
        returnContext.code = 201;
    } else {
        returnContext.error = true;
        returnContext.payload = results;
        returnContext.code = 207;
    }

    return returnContext;
};

// Find Service by ID
exports.findById = async function (id) {
    let returnContext = {
        error: false,
        payload: null,
        code: 200
    };

    if (!id) {
        returnContext.error = true;
        returnContext.payload = "noServiceIdProvided";
        returnContext.code = 400;
        return returnContext;
    }

    try {
        const service = await Service.findById(id).populate("servicesProvider");
        if (!service) {
            returnContext.error = true;
            returnContext.payload = "serviceNotFound";
            returnContext.code = 404;
        } else {
            returnContext.payload = service;
        }
    } catch (error) {
        console.error("Error finding service by ID:", error);
        returnContext.error = true;
        returnContext.payload = error.message;
        returnContext.code = 500;
    }
    return returnContext;
};

// Find All Services
exports.findAll = async function () {
    let returnContext = {
        error: false,
        payload: null,
        code: 200
    };

    try {
        const services = await Service.find().populate("servicesProvider");
        returnContext.payload = services;
    } catch (error) {
        console.error("Error finding services:", error);
        returnContext.error = true;
        returnContext.payload = error.message;
        returnContext.code = 500;
    }
    return returnContext;
};

// Update Service
exports.update = async function (id, updateData) {
    let returnContext = {
        error: false,
        payload: null,
        code: 200
    };

    if (!id || Object.keys(updateData).length === 0) {
        returnContext.error = true;
        returnContext.payload = "noUpdateDataProvided";
        returnContext.code = 400;
        return returnContext;
    }

    try {
        const updatedService = await Service.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        });
        if (!updatedService) {
            returnContext.error = true;
            returnContext.payload = "serviceNotFoundOrUpdateFailed";
            returnContext.code = 404;
        } else {
            returnContext.payload = updatedService;
        }
    } catch (error) {
        console.error("Error updating service:", error);
        returnContext.error = true;
        returnContext.payload = error.message;
        returnContext.code = 500;
    }
    return returnContext;
};

// Delete Service
exports.delete = async function (id) {
    let returnContext = {
        error: false,
        payload: null,
        code: 200
    };

    if (!id) {
        returnContext.error = true;
        returnContext.payload = "noServiceIdProvided";
        returnContext.code = 400;
        return returnContext;
    }

    try {
        const deletedService = await Service.findByIdAndDelete(id);
        if (!deletedService) {
            returnContext.error = true;
            returnContext.payload = "serviceNotFoundOrDeleteFailed";
            returnContext.code = 404;
        } else {
            returnContext.payload = deletedService;
        }
    } catch (error) {
        console.error("Error deleting service:", error);
        returnContext.error = true;
        returnContext.payload = error.message;
        returnContext.code = 500;
    }
    return returnContext;
};