const express = require('express');
const router = express.Router();
const permissionsController =   require('../controllers/permissions.controller');
const isAuth = require('../middelware/authJwt');

// Find all Roles 
router.get('/', permissionsController.findAll);


// Find One Role By email
router.post('/login', permissionsController.findById);

// Create a new Role
router.post('/create', permissionsController.create);


// Retrieve a single Role with id
router.get('/:id', [isAuth.verifyToken],  permissionsController.findById);


// Update a Role with id
router.put('/edit', [isAuth.verifyToken],  permissionsController.update);


// Delete a Role with id
router.delete('/delete', [isAuth.verifyToken], permissionsController.delete);


module.exports = router
