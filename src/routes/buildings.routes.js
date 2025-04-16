const express = require('express');
const router = express.Router();
const buildingsController =   require('../controllers/buildings.controller');
const isAuth = require('../middelware/authJwt');


// Create a new Building 
router.post('/create', [isAuth.verifyToken], buildingsController.create);

// Find all Buildings
router.get('/all', buildingsController.findAll);

// Retrieve a single Building with id
router.get('/building/:id', [isAuth.verifyToken],  buildingsController.findById);

// Check if a Building has Any Buildings  
router.get('/check', [isAuth.verifyToken], buildingsController.check);


// Update a Building with id
router.put('/edit', [isAuth.verifyToken],  buildingsController.update);


// Delete a Building with id
router.delete('/delete', [isAuth.verifyToken], buildingsController.delete);


module.exports = router
