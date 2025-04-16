// /home/alex/Projetcs/okSoft.SyndiKIT.BE/src/helpers/ownershipShares.helper.js
'use strict';

// Assuming helpers are in the same directory or adjust path accordingly
const UsersHelper = require('./users.helper');
const ApartmentsHelper = require('./apartments.helper');

/**
 * Generates Mongoose population settings for an OwnershipShares field.
 * This defines how an OwnershipShares document should be populated when referenced
 * from another schema.
 *
 * @param {string} fieldName - The name of the field in the parent schema that references OwnershipShares.
 * @param {string} whoIsDemanding - Identifier for the requester type (e.g., 'USER', 'ADMIN', 'SYSTEM').
 * @returns {object} Mongoose population object ({ path, select, populate }).
 */
// exports.populationSettings = function (fieldName, whoIsDemanding) {
//     const populationObject = {
//         path: fieldName,
//         // Sensible defaults - adjust fields as needed per security/privacy requirements
//         select: 'percentage effectiveDate endDate apartment owner createdAt updatedAt',
//         populate: []
//     };

//     // Define population based on who is demanding
//     // Example: USER and ADMIN might have slightly different needs
//     if (whoIsDemanding === 'USER' || whoIsDemanding === 'ADMIN') {
//         // Select fields suitable for users/admins
//         // Exclude historicalVersions by default for potentially large arrays
//         populationObject.select = 'percentage effectiveDate endDate apartment owner createdAt updatedAt';

//         // Define nested populations for apartment and owner details
//         // Use the respective helpers to define how these nested documents are populated
//         const apartmentPopulation = ApartmentsHelper.populationSettings('apartment', whoIsDemanding);
//         const ownerPopulation = UsersHelper.populationSettings('owner', whoIsDemanding);

//         populationObject.populate = [
//             apartmentPopulation,
//             ownerPopulation
//         ];

//         // Optionally include more details for ADMIN if necessary
//         // if (whoIsDemanding === 'ADMIN') {
//         //     populationObject.select += ' historicalVersions'; // Example: Admins might see history
//         // }
//     }
//     // Add other 'whoIsDemanding' cases if needed (e.g., 'SYSTEM' might need fewer fields)
//     /* else if (whoIsDemanding === 'SYSTEM') {
//         populationObject.select = 'percentage apartment owner effectiveDate endDate';
//         // System might not need nested population or specific fields
//         populationObject.populate = [
//              { path: 'apartment', select: '_id' }, // Just the ID
//              { path: 'owner', select: '_id' }      // Just the ID
//         ];
//     } */

//     return populationObject;
// };

/**
 * Helper to format an OwnershipShares object for API responses or other uses.
 * Ensures consistent structure and can adapt based on perspective.
 * Similar to the model's toJSON but usable independently and potentially more flexible.
 *
 * @param {object} ownershipShare - The Mongoose document or plain object representing an ownership share.
 * @param {string} [perspective='USER'] - The perspective for formatting (e.g., 'USER', 'ADMIN'). Controls which fields might be included.
 * @returns {object | null} Formatted ownership share object, or null if input is invalid.
 */
// exports.formatOwnershipShare = function(ownershipShare, perspective = 'USER') {
//     if (!ownershipShare) {
//         return null;
//     }

//     // Use toJSON if available (Mongoose object), otherwise handle plain object
//     // Ensure 'id' field is present.
//     let baseObject;
//     if (typeof ownershipShare.toJSON === 'function') {
//         baseObject = ownershipShare.toJSON(); // Uses the model's toJSON method
//     } else {
//         // Handle plain JS object, ensure id is derived from _id if present
//         const { _id, ...rest } = ownershipShare;
//         baseObject = { id: _id?.toString() || ownershipShare.id, ...rest };
//     }

//      // Start with core fields available to most perspectives
//     const formatted = {
//         id: baseObject.id,
//         percentage: baseObject.percentage,
//         effectiveDate: baseObject.effectiveDate,
//         endDate: baseObject.endDate,
//         // Handle populated vs. non-populated fields gracefully
//         apartment: baseObject.apartment, // Might be an object (populated) or just an ID string
//         owner: baseObject.owner,         // Might be an object (populated) or just an ID string
//         createdAt: baseObject.createdAt,
//         updatedAt: baseObject.updatedAt,
//     };

//     // --- Perspective-based adjustments ---

//     // Example: Admins might see historical versions
//     if (perspective === 'ADMIN' && baseObject.historicalVersions) {
//          formatted.historicalVersions = baseObject.historicalVersions;
//     }

//     // Ensure nested objects (apartment, owner) are also formatted if they are objects
//     // This relies on the nested objects having their own sensible toJSON or being formatted elsewhere
//     if (formatted.apartment && typeof formatted.apartment === 'object' && !formatted.apartment.id) {
//        // If it's an object but lacks 'id', it might be just the ObjectId; convert to string
//        formatted.apartment = formatted.apartment.toString();
//     } else if (formatted.apartment && typeof formatted.apartment !== 'object') {
//         // Ensure it's a string if it's not an object (likely already an ID)
//         formatted.apartment = formatted.apartment.toString();
//     }
//     // If apartment is a populated object, we assume its toJSON method (called by baseObject.toJSON()) handled its formatting.

//     if (formatted.owner && typeof formatted.owner === 'object' && !formatted.owner.id) {
//        formatted.owner = formatted.owner.toString();
//     } else if (formatted.owner && typeof formatted.owner !== 'object') {
//         formatted.owner = formatted.owner.toString();
//     }
//      // If owner is a populated object, assume its toJSON handled formatting.


//     // Remove fields not needed for a specific perspective if necessary
//     // if (perspective === 'LIMITED_VIEW') {
//     //    delete formatted.createdAt;
//     //    delete formatted.updatedAt;
//     // }

//     return formatted;
// };

// You could add more specific helpers here if needed, for example:
// - Calculating total percentage for an apartment (though often better in a service)
// - Finding active shares for a specific date


// exports.formatOwnershipShare = function (ownershipShare) {
//     const object = { ...ownershipShare };
    
//     try {
//         object.id = object._id.toString();
//         object.name = `Share_${object.id}`

//         // Format populated fields if they are not null
//         if (object.apartment && typeof object.apartment === 'object') {
//             object.apartment = ApartmentsHelper.formatApartment (object.apartment);
//         }

//         if (object.owner && typeof object.owner === 'object') {
//             object.owner = UsersHelper.formatUser(object.owner);
//         }

//         // Remove unwanted properties
//         delete object._id;
//         delete object.__v;
//         delete object.createdAt;
//         delete object.updatedAt;
//     } catch (error) {
//         console.error(`Error formatting <entity>:`, error);
//         return null; // Handle the error as needed
//     }

//     return object;
// }