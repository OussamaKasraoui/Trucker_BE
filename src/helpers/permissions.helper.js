'use strict';
const Permission = require("../models/permissions.model");

exports.basicPermission = function (context) {

    return [
        { name: `create:${context}`, description: `Create new ${context}` },
        { name: `read:${context}`,   description: `View all ${context}` },
        { name: `update:${context}`, description: `Update existing ${context}` },
        { name: `delete:${context}`, description: `Delete ${context}` },

        {
            roleId:       "role1",
            organization: "*",
            context:      "users",
            action:       "create"
        }
    ]
}

exports.create = async function (permissions) {
    let returnContext = {
        error: false,
        payload: null,
        code: 201 // Default success code
    };

    // Validate input: Ensure 'permissions' is provided and is an array
    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
        returnContext.error = true;
        returnContext.payload = "noPermissionDataProvided"; // Consistent payload for missing data
        returnContext.code = 400; // Bad request
        return returnContext; // Early return on error
    }

    try {
        // Bulk insert using insertMany with ordered: false (continues inserting valid data)
        const createdPermissions = await Permission.insertMany(permissions, { ordered: false });

        returnContext.payload = createdPermissions;
        returnContext.code = 201; // Resource created successfully

    } catch (error) {
        console.error("Error creating permissions:", error);

        returnContext.error = true;

        if (error?.writeErrors) {
            // Handle bulk insert errors (MongoDB's insertMany returns writeErrors array)
            returnContext.payload = error.writeErrors.map(err => ({
                code: 400,
                error: true,
                data: err.errmsg // MongoDB error message
            }));
            returnContext.code = 207; // Multi-Status (Partial Success)
        } else {
            returnContext.payload = error.message;
            returnContext.code = 500; // Internal server error
        }
    }

    return returnContext;
};


exports.findById = async function (id) {
    let returnContext = {
        error: false,
        payload: null,
        code: 200 // Default success code
    };

    if (!id) {
        returnContext.error = true;
        returnContext.payload = "noPermissionIdProvided";
        returnContext.code = 400; // Bad request
        return returnContext; // Early return on error
    }

    try {
        const permission = await Permission.findById(id);

        if (!permission) {
            returnContext.error = true;
            returnContext.payload = "permissionNotFound";
            returnContext.code = 404; // Not found
        } else {
            returnContext.payload = permission;
            returnContext.code = 200; // Success
        }

    } catch (error) {
        console.error("Error finding permission by ID:", error);

        returnContext.error = true;
        returnContext.payload = error.message;
        returnContext.code = 500; // Internal server error
    }

    return returnContext;
};


exports.findAll = async function () {
    let returnContext = {
        error: false,
        payload: null,
        code: 200 // Default success code
    };

    try {
        const permissions = await Permission.find();

        returnContext.payload = permissions;
        returnContext.message = "Permissions found successfully";

    } catch (error) {
        console.error("Error finding permissions:", error);

        returnContext.error = true;
        returnContext.payload = error.message;
        returnContext.code = 500; // Internal server error
    }

    return returnContext;
};

exports.update = async function (id, updateData) {
    let returnContext = {
        error: false,
        payload: null,
        code: 200 // Default success code
    };

    if (!id || Object.keys(updateData).length === 0) {
        returnContext.error = true;
        returnContext.payload = "noUpdateDataProvided";
        returnContext.code = 400; // Bad request
        return returnContext; // Early return on error
    }

    try {
        const updatedPermission = await Permission.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        });

        if (!updatedPermission) {
            returnContext.error = true;
            returnContext.payload = "permissionNotFoundOrUpdateFailed";
            returnContext.code = 404; // Not found
        } else {
            returnContext.payload = updatedPermission;
        }

    } catch (error) {
        console.error("Error updating permission:", error);

        returnContext.error = true;
        returnContext.payload = error.message;
        returnContext.code = 500; // Internal server error
    }

    return returnContext;
};

exports.delete = async function (id) {
    let returnContext = {
        error: false,
        payload: null,
        code: 200 // Default success code
    };

    if (!id) {
        returnContext.error = true;
        returnContext.payload = "noPermissionIdProvided";
        returnContext.code = 400; // Bad request
        return returnContext; // Early return on error
    }

    try {
        const deletedPermission = await Permission.findByIdAndDelete(id);

        if (!deletedPermission) {
            returnContext.error = true;
            returnContext.payload = "permissionNotFoundOrDeleteFailed";
            returnContext.code = 404; // Not found
        } else {
            returnContext.payload = deletedPermission;
        }

    } catch (error) {
        console.error("Error deleting permission:", error);

        returnContext.error = true;
        returnContext.payload = error.message;
        returnContext.code = 500; // Internal server error
    }

    return returnContext;
};
