const express = require('express');
const router = express.Router();
const packsController =   require('../controllers/packs.controller');
const isAuth = require('../middelware/authJwt');

// Find all Packs 
router.get('/', packsController.findAll);

// Create a new Pack
router.post('/create', packsController.create);


// // Retrieve a single Pack with id
// router.get('/:id', [isAuth.verifyToken],  packsController.findById);


// // Update a Pack with id
// router.put('/edit', [isAuth.verifyToken],  packsController.update);


// // Delete a Pack with id
// router.delete('/delete', [isAuth.verifyToken], packsController.delete);


module.exports = router
