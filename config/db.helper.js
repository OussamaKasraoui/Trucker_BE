// db.helper.js
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker'); // Using faker for better seed data

// Helpers
const PackHelpers = require('../src/helpers/packs.helper');
const UserHelpers = require('../src/helpers/users.helper');
const PermissionHelpers = require('../src/helpers/permissions.helper');
const RoleHelpers = require('../src/helpers/roles.helper');

// Models (Consider an index file in /models for cleaner imports if many more models are added)
const Agreements = require('../src/models/agreements.model');
const Contracts = require('../src/models/contracts.model');
const Contractors = require('../src/models/contractors.model');
const Emails = require('../src/models/emails.model');
const Notifications = require('../src/models/notifications.model');
const Pack = require('../src/models/packs.model');
const Permissions = require('../src/models/permissions.model');
const Roles = require('../src/models/roles.model');
const Sessions = require('../src/models/sessions.model');
const Staff = require('../src/models/staff.model');
const Tasks = require('../src/models/tasks.model');
const TwoFA = require('../src/models/twoFA.model');
const Users = require('../src/models/users.model');

// --- Initial Data Definitions ---
const permissionsActions = [
  { action: 'create-*',           description: 'Permission to add any resource',                type: ['admin'] },
  { action: 'create-own',         description: 'Permission to add own resources',               type: ['user', 'manager'] },
  { action: 'create-all',         description: 'Permission to add all resources',               type: ['admin', 'manager'] },
  { action: 'create-allowed',     description: 'Permission to add allowed resources',           type: ['manager'] },
  { action: 'create-shared',      description: 'Permission to add shared resources',            type: ['manager', 'user'] },
  { action: 'create-public',      description: 'Permission to add public resources',            type: ['user'] },
  { action: 'create-hierarchy',   description: 'Permission to create hierarchical resources',   type: ['admin'] },
  { action: 'create-logs',        description: 'Permission to create logs',                     type: ['admin', 'manager'] },

  { action: 'read-*',             description: 'Permission to view any resource',               type: ['admin'] },
  { action: 'read-own',           description: 'Permission to view own resources',              type: ['user', 'manager'] },
  { action: 'read-all',           description: 'Permission to view all resources',              type: ['admin', 'manager'] },
  { action: 'read-allowed',       description: 'Permission to view allowed resources',          type: ['manager'] },
  { action: 'read-shared',        description: 'Permission to view shared resources',           type: ['manager', 'user'] },
  { action: 'read-public',        description: 'Permission to view public resources',           type: ['user'] },
  { action: 'read-hierarchy',     description: 'Permission to view hierarchical resources',     type: ['admin'] },
  { action: 'read-logs',          description: 'Permission to view logs',                       type: ['admin', 'manager'] },

  { action: 'update-*',           description: 'Permission to modify any resource',             type: ['admin'] },
  { action: 'update-own',         description: 'Permission to modify own resources',            type: ['user', 'manager'] },
  { action: 'update-all',         description: 'Permission to modify all resources',            type: ['admin', 'manager'] },
  { action: 'update-allowed',     description: 'Permission to modify allowed resources',        type: ['manager'] },
  { action: 'update-shared',      description: 'Permission to modify shared resources',         type: ['manager', 'user'] },
  { action: 'update-public',      description: 'Permission to modify public resources',         type: ['user'] },
  { action: 'update-hierarchy',   description: 'Permission to modify hierarchical resources',   type: ['admin'] },
  { action: 'update-logs',        description: 'Permission to modify logs',                     type: ['admin', 'manager'] },

  { action: 'delete-*',           description: 'Permission to remove any resource',             type: ['admin'] },
  { action: 'delete-own',         description: 'Permission to remove own resources',            type: ['user', 'manager'] },
  { action: 'delete-all',         description: 'Permission to remove all resources',            type: ['admin', 'manager'] },
  { action: 'delete-allowed',     description: 'Permission to remove allowed resources',        type: ['manager'] },
  { action: 'delete-shared',      description: 'Permission to remove shared resources',         type: ['manager', 'user'] },
  { action: 'delete-public',      description: 'Permission to remove public resources',         type: ['user'] },
  { action: 'delete-hierarchy',   description: 'Permission to remove hierarchical resources',   type: ['admin'] },
  { action: 'delete-logs',        description: 'Permission to remove logs',                     type: ['admin', 'manager'] },

  { action: 'list-*',             description: 'Permission to list any resources',              type: ['admin'] },
  { action: 'list-own',           description: 'Permission to list own resources',              type: ['user', 'manager'] },
  { action: 'list-all',           description: 'Permission to list all resources',              type: ['admin', 'manager'] },
  { action: 'list-allowed',       description: 'Permission to list allowed resources',          type: ['manager'] },
  { action: 'list-shared',        description: 'Permission to list shared resources',           type: ['manager', 'user'] },
  { action: 'list-public',        description: 'Permission to list public resources',           type: ['user'] },
  { action: 'list-hierarchy',     description: 'Permission to list hierarchical resources',     type: ['admin'] },
  { action: 'list-logs',          description: 'Permission to list logs',                       type: ['admin', 'manager'] },

  { action: 'export-*',           description: 'Permission to export any data or reports',      type: ['admin'] },
  { action: 'export-own',         description: 'Permission to export own data',                 type: ['user', 'manager'] },
  { action: 'export-all',         description: 'Permission to export all data',                 type: ['admin', 'manager'] },
  { action: 'export-allowed',     description: 'Permission to export allowed data',             type: ['manager'] },
  { action: 'export-shared',      description: 'Permission to export shared data',              type: ['manager', 'user'] },
  { action: 'export-public',      description: 'Permission to export public data',              type: ['user'] },
  { action: 'export-hierarchy',   description: 'Permission to export hierarchical data',        type: ['admin'] },
  { action: 'export-logs',        description: 'Permission to export logs',                     type: ['admin', 'manager'] },

  { action: 'import-*',           description: 'Permission to import any data into the system', type: ['admin'] },
  { action: 'import-own',         description: 'Permission to import own data',                 type: ['user', 'manager'] },
  { action: 'import-all',         description: 'Permission to import all data',                 type: ['admin', 'manager'] },
  { action: 'import-allowed',     description: 'Permission to import allowed data',             type: ['manager'] },
  { action: 'import-shared',      description: 'Permission to import shared data',              type: ['manager', 'user'] },
  { action: 'import-public',      description: 'Permission to import public data',              type: ['user'] },
  { action: 'import-hierarchy',   description: 'Permission to import hierarchical data',        type: ['admin'] },
  { action: 'import-logs',        description: 'Permission to import logs',                     type: ['admin', 'manager'] },

  { action: 'approve-*',          description: 'Permission to approve any request or change',   type: ['admin'] },
  { action: 'approve-own',        description: 'Permission to approve own requests',            type: ['user', 'manager'] },
  { action: 'approve-all',        description: 'Permission to approve all requests',            type: ['admin', 'manager'] },
  { action: 'approve-allowed',    description: 'Permission to approve allowed requests',        type: ['manager'] },
  { action: 'approve-shared',     description: 'Permission to approve shared requests',         type: ['manager', 'user'] },
  { action: 'approve-public',     description: 'Permission to approve public requests',         type: ['user'] },
  { action: 'approve-hierarchy',  description: 'Permission to approve hierarchical requests',   type: ['admin'] },
  { action: 'approve-logs',       description: 'Permission to approve logs',                    type: ['admin', 'manager'] },
];

// --- Helper Functions for Seeding ---

/**
 * @function permissionsGenerator
 * @description Generates permission objects based on contexts and predefined actions.
 * @param {object} org - The organization context (e.g., { id, name, type }).
 * @param {string[]} contexts - Array of context strings (e.g., ['users', 'sites']).
 * @param {object[]} actions - Array of permission action definitions.
 * @returns {object[]} Array of permission objects to be created.
 */
function permissionsGenerator(org, contexts, actions) {
  const permissions = [];
  contexts.forEach((context) => {
    actions.forEach((action) => {
      // Generate the unique payload string first
      const uniquePayload = `${context}:${action.action}`;
      permissions.push({
        // Use the unique payload as the permissionName to avoid duplicates
        permissionName: uniquePayload,
        permissionDescription: action.description,
        permissionRoles: action.type, // Maps to role types initially
        // permissionOrganization: org.id, // Uncomment if needed
        // permissionOrganizationType: org.type, // Uncomment if needed
        permissionContext: context,
        permissionAction: action.action,
        // Keep the permissionPayload field as well
        permissionPayload: uniquePayload,
      });
    });
  });
  return permissions;
}

/**
 * @async
 * @function createInitialPacks
 * @description Creates the initial set of Packs if they don't exist.
 * @returns {Promise<object[]>} Promise resolving to the created pack objects.
 * @throws {Error} If pack creation fails.
 */
const createInitialPacks = async () => {
  console.log("Step 1: Creating Initial Packs...");
  const result = await PackHelpers.create(PackHelpers.initPacks);
  if (result.error || !result.payload) {
      throw new Error(`Failed to create initial packs: ${JSON.stringify(result.payload)}`);
  }
  console.log(`Created ${result.payload.length} initial packs.`);
  return result.payload.map(pack => {
    return pack.populateAndTransform ? pack.populateAndTransform('ADMIN') : pack.toJSON('ADMIN');
  });
};

/**
 * @async
 * @function createInitialPermissions
 * @description Creates permissions for a specific pack.
 * @param {object[]} packs - Array of existing pack objects.
 * @param {string} packName - The name of the pack to create permissions for.
 * @returns {Promise<[object[], object]>} Promise resolving to [created permissions, selected pack].
 * @throws {Error} If the specified pack is not found or permission creation fails.
 */
const createInitialPermissions = async (packs, packName) => {
  console.log(`Step 2: Creating Initial Permissions for '${packName}' Pack...`);
  const selectedPack = packs.find(pack => {
    return  pack.packName === packName || pack.name === packName
  });
  if (!selectedPack) {
    throw new Error(`'${packName}' pack not found during permission creation!`);
  }

  const permissionsToCreate = permissionsGenerator(
    { id: selectedPack.id, name: selectedPack.name, type: "packs" },
    selectedPack.packContexts,
    permissionsActions
  );

  const result = await PermissionHelpers.create(permissionsToCreate);
  if (result.error || !result.payload) {
      throw new Error(`Failed to create permissions for '${packName}': ${JSON.stringify(result.payload)}`);
  }
  console.log(`Created ${result.payload.length} permissions for '${packName}'.`);
  return [result.payload, selectedPack];
};

/**
 * @async
 * @function createAdminUser
 * @description Creates the initial administrative user.
 * @param {object[]} packs - Array of existing pack objects.
 * @returns {Promise<object>} Promise resolving to the created admin user's composite data object (user, contractor, staff, contract).
 * @throws {Error} If the Administrator pack is not found or user creation fails.
 */
const createAdminUser = async (packs) => {
    console.log("Step 3: Creating Initial Admin User...");
    const adminPack = packs.find(pack => pack.packName === 'Administrator');
    if (!adminPack) {
        throw new Error("Administrator pack not found for admin user creation!");
    }

    const adminUserData = [{
        userFirstName: "admin",
        userLastName: "root",
        userAddress: "Local Site 00 City 99",
        userPhone: "0666778899",
        userEmail: "admin@root.local",
        userPassword: 'admin123', // Consider using an env variable for default password
        userPack: adminPack.id,
        userStatus: "Active",
    }];

    const result = await UserHelpers.create(adminUserData);

    // Add more robust checking
    if (result.error || !result.payload || result.payload.length === 0 || !result.payload[0].data || !result.payload[0].data.userCreation || result.payload[0].data.userCreation.length === 0) {
        throw new Error(`Failed to create admin user: ${JSON.stringify(result.payload || result.error)}`);
    }

    console.log(`Created admin user: ${result.payload[0].data.userCreation[0].userEmail}`);
    // Return the composite data object for the admin
    return result.payload[0].data;
};


/**
 * @async
 * @function createInitialRoles
 * @description Creates the initial ADMIN, MANAGER, USER roles based on permissions, matching the original assignment logic.
 * @param {object[]} permissions - Array of created permission objects (must include 'id' and 'permissionPayload').
 * @param {object} selectedPack - The pack object these roles belong to (must include 'id').
 * @param {object} adminCompositeData - The composite data object for the admin user (containing contractor ID).
 * @returns {Promise<object[]>} Promise resolving to the created role objects.
 * @throws {Error} If role creation fails, admin contractor ID is missing, or input is invalid.
 */
const createInitialRoles = async (permissions, selectedPack, adminCompositeData) => {
  console.log("Step 4: Creating Initial Roles...");

  // --- Input Validation ---
  if (!Array.isArray(permissions) || permissions.length === 0) {
    throw new Error("Invalid or empty permissions array provided for role creation.");
  }
  if (!selectedPack || !selectedPack.id) {
    throw new Error("Invalid selectedPack object provided for role creation.");
  }
  // Ensure admin contractor data is available (more robust check)
  const adminContractorId = adminCompositeData?.contractorCreation?.[0]?.id;
  if (!adminContractorId) {
      throw new Error("Admin contractor ID not found or invalid in adminCompositeData for role creation.");
  }
  // --- End Input Validation ---

  const rolesPermissions = { ADMIN: [], MANAGER: [], USER: [] };

  // --- Permission Categorization (Old Logic) ---
  permissions.forEach(permission => {
    // Validate each permission object minimally
    if (!permission || !permission.id || typeof permission.permissionPayload !== 'string') {
        console.warn(`Skipping invalid permission object during role creation: ${JSON.stringify(permission)}`);
        return; // Skip this invalid permission
    }

    // Assign to ADMIN if payload includes "-*"
    if (permission.permissionPayload.includes("-*")) {
      rolesPermissions.ADMIN.push(permission.id);
    }
    // Assign to MANAGER if payload includes "-allowed"
    if (permission.permissionPayload.includes("-allowed")) {
      rolesPermissions.MANAGER.push(permission.id);
    }
    // Assign to USER if payload includes "-own"
    if (permission.permissionPayload.includes("-own")) {
      rolesPermissions.USER.push(permission.id);
    }
    // Note: A permission could potentially belong to multiple roles based on this logic,
    // e.g., if a payload was "context:action-allowed-own", it would go to both MANAGER and USER.
    // This matches the implicit behavior of the separate 'if' statements in the old code.
  });
  // --- End Permission Categorization ---


  // --- Role Definition ---
  const initialRolesData = ["ADMIN", "MANAGER", "USER"].map(roleName => ({
    roleOrganization: selectedPack.id,
    roleOrganizationType: "Packs", // Ensure consistency (e.g., always uppercase 'Packs')
    roleName,
    roleStatus: "Active",
    roleType: "Basic", // Or derive from somewhere if needed
    rolePermissions: rolesPermissions[roleName], // Assign categorized permissions
    roleContractor: adminContractorId, // Use the validated contractor ID
  }));
  // --- End Role Definition ---

  // --- Role Creation ---
  try {
    const result = await RoleHelpers.create(initialRolesData);
    // Check the result structure from your RoleHelpers.create function
    if (result.error || !result.payload) {
        // Use the error payload if available, otherwise stringify the whole result
        const errorMessage = result.payload ? JSON.stringify(result.payload) : JSON.stringify(result);
        throw new Error(`Failed to create initial roles: ${errorMessage}`);
    }
    console.log(`Created ${result.payload.length} initial roles (ADMIN, MANAGER, USER).`);
    // Extract the actual role documents from the results array
    const createdRoles = result.payload.map(res => res.data);
    return createdRoles; // Return the array of created role documents
  } catch (error) {
      // Catch errors from RoleHelpers.create or the throw statements above
      console.error(`Error during initial role creation: ${error.message}`);
      console.error(error.stack); // Log stack for better debugging
      // Re-throw the original error or a new one wrapping it
      throw new Error(`Initial role creation failed: ${error.message}`);
  }
  // --- End Role Creation ---
};

// --- Main Seeding Orchestration ---

/**
 * @async
 * @function createInitialData
 * @description Orchestrates the creation of essential initial data (Packs, Admin, Permissions, Roles).
 * @returns {Promise<{initPacks: object[], initPermissions: object[], initAdminData: object, initRoles: object[], selectedPack: object}>} Object containing results of initial seeding.
 * @throws {Error} If any step of the initial data creation fails.
 */
const createInitialData = async () => {
  console.log("\n--- Starting Initial Data Creation ---");
  try {
    const initPacks = await createInitialPacks();

    const [initPermissions, selectedPack] = await createInitialPermissions(initPacks, "Administrator");

    const initAdminData = await createAdminUser(initPacks); // Create admin first to get contractor ID

    const initRoles = await createInitialRoles(initPermissions, selectedPack, initAdminData);

    // Assign the ADMIN role to the initial admin user's staff record
    const adminRole = initRoles.find(role => role.roleName === 'ADMIN');
    if (adminRole && initAdminData?.staffCreation?.[0]?.id) {
        try {
            await Staff.findByIdAndUpdate(initAdminData.staffCreation[0].id, { $addToSet: { staffRoles: adminRole._id } });
            console.log(`Assigned ADMIN role to initial admin staff.`);
        } catch (roleAssignError) {
            console.warn(`Warning: Could not assign ADMIN role to initial admin staff: ${roleAssignError.message}`);
        }
    } else {
        console.warn("Warning: Could not find ADMIN role or admin staff record to assign role.");
    }


    console.log("--- Initial Data Creation Successful ---");
    return { initPacks, initPermissions, initAdminData, initRoles, selectedPack };

  } catch (error) {
    console.error(`Error during initial data creation: ${error.message}`);
    console.error(error.stack); // Log stack for debugging
    throw error; // Re-throw to be caught by the caller (initializeDatabase)
  }
};

/**
 * @async
 * @function populateDatabaseWithSampleData
 * @description Populates the database with extensive sample data for testing/demonstration.
 * @param {string} packId - The ID of the pack to associate data with.
 * @param {object} adminUserData - The user object for the admin (used for referencing).
 * @returns {Promise<void>}
 */
// const populateDatabaseWithSampleData = async (packId, adminUserData) => {
//   console.log("\n--- Starting Database Population with Sample Data ---");
//   if (!packId || !adminUserData || !adminUserData.id) {
//       console.warn("Skipping sample data population: Missing packId or adminUserData.");
//       return;
//   }

//   try {
//     // 1. Create Users (using faker)
//     console.log("Creating Sample Users...");
//     const usersData = Array.from({ length: 5 }).map((item, index) => ({
//       userFirstName: faker.person.firstName(),
//       userLastName: faker.person.lastName(),
//       userAddress: faker.location.streetAddress(),
//       userPhone: faker.phone.number(),
//       userEmail: `user${index + 1}@email.com`,//faker.internet.email({ provider: 'sample.local' }), // Unique emails
//       userPassword: "password123", // Use env var ideally
//       userPack: packId,
//       userStatus: "Active",
//       // userRef: { // Reference the admin user who initiated seeding
//       //   referrer: adminUserData.id,
//       //   reference: {
//       //     id: adminUserData.id,
//       //     name: `${adminUserData.userFirstName} ${adminUserData.userLastName}`,
//       //     type: "User"
//       //   }
//       // },
//       userRoles: [] // Assign roles later if needed
//     }));

//     // --- Add Log Here ---
//     console.log('[PopulateDB] Sample users data before creation:', JSON.stringify(usersData, null, 2));
//     // --- End Log ---

//     const usersCreationResults = await UserHelpers.create(usersData);
//     if (usersCreationResults.error || !usersCreationResults.payload) {
//       throw new Error(`Error creating sample users: ${JSON.stringify(usersCreationResults.payload)}`);
//     }
//     // Extract the composite data for each created user
//     const createdUsersComposite = usersCreationResults.payload.map(result => result.data);
//     console.log(`Created ${createdUsersComposite.length} sample users.`);

//     // Helper to safely get IDs/Objects
//     const getUserData = (index) => {
//         if (index < 0 || index >= createdUsersComposite.length || !createdUsersComposite[index]) return null;
//         const composite = createdUsersComposite[index];
//         return {
//             user: composite.userCreation?.[0],
//             contractor: composite.contractorCreation?.[0],
//             staff: composite.staffCreation?.[0],
//             contract: composite.contractCreation?.[0],
//         };
//     };

//     // --- Create dependent data ---
//     // Keep track of created items to link them
//     const createdSites = [];
//     const createdBuildings = [];
//     const createdApartments = [];
//     const createdServices = [];
//     const createdAgreements = [];
//     const createdOwnershipShares = [];
//     const createdReserveFunds = [];
//     const createdMissions = [];
//     const createdTasks = [];
//     const createdServiceRequests = [];
//     const createdDevis = [];
//     const createdPartiesCommunes = [];
//     const createdVotes = [];
//     const createdCotisations = [];
//     const createdDepenses = [];
//     // ... and so on

//     // 2. Create Sites (Example: 2 sites for the first user's contract)
//     console.log("\nCreating Sample Sites...");
//     const user0Data = getUserData(0);
//     if (user0Data?.contract) {
//         for (let j = 0; j < 2; j++) {
//             try {
//                 const site = await Sites.create({
//                     siteName: faker.company.name() + ` Site ${j + 1}`,
//                     siteDetails: faker.lorem.sentence(),
//                     siteAddress: faker.location.streetAddress(),
//                     siteCity: faker.location.city(),
//                     siteType: faker.helpers.arrayElement(["Simple", "Complex"]),
//                     siteStatus: "Active",
//                     sitePrefix: `ST-${j + 1}`,
//                     siteContract: user0Data.contract._id, // Link to user's contract
//                 });
//                 createdSites.push(site);
//                 console.log(`Created site: ${site.siteName} (Contract: ${user0Data.contract._id})`);
//             } catch(err) { console.error(`Error creating site ${j+1}: ${err.message}`); }
//         }
//     } else { console.warn("Skipping site creation: User 0 data or contract missing."); }

//     // 3. Create Buildings (Example: 3 per site)
//     console.log("\nCreating Sample Buildings...");
//     for (const site of createdSites) {
//         for (let i = 0; i < 3; i++) {
//              try {
//                 const building = await Buildings.create({
//                     buildingName: `Building ${faker.word.noun()} ${i + 1}`,
//                     buildingAddress: faker.location.secondaryAddress(), // e.g., Apt. 123
//                     buildingPrefix: `BLD-${site.sitePrefix}-${i + 1}`,
//                     buildingFloors: faker.number.int({ min: 2, max: 10 }),
//                     buildingAptPerFloor: faker.number.int({ min: 2, max: 6 }),
//                     buildingSite: site._id,
//                     buildingContract: site.siteContract,
//                     buildingStatus: "Active",
//                 });
//                 createdBuildings.push(building);
//                 console.log(`Created building: ${building.buildingName} (Site: ${site.siteName})`);
//              } catch(err) { console.error(`Error creating building ${i+1} for site ${site.siteName}: ${err.message}`); }
//         }
//     }

//     // 4. Create Apartments (Example: 5 per building, assign owners/users round-robin)
//     console.log("\nCreating Sample Apartments...");
//     let userIndex = 0;
//     for (const building of createdBuildings) {
//         for (let i = 0; i < 5; i++) {
//             const ownerData = getUserData(userIndex % createdUsersComposite.length);
//             const tenantData = getUserData((userIndex + 1) % createdUsersComposite.length); // Example: next user is tenant
//             if (ownerData?.user && tenantData?.user) {
//                  try {
//                     const ownershipPercentage = 100 / 5; // Simple equal distribution for example
//                     const apartment = await Apartments.create({
//                         apartmentNumber: `${building.buildingFloors > i ? i + 1 : 1}0${i % 4 + 1}`, // Example numbering
//                         apartmentEtage: building.buildingFloors > i ? i + 1 : 1,
//                         apartmentType: faker.helpers.arrayElement(["Rental", "Property"]),
//                         apartmentStatus: faker.helpers.arrayElement(["Active", "Inactive", "Suspended"]),
//                         apartmentOwner: ownerData.user._id,
//                         apartmentUser: tenantData.user._id, // Could be same as owner
//                         apartmentBuilding: building._id,
//                         apartmentSite: building.buildingSite,
//                         apartmentContract: building.buildingContract,
//                         ownershipPercentage: ownershipPercentage, // Assign calculated percentage
//                         commonAreasContribution: ownershipPercentage * 10, // Example calculation
//                     });
//                     createdApartments.push(apartment);
//                     console.log(`Created apartment: ${apartment.apartmentNumber} (Building: ${building.buildingName}, Owner: ${ownerData.user.userEmail})`);
//                     userIndex++;
//                  } catch(err) { console.error(`Error creating apartment ${i+1} for building ${building.buildingName}: ${err.message}`); }
//             } else { console.warn(`Skipping apartment creation for building ${building.buildingName}: Missing owner/tenant data.`); }
//         }
//     }

//     // 5. Create Services (Example: 2 per user/contractor)
//     console.log("\nCreating Sample Services...");
//      for (let i = 0; i < createdUsersComposite.length; i++) {
//         const userData = getUserData(i);
//         if (userData?.contractor) {
//             for (let j = 0; j < 2; j++) {
//                  try {
//                     const service = await Services.create({
//                         servicesProvider: userData.contractor._id,
//                         servicesName: faker.commerce.productName() + ` Service ${j+1}`,
//                         servicesType: faker.commerce.department(),
//                         servicesCost: faker.commerce.price({ min: 50, max: 500 }),
//                         description: faker.lorem.sentence(),
//                     });
//                     createdServices.push(service);
//                     console.log(`Created service: ${service.servicesName} (Provider: ${userData.contractor.contractorTitle})`);
//                  } catch(err) { console.error(`Error creating service ${j+1} for contractor ${userData.contractor.contractorTitle}: ${err.message}`); }
//             }
//         } else { console.warn(`Skipping service creation for user index ${i}: Missing contractor data.`); }
//      }

//     // 6. Create Agreements (Example: 1 per site)
//     console.log("\nCreating Sample Agreements...");
//     for (const site of createdSites) {
//         const contractorData = getUserData(createdSites.indexOf(site) % createdUsersComposite.length); // Assign a contractor
//         const staffData = getUserData((createdSites.indexOf(site) + 1) % createdUsersComposite.length); // Assign staff members
//         if (contractorData?.contractor && staffData?.staff) {
//             try {
//                 const agreement = await Agreements.create({
//                     agreementContract: site.siteContract,
//                     agreementSite: site._id,
//                     agreementContractor: [contractorData.contractor._id],
//                     agreementTerm: faker.helpers.arrayElement(['half-yearly', 'quarterly', 'annually']),
//                     agreementStart: faker.date.past({ years: 1 }),
//                     agreementEnd: faker.date.future({ years: 1 }),
//                     agreementBoardMembers: {
//                         syndic: staffData.staff._id, // Assign staff as board members
//                         adjoint: getUserData((createdSites.indexOf(site) + 2) % createdUsersComposite.length)?.staff?._id,
//                         tresorier: getUserData((createdSites.indexOf(site) + 3) % createdUsersComposite.length)?.staff?._id,
//                         members: [getUserData((createdSites.indexOf(site) + 4) % createdUsersComposite.length)?.staff?._id].filter(id => id), // Ensure no nulls
//                     },
//                     agreementServicesIncluded: faker.datatype.boolean(),
//                     agreementServices: faker.helpers.arrayElements(createdServices.map(s => s._id), faker.number.int({ min: 0, max: 3 })), // Link 0-3 random services
//                     agreementBudget: faker.finance.amount({ min: 5000, max: 50000 }),
//                     agreementStatus: true, // Active
//                     reserveFundSettings: { contributionRate: faker.number.int({ min: 1, max: 10 }), minBalance: faker.number.int({ min: 0, max: 1000 }) },
//                     quorumRules: { ordinary: faker.number.int({ min: 40, max: 60 }), extraordinary: faker.number.int({ min: 65, max: 85 }) },
//                 });
//                 createdAgreements.push(agreement);
//                 console.log(`Created agreement: ${agreement._id} (Site: ${site.siteName})`);
//             } catch (err) { console.error(`Error creating agreement for site ${site.siteName}: ${err.message}`); }
//         } else { console.warn(`Skipping agreement creation for site ${site.siteName}: Missing contractor/staff data.`); }
//     }

//     // 7. Create OwnershipShares (One per apartment, linked to owner)
//     console.log("\nCreating Sample OwnershipShares...");
//     for (const apartment of createdApartments) {
//         if (apartment.apartmentOwner) {
//             try {
//                 const share = await OwnershipShares.create({
//                     apartment: apartment._id,
//                     owner: apartment.apartmentOwner,
//                     percentage: apartment.ownershipPercentage, // Use percentage from apartment
//                     effectiveDate: apartment.createdAt, // Start date from apartment creation
//                     endDate: null, // Current share
//                     historicalVersions: [],
//                 });
//                 createdOwnershipShares.push(share);
//                 console.log(`Created ownership share for Apartment ${apartment.apartmentNumber} (Owner: ${apartment.apartmentOwner})`);
//             } catch (err) { console.error(`Error creating ownership share for apartment ${apartment.apartmentNumber}: ${err.message}`); }
//         } else { console.warn(`Skipping ownership share creation for apartment ${apartment.apartmentNumber}: Missing owner.`); }
//     }

//     // 8. Create Cotisations (Example: 1 per ownership share)
//     console.log("\nCreating Sample Cotisations...");
//     for (const share of createdOwnershipShares) {
//         const apartment = createdApartments.find(a => a._id.equals(share.apartment));
//         if (apartment) {
//             try {
//                 const totalAmount = faker.finance.amount({ min: 50, max: 200 });
//                 const reserveAmount = totalAmount * 0.1; // 10% to reserve
//                 const ordinaryAmount = totalAmount - reserveAmount;
//                 const cotisation = await Cotisations.create({
//                     cotisationType: faker.helpers.arrayElement(['Quarterly Dues', 'Special Assessment']),
//                     cotisationAppartment: share.apartment,
//                     cotisationMoyPaiement: faker.helpers.arrayElement(['Bank Transfer', 'Cash', 'Check']),
//                     cotisationMontant: totalAmount,
//                     cotisationStuff: adminUserData.id, // Recorded by admin
//                     cotisationMotif: faker.lorem.sentence(),
//                     paymentStatus: faker.helpers.arrayElement(['Pending', 'Paid', 'Overdue']),
//                     dueDate: faker.date.future(),
//                     breakdown: {
//                         ordinary: ordinaryAmount,
//                         extraordinary: 0,
//                         reserve: reserveAmount,
//                     },
//                     ownershipShare: share._id,
//                 });
//                 createdCotisations.push(cotisation);
//                 console.log(`Created cotisation for Apartment ${apartment.apartmentNumber} (Share: ${share._id})`);
//             } catch (err) { console.error(`Error creating cotisation for share ${share._id}: ${err.message}`); }
//         } else { console.warn(`Skipping cotisation creation for share ${share._id}: Corresponding apartment not found.`); }
//     }

//     // 9. Create ReserveFunds (One per agreement)
//     console.log("\nCreating Sample ReserveFunds...");
//     for (const agreement of createdAgreements) {
//         try {
//             // Add some initial contribution transactions based on created cotisations
//             const relatedCotisations = createdCotisations.filter(c => {
//                 const share = createdOwnershipShares.find(s => s._id.equals(c.ownershipShare));
//                 const apartment = share ? createdApartments.find(a => a._id.equals(share.apartment)) : null;
//                 return apartment && apartment.apartmentSite.equals(agreement.agreementSite);
//             });

//             const transactions = relatedCotisations.map(cot => ({
//                 type: 'Contribution',
//                 amount: cot.breakdown.reserve,
//                 reference: cot._id,
//                 refModel: 'Cotisations',
//                 date: cot.createdAt,
//                 description: `Initial contribution from Cotisation ${cot._id}`
//             }));

//             const reserveFund = await ReserveFunds.create({
//                 agreement: agreement._id,
//                 currentBalance: 0, // Balance will be calculated by pre-save hook
//                 transactions: transactions,
//             });
//             createdReserveFunds.push(reserveFund);
//             console.log(`Created reserve fund for Agreement ${agreement._id} with ${transactions.length} initial transactions.`);
//         } catch (err) { console.error(`Error creating reserve fund for agreement ${agreement._id}: ${err.message}`); }
//     }

//     // 10. Create Missions (Example: 1 per site)
//     console.log("\nCreating Sample Missions...");
//     for (const site of createdSites) {
//         const contractorData = getUserData(createdSites.indexOf(site) % createdUsersComposite.length);
//         if (contractorData?.contractor) {
//             try {
//                 const mission = await Missions.create({
//                     missionName: `Maintenance Mission ${site.siteName}`,
//                     missionDetails: faker.lorem.paragraph(),
//                     missionType: 'Routine Check',
//                     missionPrice: faker.finance.amount({ min: 100, max: 1000 }),
//                     missionContractor: contractorData.contractor._id,
//                     missionSite: site._id,
//                     missionState: faker.helpers.arrayElement(['Planned', 'InProgress', 'Completed']),
//                 });
//                 createdMissions.push(mission);
//                 console.log(`Created mission: ${mission.missionName} (Site: ${site.siteName})`);
//             } catch (err) { console.error(`Error creating mission for site ${site.siteName}: ${err.message}`); }
//         } else { console.warn(`Skipping mission creation for site ${site.siteName}: Missing contractor data.`); }
//     }

//     // 11. Create Tasks (Example: 2 per mission)
//     console.log("\nCreating Sample Tasks...");
//     for (const mission of createdMissions) {
//         const staffData = getUserData(createdMissions.indexOf(mission) % createdUsersComposite.length);
//         if (staffData?.staff) {
//             for (let i = 0; i < 2; i++) {
//                 try {
//                     const task = await Tasks.create({
//                         taskName: `Task ${i + 1} for ${mission.missionName}`,
//                         taskDetail: faker.lorem.sentence(),
//                         taskType: 'Inspection',
//                         taskStart: faker.date.soon(),
//                         taskEnd: faker.date.soon({ days: 5 }),
//                         taskSeverity: faker.helpers.arrayElement(['Low', 'Medium', 'High']),
//                         taskNotes: [{ note: faker.lorem.sentence(), author: adminUserData.id }],
//                         taskPrice: faker.finance.amount({ min: 20, max: 200 }),
//                         taskStuff: [staffData.staff._id], // Assign staff
//                         taskMission: mission._id,
//                         taskSite: mission.missionSite,
//                         taskState: faker.helpers.arrayElement(['Todo', 'InProgress', 'Done']),
//                         relatedApartment: faker.helpers.arrayElement(createdApartments.filter(a => a.apartmentSite.equals(mission.missionSite)).map(a => a._id)), // Optional link to apartment on same site
//                     });
//                     createdTasks.push(task);
//                     console.log(`Created task: ${task.taskName} (Mission: ${mission.missionName})`);
//                 } catch (err) { console.error(`Error creating task for mission ${mission.missionName}: ${err.message}`); }
//             }
//         } else { console.warn(`Skipping task creation for mission ${mission.missionName}: Missing staff data.`); }
//     }

//     // 12. Create Depenses (Example: 1 per completed task, some from reserve)
//     console.log("\nCreating Sample Depenses...");
//     for (const task of createdTasks.filter(t => t.taskState === 'Done')) {
//         const agreement = createdAgreements.find(a => a.agreementSite.equals(task.taskSite));
//         const contractorData = getUserData(createdTasks.indexOf(task) % createdUsersComposite.length);
//         const reserveFund = agreement ? createdReserveFunds.find(rf => rf.agreement.equals(agreement._id)) : null;
//         const useReserve = faker.datatype.boolean(0.3) && reserveFund; // 30% chance to use reserve if available

//         if (agreement && contractorData?.contractor) {
//             try {
//                 const depense = await Depenses.create({
//                     depenseName: `Expense for ${task.taskName}`,
//                     depenseType: useReserve ? 'Reserve' : faker.helpers.arrayElement(['Ordinary', 'Extraordinary']),
//                     depenseMontant: task.taskPrice || faker.finance.amount({ min: 50, max: 300 }),
//                     depenseDate: task.taskEnd || new Date(),
//                     depenseStuff: adminUserData.id, // Recorded by admin
//                     depenseDocuments: [{ name: 'invoice.pdf', url: faker.internet.url(), type: 'Invoice' }],
//                     depenseBenificiaire: contractorData.contractor._id,
//                     depenseMission: task.taskMission,
//                     depenseTask: task._id,
//                     reserveFundSource: useReserve ? reserveFund._id : null,
//                     agreement: agreement._id,
//                 });
//                 createdDepenses.push(depense);
//                 console.log(`Created depense: ${depense.depenseName} (Task: ${task.taskName})`);

//                 // If it was a reserve withdrawal, add transaction to ReserveFund
//                 if (useReserve) {
//                     reserveFund.transactions.push({
//                         type: 'Withdrawal',
//                         amount: -depense.depenseMontant, // Negative amount for withdrawal
//                         reference: depense._id,
//                         refModel: 'Depenses',
//                         description: `Withdrawal for Depense ${depense._id}`
//                     });
//                     await reserveFund.save(); // Trigger pre-save hook to update balance
//                     console.log(`Added withdrawal transaction to ReserveFund ${reserveFund._id} for Depense ${depense._id}`);
//                 }

//             } catch (err) { console.error(`Error creating depense for task ${task.taskName}: ${err.message}`); }
//         } else { console.warn(`Skipping depense creation for task ${task.taskName}: Missing agreement or contractor data.`); }
//     }

//     // 13. Create ServiceRequests (Example: 1 per site)
//     console.log("\nCreating Sample ServiceRequests...");
//     for (const site of createdSites) {
//         const userData = getUserData(createdSites.indexOf(site) % createdUsersComposite.length);
//         const mission = createdMissions.find(m => m.missionSite.equals(site._id)); // Find a mission on the same site
//         if (userData?.user) {
//             try {
//                 const serviceRequest = await ServiceRequests.create({
//                     serviceRequestUser: userData.user._id,
//                     serviceRequestMission: mission?._id, // Optional link
//                     serviceRequestSite: site._id,
//                     serviceRequestState: faker.helpers.arrayElement(['New', 'Assigned', 'InProgress', 'Completed']),
//                     requestTitle: `Request for ${faker.hacker.verb()} on ${site.siteName}`,
//                     requestDetails: faker.lorem.paragraph(),
//                     assignedContractor: mission?.missionContractor, // Assign contractor from mission if exists
//                 });
//                 createdServiceRequests.push(serviceRequest);
//                 console.log(`Created service request: ${serviceRequest.requestTitle} (Site: ${site.siteName})`);
//             } catch (err) { console.error(`Error creating service request for site ${site.siteName}: ${err.message}`); }
//         } else { console.warn(`Skipping service request creation for site ${site.siteName}: Missing user data.`); }
//     }

//     // 14. Create Devis (Example: 1 per service request)
//     console.log("\nCreating Sample Devis...");
//     for (const request of createdServiceRequests) {
//         try {
//             const devis = await Devis.create({
//                 devisServiceRequest: request._id,
//                 devisPrice: faker.finance.amount({ min: 100, max: 2000 }),
//                 devisState: faker.helpers.arrayElement(['Draft', 'Sent', 'Approved', 'Rejected']),
//                 devisDetails: faker.lorem.sentence(),
//                 validUntil: faker.date.future(),
//             });
//             createdDevis.push(devis);
//             // Link back to service request
//             request.relatedDevis = devis._id;
//             await request.save();
//             console.log(`Created devis ${devis._id} for ServiceRequest ${request._id}`);
//         } catch (err) { console.error(`Error creating devis for service request ${request._id}: ${err.message}`); }
//     }

//     // 15. Create PartiesCommunes (Example: 2 per building)
//     console.log("\nCreating Sample PartiesCommunes...");
//     for (const building of createdBuildings) {
//         const contractorData = getUserData(createdBuildings.indexOf(building) % createdUsersComposite.length);
//         for (let i = 0; i < 2; i++) {
//             try {
//                 const partie = await PartiesCommunes.create({
//                     partiesCommuneName: `${faker.word.adjective()} ${faker.word.noun()} Area ${i + 1}`,
//                     partiesCommuneEtage: faker.number.int({ min: 0, max: building.buildingFloors }),
//                     partiesCommuneType: faker.helpers.arrayElement(['Hallway', 'Staircase', 'Roof', 'Garden', 'Elevator']),
//                     partiesCommuneState: faker.helpers.arrayElement(['Good', 'Fair', 'Poor', 'NeedsRepair']),
//                     partiesCommuneImmeuble: building._id,
//                     partiesCommunePrestataire: contractorData?.contractor?._id, // Optional link to contractor
//                 });
//                 createdPartiesCommunes.push(partie);
//                 console.log(`Created partie commune: ${partie.partiesCommuneName} (Building: ${building.buildingName})`);
//             } catch (err) { console.error(`Error creating partie commune for building ${building.buildingName}: ${err.message}`); }
//         }
//     }

//     // 16. Create Votes (Example: 1 per agreement)
//     console.log("\nCreating Sample Votes...");
//     for (const agreement of createdAgreements) {
//         // Find shares related to this agreement's site
//         const relatedShares = createdOwnershipShares.filter(share => {
//             const apt = createdApartments.find(a => a._id.equals(share.apartment));
//             return apt && apt.apartmentSite.equals(agreement.agreementSite);
//         });

//         if (relatedShares.length > 0) {
//             try {
//                 const vote = await Votes.create({
//                     agreement: agreement._id,
//                     title: `Vote for ${faker.company.catchPhrase()}`,
//                     description: faker.lorem.paragraph(),
//                     type: faker.helpers.arrayElement(['Ordinary', 'Extraordinary']),
//                     decisions: [{ // Example decision
//                         description: `Approve ${faker.commerce.productName()} purchase`,
//                         // Simulate some votes
//                         votesFor: faker.helpers.arrayElements(relatedShares.map(s => ({ share: s._id })), faker.number.int({ min: 0, max: relatedShares.length / 2 })),
//                         votesAgainst: faker.helpers.arrayElements(relatedShares.map(s => ({ share: s._id })), faker.number.int({ min: 0, max: relatedShares.length / 3 })),
//                         abstentions: faker.helpers.arrayElements(relatedShares.map(s => ({ share: s._id })), faker.number.int({ min: 0, max: relatedShares.length / 4 })),
//                     }],
//                     quorumRequired: agreement.quorumRules.ordinary, // Use agreement rules
//                     majorityRequired: 50.1, // Example majority
//                     meetingDate: faker.date.past(),
//                     status: 'Closed',
//                 });
//                 createdVotes.push(vote);
//                 console.log(`Created vote: ${vote.title} (Agreement: ${agreement._id})`);
//             } catch (err) { console.error(`Error creating vote for agreement ${agreement._id}: ${err.message}`); }
//         } else { console.warn(`Skipping vote creation for agreement ${agreement._id}: No related ownership shares found.`); }
//     }

//     // 17. Create Emails (Example: 5 system emails)
//     console.log("\nCreating Sample Emails...");
//     for (let i = 0; i < 5; i++) {
//         const recipientUser = getUserData(i)?.user;
//         if (recipientUser) {
//             try {
//                 await Emails.create({
//                     emailSubject: faker.lorem.sentence(),
//                     emailBody: `<p>${faker.lorem.paragraphs()}</p>`,
//                     emailRecipient: [recipientUser.userEmail],
//                     emailSender: 'system@syndikit.local',
//                     emailStatus: faker.helpers.arrayElement(['sent', 'pending', 'failed']),
//                     emailSentAt: faker.helpers.maybe(() => faker.date.past(), { probability: 0.8 }), // 80% chance it was sent
//                 });
//                 console.log(`Created sample email to ${recipientUser.userEmail}`);
//             } catch (err) { console.error(`Error creating email for user ${recipientUser.userEmail}: ${err.message}`); }
//         }
//     }

//     // 18. Create Notifications (Example: 3 per user)
//     console.log("\nCreating Sample Notifications...");
//     for (let i = 0; i < createdUsersComposite.length; i++) {
//         const userData = getUserData(i);
//         if (userData?.user) {
//             for (let j = 0; j < 3; j++) {
//                 try {
//                     await Notifications.create({
//                         notificationCreator: adminUserData.id, // Admin created notification
//                         notificationTitle: faker.lorem.words(5),
//                         notificationType: faker.helpers.arrayElement(["success", "info", "warning", "error"]),
//                         notificationText: faker.lorem.sentence(),
//                         notificationTarget: [{ targetUser: userData.user._id, targetRead: faker.datatype.boolean(0.5) }], // 50% read
//                         notificationLink: faker.helpers.maybe(() => `/some/link/${faker.string.uuid()}`, { probability: 0.7 }),
//                     });
//                     console.log(`Created notification for user ${userData.user.userEmail}`);
//                 } catch (err) { console.error(`Error creating notification for user ${userData.user.userEmail}: ${err.message}`); }
//             }
//         }
//     }

//     // 19. Create Sessions (Example: 1 active per user)
//     console.log("\nCreating Sample Sessions...");
//     for (let i = 0; i < createdUsersComposite.length; i++) {
//         const userData = getUserData(i);
//         if (userData?.user) {
//             try {
//                 await Sessions.create({
//                     userId: userData.user._id,
//                     ipAddress: faker.internet.ipv4(),
//                     deviceInfo: faker.internet.userAgent(),
//                     status: 'Active',
//                 });
//                 console.log(`Created active session for user ${userData.user.userEmail}`);
//             } catch (err) { console.error(`Error creating session for user ${userData.user.userEmail}: ${err.message}`); }
//         }
//     }

//     // 20. Create TwoFA Records (Example: 1 per user, pending)
//     console.log("\nCreating Sample TwoFA Records...");
//     for (let i = 0; i < createdUsersComposite.length; i++) {
//         const userData = getUserData(i);
//         if (userData?.user) {
//             try {
//                 await TwoFA.create({
//                     twoFAUser: userData.user._id,
//                     twoFAStatus: 'Pending', // Start as pending
//                     twoFAMethod: 'Email',
//                     twoFAPassCode: [], // No codes generated initially
//                 });
//                 console.log(`Created TwoFA record for user ${userData.user.userEmail}`);
//             } catch (err) {
//                 // Handle potential duplicate key error if record already exists
//                 if (err.code !== 11000) {
//                     console.error(`Error creating TwoFA record for user ${userData.user.userEmail}: ${err.message}`);
//                 } else {
//                     console.warn(`TwoFA record already exists for user ${userData.user.userEmail}. Skipping.`);
//                 }
//             }
//         }
//     }


//     console.log("\n--- Database Population with Sample Data Completed ---");
//   } catch (error) {
//     console.error("Error populating database with sample data:", error.message);
//     console.error(error.stack);
//     // Decide if this error should halt the entire application start (throw error)
//     // or just log a warning (don't throw)
//     // throw error; // Optional: re-throw if sample data population failure is critical
//   }
// };


// --- Initialization Logic ---


/**
 * @async
 * @function initializeCollections
 * @description Checks if initial data (Packs) exists. If not, creates essential data
 *              and optionally populates with more sample data based on environment.
 * @returns {Promise<void>}
 * @throws {Error} If essential data creation fails.
 */
async function initializeCollections() {
  try {
    const packCount = await Pack.countDocuments();
    console.log(`Found ${packCount} existing packs.`);

    if (packCount === 0) {
      console.log("No packs found. Proceeding with initial data seeding...");

      // Create essential data (Packs, Admin User, Permissions, Roles)
      const { initAdminData, selectedPack } = await createInitialData();

      console.log("Skipping extensive sample data population (Production environment or missing initial data).");
      /* // Populate with more sample data only in non-production environments (optional)
      if (process.env.NODE_ENV !== 'production' && selectedPack && initAdminData?.userCreation?.[0]) {
         console.log("Non-production environment detected. Populating with additional sample data...");
         // Pass the specific pack ID and the created admin *user* object
         await populateDatabaseWithSampleData(selectedPack.id, initAdminData.userCreation[0]);
      } else {
          console.log("Skipping extensive sample data population (Production environment or missing initial data).");
      } */

      console.log("Database seeding process completed.");

    } else {
      console.log("Initial data (Packs) already exists. Skipping seeding.");
    }
  } catch (error) {
      console.error(`Critical error during database seeding check: ${error.message}`);
      // This error should likely stop the application
      throw new Error(`Database seeding failed: ${error.message}`);
  }
}

/**
 * @async
 * @function connectToDatabase
 * @description Establishes a connection to the MongoDB database.
 * @param {string} dbURL - The MongoDB connection string.
 * @returns {Promise<void>}
 * @throws {Error} If the database connection fails.
 */
async function connectToDatabase(dbURL) {
  try {
    await mongoose.connect(dbURL, {
      // useNewUrlParser: true, // Deprecated
      // useUnifiedTopology: true, // Deprecated
      serverSelectionTimeoutMS: 10000, // Increased timeout
      socketTimeoutMS: 45000
    });
    console.log('Successfully connected to MongoDB');
  } catch (error) {
    console.error('Database connection error:', error.message);
    // Log the specific error type if available
    if (error.name) {
        console.error(`Error type: ${error.name}`);
    }
    throw new Error('Database connection failed'); // Re-throw standardized error
  }
}

module.exports = {
    connectToDatabase,
    initializeCollections // Export renamed function
};