
/**
 * Notifications Controller
 *
 * Handles CRUD operations and specific actions for notifications.
 * Relies on static methods from the Notification model.
 */
const mongoose = require('mongoose');
const Notification = require('./../models/notifications.model'); // Use the model directly
const ObjectId = mongoose.Types.ObjectId;

// Assume you have a validation function defined elsewhere (important for 'create')
// const { validateNotificationInput } = require('../validation/notificationValidation');

// --- Core Notification Actions ---

/**
 * @description Create one or more notifications.
 * @route POST /api/notifications
 * @access Private (Requires Authentication)
 */
exports.create = async (req, res) => {
    // Basic check for empty body
    if (!req.body || (typeof req.body === 'object' && Object.keys(req.body).length === 0)) {
        return res.status(400).json({ error: true, message: 'Request body cannot be empty.', data: null });
    }

    try {
        const notificationsData = Array.isArray(req.body) ? req.body : [req.body];
        const creatorId = req.decoded.id; // Assuming JWT middleware adds decoded token to req.decoded

        // --- Input Validation (Placeholder - Implement your actual validation) ---
        const validationErrors = [];
        const dataToInsert = [];

        for (const [index, notificationInput] of notificationsData.entries()) {
            // Example: Use your validation function
            // const { errors, isValid } = validateNotificationInput(notificationInput);
            // if (!isValid) {
            //     validationErrors.push({ index, input: notificationInput, errors });
            //     continue; // Skip invalid items
            // }

            // Basic structural check (adapt based on your validation)
            if (!notificationInput.notificationTitle || !notificationInput.notificationType || !notificationInput.notificationText || !notificationInput.notificationTarget) {
                 validationErrors.push({ index, input: notificationInput, errors: "Missing required fields (title, type, text, target)" });
                 continue; // Skip invalid items
            }

            // Add creator and ensure target format
            dataToInsert.push({
                ...notificationInput,
                notificationCreator: creatorId,
                notificationTarget: Array.isArray(notificationInput.notificationTarget)
                    ? notificationInput.notificationTarget.map(t => ({ // Ensure target objects have user and default read status
                        targetUser: t.targetUser, // Assume targetUser ID is provided correctly
                        targetRead: t.targetRead === true, // Default to false if not provided or invalid
                        readAt: t.targetRead === true ? (t.readAt || new Date()) : null
                      }))
                    : [] // Default to empty array if target is missing/invalid
            });
        }

        // If only validation errors occurred
        if (dataToInsert.length === 0 && validationErrors.length > 0) {
             return res.status(400).json({
                 error: true,
                 message: "Validation failed for all provided notifications.",
                 data: validationErrors
             });
        }
        // --- End Input Validation ---


        // Use insertMany for potentially better performance with multiple documents
        // ordered: false allows partial success if some documents fail validation/insertion
        const createdNotifications = await Notification.insertMany(dataToInsert, { ordered: false });

        const responseData = {
            success: createdNotifications.map(n => n.toJSON()), // Transform successful ones
            errors: validationErrors // Include validation errors
        };

        // Determine overall status
        if (validationErrors.length > 0 && createdNotifications.length > 0) {
            // Partial success
            return res.status(207).json({ // Multi-Status
                error: true, // Indicate partial failure
                message: `Partially created ${createdNotifications.length} notification(s) with ${validationErrors.length} validation error(s).`,
                data: responseData
            });
        } else if (createdNotifications.length > 0) {
             // All success (or only successes if some were filtered by validation)
             return res.status(201).json({
                 error: false,
                 message: `Successfully created ${createdNotifications.length} notification(s).`,
                 data: responseData.success // Only return successful data
             });
        } else {
             // This case should ideally be caught by the validation error check above
             return res.status(400).json({
                 error: true,
                 message: "No notifications were created. Check input data.",
                 data: responseData.errors
             });
        }


    } catch (err) {
        console.error("Error in Notification creation:", err);
        // Handle potential bulk write errors (if using ordered: false and DB validation fails)
        if (err.name === 'MongoBulkWriteError') {
             const responseData = {
                 // Attempt to map successful inserts if possible from err.result
                 success: err.result?.insertedIds?.map((ins, index) => ({ id: ins._id, /* you might need to fetch or reconstruct */ })) || [],
                 errors: err.writeErrors?.map(e => ({ index: e.index, message: e.errmsg, input: dataToInsert[e.index] /* Approx input */ })) || []
             };
             const status = responseData.success.length > 0 ? 207 : 400; // Partial or complete failure
             return res.status(status).json({
                 error: true,
                 message: `Database error during bulk creation. ${responseData.success.length} succeeded, ${responseData.errors.length} failed.`,
                 data: responseData
             });
        }
        // Handle single Mongoose validation errors if not using insertMany or if validation runs before
        if (err.name === 'ValidationError') {
            return res.status(400).json({ error: true, message: "Validation failed.", data: err.errors });
        }
        // General server error
        return res.status(500).json({
            error: true,
            message: "Internal server error during notification creation.",
            data: err.message || err
        });
    }
};

/**
 * @description Get notifications targeted to the logged-in user, with pagination.
 * @route GET /api/notifications?limit=10&page=0
 * @access Private (Requires Authentication)
 */
exports.getAllNotifications = async (req, res) => {
    try {
        const userId = req.decoded.id; // ID of the logged-in user
        const limit = Math.max(1, parseInt(req.query.limit, 10) || 10); // Ensure limit is at least 1
        const page = Math.max(0, parseInt(req.query.page, 10) || 0); // Ensure page is non-negative (renamed from skip for clarity)
        const skip = page * limit;

        // Fetch notifications using the model's static method
        // This method already transforms the data and adds currentUserTarget
        const notifications = await Notification.FindNotifications(userId, limit, skip);

        // For accurate total pages, perform a separate count query
        const totalNotifications = await Notification.countDocuments({ 'notificationTarget.targetUser': userId });
        const totalpage = Math.ceil(totalNotifications / limit);

        // No need for the extra map loop here as FindNotifications handles it.

        return res.status(200).json({
            error: false,
            message: notifications.length > 0 ? "Notifications retrieved successfully." : "No notifications found for this user.",
            data: {
                totalpage: totalpage,
                currentPage: page,
                notifications: notifications // Already transformed
            }
        });

    } catch (err) {
        console.error("Error in getAllNotifications:", err);
        return res.status(500).json({
            error: true,
            message: "Internal server error fetching notifications.",
            data: err.message || err
        });
    }
};

/**
 * @description Unsubscribe the logged-in user from a specific notification.
 * @route DELETE /api/notifications/:id/unsubscribe // Changed route for clarity
 * @access Private (Requires Authentication)
 */
exports.deleteNotification = async (req, res) => {
    try {
        const targetUserID = req.decoded.id; // Logged-in user ID (fixed typo)
        const notificationID = req.params.id;

        // Validate Notification ID format
        if (!ObjectId.isValid(notificationID)) {
            return res.status(400).json({
                error: true,
                message: "Invalid notification ID format.",
                data: { id: notificationID }
            });
        }

        // Use the static method from the model
        const updatedNotification = await Notification.unsubscribeNotifications(notificationID, targetUserID);

        if (!updatedNotification) {
            // This could mean the notification doesn't exist OR the user wasn't subscribed
            return res.status(404).json({ // Not Found is appropriate
                error: false, // Operation successful, but no change needed/possible
                message: "Notification not found or user was not subscribed.",
                data: { notificationID, targetUserID }
            });
        }

        // Success message changed to reflect action
        return res.status(200).json({
            error: false,
            message: "Successfully unsubscribed from notification.",
            // data: updatedNotification.toJSON() // Optionally return updated state
            data: { notificationID, targetUserID } // Or just confirm IDs
        });

    } catch (err) {
        console.error("Error in deleteNotification (unsubscribe):", err);
        return res.status(500).json({
            error: true,
            message: "Internal server error unsubscribing from notification.",
            data: err.message || err
        });
    }
};

/**
 * @description Unsubscribe the logged-in user from ALL notifications.
 * @route DELETE /api/notifications/unsubscribe/all // Changed route for clarity
 * @access Private (Requires Authentication)
 */
exports.deleteAllNotifications = async (req, res) => {
    try {
        // Get ID from authenticated user (removed req.body dependency)
        const targetUserID = req.decoded.id;

        // Pull the user from the target array of all notifications they are part of
        const updateResult = await Notification.updateMany(
            { 'notificationTarget.targetUser': targetUserID }, // Find notifications targeting the user
            { $pull: { notificationTarget: { targetUser: targetUserID } } } // Remove the user's entry from the array
        );

        // updateResult contains info like matchedCount, modifiedCount
        if (!updateResult || updateResult.matchedCount === 0) {
            return res.status(200).json({ // 200 OK is fine, just nothing to update
                error: false,
                message: 'User was not subscribed to any notifications.',
                data: { modifiedCount: 0 }
            });
        }

        // Success message changed to reflect action
        return res.status(200).json({
            error: false,
            message: `Successfully unsubscribed user from ${updateResult.modifiedCount} notification(s).`,
            data: { modifiedCount: updateResult.modifiedCount }
        });

    } catch (err) {
        console.error("Error in deleteAllNotifications (unsubscribe all):", err);
        return res.status(500).json({
            error: true,
            message: "Internal server error unsubscribing from all notifications.",
            data: err.message || err
        });
    }
};

/**
 * @description Mark a specific notification as read for the logged-in user.
 * @route PUT /api/notifications/:id/read // Changed route for clarity
 * @access Private (Requires Authentication)
 */
exports.markOneNotificationasread = async (req, res) => {
    try {
        const targetUserID = req.decoded.id; // Logged-in user ID (fixed typo)
        const notificationID = req.params.id;

        // Validate Notification ID format
        if (!ObjectId.isValid(notificationID)) {
            return res.status(400).json({
                error: true,
                message: "Invalid notification ID format.",
                data: { id: notificationID }
            });
        }

        // Use the static method from the model (which now sets readAt)
        const updatedNotification = await Notification.MarkNotifications(notificationID, targetUserID);

        if (!updatedNotification) {
            // Could mean notification didn't exist, user wasn't target, or already read
            return res.status(404).json({ // Or 200 with a specific message
                error: false, // Operation successful, but no change needed/possible
                message: "Notification not found, user not targeted, or already marked as read.",
                data: { notificationID, targetUserID }
            });
        }

        // Success message changed for clarity
        return res.status(200).json({
            error: false,
            message: "Notification marked as read successfully.",
            data: updatedNotification.toJSON() // Return the updated notification state
        });

    } catch (err) {
        console.error("Error in markOneNotificationasread:", err);
        return res.status(500).json({
            error: true,
            message: "Internal server error marking notification as read.",
            data: err.message || err
        });
    }
};

/**
 * @description Mark all unread notifications as read for the logged-in user.
 * @route PUT /api/notifications/read/all // Changed route for clarity
 * @access Private (Requires Authentication)
 */
exports.markAllNotificationsAsRead = async (req, res) => {
    try {
        // Get ID from authenticated user (removed req.body dependency)
        const targetUserID = req.decoded.id;

        // Update notifications where the user is a target and it's not read
        // Use arrayFilters for precision
        const updateResult = await Notification.updateMany(
            {
                'notificationTarget.targetUser': targetUserID,
                'notificationTarget.targetRead': false // Only target unread ones for this user
            },
            {
                $set: {
                    'notificationTarget.$[elem].targetRead': true,
                    'notificationTarget.$[elem].readAt': new Date() // Set read timestamp
                }
            },
            {
                // Specify which elements in the array to apply the $set operation to
                arrayFilters: [{ 'elem.targetUser': targetUserID, 'elem.targetRead': false }]
            }
        );

        // updateResult contains info like matchedCount, modifiedCount
        if (!updateResult || updateResult.matchedCount === 0) {
            return res.status(200).json({ // 200 OK is fine, just nothing to update
                error: false,
                message: 'No unread notifications found for this user to mark as read.',
                data: { modifiedCount: 0 }
            });
        }

        // Success message changed for clarity
        return res.status(200).json({
            error: false,
            message: `Successfully marked ${updateResult.modifiedCount} notification(s) as read.`,
            data: { modifiedCount: updateResult.modifiedCount }
        });

    } catch (err) {
        console.error("Error in markAllNotificationsAsRead:", err);
        return res.status(500).json({
            error: true,
            message: "Internal server error marking all notifications as read.",
            data: err.message || err
        });
    }
};


// --- Generic CRUD (Implement if needed, using direct Mongoose methods) ---

/**
 * @description Find a single notification by its ID. (Example: Public or Admin access)
 * @route GET /api/notifications/:id
 * @access Public/Private (Adjust middleware accordingly)
 */
exports.findById = async (req, res) => {
    try {
        const notificationID = req.params.id;

        if (!ObjectId.isValid(notificationID)) {
            return res.status(400).json({ error: true, message: "Invalid notification ID format.", data: { id: notificationID } });
        }

        // Find by ID and potentially populate creator info
        const notification = await Notification.findById(notificationID)
                                            .populate({ path: 'notificationCreator', select: 'userFirstName userLastName userEmail' }); // Example population

        if (!notification) {
            return res.status(404).json({ error: false, message: "Notification not found.", data: { id: notificationID } });
        }

        // Use populateAndTransform or just toJSON depending on needs
        // const transformedData = await notification.populateAndTransform(whoIsDemanding); // If complex transform needed
        const transformedData = notification.toJSON(); // Use standard toJSON

        return res.status(200).json({
            error: false,
            message: "Notification retrieved successfully.",
            data: transformedData
        });

    } catch (err) {
        console.error("Error finding notification by ID:", err);
        return res.status(500).json({ error: true, message: "Internal server error retrieving notification.", data: err.message || err });
    }
};

/**
 * @description Find all notifications (Admin functionality - use with caution).
 * @route GET /api/notifications/all // Consider if this endpoint is truly needed vs. getAllNotifications for user
 * @access Private (Admin Only - Add role check middleware)
 */
exports.findAll = async (req, res) => {
     try {
        // WARNING: Fetches potentially many notifications. Always use pagination.
        const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);
        const page = Math.max(0, parseInt(req.query.page, 10) || 0);
        const skip = page * limit;

        // Add filtering based on query params if needed (e.g., ?type=error)
        const filter = {};
        if (req.query.type) {
            filter.notificationType = req.query.type;
        }
        // Add more filters as required

        const notifications = await Notification.find(filter)
            .populate({ path: 'notificationCreator', select: 'userFirstName userLastName' }) // Example population
            .sort({ createdAt: -1 }) // Or other sorting
            .skip(skip)
            .limit(limit);

        const totalNotifications = await Notification.countDocuments(filter);
        const totalpage = Math.ceil(totalNotifications / limit);

        return res.status(200).json({
            error: false,
            message: "Notifications retrieved successfully.",
            data: {
                totalpage: totalpage,
                currentPage: page,
                notifications: notifications.map(n => n.toJSON()) // Transform results
            }
        });
    } catch (err) {
        console.error("Error finding all notifications:", err);
        return res.status(500).json({ error: true, message: "Internal server error retrieving all notifications.", data: err.message || err });
    }
};

/**
 * @description Update a notification by ID (Admin functionality?).
 * @route PUT /api/notifications/:id
 * @access Private (Admin Only - Add role check middleware)
 */
exports.update = async (req, res) => {
     try {
        const notificationID = req.params.id;

        if (!ObjectId.isValid(notificationID)) {
            return res.status(400).json({ error: true, message: "Invalid notification ID format.", data: { id: notificationID } });
        }

        if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: true, message: "Request body cannot be empty for update.", data: null });
        }

        // Define allowed fields for update to prevent unwanted changes
        const allowedUpdates = ['notificationTitle', 'notificationType', 'notificationText', 'notificationLink'];
        const updateData = {};
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key) && req.body[key] !== undefined) {
                updateData[key] = req.body[key];
            }
        });

        if (Object.keys(updateData).length === 0) {
             return res.status(400).json({ error: true, message: "No valid fields provided for update.", data: null });
        }

        // Use the model's static method or findByIdAndUpdate
        const updatedNotification = await Notification.UpdateById( // Using the static method
            notificationID,
            { $set: updateData }, // Use $set to update only specified fields
            { new: true, runValidators: true } // Return updated doc, run schema validators
        );
        // Alternative: await Notification.findByIdAndUpdate(...)

        if (!updatedNotification) {
            return res.status(404).json({ error: false, message: "Notification not found for update.", data: { id: notificationID } });
        }

        return res.status(200).json({
            error: false,
            message: "Notification updated successfully.",
            data: updatedNotification.toJSON()
        });

    } catch (err) {
        console.error("Error updating notification:", err);
         if (err.name === 'ValidationError') {
            return res.status(400).json({ error: true, message: "Validation failed during update.", data: err.errors });
        }
        return res.status(500).json({ error: true, message: "Internal server error updating notification.", data: err.message || err });
    }
};

/**
 * @description Delete a notification completely by ID (Hard Delete - Admin functionality?).
 * @route DELETE /api/notifications/:id // Standard DELETE route for hard delete
 * @access Private (Admin Only - Add role check middleware)
 */
exports.delete = async (req, res) => {
    try {
        const notificationID = req.params.id;

        if (!ObjectId.isValid(notificationID)) {
            return res.status(400).json({ error: true, message: "Invalid notification ID format.", data: { id: notificationID } });
        }

        const deletedNotification = await Notification.findByIdAndDelete(notificationID);

        if (!deletedNotification) {
            return res.status(404).json({ error: false, message: "Notification not found for deletion.", data: { id: notificationID } });
        }

        return res.status(200).json({
            error: false,
            message: "Notification deleted successfully.",
            data: { id: notificationID } // Confirm deletion ID
            // data: deletedNotification.toJSON() // Optionally return the deleted object
        });

    } catch (err) {
        console.error("Error deleting notification:", err);
        return res.status(500).json({ error: true, message: "Internal server error deleting notification.", data: err.message || err });
    }
};



// const Notification = require('./../models/notifications.model');
// const ObjectId = require("mongoose").Types.ObjectId;
// const { Count, UpdateById, Notify, findNotifications, markNotifications } = require('./../middelware/helper')

// exports.create = async function (req, res) {
//   // Check if request body is empty
//   if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
//       return res.status(400).json({ error: true, message: 'Field required', data: req.body });
//   }

//   // Validate input
//   const { errors, isValid } = validateNotificationInput(req.body);

//   if (!isValid) {
//       return res.status(400).json({ error: true, message: "Validation failed", data: errors });
//   }

//   try {
//       // Extract and format notifications data
//       const notificationsData = Array.isArray(req.body) ? req.body : [req.body];

//       // Create notifications using the helper
//       const notificationCreationResult = await NotificationHelpers.create(notificationsData);

//       // Handle all-failed case
//       if (notificationCreationResult.error && notificationCreationResult.code === 400) {
//           return res.status(400).json({
//               error: true,
//               message: "All notifications failed to create",
//               data: notificationCreationResult.payload
//           });
//       }

//       // Handle all-success case
//       if (!notificationCreationResult.error && notificationCreationResult.code === 201) {
//           return res.status(201).json({
//               error: false,
//               message: "All notifications created successfully",
//               data: notificationCreationResult.payload
//           });
//       }

//       // Handle partial-success case
//       return res.status(207).json({
//           error: true,
//           message: "Partial success in creating notifications",
//           data: notificationCreationResult.payload
//       });

//   } catch (err) {
//       console.error("Error in Notification creation process:", err);
//       return res.status(500).json({
//           error: true,
//           message: "Internal server error",
//           data: err.message
//       });
//   }
// };

// exports.getAllNotifications = async (req, res) => {
//   const id = req.decoded.id;
//   const limit = parseInt(req.query.limit);
//   const skip =  limit * parseInt(req.query.skip);

//   const notifications = await findNotifications(id, limit, skip)
//   if (!notifications) {
//     return res.status(200).json({ 
//       error: false, 
//       message: "unfoundNotifications", 
//       data: {
//         totalpage: -1, 
//         notifications: []  
//       } 
//     });
//   }
  
//   notifications.map((element) => {

//     for(const [key, value] of Object.entries(element.notificationTarget)){

//       if(value.targetUser.equals(id)){
        
//         element.notificationTarget = value
        
//         return element
//         break;
//       }
//     }

//   })

//   return res.status(200).json({ 
//     error: false, 
//     message: "foundNotifications", 
//     data: {
//       totalpage: Math.ceil(notifications.length / limit), 
//       notifications: notifications
//     }
//   });
// };

// exports.deleteNotification = async (req, res) => {
//   const tragetUserID = req.decoded.id
//   const notificationID = req.params.id;

//   if(ObjectId.isValid(notificationID)){
    
//     if((String)(new ObjectId(notificationID)) === notificationID){
        
//       const updateNotification = await Notification.unsubscribeNotifications(notificationID, tragetUserID)

//       if (!updateNotification) {
//         res.status(400).json({ 
//           error: false, 
//           message: "unDeletedNotifications", 
//           data: []
//         });
//       }

//       res.status(200).json({ 
//         error: false, 
//         message: "deletedNotifications", 
//         data: updateNotification
//       });    
    
    
//     }else{
    
//       //res.status(400).json({ message: `You must give a valid id: ${notificationID}`});
//       res.status(400).json({ 
//         error: false, 
//         message: "invalidNotificationID", 
//         data: []
//       });
//     }
//   }
// };

// exports.deleteAllNotifications = async (req, res) => {
//   const { id } = req.body;
//   if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
//     return res.status(400).json({ message: `You must give a valid id: ${id}` });
//   }
//   const notificationsDeleteMany = await Notification.deleteMany({ user: id });
//   if (!notificationsDeleteMany) {
//     return res
//       .status(400)
//       .json({ message: 'Error Deleting all notifications as read' });
//   }
//   res.json({ message: `All notifications for user ${id}marked was deleted` });
// };

// exports.markOneNotificationasread = async (req, res) => {
//   const tragetUserID = req.decoded.id
//   const notificationID = req.params.id;

//   if(ObjectId.isValid(notificationID)){
    
//     if((String)(new ObjectId(notificationID)) === notificationID){
        
//       const updateNotification = await Notification.MarkNotifications(notificationID, tragetUserID)

//       if (!updateNotification) {
//         res.status(400).json({ 
//           error: false, 
//           message: "unUpdatedNotifications", 
//           data: []
//         });
//       }

//       res.status(200).json({ 
//         error: false, 
//         message: "updatedNotifications", 
//         data: updateNotification
//       });    
    
    
//     }else{
    
//       return res.status(400).json({ message: `You must give a valid id: ${notificationID}`});
//     }
//   }
// };

// exports.markAllNotificationsAsRead = async (req, res) => {
//   const { id } = req.body;
//   if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
//     return res.status(400).json({ message: `You must give a valid id: ${id}` });
//   }
//   const notificationsUpdateMany = await Notification.updateMany(
//     { user: id },
//     { $set: { read: true } }
//   );
//   if (!notificationsUpdateMany) {
//     return res
//       .status(400)
//       .json({ message: 'Error Marking all notifications as read' });
//   }
//   res.json({ message: `All notifications for user ${id}marked as read` });
// };

// /* // Create Notification
// exports.create = async function (req, res) {
//   if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
//     return res.status(400).json({ error: true, message: { type: "error", text: "Field required" }, data: [] });
//   }

//   try {
//     const result = await NotificationHelpers.create(req.body.formData);
//     return res.status(result.code).json({
//       error: result.error,
//       message: result.message,
//       data: result.data
//     });
//   } catch (err) {
//     console.error("Error creating notification:", err);
//     return res.status(500).json({ error: true, message: { type: "error", text: "Notification creation failed" }, data: [err] });
//   }
// }; */

// // Find Notification by ID
// exports.findById = async function (req, res) {
//   if (!req.params.id) {
//     return res.status(400).json({ error: true, message: { type: "error", text: "Field required" }, data: [] });
//   }

//   try {
//     const result = await NotificationHelpers.findById(req.params.id);
//     return res.status(result.code).json({
//       error: result.error,
//       message: result.message,
//       data: result.data
//     });
//   } catch (err) {
//     console.error("Error finding notification by ID:", err);
//     return res.status(500).json({ error: true, message: { type: "error", text: "Notification retrieval failed" }, data: [err] });
//   }
// };

// // Find All Notifications
// exports.findAll = async function (req, res) {
//   try {
//     const result = await NotificationHelpers.findAll();
//     return res.status(result.code).json({
//       error: result.error,
//       message: result.message,
//       data: result.data
//     });
//   } catch (err) {
//     console.error("Error finding all notifications:", err);
//     return res.status(500).json({ error: true, message: { type: "error", text: "Notification retrieval failed" }, data: [err] });
//   }
// };

// // Update Notification
// exports.update = async function (req, res) {
//   if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
//     return res.status(400).json({ error: true, message: { type: "error", text: "Field required" }, data: [] });
//   }

//   try {
//     const result = await NotificationHelpers.update(req.params.id, req.body);
//     return res.status(result.code).json({
//       error: result.error,
//       message: result.message,
//       data: result.data
//     });
//   } catch (err) {
//     console.error("Error updating notification:", err);
//     return res.status(500).json({ error: true, message: { type: "error", text: "Notification update failed" }, data: [err] });
//   }
// };

// // Delete Notification
// exports.delete = async function (req, res) {
//   if (!req.params.id) {
//     return res.status(400).json({ error: true, message: { type: "error", text: "Field required" }, data: [] });
//   }

//   try {
//     const result = await NotificationHelpers.delete(req.params.id);
//     return res.status(result.code).json({
//       error: result.error,
//       message: result.message,
//       data: result.data
//     });
//   } catch (err) {
//     console.error("Error deleting notification:", err);
//     return res.status(500).json({ error: true, message: { type: "error", text: "Notification deletion failed" }, data: [err] });
//   }
// };