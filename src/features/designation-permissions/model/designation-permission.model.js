const mongoose = require("mongoose");

const designationPermissionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    designation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Designation",
      required: true,
    },
    module_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AppModule",
      required: true,
    },

    can_add: { type: Boolean, default: false },
    can_view: { type: Boolean, default: false },
    can_edit: { type: Boolean, default: false },
    can_delete: { type: Boolean, default: false },
    can_approve: { type: Boolean, default: false },
    can_reject: { type: Boolean, default: false },
    can_download: { type: Boolean, default: false },
    can_report: { type: Boolean, default: false },
    can_view_all: { type: Boolean, default: false },
    can_notification: { type: Boolean, default: false },
    can_transfer: { type: Boolean, default: false },
  },
  { timestamps: true },
);

designationPermissionSchema.index(
  { user_id: 1, designation_id: 1, module_id: 1 },
  { unique: true },
);

module.exports = mongoose.model(
  "DesignationPermission",
  designationPermissionSchema,
);
