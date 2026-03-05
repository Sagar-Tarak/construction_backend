const Joi = require("joi");

const createMaterialCategorySchema = Joi.object({
  material_category_name: Joi.string().trim().required().messages({
    "string.empty": "Material category name is required.",
    "any.required": "Material category name is required.",
  }),
});

const updateMaterialCategorySchema = Joi.object({
  material_category_name: Joi.string().trim().optional().messages({
    "string.empty": "Material category name cannot be empty.",
  }),
  active: Joi.boolean().optional(),
})
  .min(1)
  .messages({
    "object.min": "Provide at least one field to update.",
  });

module.exports = { createMaterialCategorySchema, updateMaterialCategorySchema };
