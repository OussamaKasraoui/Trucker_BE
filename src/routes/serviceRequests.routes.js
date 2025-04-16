const express = require('express');
const router = express.Router();
const serviceRequestsController =   require('../controllers/serviceRequests.controller');
const isAuth = require('../middelware/authJwt');


// Create a new serviceRequests 
router.post('/new', [isAuth.verifyToken], serviceRequestsController.create);

// Find all serviceRequests  
router.get('/all', serviceRequestsController.findAll);

// Retrieve a single serviceRequests with id
router.get('/:id', [isAuth.verifyToken],  serviceRequestsController.findById);


// Update a serviceRequests with id
router.put('/edit', [isAuth.verifyToken],  serviceRequestsController.update);


// Delete a serviceRequests with id
router.delete('/delete', [isAuth.verifyToken], serviceRequestsController.delete);


module.exports = router
