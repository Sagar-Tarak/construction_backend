const mongoose = require("mongoose");
const OtherParty = require("./other-party.model");

/**
 * GET /api/other-parties
 * Returns all active other parties scoped to the tenant.
 */
const getAll = async (req, res, next) => {
  try {
    const parties = await OtherParty.find({
      user_id: req.user._id,
      active: true,
    }).sort({ party_name: 1 });

    return res.status(200).json({ success: true, data: { other_parties: parties } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/other-parties/:id
 * Returns a single other party scoped to the tenant.
 */
const getOne = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const party = await OtherParty.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!party) {
      return res
        .status(404)
        .json({ success: false, message: "Other party not found." });
    }

    return res.status(200).json({ success: true, data: { other_party: party } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/other-parties
 * Creates a new other party.
 * user_id always from req.user._id — never req.body.
 */
const create = async (req, res, next) => {
  try {
    const { party_name } = req.body;

    const exists = await OtherParty.findOne({
      user_id: req.user._id,
      party_name: party_name.trim(),
    });
    if (exists) {
      return res.status(409).json({
        success: false,
        errors: { party_name: "An other party with this name already exists." },
      });
    }

    const party = await OtherParty.create({
      user_id: req.user._id,
      party_name: party_name.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Other party created successfully.",
      data: { other_party: party },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/other-parties/:id
 * Updates an other party scoped to the tenant.
 */
const update = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const party = await OtherParty.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!party) {
      return res
        .status(404)
        .json({ success: false, message: "Other party not found." });
    }

    if (
      req.body.party_name &&
      req.body.party_name.trim() !== party.party_name
    ) {
      const duplicate = await OtherParty.findOne({
        user_id: req.user._id,
        party_name: req.body.party_name.trim(),
        _id: { $ne: party._id },
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          errors: { party_name: "An other party with this name already exists." },
        });
      }
    }

    const { user_id: _removed, ...safeBody } = req.body;
    Object.assign(party, safeBody);
    await party.save();

    return res.status(200).json({
      success: true,
      message: "Other party updated successfully.",
      data: { other_party: party },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/other-parties/:id
 * Soft delete — sets active: false.
 */
const softDelete = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const party = await OtherParty.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!party) {
      return res
        .status(404)
        .json({ success: false, message: "Other party not found." });
    }

    party.active = false;
    await party.save();

    return res.status(200).json({
      success: true,
      message: "Other party deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getOne, create, update, softDelete };
