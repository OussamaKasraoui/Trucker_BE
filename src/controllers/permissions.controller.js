const PermissionHelpers = require("../helpers/permissions.helper");

exports.create = async function (req, res) {
    const formData = req.body?.formData;

    if (!formData || Object.keys(formData).length === 0) {
        return res.status(400).json({
            error: true,
            message: "noPermissionDataProvided",
            code: 400,
            data: null
        });
    }

    try {
        const result = await PermissionHelpers.create(formData);
        return res.status(result.code).json(result);

    } catch (error) {
        console.error("Error creating permission:", error);
        return res.status(500).json({
            error: true,
            message: "Internal server error",
            code: 500,
            data: error.message
        });
    }
};

exports.findById = async function (req, res) {
    const formData = req.body?.formData;

    if (!formData || Object.keys(formData).length === 0) {
        return res.status(400).json({
            error: true,
            message: "noPermissionDataProvided",
            code: 400,
            data: null
        });
    }

    try {
        const result = await PermissionHelpers.create(formData);
        return res.status(result.code).json(result);

    } catch (error) {
        console.error("Error creating permission:", error);
        return res.status(500).json({
            error: true,
            message: "Internal server error",
            code: 500,
            data: error.message
        });
    }
};

exports.findAll = async function (req, res) {
    const formData = req.body?.formData;

    if (!formData || Object.keys(formData).length === 0) {
        return res.status(400).json({
            error: true,
            message: "noPermissionDataProvided",
            code: 400,
            data: null
        });
    }

    try {
        const result = await PermissionHelpers.create(formData);
        return res.status(result.code).json(result);

    } catch (error) {
        console.error("Error creating permission:", error);
        return res.status(500).json({
            error: true,
            message: "Internal server error",
            code: 500,
            data: error.message
        });
    }
};

exports.update = async function (req, res) {
    const formData = req.body?.formData;

    if (!formData || Object.keys(formData).length === 0) {
        return res.status(400).json({
            error: true,
            message: "noPermissionDataProvided",
            code: 400,
            data: null
        });
    }

    try {
        const result = await PermissionHelpers.create(formData);
        return res.status(result.code).json(result);

    } catch (error) {
        console.error("Error creating permission:", error);
        return res.status(500).json({
            error: true,
            message: "Internal server error",
            code: 500,
            data: error.message
        });
    }
};

exports.delete = async function (req, res) {
    const formData = req.body?.formData;

    if (!formData || Object.keys(formData).length === 0) {
        return res.status(400).json({
            error: true,
            message: "noPermissionDataProvided",
            code: 400,
            data: null
        });
    }

    try {
        const result = await PermissionHelpers.create(formData);
        return res.status(result.code).json(result);

    } catch (error) {
        console.error("Error creating permission:", error);
        return res.status(500).json({
            error: true,
            message: "Internal server error",
            code: 500,
            data: error.message
        });
    }
};