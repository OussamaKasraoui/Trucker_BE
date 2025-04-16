// /home/alex/Projetcs/okSoft.SyndiKIT.BE/src/helpers/reserveFunds.helper.js
'use strict';
// const AgreementHelpers = require('./agreements.helper');

/**
 * Generates Mongoose population settings for a ReserveFunds field.
 * This defines how a ReserveFunds document should be populated when referenced
 * from another schema (e.g., from a Condominium).
 *
 * @param {string} fieldName - The name of the field in the parent schema that references ReserveFunds.
 * @param {string} whoIsDemanding - Identifier for the requester type (e.g., 'USER', 'ADMIN', 'SYSTEM').
 * @returns {object} Mongoose population object ({ path, select, populate }).
 */
// exports.populationSettings = function (fieldName, whoIsDemanding) {
//     const object = {}; // Removed extra 'const'

//     // Populate fields based on who is demanding
//     if (whoIsDemanding === 'USER') {
        
//         object.path = fieldName;
//         object.select = 'currentBalance '; // Added potential fields
//         object.populate = [
//             AgreementHelpers.populationSettings('agreement', 'USER'), // Populate agreement with specific fields,
//             servicePopulation
//         ];
//     }
//     // Add other 'whoIsDemanding' cases if needed


//     // Define population based on who is demanding
//     if (whoIsDemanding === 'USER' || whoIsDemanding === 'ADMIN') {
//         // Select fields suitable for users/admins
//         populationObject.select = 'name description balance targetAmount startDate endDate condominium createdAt updatedAt';

//         // Define nested populations if needed (e.g., for the condominium)
//         if (CondominiumHelper && typeof CondominiumHelper.populationSettings === 'function') {
//             const condominiumPopulation = CondominiumHelper.populationSettings('condominium', whoIsDemanding);
//             populationObject.populate.push(condominiumPopulation);
//         }

//         // Optionally populate related transactions/contributions, but be mindful of performance
//         // if (whoIsDemanding === 'ADMIN' && TransactionsHelper) {
//         //     const transactionsPopulation = TransactionsHelper.populationSettings('transactions', whoIsDemanding); // Assuming 'transactions' is the field name
//         //     populationObject.populate.push(transactionsPopulation);
//         //     populationObject.select += ' transactions'; // Add transactions to select if populating
//         // }
//     }
//     // Add other 'whoIsDemanding' cases if needed
//     /* else if (whoIsDemanding === 'SYSTEM') {
//         populationObject.select = 'name balance condominium';
//         populationObject.populate = [
//              { path: 'condominium', select: '_id' } // Just the ID
//         ];
//     } */

//     return object;
// };

/**
 * Helper to format a ReserveFund object for API responses or other uses.
 * Ensures consistent structure and can adapt based on perspective.
 *
 * @param {object} reserveFund - The Mongoose document or plain object representing a reserve fund.
 * @param {string} [perspective='USER'] - The perspective for formatting (e.g., 'USER', 'ADMIN'). Controls which fields might be included.
 * @returns {object | null} Formatted reserve fund object, or null if input is invalid.
 */
// exports.formatReserveFund = function(reserveFund, perspective = 'USER') {
//     if (!reserveFund) {
//         return null;
//     }

//     // Use toJSON if available (Mongoose object), otherwise handle plain object
//     let baseObject;
//     if (typeof reserveFund.toJSON === 'function') {
//         baseObject = reserveFund.toJSON(); // Uses the model's toJSON method
//     } else {
//         // Handle plain JS object, ensure id is derived from _id if present
//         const { _id, ...rest } = reserveFund;
//         baseObject = { id: _id?.toString() || reserveFund.id, ...rest };
//     }

//      // Start with core fields available to most perspectives
//     const formatted = {
//         id: baseObject.id,
//         name: baseObject.name,
//         description: baseObject.description,
//         balance: baseObject.balance,
//         targetAmount: baseObject.targetAmount,
//         startDate: baseObject.startDate,
//         endDate: baseObject.endDate,
//         // Handle populated vs. non-populated fields gracefully
//         condominium: baseObject.condominium, // Might be an object (populated) or just an ID string
//         createdAt: baseObject.createdAt,
//         updatedAt: baseObject.updatedAt,
//     };

//     // --- Perspective-based adjustments ---

//     // Example: Admins might see additional sensitive fields if any exist
//     // if (perspective === 'ADMIN' && baseObject.someAdminOnlyField) {
//     //      formatted.someAdminOnlyField = baseObject.someAdminOnlyField;
//     // }

//     // Ensure nested condominium object is handled correctly
//     if (formatted.condominium && typeof formatted.condominium === 'object' && !formatted.condominium.id) {
//        // If it's an object but lacks 'id', it might be just the ObjectId; convert to string
//        formatted.condominium = formatted.condominium.toString();
//     } else if (formatted.condominium && typeof formatted.condominium !== 'object') {
//         // Ensure it's a string if it's not an object (likely already an ID)
//         formatted.condominium = formatted.condominium.toString();
//     }
//     // If condominium is a populated object, we assume its toJSON method handled its formatting.


//     // Remove fields not needed for a specific perspective if necessary
//     // if (perspective === 'LIMITED_VIEW') {
//     //    delete formatted.createdAt;
//     //    delete formatted.updatedAt;
//     //    delete formatted.targetAmount;
//     // }

//     return formatted;
// };

// --- Potential Additional Helpers ---

/**
 * Calculates the remaining amount needed to reach the target for a reserve fund.
 *
 * @param {object} reserveFund - The reserve fund object (should have balance and targetAmount).
 * @returns {number | null} The remaining amount, or null if data is missing.
 */
/*
exports.calculateRemainingTarget = function(reserveFund) {
    if (reserveFund && typeof reserveFund.balance === 'number' && typeof reserveFund.targetAmount === 'number') {
        return Math.max(0, reserveFund.targetAmount - reserveFund.balance);
    }
    return null;
};
*/

/**
 * Checks if a reserve fund is considered active based on its dates.
 * (Assumes null/undefined dates mean it's indefinitely active in that direction)
 *
 * @param {object} reserveFund - The reserve fund object (should have startDate and endDate).
 * @param {Date} [checkDate=new Date()] - The date to check against (defaults to now).
 * @returns {boolean} True if the fund is active on the checkDate, false otherwise.
 */
/*
exports.isReserveFundActive = function(reserveFund, checkDate = new Date()) {
    if (!reserveFund) {
        return false;
    }
    const start = reserveFund.startDate ? new Date(reserveFund.startDate) : null;
    const end = reserveFund.endDate ? new Date(reserveFund.endDate) : null;

    const isActive =
        (!start || checkDate >= start) &&
        (!end || checkDate <= end);

    return isActive;
};
*/

