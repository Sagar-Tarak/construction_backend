const Joi = require("joi");

const createSupplierSchema = Joi.object({
  supplier_name: Joi.string().trim().required().messages({
    "string.empty": "Supplier name is required.",
    "any.required": "Supplier name is required.",
  }),
  contact_person: Joi.string().trim().optional().allow(null, ""),
  supplier_email: Joi.string().trim().email().optional().allow(null, "").messages({
    "string.email": "Enter a valid email address.",
  }),
  supplier_number: Joi.string().trim().optional().allow(null, ""),
  address: Joi.string().trim().optional().allow(null, ""),
  gst_number: Joi.string().trim().optional().allow(null, ""),
  pan_number: Joi.string().trim().optional().allow(null, ""),
});

const updateSupplierSchema = Joi.object({
  supplier_name: Joi.string().trim().optional().messages({
    "string.empty": "Supplier name cannot be empty.",
  }),
  contact_person: Joi.string().trim().optional().allow(null, ""),
  supplier_email: Joi.string().trim().email().optional().allow(null, "").messages({
    "string.email": "Enter a valid email address.",
  }),
  supplier_number: Joi.string().trim().optional().allow(null, ""),
  address: Joi.string().trim().optional().allow(null, ""),
  gst_number: Joi.string().trim().optional().allow(null, ""),
  pan_number: Joi.string().trim().optional().allow(null, ""),
  active: Joi.boolean().optional(),
})
  .min(1)
  .messages({
    "object.min": "Provide at least one field to update.",
  });

module.exports = { createSupplierSchema, updateSupplierSchema };
