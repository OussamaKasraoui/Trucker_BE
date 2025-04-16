const express = require('express');
const router = express.Router();
const agreementsController =   require('../controllers/agreements.controller');
const isAuth = require('../middelware/authJwt');
const permissions = require('../middelware/permissions');


// Create a new Agreement 
router.post('/create',      [isAuth.verifyToken], agreementsController.create);

// Find all Agreement  
router.get(
    '/all',          
    [isAuth.verifyToken, permissions.checkPermissionMiddleware("read", "read-all", "agreements", "contractor")], 
    agreementsController.findAll
);

/* // Retrieve a single Agreement with id
router.get('/agreement/:id', [isAuth.verifyToken],  contractsController.findById);


// Update a Agreement with id
router.put('/edit',         [isAuth.verifyToken],  contractsController.update);


// Delete a Agreement with id
router.delete('/delete',    [isAuth.verifyToken], contractsController.delete);

// Check if Contractor has any agreements  
router.get('/check',        [isAuth.verifyToken], contractsController.check); */


module.exports = router
