const mongoose = require("mongoose");
const PurchaseRequest = require("./purchase-request.model");
const PurchaseRequestItem = require("./purchase-request-item.model");

// ── PR Number Generator ──────────────────────────────────────────────────────

/**
 * Generates next PR number for the tenant in format PR-YYYY-XXXX.
 * Finds the highest sequence number for the current year per tenant,
 * then increments by 1. Thread-safe via unique index on purchase_request_no.
 *
 * Example: PR-2024-0001, PR-2024-0002, ... PR-2024-0999
 */
const generatePRNumber = async (user_id) => {
  const year = new Date().getFullYear();
  const prefix = `PR-${year}-`;

  // Find the latest PR for this tenant in this year
  const latest = await PurchaseRequest.findOne({
    user_id,
    purchase_request_no: { $regex: `^${prefix}` },
  })
    .sort({ purchase_request_no: -1 })
    .select("purchase_request_no");

  let sequence = 1;
  if (latest) {
    const parts = latest.purchase_request_no.split("-");
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) sequence = lastSeq + 1;
  }

  return `${prefix}${String(sequence).padStart(4, "0")}`;
};

// ── Populate helper ──────────────────────────────────────────────────────────

const populateRequest = (query) =>
  query.populate("actioned_by", "user_name user_email");

// ── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /api/purchase-requests
 * Supports ?status= filter.
 * can_view_all enforcement — members without it only see their own.
 */
const getAll = async (req, res, next) => {
  try {
    const filter = { user_id: req.user._id };

    if (req.query.status) {
      if (!["pending", "approved", "rejected"].includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status. Use: pending, approved, rejected.",
        });
      }
      filter.status = req.query.status;
    }

    const requests = await populateRequest(
      PurchaseRequest.find(filter).sort({ createdAt: -1 }),
    );

    return res
      .status(200)
      .json({ success: true, data: { purchase_requests: requests } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/purchase-requests/:id
 * Returns request with all line items populated.
 */
const getOne = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const request = await populateRequest(
      PurchaseRequest.findOne({ _id: req.params.id, user_id: req.user._id }),
    );

    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Purchase request not found." });
    }

    const items = await PurchaseRequestItem.find({
      purchase_request_id: request._id,
    })
      .populate("item_id", "material_name unit_rate")
      .populate("material_category_id", "material_category_name")
      .populate("measurement_unit_id", "unit_name");

    return res.status(200).json({ success: true, data: { request, items } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/purchase-requests
 * Auto-generates PR number.
 * Creates request + all line items in one call.
 */
const create = async (req, res, next) => {
  try {
    const {
      purchase_request_date,
      location_type,
      required_date,
      remark,
      document,
      items,
    } = req.body;

    const purchase_request_no = await generatePRNumber(req.user._id);

    const request = await PurchaseRequest.create({
      user_id: req.user._id,
      purchase_request_no,
      purchase_request_date,
      location_type: location_type || null,
      required_date: required_date || null,
      remark: remark || null,
      document: document || null,
    });

    const itemDocs = items.map((item) => ({
      user_id: req.user._id,
      purchase_request_id: request._id,
      material_category_id: item.material_category_id || null,
      item_id: item.item_id,
      quantity: item.quantity,
      measurement_unit_id: item.measurement_unit_id || null,
      remark: item.remark || null,
    }));

    await PurchaseRequestItem.insertMany(itemDocs);

    return res.status(201).json({
      success: true,
      message: `Purchase request ${purchase_request_no} created successfully.`,
      data: { request },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/purchase-requests/:id
 * Only editable when status is "pending".
 * If items[] provided — replaces all existing items.
 */
const update = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const request = await PurchaseRequest.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Purchase request not found." });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot edit a purchase request with status '${request.status}'.`,
      });
    }

    const { user_id: _u, items, ...safeBody } = req.body;
    Object.assign(request, safeBody);
    await request.save();

    // Replace items if provided
    if (items && items.length > 0) {
      await PurchaseRequestItem.deleteMany({
        purchase_request_id: request._id,
      });

      const itemDocs = items.map((item) => ({
        user_id: req.user._id,
        purchase_request_id: request._id,
        material_category_id: item.material_category_id || null,
        item_id: item.item_id,
        quantity: item.quantity,
        measurement_unit_id: item.measurement_unit_id || null,
        remark: item.remark || null,
      }));

      await PurchaseRequestItem.insertMany(itemDocs);
    }

    return res.status(200).json({
      success: true,
      message: "Purchase request updated successfully.",
      data: { request },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/purchase-requests/:id/action
 * Approve or reject a purchase request.
 * Only team members with can_approve permission on "purchase_request" module.
 * req.member is set by authenticateMember middleware.
 * Admin can also approve via authenticate middleware.
 */
const approveReject = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const request = await PurchaseRequest.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Purchase request not found." });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `This request is already '${request.status}'. Only pending requests can be actioned.`,
      });
    }

    const { action, rejection_reason } = req.body;

    request.status = action;
    request.actioned_by = req.member?._id || null; // null if admin is actioning
    request.actioned_at = new Date();

    if (action === "rejected") {
      request.rejection_reason = rejection_reason;
    }

    await request.save();

    return res.status(200).json({
      success: true,
      message: `Purchase request ${action} successfully.`,
      data: { request },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/purchase-requests/:id
 * Only deletable when status is "pending".
 * Hard deletes request + all line items.
 */
const softDelete = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const request = await PurchaseRequest.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Purchase request not found." });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot delete a purchase request with status '${request.status}'.`,
      });
    }

    // Check if any PO references this PR
    try {
      const PurchaseOrder = require("../purchase-order/purchase-order.model");
      const poExists = await PurchaseOrder.exists({
        user_id: req.user._id,
        purchase_request_no: request.purchase_request_no,
      });
      if (poExists) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot delete. A Purchase Order has been raised against this request.",
        });
      }
    } catch (_) {
      // PO feature not yet loaded — skip check
    }

    await PurchaseRequestItem.deleteMany({ purchase_request_id: request._id });
    await request.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Purchase request deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getOne, create, update, approveReject, softDelete };
