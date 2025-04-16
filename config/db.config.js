'use strict';

// db.config.js
const {
  connectToDatabase,
  // initializeCollections, // This seems unused now
  initializeCollections // Consider renaming for clarity (e.g., seedDatabaseIfNeeded)
} = require('./db.helper');

const initializeDatabase = async () => {
  // Consider adding a check or default value for MONGODB_BASE_URL
  const dbURL = process.env.MONGODB_BASE_URL;
  if (!dbURL) {
    console.error('Error: MONGODB_BASE_URL environment variable is not set.');
    process.exit(1); // Exit if the essential DB URL is missing
  }

  try {
    console.log('Attempting to connect to the database...');
    await connectToDatabase(dbURL);
    console.log('Database connection successful.');

    console.log('Attempting to initialize/seed collections...');
    // This function name is a bit misleading if it's awaited (see db.helper.js review)
    // Renaming it to seedDatabaseIfNeeded or similar might be clearer.
    await initializeCollections();
    console.log('Database initialization/seeding check complete.');

  } catch (error) {
    // Log the specific step that failed if possible
    console.error('Error during database setup:', error.message);
    // Log the stack trace for better debugging in development/staging
    if (process.env.NODE_ENV !== 'production') {
        console.error(error.stack);
    }
    process.exit(1); // Exit with error if db connection or seeding fails
  }
};

module.exports = { initializeDatabase };