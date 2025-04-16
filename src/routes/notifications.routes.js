const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notifications.controller');
const isAuth = require('../middelware/authJwt');

// Fetch All Notifications 
router.get('/all', [isAuth.verifyToken], notificationsController.getAllNotifications);

// Read One Notification with id
router.put('/read/:id', [isAuth.verifyToken], notificationsController.markOneNotificationasread);

// Read All Notifications  
router.put('/read/all', [isAuth.verifyToken], notificationsController.markAllNotificationsAsRead);

// Delete One Notification with id
router.put('/delete/:id', [isAuth.verifyToken], notificationsController.deleteNotification);

// Delete all Notifications 
router.put('/delete/all', [isAuth.verifyToken], notificationsController.deleteAllNotifications);


module.exports = router