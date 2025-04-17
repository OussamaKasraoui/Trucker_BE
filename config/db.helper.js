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
const populateDatabaseWithSampleData = async (packId, adminUserData) => {
  console.log("\n--- Starting Database Population with Sample Data ---");
  if (!packId || !adminUserData || !adminUserData.id) {
      console.warn("Skipping sample data population: Missing packId or adminUserData.");
      return;
  }

  try {
    // 1. Create Users (using faker)
    console.log("Creating Sample Users...");
    const usersData = Array.from({ length: 5 }).map((item, index) => ({
      userFirstName: faker.person.firstName(),
      userLastName: faker.person.lastName(),
      userAddress: faker.location.streetAddress(),
      userPhone: faker.phone.number(),
      userEmail: faker.internet.email({ provider: 'email.com' }), // Unique emails // `user${index + 1}@email.com`,//
      userPassword: "password123", // Use env var ideally
      userPack: packId,
      userStatus: "Active",
      userRoles: [] // Assign roles later if needed
    }));

    // --- Add Log Here ---
    console.log('[PopulateDB] Sample users data before creation:', JSON.stringify(usersData, null, 2));
    // --- End Log ---

    const usersCreationResults = await UserHelpers.create(usersData);
    if (usersCreationResults.error || !usersCreationResults.payload) {
      throw new Error(`Error creating sample users: ${JSON.stringify(usersCreationResults.payload)}`);
    }
    // Extract the composite data for each created user
    const createdUsersComposite = usersCreationResults.payload.map(result => result.data);
    console.log(`Created ${createdUsersComposite.length} sample users.`);

    // Helper to safely get IDs/Objects
    const getUserData = (index) => {
        if (index < 0 || index >= createdUsersComposite.length || !createdUsersComposite[index]) return null;
        const composite = createdUsersComposite[index];
        return {
            user: composite.userCreation?.[0],
            contractor: composite.contractorCreation?.[0],
            staff: composite.staffCreation?.[0],
            contract: composite.contractCreation?.[0],
        };
    };

    // --- Create dependent data ---
    // Keep track of created items to link them
    const createdAgreements = [];
    const createdTasks = []; 
    // ... and so on  


    console.log("\n--- Database Population with Sample Data Completed ---");
  } catch (error) {
    console.error("Error populating database with sample data:", error.message);
    console.error(error.stack);
    // Decide if this error should halt the entire application start (throw error)
    // or just log a warning (don't throw)
    // throw error; // Optional: re-throw if sample data population failure is critical
  }
};


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