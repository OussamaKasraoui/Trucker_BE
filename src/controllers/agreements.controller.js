const AgreementHelpers = require("../helpers/agreements.helper");

// Create Agreement
exports.create = async function (req, res) {
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: true, message: { type: "error", text: "Field required" }, data: [] });
    }

    const { errors, isValid, code } = validateAgreementInput(req.body?.formData);
    if (!isValid) {
        return res.status(code).json({ error: true, message: { type: "error", text: "Validation failed" }, data: errors });
    }

    try {
        const result = await AgreementHelpers.create(req.body.formData);
        return res.status(result.code).json({ error: result.error, message: { type: result.error ? "error" : "success", text: result.message }, data: Array.isArray(result.payload) ? result.payload : [result.payload] });
    } catch (err) {
        console.error("Error creating agreement:", err);
        return res.status(500).json({ error: true, message: { type: "error", text: "Agreement creation failed" }, data: [err] });
    }
};

// Find Agreement by ID
exports.findById = async function (req, res) {
    if (!req.params.id) {
        return res.status(400).json({ error: true, message: { type: "error", text: "Field required" }, data: [] });
    }

    try {
        const result = await AgreementHelpers.findById(req.params.id);
        return res.status(result.code).json({ error: result.error, message: { type: result.error ? "error" : "success", text: result.message }, data: Array.isArray(result.payload) ? result.payload : [result.payload] });
    } catch (err) {
        console.error("Error finding agreement by ID:", err);
        return res.status(500).json({ error: true, message: { type: "error", text: "Agreement retrieval failed" }, data: [err] });
    }
};

// Find All Agreements
exports.findAll = async function (req, res) {
    try {
        const result = await AgreementHelpers.findAll();
        return res.status(result.code).json({ error: result.error, message: { type: result.error ? "error" : "success", text: result.message }, data: Array.isArray(result.payload) ? result.payload : [result.payload] });
    } catch (err) {
        console.error("Error finding all agreements:", err);
        return res.status(500).json({ error: true, message: { type: "error", text: "Agreement retrieval failed" }, data: [err] });
    }
};

// Update Agreement
exports.update = async function (req, res) {
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: true, message: { type: "error", text: "Field required" }, data: [] });
    }

    const { errors, isValid, code } = validateAgreementInput(req.body);
    if (!isValid) {
        return res.status(code).json({ error: true, message: { type: "error", text: "Validation failed" }, data: errors });
    }

    try {
        const result = await AgreementHelpers.update(req.params.id, req.body);
        return res.status(result.code).json({ error: result.error, message: { type: result.error ? "error" : "success", text: result.message }, data: Array.isArray(result.payload) ? result.payload : [result.payload] });
    } catch (err) {
        console.error("Error updating agreement:", err);
        return res.status(500).json({ error: true, message: { type: "error", text: "Agreement update failed" }, data: [err] });
    }
};

// Delete Agreement
exports.delete = async function (req, res) {
    if (!req.params.id) {
        return res.status(400).json({ error: true, message: { type: "error", text: "Field required" }, data: [] });
    }

    try {
        const result = await AgreementHelpers.delete(req.params.id);
        return res.status(result.code).json({ error: result.error, message: { type: result.error ? "error" : "success", text: result.message }, data: Array.isArray(result.payload) ? result.payload : [result.payload] });
    } catch (err) {
        console.error("Error deleting agreement:", err);
        return res.status(500).json({ error: true, message: { type: "error", text: "Agreement deletion failed" }, data: [err] });
    }
};
