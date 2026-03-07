const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // Company / admin account — this _id IS the user_id (tenant key) used across all collections
    company_name: { type: String, required: true, trim: true },
    user_email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String, trim: true },
    business_address: { type: String, trim: true },
    state: { type: String, trim: true },
    gst_no: { type: String, trim: true },
    pan_no: { type: String, trim: true },
    active: { type: Boolean, default: true },
    registration_status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
    },
    rejection_reason: {
      type: String,
      default: undefined,
    },
    approved_at: {
      type: Date,
      default: undefined,
    },
    approved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SuperAdmin",
      default: undefined,
    },
  },
  { timestamps: true },
);

// Hash password before save
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Instance method — compare plain password to hash
userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Never expose password in JSON responses
userSchema.set("toJSON", {
  transform: (_, obj) => {
    delete obj.password;
    return obj;
  },
});

module.exports = mongoose.model("User", userSchema);
