const express = require('express');
const router = express.Router();
const depensesController =   require('../controllers/depenses.controller');
const isAuth = require('../middelware/authJwt');


// Create a new Depense 
router.post('/new', [isAuth.verifyToken], depensesController.create);

// Find all Depense  
router.get('/all', depensesController.findAll);

// Retrieve a single Depense with id
router.get('/:id', [isAuth.verifyToken],  depensesController.findById);


// Update a Depense with id
router.put('/edit', [isAuth.verifyToken],  depensesController.update);


// Delete a Depense with id
router.delete('/delete', [isAuth.verifyToken], depensesController.delete);


module.exports = router
