const express = require('express');
const router = express.Router();
const welcomeController =   require('../controllers/welcome.controller');
const isAuth = require('../middelware/authJwt');

// Find all users 
// router.get('/', welcomeController.findAll);


// Find One User By email
router.get('/check', [isAuth.verifyToken], welcomeController.check);
// router.post('/Individual', [isAuth.verifyToken], welcomeController.create);

// Create a new user
// router.post('/register', welcomeController.create);


// Retrieve a single user with id
// router.post('/check', [isAuth.verifyToken],  welcomeController.check);


// Retrieve a single user with id
// router.get('/:id', [isAuth.verifyToken],  usersController.findById);


// Update a user with id
// router.put('/edit', [isAuth.verifyToken],  welcomeController.update);


// Delete a user with id
// router.delete('/delete', [isAuth.verifyToken], welcomeController.delete);


module.exports = router
