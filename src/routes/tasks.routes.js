const express = require('express');
const router = express.Router();
const tasksController =   require('../controllers/tasks.controller');
const isAuth = require('../middelware/authJwt');


// Create a new Task 
router.post('/new', [isAuth.verifyToken], tasksController.create);

// Find all Task  
router.get('/all', tasksController.findAll);

// Retrieve a single Task with id
router.get('/:id', [isAuth.verifyToken],  tasksController.findById);


// Update a Task with id
router.put('/edit', [isAuth.verifyToken],  tasksController.update);


// Delete a Task with id
router.delete('/delete', [isAuth.verifyToken], tasksController.delete);


module.exports = router
