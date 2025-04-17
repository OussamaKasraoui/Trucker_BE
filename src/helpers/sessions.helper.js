'use strict';

const Session = require("../models/sessions.model");

exports.createSession = async function (userId, ipAddress, deviceInfo) {
    let returnSession = {
        error: false,
        payload: null,
        code: 201,
    };

    try {
        // Create a new session document
        const newSession = new Session({
            userId,
            ipAddress,
            deviceInfo,
        });

        // Save the session to the database
        const savedSession = await newSession.save();

        returnSession.payload = await savedSession.populateAndTransform(whoIsDemanding); // Populate and transform data
        return returnSession;
    } catch (err) {
        console.error("Error creating session:", err);
        returnSession.error = true;
        returnSession.payload = err.message;
        returnSession.code = 500;
        return returnSession;
    }
};

exports.getSessionHistory = async function (userId) {
    try {
        // Fetch all sessions for the user, including inactive sessions
        const sessions = await Session.find({ userId }).sort({ loginTime: -1 });

        // Transform each session's data before returning
        const transformedSessions = await Promise.all(
            sessions.map((session) => session.populateAndTransform(whoIsDemanding))
        );

        return transformedSessions;
    } catch (err) {
        console.error("Error fetching session history:", err);
        throw new Error("Error fetching session history");
    }
};

exports.clearUserHistory = async function (userId) {
    let returnResult = {
        error: false,
        payload: null,
        code: 200,
    };

    try {
        // Delete all sessions for the user
        const deleteResult = await Session.deleteMany({ userId });

        if (deleteResult.deletedCount === 0) {
            returnResult.error = true;
            returnResult.payload = "No sessions found to delete";
            returnResult.code = 404; // Not found
        } else {
            returnResult.payload = `Successfully deleted ${deleteResult.deletedCount} session(s)`;
        }

        return returnResult;
    } catch (err) {
        console.error("Error clearing session history:", err);
        returnResult.error = true;
        returnResult.payload = err.message;
        returnResult.code = 500;
        return returnResult;
    }
};