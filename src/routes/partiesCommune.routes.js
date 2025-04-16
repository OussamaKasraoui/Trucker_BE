const express = require('express');
const router = express.Router();
const partiesCommunesController =   require('../controllers/partiesCommune.controller');
const isAuth = require('../middelware/authJwt');


// Create a new PartiesCommune 
router.post('/new', [isAuth.verifyToken], partiesCommunesController.create);

// Find all PartiesCommune  
router.get('/all', partiesCommunesController.findAll);

// Retrieve a single PartiesCommune with id
router.get('/:id', [isAuth.verifyToken],  partiesCommunesController.findById);


// Update a PartiesCommune with id
router.put('/edit', [isAuth.verifyToken],  partiesCommunesController.update);


// Delete a PartiesCommune with id
router.delete('/delete', [isAuth.verifyToken], partiesCommunesController.delete);


module.exports = router
