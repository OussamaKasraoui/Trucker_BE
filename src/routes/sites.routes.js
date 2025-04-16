const express = require('express');
const router = express.Router();
const sitesController =   require('../controllers/sites.controller');
const isAuth = require('../middelware/authJwt');


// Create a new Site 
router.post('/create', [isAuth.verifyToken, isAuth.isAllowed], sitesController.create);

// Retrieve a single Site with id
router.get('/site/:id', [isAuth.verifyToken], sitesController.findById);

// Find all Site  
router.get('/all', [isAuth.verifyToken], sitesController.findAll);

// Check if a Contractor has Any Sites  
router.get('/check', [isAuth.verifyToken], sitesController.check);

// Update a Site with id
// router.put('/update', [isAuth.verifyToken],  sitesController.);


// Delete a Site with id
// router.delete('/delete', [isAuth.verifyToken], sitesController.);


module.exports = router
