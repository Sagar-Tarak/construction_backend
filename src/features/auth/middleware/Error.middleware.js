/**
 * Global error handler — mount LAST in app.js after all routes.
 * Catches anything passed via next(err).
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl} →`, err);

  // Mongoose duplicate key (e.g. unique email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `Duplicate value for field: ${field}.`,
      errors: { [field]: `This ${field} is already in use.` },
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.keys(err.errors).reduce((acc, key) => {
      acc[key] = err.errors[key].message;
      return acc;
    }, {});
    return res
      .status(422)
      .json({ success: false, message: "Validation failed.", errors });
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    return res
      .status(400)
      .json({
        success: false,
        message: `Invalid ID format for field: ${err.path}.`,
      });
  }

  // Default 500
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error.";
  return res.status(status).json({ success: false, message });
};

module.exports = errorHandler;
