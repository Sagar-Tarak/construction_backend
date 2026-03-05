const mongoose = require("mongoose");

/**
 * material_transfer
 * Moves stock between two projects.
 * Status flow: "pending" → "received" | "cancelled"
 *
 * On create:
 *   - source project inventory decremented (transfer_out transaction)
 * On receive (PATCH /:id/receive):
 *   - destination project inventory incremented (transfer_in transaction)
 * On cancel (PATCH /:id/cancel):
 *   - source project inventory restored (reversal)
 *   - transfer_out transaction deleted
 */
const materialTransferSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    transfer_no: {
      type: String,
      required: true,
      trim: true,
    },
    transfer_date: {
      type: Date,
      required: true,
    },
    from_project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    to_project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    transferred_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamMember",
      default: null,
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
    status: {
      type: String,
      enum: ["pending", "received", "cancelled"],
      default: "pending",
    },
    remark: {
      type: String,
      trim: true,
      default: null,
    },
    documents: {
      type: String, // file path / URL
      default: null,
    },
  },
  { timestamps: true },
);

materialTransferSchema.index({ user_id: 1 });
materialTransferSchema.index({ user_id: 1, transfer_no: 1 }, { unique: true });
materialTransferSchema.index({ user_id: 1, status: 1 });
materialTransferSchema.index({ from_project_id: 1 });
materialTransferSchema.index({ to_project_id: 1 });

module.exports = mongoose.model("MaterialTransfer", materialTransferSchema);
