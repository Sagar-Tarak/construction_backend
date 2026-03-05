const mongoose = require("mongoose");
const CentralStoreRequest = require("./central-store-request.model");
const CentralStoreRequestItem = require("./central-store-request-item.model");

// ── Helpers ──────────────────────────────────────────────────────────────────

const populateRequest = (query) =>
  query
    .populate("store_id", "store_name store_address")
    .populate("requested_by", "user_name user_email")
    .populate("received_by", "user_name user_email")
    .populate("contractor_id", "contractor_name")
    .populate("department_id", "department_name");

// Supports both nested route /:storeId/requests/:requestId and standalone /:id
const getRequestId = (req) => req.params.requestId || req.params.id;

// ── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /api/central-stores/:id/requests
 * Also: GET /api/central-store-requests?store_id=&status=
 * Supports ?status= filter.
 */
const getAll = async (req, res, next) => {
  try {
    const filter = { user_id: req.user._id };

    // When accessed via nested route, scope to this store
    if (req.params.id) {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid store ID." });
      }
      filter.store_id = req.params.id;
    }

    if (req.query.store_id) {
      if (!mongoose.Types.ObjectId.isValid(req.query.store_id)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid store ID." });
      }
      filter.store_id = req.query.store_id;
    }

    if (req.query.status) {
      if (!["requested", "received"].includes(req.query.status)) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Invalid status. Use: requested, received.",
          });
      }
      filter.status = req.query.status;
    }

    const requests = await populateRequest(
      CentralStoreRequest.find(filter).sort({ createdAt: -1 }),
    );

    return res.status(200).json({ success: true, data: { requests } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/central-stores/:id/requests/:requestId
 * Returns request with all line items.
 */
const getOne = async (req, res, next) => {
  try {
    const requestId = getRequestId(req);
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const request = await populateRequest(
      CentralStoreRequest.findOne({ _id: requestId, user_id: req.user._id }),
    );

    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found." });
    }

    const items = await CentralStoreRequestItem.find({
      request_id: request._id,
    }).populate("item_id", "material_name measurement_unit_id unit_rate");

    return res.status(200).json({ success: true, data: { request, items } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/central-stores/:id/requests
 * Creates request + all line items in one call.
 */
const create = async (req, res, next) => {
  try {
    const {
      requested_by,
      request_date,
      location_type,
      contractor_id,
      department_id,
      notes,
      file,
      items,
    } = req.body;

    // store_id comes from route param when nested, or body when standalone
    const store_id = req.params.id || req.body.store_id;

    if (!store_id || !mongoose.Types.ObjectId.isValid(store_id)) {
      return res
        .status(422)
        .json({
          success: false,
          errors: { store_id: "Valid store ID is required." },
        });
    }

    const request = await CentralStoreRequest.create({
      user_id: req.user._id,
      store_id,
      requested_by,
      request_date,
      location_type: location_type || null,
      contractor_id: contractor_id || null,
      department_id: department_id || null,
      notes: notes || null,
      file: file || null,
    });

    const itemDocs = items.map((item) => ({
      user_id: req.user._id,
      request_id: request._id,
      item_id: item.item_id,
      quantity: item.quantity,
      unit_rate: item.unit_rate || null,
      notes: item.notes || null,
    }));

    await CentralStoreRequestItem.insertMany(itemDocs);

    return res.status(201).json({
      success: true,
      message: "Material request created successfully.",
      data: { request },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/central-stores/:id/requests/:requestId
 * Only editable when status is "requested".
 */
const update = async (req, res, next) => {
  try {
    const requestId = getRequestId(req);
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const request = await CentralStoreRequest.findOne({
      _id: requestId,
      user_id: req.user._id,
    });

    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found." });
    }

    if (request.status === "received") {
      return res.status(400).json({
        success: false,
        message: "Cannot edit a request that has already been received.",
      });
    }

    const { user_id: _u, store_id: _s, status: _st, ...safeBody } = req.body;
    Object.assign(request, safeBody);
    await request.save();

    return res.status(200).json({
      success: true,
      message: "Request updated successfully.",
      data: { request },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/central-stores/:id/requests/:requestId/receive
 * Marks request as received.
 */
const receiveRequest = async (req, res, next) => {
  try {
    const requestId = getRequestId(req);
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const request = await CentralStoreRequest.findOne({
      _id: requestId,
      user_id: req.user._id,
    });

    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found." });
    }

    if (request.status === "received") {
      return res.status(400).json({
        success: false,
        message: "This request has already been received.",
      });
    }

    request.status = "received";
    request.received_by = req.body.received_by;
    request.received_date = req.body.received_date;
    await request.save();

    return res.status(200).json({
      success: true,
      message: "Request marked as received.",
      data: { request },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/central-stores/:id/requests/:requestId
 * Only deletable when status is "requested".
 */
const softDelete = async (req, res, next) => {
  try {
    const requestId = getRequestId(req);
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const request = await CentralStoreRequest.findOne({
      _id: requestId,
      user_id: req.user._id,
    });

    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found." });
    }

    if (request.status === "received") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a request that has already been received.",
      });
    }

    await CentralStoreRequestItem.deleteMany({ request_id: request._id });
    await request.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Request deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getOne, create, update, receiveRequest, softDelete };
