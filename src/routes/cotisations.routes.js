const express = require('express');
const router = express.Router();
const cotisationsController =   require('../controllers/cotisations.controller');
const isAuth = require('../middelware/authJwt');


// Create a new Cotisation 
router.post('/new', [isAuth.verifyToken], cotisationsController.create);

// Find all Cotisation  
router.get('/all', cotisationsController.findAll);

// Retrieve a single Cotisation with id
router.get('/:id', [isAuth.verifyToken],  cotisationsController.findById);


// Update a Cotisation with id
router.put('/edit', [isAuth.verifyToken],  cotisationsController.update);


// Delete a Cotisation with id
router.delete('/delete', [isAuth.verifyToken], cotisationsController.delete);


module.exports = router
