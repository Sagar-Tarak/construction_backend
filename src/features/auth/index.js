// features/auth/index.js
// Single entry point for the auth feature — import only this in app.js

const authRoutes = require("./routes/Auth.routes");
const memberAuthRoutes = require("./routes/member-auth.routes");
const {
  authenticate,
  authenticateMember,
  requirePermission,
} = require("./middleware/Auth.middleware");

module.exports = {
  authRoutes,
  memberAuthRoutes,
  authenticate,
  authenticateMember,
  requirePermission,
};
