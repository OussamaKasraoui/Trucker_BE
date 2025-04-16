const express = require('express');
const router = express.Router();
const appartmentsController =   require('../controllers/apartments.controller');
const isAuth = require('../middelware/authJwt');


// Create a new Appartment 
router.post('/create', [isAuth.verifyToken], appartmentsController.create);

// Find all Appartment  
router.get('/all', appartmentsController.findAll);

// Retrieve a single Appartment with id
router.get('/apartment/:id', [isAuth.verifyToken],  appartmentsController.findById);

// Check if a Building has Any apartments  
router.get('/check', [isAuth.verifyToken], appartmentsController.check);


// Update a Appartment with id
router.put('/edit', [isAuth.verifyToken],  appartmentsController.update);


// Delete a Appartment with id
router.delete('/delete', [isAuth.verifyToken], appartmentsController.delete);


module.exports = router
