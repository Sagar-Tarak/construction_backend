const mongoose = require("mongoose");

/**
 * createLookupController(Model, modelLabel, fieldName)
 * Factory that returns all 5 CRUD handlers for any lookup model.
 *
 * Model: Mongoose model
 * modelLabel: human-readable name for error messages e.g. "Designation"
 * fieldName: the unique field name for this collection (e.g. "designation_name")
 *
 * All handlers:
 *   - Scope every query by req.user._id (tenant isolation)
 *   - Never use user_id from req.body
 *   - Soft delete (active: false) with reference protection
 */
const createLookupController = (Model, modelLabel, fieldName) => {
  /**
   * GET /api/:collection
   * Returns all active records for the tenant, sorted by fieldName.
   */
  const getAll = async (req, res, next) => {
    try {
      const records = await Model.find({
        user_id: req.user._id,
        active: true,
      }).sort({ [fieldName]: 1 });

      return res.status(200).json({
        success: true,
        data: { [modelLabel.toLowerCase().replace(/ /g, "_") + "s"]: records },
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/:collection/:id
   * Returns a single record scoped to the tenant.
   */
  const getOne = async (req, res, next) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: "Invalid ID." });
      }

      const record = await Model.findOne({
        _id: req.params.id,
        user_id: req.user._id,
      });

      if (!record) {
        return res.status(404).json({
          success: false,
          message: `${modelLabel} not found.`,
        });
      }

      return res.status(200).json({ success: true, data: { record } });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/:collection
   * Creates a new record scoped to the tenant.
   * user_id always comes from req.user._id — never req.body.
   */
  const create = async (req, res, next) => {
    try {
      const fieldValue = req.body[fieldName];

      if (!fieldValue || !fieldValue.toString().trim()) {
        return res.status(422).json({
          success: false,
          errors: { [fieldName]: `${modelLabel} is required.` },
        });
      }

      const exists = await Model.findOne({
        user_id: req.user._id,
        [fieldName]: fieldValue.toString().trim(),
      });

      if (exists) {
        return res.status(409).json({
          success: false,
          errors: { [fieldName]: `${modelLabel} with this name already exists.` },
        });
      }

      const record = await Model.create({
        user_id: req.user._id,
        ...req.body,
        [fieldName]: fieldValue.toString().trim(),
      });

      return res.status(201).json({
        success: true,
        message: `${modelLabel} created successfully.`,
        data: { record },
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * PATCH /api/:collection/:id
   * Updates fieldName or other fields, or toggles active flag.
   * Scoped to tenant — cannot update another tenant's records.
   */
  const update = async (req, res, next) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: "Invalid ID." });
      }

      const record = await Model.findOne({
        _id: req.params.id,
        user_id: req.user._id,
      });

      if (!record) {
        return res.status(404).json({
          success: false,
          message: `${modelLabel} not found.`,
        });
      }

      if (req.body[fieldName] && req.body[fieldName].toString().trim() !== record[fieldName]) {
        const duplicate = await Model.findOne({
          user_id: req.user._id,
          [fieldName]: req.body[fieldName].toString().trim(),
          _id: { $ne: record._id },
        });

        if (duplicate) {
          return res.status(409).json({
            success: false,
            errors: { [fieldName]: `${modelLabel} with this name already exists.` },
          });
        }
      }

      const { user_id: _removed, ...safeBody } = req.body;
      Object.assign(record, safeBody);
      await record.save();

      return res.status(200).json({
        success: true,
        message: `${modelLabel} updated successfully.`,
        data: { record },
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * DELETE /api/:collection/:id
   * Soft delete — sets active: false.
   * IMPORTANT: referenceModels[] is checked before deactivating.
   * If any active document references this record, returns HTTP 400.
   *
   * referenceModels is injected per-collection in each feature's index.js
   * e.g. Designation is referenced by TeamMember, so we check before deleting.
   */
  const softDelete =
    (referenceModels = []) =>
    async (req, res, next) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid ID." });
        }

        const record = await Model.findOne({
          _id: req.params.id,
          user_id: req.user._id,
        });

        if (!record) {
          return res.status(404).json({
            success: false,
            message: `${modelLabel} not found.`,
          });
        }

        // Reference protection
        for (const { model: RefModel, field, label } of referenceModels) {
          const inUse = await RefModel.exists({
            [field]: record._id,
            active: true,
          });

          if (inUse) {
            return res.status(400).json({
              success: false,
              message: `Cannot delete. This ${modelLabel} is currently assigned to one or more ${label}. Remove those assignments first.`,
            });
          }
        }

        record.active = false;
        await record.save();

        return res.status(200).json({
          success: true,
          message: `${modelLabel} deleted successfully.`,
        });
      } catch (err) {
        next(err);
      }
    };

  return { getAll, getOne, create, update, softDelete };
};

module.exports = createLookupController;
