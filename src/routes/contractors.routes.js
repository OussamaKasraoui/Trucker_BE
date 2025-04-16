const express = require('express');
const router = express.Router();
const contractorsController =   require('../controllers/contractors.controller');
const isAuth = require('../middelware/authJwt');


// Create a new Contractor 
router.post('/new', [isAuth.verifyToken], contractorsController.create);

// Find all Contractor  
router.get('/all', contractorsController.findAll);

// Retrieve a single Contractor with id
router.get('/:id', [isAuth.verifyToken],  contractorsController.findById);


// Update a Contractor with id
router.put('/edit', [isAuth.verifyToken],  contractorsController.update);


// Delete a Contractor with id
router.delete('/delete', [isAuth.verifyToken], contractorsController.delete);


module.exports = router
