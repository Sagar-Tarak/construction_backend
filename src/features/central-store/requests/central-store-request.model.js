const mongoose = require("mongoose");

/**
 * central_store_material_request
 * Status flow: "requested" → "received"
 * requested_by and received_by both ref TeamMember
 */
const centralStoreRequestSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    store_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CentralStore",
      required: true,
    },
    requested_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamMember",
      required: true,
    },
    request_date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["requested", "received"],
      default: "requested",
    },
    received_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamMember",
      default: null,
    },
    received_date: {
      type: Date,
      default: null,
    },
    location_type: {
      type: String,
      trim: true,
      default: null,
    },
    contractor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contractor",
      default: null,
    },
    department_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
    file: {
      type: String, // file path / URL
      default: null,
    },
  },
  { timestamps: true },
);

centralStoreRequestSchema.index({ user_id: 1 });
centralStoreRequestSchema.index({ store_id: 1 });
centralStoreRequestSchema.index({ user_id: 1, status: 1 });
centralStoreRequestSchema.index({ user_id: 1, store_id: 1, status: 1 });

module.exports = mongoose.model(
  "CentralStoreRequest",
  centralStoreRequestSchema,
);
