const express = require('express');
const router = express.Router();
const servicesController =   require('../controllers/services.controller');
const isAuth = require('../middelware/authJwt');
const permissions = require('../middelware/permissions');


// Create a new Service 
router.post('/create',      [isAuth.verifyToken], servicesController.create);

// Find all Service  
router.get(
    '/all',          
    [isAuth.verifyToken, permissions.checkPermissionMiddleware("read", "read-all", "services", "contractor")], 
    servicesController.findAll
);

/* // Retrieve a single Service with id
router.get('/service/:id', [isAuth.verifyToken],  contractsController.findById);


// Update a Service with id
router.put('/edit',         [isAuth.verifyToken],  contractsController.update);


// Delete a Service with id
router.delete('/delete',    [isAuth.verifyToken], contractsController.delete);

// Check if Contractor has any services  
router.get('/check',        [isAuth.verifyToken], contractsController.check); */


module.exports = router
