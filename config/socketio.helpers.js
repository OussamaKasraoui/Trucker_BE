// src/helpers/socketio.helpers.js
const User =         require('../src/models/users.model');
const notification = require('../src/models/notifications.model');

async function handleSetUserId(usersio, socket, userId) {
  try {
    if (userId) {
      const oneUser = await User.findById(userId).lean().exec();
      if (oneUser) {
        usersio[userId] = socket;
        console.log(`⚡ Socket: User with id ${userId} connected`);
      } else {
        console.log(`🚩 Socket: No user with id ${userId}`);
      }
    }
  } catch (error) {
    console.error('Error in handleSetUserId:', error.message);
  }
}

async function handleGetNotificationsLength(usersio, socket, userId) {
  try {
    const notifications = await notification
      .find({ user: userId, read: false })
      .lean();
    usersio[userId]?.emit('notificationsLength', notifications.length || 0);
  } catch (error) {
    console.error('Error in handleGetNotificationsLength:', error.message);
  }
}

function handleDisconnect(usersio, socket) {
  try {
    const userId = Object.keys(usersio).find(key => usersio[key] === socket);
    if (userId) {
      console.log(`🔥 User with id ${userId} disconnected from socket`);
      usersio[userId] = null;
    }
  } catch (error) {
    console.error('Error in handleDisconnect:', error.message);
  }
}

module.exports = { handleSetUserId, handleGetNotificationsLength, handleDisconnect };
