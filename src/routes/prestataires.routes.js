const express = require('express');
const router = express.Router();
const prestatairesController =   require('../controllers/prestataires.controller');
const isAuth = require('../middelware/authJwt');


// Create a new Prestataire 
router.post('/new', [isAuth.verifyToken], prestatairesController.create);

// Find all Prestataire  
router.get('/all', prestatairesController.findAll);

// Retrieve a single Prestataire with id
router.get('/:id', [isAuth.verifyToken],  prestatairesController.findById);


// Update a Prestataire with id
router.put('/edit', [isAuth.verifyToken],  prestatairesController.update);


// Delete a Prestataire with id
router.delete('/delete', [isAuth.verifyToken], prestatairesController.delete);


module.exports = router
