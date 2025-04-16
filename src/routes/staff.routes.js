const express = require('express');
const router = express.Router();
const staffController =   require('../controllers/staff.controller');
const isAuth = require('../middelware/authJwt');


// Create a new Stuff 
router.post('/new', [isAuth.verifyToken], staffController.create);

// Find all Stuff  
router.get('/all', staffController.findAll);

// Retrieve a single Stuff with id
router.get('/:id', [isAuth.verifyToken],  staffController.findById);


// Update a Stuff with id
router.put('/edit', [isAuth.verifyToken],  staffController.update);


// Delete a Stuff with id
router.delete('/delete', [isAuth.verifyToken], staffController.delete);


module.exports = router
