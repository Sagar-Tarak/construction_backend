const Joi = require("joi");

// ── Vendor ───────────────────────────────────────────────────────────────────

const createVendorSchema = Joi.object({
  vendor_name: Joi.string().trim().required().messages({
    "string.empty": "Vendor name is required.",
    "any.required": "Vendor name is required.",
  }),
  address: Joi.string().trim().optional().allow(null, ""),
  gst_number: Joi.string().trim().optional().allow(null, ""),
  pan_number: Joi.string().trim().optional().allow(null, ""),
});

const updateVendorSchema = Joi.object({
  vendor_name: Joi.string().trim().optional().messages({
    "string.empty": "Vendor name cannot be empty.",
  }),
  address: Joi.string().trim().optional().allow(null, ""),
  gst_number: Joi.string().trim().optional().allow(null, ""),
  pan_number: Joi.string().trim().optional().allow(null, ""),
  active: Joi.boolean().optional(),
})
  .min(1)
  .messages({
    "object.min": "Provide at least one field to update.",
  });

// ── Shifts ───────────────────────────────────────────────────────────────────

const createShiftSchema = Joi.object({
  labour_category_id: Joi.string().hex().length(24).required().messages({
    "string.empty": "Labour category is required.",
    "any.required": "Labour category is required.",
    "string.length": "Invalid labour category ID.",
  }),
  shift_start_time: Joi.string().trim().required().messages({
    "string.empty": "Shift start time is required.",
    "any.required": "Shift start time is required.",
  }),
  shift_end_time: Joi.string().trim().required().messages({
    "string.empty": "Shift end time is required.",
    "any.required": "Shift end time is required.",
  }),
  rate_per_day: Joi.number().optional().allow(null),
  overtime_wage_per_hour: Joi.number().optional().allow(null),
});

const updateShiftSchema = Joi.object({
  labour_category_id: Joi.string().hex().length(24).optional().messages({
    "string.length": "Invalid labour category ID.",
  }),
  shift_start_time: Joi.string().trim().optional(),
  shift_end_time: Joi.string().trim().optional(),
  rate_per_day: Joi.number().optional().allow(null),
  overtime_wage_per_hour: Joi.number().optional().allow(null),
  active: Joi.boolean().optional(),
})
  .min(1)
  .messages({
    "object.min": "Provide at least one field to update.",
  });

module.exports = {
  createVendorSchema,
  updateVendorSchema,
  createShiftSchema,
  updateShiftSchema,
};
