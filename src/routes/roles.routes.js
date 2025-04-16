const express = require('express');
const router = express.Router();
const rolesController =   require('../controllers/role.controller');
const isAuth = require('../middelware/authJwt');

// Find all Roles 
router.get('/', rolesController.findAll);


// Find One Role By email
router.post('/login', rolesController.findOne);

// Create a new Role
router.post('/create', rolesController.create);


// Retrieve a single Role with id
router.get('/:id', [isAuth.verifyToken],  rolesController.findById);


// Update a Role with id
router.put('/edit', [isAuth.verifyToken],  rolesController.update);


// Delete a Role with id
router.delete('/delete', [isAuth.verifyToken], rolesController.delete);


module.exports = router
