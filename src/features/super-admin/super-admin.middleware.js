const jwt = require("jsonwebtoken");
const SuperAdmin = require("./super-admin.model");

const authenticateSuperAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== "superadmin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const superAdmin = await SuperAdmin.findById(decoded.id);
    if (!superAdmin || !superAdmin.active) {
      return res
        .status(401)
        .json({ success: false, message: "Account not found or inactive" });
    }

    req.superAdmin = superAdmin;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
};

module.exports = { authenticateSuperAdmin };
