// socketio.config.js
const { handleSetUserId, handleGetNotificationsLength, handleDisconnect } = require('./socketio.helpers');

let usersio = [];

function initializeSocketIO(io) {

  io.on('connection', (socket) => {
    // Wrap helper functions in a callback
    socket.on('setUserId', (userId) => handleSetUserId(usersio, socket, userId));
    socket.on('getNotificationsLength', (userId) => handleGetNotificationsLength(usersio, socket, userId));
    socket.on('disconnect', () => handleDisconnect(usersio, socket));
  });
  
};

module.exports = { initializeSocketIO }