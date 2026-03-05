const Joi = require("joi");

const savePermissionsSchema = Joi.object({
  permissions: Joi.array()
    .items(
      Joi.object({
        module_id: Joi.string().hex().length(24).required(),
        can_add: Joi.boolean().default(false),
        can_view: Joi.boolean().default(false),
        can_edit: Joi.boolean().default(false),
        can_delete: Joi.boolean().default(false),
        can_approve: Joi.boolean().default(false),
        can_reject: Joi.boolean().default(false),
        can_download: Joi.boolean().default(false),
        can_report: Joi.boolean().default(false),
        can_view_all: Joi.boolean().default(false),
        can_notification: Joi.boolean().default(false),
        can_transfer: Joi.boolean().default(false),
      }),
    )
    .min(1)
    .required(),
});

module.exports = { savePermissionsSchema };
