const RoleHelpers = require('./../helpers/roles.helper'); // Assuming Role model exists

// Function to create a role
exports.create = async function (req, res) {
  // Validate request body
  if (!req.body || !Array.isArray(req.body) || req.body.length === 0) {
      return res.status(400).json({ error: true, message: "Field required", data: req.body });
  }

  try {
      // Call the helper function (session handling is now inside)
      const roleCreationResult = await RoleHelpers.create(req.body);

      return res.status(roleCreationResult.code).json({
          error: roleCreationResult.error,
          message: roleCreationResult.error ? "Role creation failed" : "Roles created successfully",
          data: roleCreationResult.payload
      });

  } catch (err) {
      console.error("Error in Role creation process:", err);
      return res.status(500).json({ error: true, message: "Internal server error", data: err.message });
  }
};
