const cache = require("./../../config/cache.config");
const mongoose = require('mongoose');
const Permission = require("./../models/permissions.model");

const User = require('../models/users.model');         // Users Model
const Role = require('../models/roles.model');         // Roles Model

/**
 * Recursively retrieves all permissions for a given role, including inherited roles.
 * @param {Object} role - The role document.
 * @returns {Promise<Array>} - An array of Permission documents.
 **/

function checkPermission(roles, { context, action, payload }) {
  // Initialize an array to hold the permissions
  let isAllowed = false
  let permissions = [];

  const permissionPayload = `${context}:${action}`
  const permissionWildCard = `${context}:${payload}-*`


  if(Array.isArray(roles) && roles.length){

    roles.forEach(role => {

      role.rolePermissions.forEach(rolePermission => {
        
        if([permissionPayload, permissionWildCard].includes(rolePermission.permissionPayload)){
          isAllowed = true;
          // break;
        }
      });
    });
  }

  return isAllowed;
}

/**
 * Checks if a user (by userId) has a permission matching the provided criteria.
 * @param {String} userId - The ID of the user.
 * @param {Object} requiredPermission - An object with context, action, and payload.
 * @returns {Promise<Boolean>} - True if the user has the permission; otherwise false.
 **/

async function checkRoles(persona, actor, { context, action, payload }) {
  
  if (!actor[persona]) return false;

  // Iterate through each role assigned to the user
  const roles = await Promise.all(
    actor[persona][`${persona}Roles`].map(
      (role, index) => Role.findById(role)
                       .populate('roleContractor')
                       .populate('roleOrganization')
                       .populate({
                          path: 'rolePermissions',
                          match: { permissionContext: context },
                          select: 'permissionContext permissionAction permissionPayload'
                        })
                        .populate({
                           path: 'roleInheritsFrom',
                           populate :{
                             path: 'rolePermissions',
                             match: { permissionContext: context },
                             select: 'permissionContext permissionAction permissionPayload'
                           }
                         })
    )
  )

  const isAllowed = checkPermission(roles, { context, action, payload });

  /* for (const role of roles) {

    // Retrieve all permissions for this role (including inherited ones)
    const permissions = await checkPermissions(role);

    // Check if any permission matches the required criteria
    const hasPermission = permissions.some((perm) => {
      return (
        perm.permissionContext === context &&
        perm.permissionAction === action &&
        perm.permissionPayload === payload
      );
    });

    if (hasPermission) return true;
  } */

  return isAllowed;
}

/**
 * Express middleware to check for a required permission.
 * The permission is defined by its context, action, and payload.
 * Assumes req.user.id is set by previous authentication middleware.
 * @param {String} context - The required permission context.
 * @param {String} action - The required permission action.
 * @param {String} payload - The required permission payload.
 **/

const checkPermissionMiddleware = (payload, action, context, persona) => {
  return async (req, res, next) => {
    try {
      const user = req.decoded.user
      const contractor = req.decoded.contractor
      const staff = req.decoded.staff

      // Check if the user has the required permission
      const hasPermission = await checkRoles(persona, { user, contractor, staff }, { context, action, payload });
      if (!hasPermission) {
        return res.status(403).json({ message: "Access Denied: Insufficient permissions" });
      }
      next(); // User has permission, proceed to the next middleware/route handler
    } catch (error) {
      console.error("Error checking permissions:", error);
      return res.status(403 ?? 500).json({ message: "Server Error", error: error.message });
    }
  };
};

module.exports = {
  checkPermissions: checkPermission, 
  checkRoles,
  checkPermissionMiddleware
};
