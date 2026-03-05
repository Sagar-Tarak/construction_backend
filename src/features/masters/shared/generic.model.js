const mongoose = require("mongoose");

/**
 * createLookupModel(modelName, extraFields)
 * Factory that builds a standard lookup model.
 *
 * Every lookup collection shares:
 *   - user_id    → tenant scope (CRITICAL — always filter by this)
 *   - active     → soft delete flag
 *   - timestamps → createdAt, updatedAt
 *
 * extraFields: mongoose schema fields unique to that collection
 *              MUST include the unique field (e.g. designation_name, department_name, etc.)
 *
 * Usage:
 *   const Designation = createLookupModel("Designation", {
 *     designation_name: { type: String, required: true, trim: true }
 *   });
 *   const GstRate = createLookupModel("GstRate", {
 *     gst_rate: { type: Number, required: true }
 *   });
 */
const createLookupModel = (modelName, extraFields = {}) => {
  if (mongoose.models[modelName]) {
    return mongoose.model(modelName);
  }

  const schema = new mongoose.Schema(
    {
      user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      active: {
        type: Boolean,
        default: true,
      },
      ...extraFields,
    },
    { timestamps: true },
  );

  schema.index({ user_id: 1 });

  return mongoose.model(modelName, schema);
};

module.exports = createLookupModel;
