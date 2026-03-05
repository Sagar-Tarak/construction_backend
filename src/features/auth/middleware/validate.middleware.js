/**
 * validate(schema)
 * Reusable Joi validation middleware.
 * Usage: router.post("/register", validate(registerSchema), controller)
 *
 * - Validates req.body against the Joi schema
 * - On failure: returns 422 with a clean { field: message } errors object
 * - On success: replaces req.body with the sanitized Joi output (trims, lowercases etc.)
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false, // collect ALL errors, not just the first
    stripUnknown: true, // remove fields not defined in schema (security)
  });

  if (error) {
    const errors = error.details.reduce((acc, detail) => {
      const key = detail.path.join(".");
      acc[key] = detail.message;
      return acc;
    }, {});

    return res.status(422).json({ success: false, errors });
  }

  req.body = value; // use sanitized value going forward
  next();
};

module.exports = validate;
