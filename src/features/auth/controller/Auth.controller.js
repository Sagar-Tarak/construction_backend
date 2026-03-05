const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Signs a JWT for an admin/tenant account.
 * Payload is minimal — sensitive data lives in the DB.
 * type: "admin" prevents team member tokens being accepted on admin routes.
 */
const signAdminToken = (userId) =>
  jwt.sign({ id: userId, type: "admin" }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// ─── Controllers ────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Creates a new company / admin (tenant) account.
 * Public route — no JWT required.
 */
const register = async (req, res, next) => {
  try {
    const { company_name, user_email, password, phone, business_address, state, gst_no, pan_no } = req.body;

    // Prevent duplicate company email
    const exists = await User.findOne({ user_email });
    if (exists) {
      return res.status(409).json({
        success: false,
        errors: { user_email: "An account with this email already exists." },
      });
    }

    const user = await User.create({
      company_name,
      user_email,
      password,
      phone,
      business_address,
      state,
      gst_no,
      pan_no,
    });

    const token = signAdminToken(user._id);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      data: { token, user },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Returns JWT + full resolved permissions object (per spec §2.1).
 * The permissions object is built from designation_permission on team member login —
 * for admin accounts we return an "admin: true" flag instead (full access).
 */
const login = async (req, res, next) => {
  try {
    const { user_email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ user_email }).select("+password");
    if (!user || !user.active) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = signAdminToken(user._id);

    // Admin accounts have full access — no designation-based restrictions
    // When team member login is built, this will be replaced with resolved permission map
    const permissions = { admin: true };

    // Remove password from response object
    const userObj = user.toJSON();

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        token,
        user: userObj,
        permissions,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 * JWT-protected. Stateless JWT — client must discard the token.
 * For token blacklisting (optional), add token to a Redis set here.
 */
const logout = async (req, res, next) => {
  try {
    // Stateless: the client drops the token.
    // If you add Redis/DB token blacklisting, do it here using req.headers.authorization.
    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Returns the authenticated admin's profile.
 * req.user is already attached by the authenticate middleware.
 */
const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: { user: req.user },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/auth/me
 * Updates company profile. Password update re-triggers the pre-save hash.
 * CRITICAL: user_id always from req.user._id — never req.body.
 */
const updateMe = async (req, res, next) => {
  try {
    // Joi strips unknown fields upstream via stripUnknown: true
    // Only whitelisted fields from updateProfileSchema reach here
    if (req.body.user_email && req.body.user_email !== req.user.user_email) {
      const taken = await User.findOne({ user_email: req.body.user_email });
      if (taken) {
        return res.status(409).json({
          success: false,
          errors: { user_email: "This email is already in use by another account." },
        });
      }
    }

    // Use findById + save so the pre-save password hash hook fires on password change
    const user = await User.findById(req.user._id).select("+password");
    Object.assign(user, req.body);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: { user: user.toJSON() },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, logout, getMe, updateMe };
