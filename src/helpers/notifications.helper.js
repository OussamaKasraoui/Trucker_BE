'use strict';
const Notification = require('../models/notification.model');
const ObjectId = require("mongoose").Types.ObjectId;
const { Count, UpdateById, Notify, findNotifications, markNotifications } = require('../middelware/helper');

exports.create = async function (notifications, session) {
  let returnNotifications = {
      error: false,
      payload: null,
      code: 201 // Default code for successful creation
  };

  // Validate input: Ensure 'notifications' is provided and is an array
  if (!notifications || !Array.isArray(notifications)) {
      returnNotifications.error = true;
      returnNotifications.payload = "noNotificationDataProvided"; // Consistent payload for missing data
      returnNotifications.code = Array.isArray(notifications) ? 400 : 500; // Bad request or internal server error
      return returnNotifications; // Early return on error
  }

  const results = [];

  try {
    // Create a new notification document
    const docNotification = await Notification.create(notifications, session ? { session } : undefined);

    // Push success result after transformation
    results.push({ code: 201, error: false, data: await docNotification.populateAndTransform() });

  } catch (error) {
    console.error("Error creating notification:", error);

    const errorDetails = {
      code: 400,
      error: true,
    };

    // Handle validation errors specifically
    if (error?.errors && Object.keys(error.errors).length) {
      const validationErrors = {};
      for (const key in error.errors) {
        if (error.errors.hasOwnProperty(key)) {
          validationErrors[key] = `${key}Error`;
        }
      }
      errorDetails.data = validationErrors;
    } else {
      errorDetails.code = 500;
      errorDetails.data = error.message; // General error message
    }

    // Push error result
    results.push(errorDetails);
  }

  // Loop through each notification and attempt to insert
  for (const [index, notification] of notifications.entries()) {
      if (!notification.id) { // Create only if `id` is not provided
      } else {
          // Notification already exists (id provided), assume it's valid
          results.push({ code: 201, error: false, data: notification });
      }
  }

  // Evaluate results for overall success/failure
  const allFailed = results.every(result => result.error === true);
  const allSuccess = results.every(result => result.error === false);

  if (allFailed) {
      returnNotifications.error = true;
      returnNotifications.payload = results; // Return detailed errors
      returnNotifications.code = 400; // Bad request for validation errors
  } else if (allSuccess) {
      returnNotifications.error = false;
      returnNotifications.payload = results; // Return all successful results
      returnNotifications.code = 201; // Resource created successfully
  } else {
      returnNotifications.error = true;
      returnNotifications.payload = results; // Mixed results (successes and failures)
      returnNotifications.code = 207; // Partial success
  }

  return returnNotifications;
};

exports.getAllNotifications = async (req, res) => {
  const id = req.decoded.id;
  const limit = parseInt(req.query.limit);
  const skip =  limit * parseInt(req.query.skip);

  const notifications = await findNotifications(id, limit, skip)
  if (!notifications) {
    res.status(200).json({ 
      error: false, 
      message: "unfoundNotifications", 
      data: {
        totalpage: -1, 
        notifications: []  
      } 
    });
  }
  
  notifications.map((element) => {

    for(const [key, value] of Object.entries(element.notificationTarget)){

      if(value.targetUser.equals(id)){
        
        element.notificationTarget = value
        
        return element
        break;
      }
    }

  })

  res.status(200).json({ 
    error: false, 
    message: "foundNotifications", 
    data: {
      totalpage: Math.ceil(notifications.length / limit), 
      notifications: notifications
    }
  });
};

exports.deleteNotification = async (req, res) => {
  const tragetUserID = req.decoded.id
  const notificationID = req.params.id;

  if(ObjectId.isValid(notificationID)){
    
    if((String)(new ObjectId(notificationID)) === notificationID){
        
      const updateNotification = await Notification.unsubscribeNotifications(notificationID, tragetUserID)

      if (!updateNotification) {
        res.status(400).json({ 
          error: false, 
          message: "unDeletedNotifications", 
          data: []
        });
      }

      res.status(200).json({ 
        error: false, 
        message: "deletedNotifications", 
        data: updateNotification
      });    
    
    
    }else{
    
      //res.status(400).json({ message: `You must give a valid id: ${notificationID}`});
      res.status(400).json({ 
        error: false, 
        message: "invalidNotificationID", 
        data: []
      });
    }
  }
};

exports.deleteAllNotifications = async (req, res) => {
  const { id } = req.body;
  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ message: `You must give a valid id: ${id}` });
  }
  const notificationsDeleteMany = await Notification.deleteMany({ user: id });
  if (!notificationsDeleteMany) {
    return res
      .status(400)
      .json({ message: 'Error Deleting all notifications as read' });
  }
  res.json({ message: `All notifications for user ${id}marked was deleted` });
};

exports.markOneNotificationasread = async (req, res) => {
  const tragetUserID = req.decoded.id
  const notificationID = req.params.id;

  if(ObjectId.isValid(notificationID)){
    
    if((String)(new ObjectId(notificationID)) === notificationID){
        
      const updateNotification = await Notification.MarkNotifications(notificationID, tragetUserID)

      if (!updateNotification) {
        res.status(400).json({ 
          error: false, 
          message: "unUpdatedNotifications", 
          data: []
        });
      }

      res.status(200).json({ 
        error: false, 
        message: "updatedNotifications", 
        data: updateNotification
      });    
    
    
    }else{
    
      return res.status(400).json({ message: `You must give a valid id: ${notificationID}`});
    }
  }
};

exports.markAllNotificationsAsRead = async (req, res) => {
  const { id } = req.body;
  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ message: `You must give a valid id: ${id}` });
  }
  const notificationsUpdateMany = await Notification.updateMany(
    { user: id },
    { $set: { read: true } }
  );
  if (!notificationsUpdateMany) {
    return res
      .status(400)
      .json({ message: 'Error Marking all notifications as read' });
  }
  res.json({ message: `All notifications for user ${id}marked as read` });
};