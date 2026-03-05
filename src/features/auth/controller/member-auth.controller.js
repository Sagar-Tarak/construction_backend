const jwt = require("jsonwebtoken");
const TeamMember = require("../../team-member/team-member.model");
const { resolvePermissions } = require("../../designation-permissions");

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Signs a JWT for a team member.
 * Payload carries:
 *   - type: "member"        → blocks this token from admin-only routes
 *   - user_id               → tenant scope for all DB queries
 *   - member_id             → identifies the team member
 *   - designation_id        → used by getMyPermissions for fresh DB read
 *   - permissions           → full resolved map cached in token
 *                             frontend uses this to show/hide UI without extra API calls
 */
const signMemberToken = (member, permissions) =>
  jwt.sign(
    {
      type: "member",
      user_id: member.user_id,
      member_id: member._id,
      designation_id: member.designation_id,
      permissions,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );

// ─── Controllers ────────────────────────────────────────────────────────────

/**
 * POST /api/auth/member/login
 *
 * Flow:
 * 1. Find team member by user_email (globally — we don't know tenant yet)
 * 2. Validate password
 * 3. Verify member is active and belongs to an active tenant
 * 4. Resolve full permission map from designation_permission collection
 * 5. Return token + member + permissions (spec §2.1)
 *
 * IMPORTANT: user_email is unique per tenant, not globally.
 * Two members from different companies can share the same email.
 * We handle this by finding all matching emails and checking password
 * against each — first match wins.
 * In practice, advise clients to use unique emails across the system.
 */
const memberLogin = async (req, res, next) => {
  try {
    const { user_email, password } = req.body;

    // Find all members with this email across all tenants
    // select("+password") overrides the select: false on the password field
    const candidates = await TeamMember.find({ user_email, active: true })
      .select("+password")
      .populate("designation_id", "designation_name");

    if (!candidates.length) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Find the one whose password matches
    let matchedMember = null;
    for (const candidate of candidates) {
      if (!candidate.password) continue;
      const isMatch = await candidate.comparePassword(password);
      if (isMatch) {
        matchedMember = candidate;
        break;
      }
    }

    if (!matchedMember) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Verify the tenant (admin account) is still active
    const User = require("../models/user.model");
    const tenant = await User.findById(matchedMember.user_id);
    if (!tenant || !tenant.active) {
      return res.status(401).json({
        success: false,
        message:
          "Your company account has been deactivated. Please contact your administrator.",
      });
    }

    // Resolve full permission map from designation_permission (spec §3.7)
    // If no designation assigned, member gets empty permissions object
    let permissions = {};
    if (matchedMember.designation_id) {
      permissions = await resolvePermissions(
        matchedMember.user_id,
        matchedMember.designation_id._id || matchedMember.designation_id,
      );
    }

    const token = signMemberToken(matchedMember, permissions);

    // Shape matches spec §2.1
    // { token, team_member: { _id, user_name, designation }, permissions }
    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        token,
        team_member: {
          _id: matchedMember._id,
          user_name: matchedMember.user_name,
          user_email: matchedMember.user_email,
          designation: matchedMember.designation_id,
          address: matchedMember.address,
        },
        permissions,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/member/logout
 * Stateless JWT — client discards the token.
 */
const memberLogout = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/member/me
 * Returns the logged-in team member's profile + fresh permissions from DB.
 * req.member and req.user are attached by authenticateMember middleware.
 */
const getMemberMe = async (req, res, next) => {
  try {
    const member = await TeamMember.findOne({
      _id: req.member._id,
      user_id: req.user._id,
      active: true,
    }).populate("designation_id", "name");

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Team member not found or deactivated.",
      });
    }

    // Always resolve fresh permissions from DB
    // In case admin updated permissions since last login
    let permissions = {};
    if (member.designation_id) {
      const { resolvePermissions } = require("../../designation-permissions");
      permissions = await resolvePermissions(
        member.user_id,
        member.designation_id._id || member.designation_id,
      );
    }

    return res.status(200).json({
      success: true,
      data: {
        team_member: member,
        permissions,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { memberLogin, memberLogout, getMemberMe };
