const express = require('express');
const router = express.Router();
const usersController =   require('../controllers/users.controller');
const isAuth = require('./../middelware/authJwt');

// Find all users 
router.get('/', usersController.findAll);


// Find One User By email
router.post('/login', usersController.findOne);

// Create a new user
router.post('/register', usersController.create);


// Retrieve a single user with id
router.get('/:id', [isAuth.verifyToken],  usersController.findById);


// Update a user with id
router.put('/edit', [isAuth.verifyToken],  usersController.update);


// Delete a user with id
router.delete('/delete', [isAuth.verifyToken], usersController.delete);


module.exports = router
