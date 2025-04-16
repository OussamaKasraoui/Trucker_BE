const express = require('express');
const router = express.Router();
const devisController =   require('../controllers/devis.controller');
const isAuth = require('../middelware/authJwt');


// Create a new Devis 
router.post('/new', [isAuth.verifyToken], devisController.create);

// Find all Devis  
router.get('/all', devisController.findAll);

// Retrieve a single Devis with id
router.get('/:id', [isAuth.verifyToken],  devisController.findById);


// Update a Devis with id
router.put('/edit', [isAuth.verifyToken],  devisController.update);


// Delete a Devis with id
router.delete('/delete', [isAuth.verifyToken], devisController.delete);


module.exports = router
