const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

/**
 * authenticate
 * Validates the Bearer token and attaches req.user (admin/tenant account).
 * CRITICAL: user_id for all tenant-scoped queries always comes from req.user._id — never req.body.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({
            success: false,
            message: "Token expired. Please log in again.",
          });
      }
      return res
        .status(401)
        .json({ success: false, message: "Invalid token." });
    }

    // Check token type — prevents team member tokens being used on admin-only routes
    if (decoded.type !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden. Admin token required." });
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user || !user.active) {
      return res
        .status(401)
        .json({ success: false, message: "Account not found or deactivated." });
    }

    req.user = user; // user._id === tenant user_id for all queries
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * authenticateMember
 * For team member tokens (issued when a team member logs in via a separate login flow).
 * Attaches req.member and resolves req.permissions from the cached token payload.
 */
const authenticateMember = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({
            success: false,
            message: "Token expired. Please log in again.",
          });
      }
      return res
        .status(401)
        .json({ success: false, message: "Invalid token." });
    }

    if (decoded.type !== "member") {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden. Member token required." });
    }

    req.user = { _id: decoded.user_id }; // tenant scope — used in DB queries
    req.member = {
      _id: decoded.member_id,
      designation_id: decoded.designation_id,
    };
    req.permissions = decoded.permissions || {}; // full permission map from login
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * requirePermission(module, action)
 * Usage: router.get("/projects", authenticateMember, requirePermission("project", "view"), handler)
 * Checks req.permissions[module][action] — built from designation_permission on login.
 */
const requirePermission = (module, action) => (req, res, next) => {
  const perm = req.permissions?.[module];
  if (!perm || !perm[action]) {
    return res.status(403).json({
      success: false,
      message: `Permission denied. You don't have '${action}' access on '${module}'.`,
    });
  }
  next();
};

module.exports = { authenticate, authenticateMember, requirePermission };
