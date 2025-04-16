const express = require('express');
const router = express.Router();
const twoFAController =   require('../controllers/twoFA.controller');
const isAuth = require('../middelware/authJwt');


// Create a new Site 
router.post('/create', [isAuth.verifyToken, isAuth.isAllowed], twoFAController.create);

// Create a new Site 
router.post('/verify', [isAuth.verifyToken], twoFAController.verify);

// Resend Validation Code
router.get('/resend', [isAuth.verifyToken], twoFAController.resend);

// // Check if a Contractor has Any Sites  
// router.get('/check', [isAuth.verifyToken], twoFAController.check);

// // Update a Site with id
// router.put('/update', [isAuth.verifyToken],  twoFAController.update);


// // Delete a Site with id
// router.delete('/delete', [isAuth.verifyToken], twoFAController.delete);


module.exports = router
