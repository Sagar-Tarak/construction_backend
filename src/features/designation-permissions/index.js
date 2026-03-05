const designationPermissionRoutes = require("./routes/designation-permission.routes");
const DesignationPermission = require("./model/designation-permission.model");
const {
  resolvePermissions,
} = require("./controller/designation-permission.controller");

module.exports = {
  designationPermissionRoutes,
  DesignationPermission,
  resolvePermissions,
};
