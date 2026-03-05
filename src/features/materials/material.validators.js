const Joi = require("joi");

const createMaterialSchema = Joi.object({
  material_name: Joi.string().trim().required().messages({
    "string.empty": "Material name is required.",
    "any.required": "Material name is required.",
  }),
  specification: Joi.string().trim().optional().allow(null, ""),
  measurement_unit_id: Joi.string()
    .hex()
    .length(24)
    .optional()
    .allow(null, "")
    .messages({
      "string.length": "Invalid measurement unit ID.",
    }),
  material_category_id: Joi.string()
    .hex()
    .length(24)
    .optional()
    .allow(null, "")
    .messages({
      "string.length": "Invalid material category ID.",
    }),
  unit_rate: Joi.number().min(0).optional().allow(null).messages({
    "number.min": "Unit rate cannot be negative.",
  }),
  discount: Joi.number().min(0).max(100).optional().default(0).messages({
    "number.min": "Discount cannot be negative.",
    "number.max": "Discount cannot exceed 100%.",
  }),
  gst_rate_id: Joi.string()
    .hex()
    .length(24)
    .optional()
    .allow(null, "")
    .messages({
      "string.length": "Invalid GST rate ID.",
    }),
  hsn_code: Joi.string().trim().optional().allow(null, ""),
  minimum_quantity: Joi.number().min(0).optional().default(0).messages({
    "number.min": "Minimum quantity cannot be negative.",
  }),
});

const updateMaterialSchema = Joi.object({
  material_name: Joi.string().trim().optional().messages({
    "string.empty": "Material name cannot be empty.",
  }),
  specification: Joi.string().trim().optional().allow(null, ""),
  measurement_unit_id: Joi.string()
    .hex()
    .length(24)
    .optional()
    .allow(null, "")
    .messages({
      "string.length": "Invalid measurement unit ID.",
    }),
  material_category_id: Joi.string()
    .hex()
    .length(24)
    .optional()
    .allow(null, "")
    .messages({
      "string.length": "Invalid material category ID.",
    }),
  unit_rate: Joi.number().min(0).optional().allow(null).messages({
    "number.min": "Unit rate cannot be negative.",
  }),
  discount: Joi.number().min(0).max(100).optional().messages({
    "number.min": "Discount cannot be negative.",
    "number.max": "Discount cannot exceed 100%.",
  }),
  gst_rate_id: Joi.string()
    .hex()
    .length(24)
    .optional()
    .allow(null, "")
    .messages({
      "string.length": "Invalid GST rate ID.",
    }),
  hsn_code: Joi.string().trim().optional().allow(null, ""),
  minimum_quantity: Joi.number().min(0).optional().messages({
    "number.min": "Minimum quantity cannot be negative.",
  }),
  active: Joi.boolean().optional(),
})
  .min(1)
  .messages({
    "object.min": "Provide at least one field to update.",
  });

module.exports = { createMaterialSchema, updateMaterialSchema };
