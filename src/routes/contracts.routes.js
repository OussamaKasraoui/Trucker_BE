const express = require('express');
const router = express.Router();
const contractsController =   require('../controllers/contracts.controller');
const isAuth = require('../middelware/authJwt');
const permissions = require('../middelware/permissions');


// Create a new Contract 
router.post('/create',      [isAuth.verifyToken], contractsController.create);

// Find all Contract  
router.get(
    '/all',          
    [isAuth.verifyToken, permissions.checkPermissionMiddleware("read", "read-all", "contracts", "contractor")], 
    contractsController.findAll
);

/* // Retrieve a single Contract with id
router.get('/contract/:id', [isAuth.verifyToken],  contractsController.findById);


// Update a Contract with id
router.put('/edit',         [isAuth.verifyToken],  contractsController.update);


// Delete a Contract with id
router.delete('/delete',    [isAuth.verifyToken], contractsController.delete);

// Check if Contractor has any contracts  
router.get('/check',        [isAuth.verifyToken], contractsController.check); */


module.exports = router
