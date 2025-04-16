const express = require('express');
const router = express.Router();
const missionsController =   require('../controllers/missions.controller');
const isAuth = require('../middelware/authJwt');


// Create a new Mission 
router.post('/new', [isAuth.verifyToken], missionsController.create);

// Find all Mission  
router.get('/all', missionsController.findAll);

// Retrieve a single Mission with id
router.get('/:id', [isAuth.verifyToken],  missionsController.findById);


// Update a Mission with id
router.put('/edit', [isAuth.verifyToken],  missionsController.update);


// Delete a Mission with id
router.delete('/delete', [isAuth.verifyToken], missionsController.delete);


module.exports = router
