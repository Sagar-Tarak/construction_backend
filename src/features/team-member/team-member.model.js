const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * team_member
 * Tenant-scoped via user_id.
 * Has login access — stores hashed password.
 * Permissions are resolved from designation_id on login.
 */
const teamMemberSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ── Core fields (spec §5) ──────────────────────────────────────────────
    user_name: {
      type: String,
      required: true,
      trim: true,
    },
    designation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Designation",
      default: null,
    },
    user_email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true, // allows multiple null values with unique index
    },
    mobile_number: {
      type: String,
      required: true,
      trim: true,
    },
    user_pan: {
      type: String,
      trim: true,
      uppercase: true,
    },
    user_emergency_number: {
      type: String,
      trim: true,
    },

    // ── Extra fields ───────────────────────────────────────────────────────
    password: {
      type: String,
      minlength: 6,
      select: false, // never returned in queries unless explicitly requested
    },
    user_address: {
      type: String,
      trim: true,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// ── Indexes ────────────────────────────────────────────────────────────────

// Primary tenant index — on every query
teamMemberSchema.index({ user_id: 1 });

// Unique email per tenant — two members of same company can't share email
// sparse: true on field + unique here handles null values correctly
teamMemberSchema.index(
  { user_id: 1, user_email: 1 },
  { unique: true, sparse: true },
);

// Unique mobile per tenant
teamMemberSchema.index(
  { user_id: 1, mobile_number: 1 },
  { unique: true, sparse: true },
);

// ── Hooks ──────────────────────────────────────────────────────────────────

// Hash password before save — only if modified
teamMemberSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare plain password to hash — used in team member login
teamMemberSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Never expose password in JSON responses
teamMemberSchema.set("toJSON", {
  transform: (_, obj) => {
    delete obj.password;
    return obj;
  },
});

module.exports = mongoose.model("TeamMember", teamMemberSchema);
