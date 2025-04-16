'use strict';
const userController  = require('./users.controller');
const User            = require('../models/users.model');
const { 
  Count, 
  UpdateById, 
  Notify
}                     = require('./../middelware/helper')

exports.check = async function (req, res) {
  //handles null error
  if (req.decoded.constructor === Object && Object.keys(req.decoded).length === 0) {
    res.status(400).json({ error: true, message: 'invalidToken', data: 'invalidToken' });
  }else{
    let contexts = await userController.checkHelper(req, res)
    contexts = contexts.context
    let validContext = true;

    contexts.every(function (context, index) {
      if(index == contexts.length - 1){
        
        return false;
      }else{
        
        if(!context.done){

          validContext = false
          return false
        }
      }
      console.log(index)

      return true
    })

    if(!validContext){
      res.status(400).json({ error: true, message: 'invalidToken', data: 'invalidToken' });
    }else{
      res.status(200).json({ error: false, message: "read", data: contexts[contexts.length - 1] });
    }
  }
}
exports.setFirstLogin = async function (req, res) {
  //handles null error
  if (req.decoded.constructor === Object && Object.keys(req.decoded).length === 0) {
    res.status(400).json({ error: true, message: 'invalidToken', data: 'invalidToken' });
  }else{
    let contexts = await userController.checkHelper(req, res)
    contexts = contexts.context
    let validContext = true;

    contexts.every(function (context, index) {
      if(index == contexts.length - 1){
        
        return false;
      }else{
        
        if(!context.done){

          validContext = false
          return false
        }
      }
      console.log(index)

      return true
    })

    if(!validContext){
      res.status(400).json({ error: true, message: 'invalidToken', data: 'invalidToken' });
    }else{
      res.status(200).json({ error: false, message: "read", data: contexts[contexts.length - 1] });
    }
  }
}