// routes.js
const agreementsRoutes      = require('./src/routes/agreements.routes.js')
const contractorsRoutes     = require('./src/routes/contractors.routes')
const contractsRoutes       = require('./src/routes/contracts.routes')
const notificationsRoutes   = require('./src/routes/notifications.routes.js')
const packsRoutes           = require('./src/routes/packs.routes')
const permissionsRoutes     = require('./src/routes/permissions.routes.js')
const sessionRoutes         = require('./src/routes/sessions.routes.js')
// const missionsRoutes        = require('./src/routes/missions.routes')
const staffRoutes           = require('./src/routes/staff.routes')
const tasksRoutes           = require('./src/routes/tasks.routes')
const twoFARoutes           = require('./src/routes/twoFA.routes.js')
const usersRoutes           = require('./src/routes/users.routes')
const welcomeRoutes         = require('./src/routes/welcome.routes')
// Import other routes here...

module.exports = function(app) {
    app.use("/api/agreements",          agreementsRoutes)
    app.use("/api/contractors",         contractorsRoutes)
    app.use("/api/contracts",           contractsRoutes)
    app.use("/api/history",             sessionRoutes)
    app.use("/api/notifications",       notificationsRoutes)
    app.use("/api/packs",               packsRoutes)
    app.use("/api/permissionsRoutes",   permissionsRoutes)
    app.use("/api/staff",               staffRoutes)
    app.use("/api/tasks",               tasksRoutes)
    app.use("/api/twofas",              twoFARoutes)
    app.use("/api/users",               usersRoutes)
    app.use("/api/welcome",             welcomeRoutes)
    // Add other routes here...
};
