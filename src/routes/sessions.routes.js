const express = require('express');
const router = express.Router();
const sessionHistoryController = require('../controllers/sessions.controller');
const isAuth = require('../middelware/authJwt');

// Retrieve session history
router.get('/all', [isAuth.verifyToken], sessionHistoryController.getHistory);

// Clear session history
router.delete('/clear', [isAuth.verifyToken], sessionHistoryController.clearHistory);

module.exports = router;
