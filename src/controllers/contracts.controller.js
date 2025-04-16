'use strict';

const { Count, Notify }         = require('./../middelware/helper')
const validateContractsInput    = require("../validation/contracts");
const Contract                  = require('../models/contracts.model');
const ContractHelpers           = require('../helpers/contracts.helper');



exports.create = async function (req, res) {
    // Check if request body is empty
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: true, message: 'Field required', data: req.body });
    } else {

        // Get Contractor, Staff, and User from decoded token
        const contractor = req.decoded.contractor;
        const staff = req.decoded.staff;
        const user = req.decoded.user;
        const contractData = req.body.formData;

        // Form validation
        const { errors, isValid, code } = validateContractsInput(contractData);

        if (!isValid) {
            return res.status(code).json({ error: true, message: "Validation failed", data: errors });
        }

        try {
            // Insert new contract
            const contractCreationResult = await ContractHelpers.create(contractData);

            if (contractCreationResult.error) {
                return res.status(contractCreationResult.code).json({ error: true, message: contractCreationResult.payload, data: contractCreationResult.payload });
            } else if (!contractCreationResult.payload) {
                return res.status(contractCreationResult.code).json({ error: true, message: contractCreationResult.payload, data: contractCreationResult.payload });
            }

            console.log("\n\n'[New Contract]' added to 'Contracts' collection:\n", contractCreationResult.payload);

            // Create Notification
            const notifications = await Notify(
                user.id,
                "success",
                "Create Contract",
                `Contract created successfully`,
                [user.id, contractor.id, staff.id]
            );

            // Return success response
            return res.status(contractCreationResult.code).json({
                error: false,
                message: notifications,
                data: contractCreationResult.payload
            });

        } catch (err) {
            console.error("Error creating contract:", err);
            return res.status(500).json({ error: true, message: "Contract creation failed", data: err });
        }
    }
};

exports.findAll = async function (req, res) {
    // Check if request body is empty
    if (req.decoded.constructor === Object && Object.keys(req.decoded).length === 0) {
        return res.status(400).json({ error: true, message: 'Field required', data: req.body });
    } else {
        try {

            // Get Contractor, Staff, and User from decoded token
            const contractor = req.decoded.contractor;
            const staff = req.decoded.staff;
            const user = req.decoded.user;
            const pack = req.decoded.pack;

            // Call the helper function to get all contracts
            const contractsResult = await ContractHelpers.findAll([contractor.id], pack);

            if (contractsResult.error) {
                return res.status(contractsResult.code).json({
                    error: true,
                    message: contractsResult.payload,
                    data: null,
                });
            }

            // // Create Notification (optional)
            // const notifications = await Notify(
            //     req.decoded.user.id,
            //     "info",
            //     "View Contracts",
            //     "Contracts retrieved successfully"
            // );

            // Return successful response
            return res.status(contractsResult.code).json({
                error: false,
                message: "notifications",
                data: contractsResult.payload,
            });

        } catch (err) {
            console.error("Error fetching contracts:", err);
            return res.status(500).json({
                error: true,
                message: "Error fetching contracts",
                data: err
            });
        }
    }
};

exports.findById = async function (req, res) {
    const id = req.params.id;

    if (!id) {
        return res.status(400).json({
            error: true,
            message: "noContractIdProvided",
            code: 400,
            data: null
        });
    }

    try {
        const result = await ContractHelpers.findById(id);
        return res.status(result.code).json(result);

    } catch (error) {
        console.error("Error finding contract by ID:", error);
        return res.status(500).json({
            error: true,
            message: "Internal server error",
            code: 500,
            data: error.message
        });
    }
};

exports.update = async function (req, res) {
    const id = req.params.id;
    const updateData = req.body;

    if (!id || Object.keys(updateData).length === 0) {
        return res.status(400).json({
            error: true,
            message: "noUpdateDataProvided",
            code: 400,
            data: null
        });
    }

    try {
        const result = await ContractHelpers.update(id, updateData);
        return res.status(result.code).json(result);

    } catch (error) {
        console.error("Error updating contract:", error);
        return res.status(500).json({
            error: true,
            message: "Internal server error",
            code: 500,
            data: error.message
        });
    }
};

exports.delete = async function (req, res) {
    const id = req.params.id;

    if (!id) {
        return res.status(400).json({
            error: true,
            message: "noContractIdProvided",
            code: 400,
            data: null
        });
    }

    try {
        const result = await ContractHelpers.delete(id);
        return res.status(result.code).json(result);

    } catch (error) {
        console.error("Error deleting contract:", error);
        return res.status(500).json({
            error: true,
            message: "Internal server error",
            code: 500,
            data: error.message
        });
    }
};
