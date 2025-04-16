const SessionHelpers = require("../helpers/sessions.helper");
const Session = require("../models/sessions.model");

exports.create = async function (req, res) {
    const { userId, ipAddress, deviceInfo } = req.body;

    // Check if request body is valid
    if (!userId || !ipAddress || !deviceInfo) {
        return res.status(400).json({
            error: true,
            message: "User ID, IP Address, and Device Info are required",
        });
    }

    try {
        // Create a new session
        const sessionResult = await SessionHelpers.createSession(userId, ipAddress, deviceInfo);

        // Check if session creation was successful
        if (sessionResult.error) {
            return res.status(sessionResult.code).json({
                error: true,
                message: sessionResult.payload,
            });
        }

        // Return success response with session details
        return res.status(sessionResult.code).json({
            error: false,
            message: "Session created successfully",
            data: sessionResult.payload,
        });
    } catch (err) {
        console.error("Error creating session:", err);
        return res.status(500).json({
            error: true,
            message: "Session creation failed",
            data: err,
        });
    }
};

exports.getHistory = async function (req, res) {
    const { userId } = req.params;

    // Validate userId
    if (!userId) {
        return res.status(400).json({
            error: true,
            message: "User ID is required",
        });
    }

    try {
        // Get session history for the user
        const sessions = await SessionHelpers.getSessionHistory(userId);

        // Return the session history
        return res.status(200).json({
            error: false,
            message: "Session history fetched successfully",
            data: sessions,
        });
    } catch (err) {
        console.error("Error fetching session history:", err);
        return res.status(500).json({
            error: true,
            message: "Error fetching session history",
            data: err,
        });
    }
};

exports.clearHistory = async function (req, res) {
    const { userId } = req.params;

    // Validate userId
    if (!userId) {
        return res.status(400).json({
            error: true,
            message: "User ID is required",
        });
    }

    try {
        // Clear session history for the user
        const clearResult = await SessionHelpers.clearUserHistory(userId);

        if (clearResult.error) {
            return res.status(clearResult.code).json({
                error: true,
                message: clearResult.payload,
            });
        }

        // Return success response
        return res.status(200).json({
            error: false,
            message: "Session history cleared successfully",
            data: clearResult.payload,
        });
    } catch (err) {
        console.error("Error clearing session history:", err);
        return res.status(500).json({
            error: true,
            message: "Error clearing session history",
            data: err,
        });
    }
};
