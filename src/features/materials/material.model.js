const mongoose = require("mongoose");

/**
 * items (materials)
 * Tenant-scoped via user_id.
 * Referenced by: purchase_request_item, purchase_order_item,
 *                materials_received_item, project_inventory,
 *                project_inventory_transaction, project_material_transfer_item
 */
const materialSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    material_name: {
      type: String,
      required: true,
      trim: true,
    },
    specification: {
      type: String,
      trim: true,
      default: null,
    },
    measurement_unit_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MeasurementUnit",
      default: null,
    },
    material_category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MaterialCategory",
      default: null,
    },
    unit_rate: {
      type: Number,
      default: null,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    gst_rate_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GstRate",
      default: null,
    },
    hsn_code: {
      type: String,
      trim: true,
      default: null,
    },
    // Used for low stock alerts in project inventory (spec §15)
    minimum_quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Primary tenant index
materialSchema.index({ user_id: 1 });

// Unique material name per tenant
materialSchema.index({ user_id: 1, material_name: 1 }, { unique: true });

// Filter by category — used frequently in GET /api/materials?category_id=
materialSchema.index({ user_id: 1, material_category_id: 1 });

module.exports = mongoose.model("Material", materialSchema);
