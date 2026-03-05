const mongoose = require("mongoose");
const PurchaseOrder = require("./purchase-order.model");
const PurchaseOrderItem = require("./purchase-order-item.model");
const PurchaseRequest = require("../purchase-request/purchase-request.model");
const GstRate = require("../masters/gst-rate/gst-rate.model");

// ── PO Number Generator ──────────────────────────────────────────────────────

const generatePONumber = async (user_id) => {
  const year = new Date().getFullYear();
  const prefix = `PO-${year}-`;

  const latest = await PurchaseOrder.findOne({
    user_id,
    purchase_order_no: { $regex: `^${prefix}` },
  })
    .sort({ purchase_order_no: -1 })
    .select("purchase_order_no");

  let sequence = 1;
  if (latest) {
    const parts = latest.purchase_order_no.split("-");
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) sequence = lastSeq + 1;
  }

  return `${prefix}${String(sequence).padStart(4, "0")}`;
};

// ── Line Item Calculator ─────────────────────────────────────────────────────

/**
 * Calculates total_amount for a single line item.
 * Formula:
 *   line_total      = quantity × unit_rate
 *   after_discount  = line_total - (line_total × discount / 100)
 *   gst_amount      = after_discount × gst_rate / 100
 *   total_amount    = after_discount + gst_amount
 *
 * Fetches gst_rate value from DB if gst_rate_id is provided.
 * Stores snapshot of gst_rate_value on the item for historical accuracy.
 */
const calculateItemTotal = async (item) => {
  const { quantity, unit_rate, discount = 0, gst_rate_id } = item;

  const line_total = quantity * unit_rate;
  const after_discount = line_total - (line_total * discount) / 100;

  let gst_rate_value = 0;
  if (gst_rate_id && mongoose.Types.ObjectId.isValid(gst_rate_id)) {
    const gstDoc = await GstRate.findById(gst_rate_id).select("gst_rate");
    if (gstDoc) gst_rate_value = gstDoc.gst_rate;
  }

  const gst_amount = (after_discount * gst_rate_value) / 100;
  const total_amount = parseFloat((after_discount + gst_amount).toFixed(2));

  return { gst_rate_value, total_amount };
};

/**
 * Builds item docs with calculated totals.
 * Returns { itemDocs, subtotal }
 */
const buildItemDocs = async (items, user_id, purchase_order_id) => {
  let subtotal = 0;
  const itemDocs = [];

  for (const item of items) {
    const { gst_rate_value, total_amount } = await calculateItemTotal(item);

    itemDocs.push({
      user_id,
      purchase_order_id,
      item_id: item.item_id,
      quantity: item.quantity,
      unit_rate: item.unit_rate,
      discount: item.discount || 0,
      gst_rate_id: item.gst_rate_id || null,
      gst_rate_value,
      total_amount,
      remark: item.remark || null,
    });

    subtotal += total_amount;
  }

  return { itemDocs, subtotal: parseFloat(subtotal.toFixed(2)) };
};

// ── Status transition rules ──────────────────────────────────────────────────

const VALID_TRANSITIONS = {
  draft: ["sent", "cancelled"],
  sent: ["acknowledged", "cancelled"],
  acknowledged: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

// ── Populate helper ──────────────────────────────────────────────────────────

const populateOrder = (query) =>
  query
    .populate("supplier_id", "supplier_name supplier_email supplier_number")
    .populate("terms_condition_id", "term_condition_name description");

// ── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /api/purchase-orders
 * Supports ?status= and ?purchase_request_no= filters.
 */
const getAll = async (req, res, next) => {
  try {
    const filter = { user_id: req.user._id };

    if (req.query.status) {
      if (
        !["draft", "sent", "acknowledged", "completed", "cancelled"].includes(
          req.query.status,
        )
      ) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid status." });
      }
      filter.status = req.query.status;
    }

    if (req.query.purchase_request_no) {
      filter.purchase_request_no = req.query.purchase_request_no.trim();
    }

    const orders = await populateOrder(
      PurchaseOrder.find(filter).sort({ createdAt: -1 }),
    );

    return res
      .status(200)
      .json({ success: true, data: { purchase_orders: orders } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/purchase-orders/:id
 * Returns PO with all line items fully populated.
 */
const getOne = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const order = await populateOrder(
      PurchaseOrder.findOne({ _id: req.params.id, user_id: req.user._id }),
    );

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Purchase order not found." });
    }

    const items = await PurchaseOrderItem.find({ purchase_order_id: order._id })
      .populate("item_id", "material_name specification")
      .populate("gst_rate_id", "gst_rate");

    return res.status(200).json({ success: true, data: { order, items } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/purchase-orders
 * Validates the referenced PR is approved.
 * Auto-generates PO number.
 * Calculates all line item totals + grand total.
 */
const create = async (req, res, next) => {
  try {
    const {
      purchase_order_date,
      purchase_request_no,
      location_type,
      supplier_id,
      expected_delivery_date,
      delivery_address,
      contact_person_name,
      additional_charges = 0,
      deduction_amount = 0,
      payment_term,
      terms_condition_id,
      remark,
      items,
    } = req.body;

    // Validate the PR exists and is approved
    const pr = await PurchaseRequest.findOne({
      user_id: req.user._id,
      purchase_request_no: purchase_request_no.trim(),
    });

    if (!pr) {
      return res.status(404).json({
        success: false,
        errors: { purchase_request_no: "Purchase request not found." },
      });
    }

    if (pr.status !== "approved") {
      return res.status(400).json({
        success: false,
        errors: {
          purchase_request_no: `Purchase request is '${pr.status}'. Only approved PRs can be converted to a PO.`,
        },
      });
    }

    const purchase_order_no = await generatePONumber(req.user._id);

    // Create PO first to get its _id for items
    const order = await PurchaseOrder.create({
      user_id: req.user._id,
      purchase_order_no,
      purchase_order_date,
      purchase_request_no: purchase_request_no.trim(),
      location_type: location_type || null,
      supplier_id: supplier_id || null,
      expected_delivery_date,
      delivery_address: delivery_address || null,
      contact_person_name: contact_person_name || null,
      additional_charges,
      deduction_amount,
      payment_term: payment_term || null,
      terms_condition_id: terms_condition_id || null,
      remark: remark || null,
    });

    // Build and insert items with calculated totals
    const { itemDocs, subtotal } = await buildItemDocs(
      items,
      req.user._id,
      order._id,
    );
    await PurchaseOrderItem.insertMany(itemDocs);

    // Store computed totals on the PO
    const grand_total = parseFloat(
      (subtotal + additional_charges - deduction_amount).toFixed(2),
    );

    order.subtotal = subtotal;
    order.grand_total = grand_total;
    await order.save();

    return res.status(201).json({
      success: true,
      message: `Purchase order ${purchase_order_no} created successfully.`,
      data: { order },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/purchase-orders/:id
 * Only editable when status is "draft".
 * Recalculates totals if items or charges are updated.
 */
const update = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const order = await PurchaseOrder.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Purchase order not found." });
    }

    if (order.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: `Cannot edit a purchase order with status '${order.status}'. Only draft orders can be edited.`,
      });
    }

    const {
      user_id: _u,
      purchase_request_no: _pr,
      items,
      ...safeBody
    } = req.body;
    Object.assign(order, safeBody);

    // Recalculate if items provided
    if (items && items.length > 0) {
      await PurchaseOrderItem.deleteMany({ purchase_order_id: order._id });
      const { itemDocs, subtotal } = await buildItemDocs(
        items,
        req.user._id,
        order._id,
      );
      await PurchaseOrderItem.insertMany(itemDocs);

      order.subtotal = subtotal;
      order.grand_total = parseFloat(
        (
          subtotal +
          (order.additional_charges || 0) -
          (order.deduction_amount || 0)
        ).toFixed(2),
      );
    } else if (
      req.body.additional_charges !== undefined ||
      req.body.deduction_amount !== undefined
    ) {
      // Recalculate grand total if charges changed without item update
      order.grand_total = parseFloat(
        (
          order.subtotal +
          (order.additional_charges || 0) -
          (order.deduction_amount || 0)
        ).toFixed(2),
      );
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Purchase order updated successfully.",
      data: { order },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/purchase-orders/:id/status
 * Advances PO through status flow.
 * Enforces valid transitions: draft→sent→acknowledged→completed|cancelled
 */
const updateStatus = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const order = await PurchaseOrder.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Purchase order not found." });
    }

    const { status } = req.body;
    const allowed = VALID_TRANSITIONS[order.status];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot move from '${order.status}' to '${status}'. Allowed transitions: ${allowed.join(", ") || "none"}.`,
      });
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Purchase order status updated to '${status}'.`,
      data: { order },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/purchase-orders/:id
 * Only deletable when status is "draft".
 */
const softDelete = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const order = await PurchaseOrder.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Purchase order not found." });
    }

    if (order.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: `Cannot delete a purchase order with status '${order.status}'. Only draft orders can be deleted.`,
      });
    }

    // Check if any MR references this PO
    try {
      const MaterialsReceived = require("../materials-received/materials-received.model");
      const mrExists = await MaterialsReceived.exists({
        user_id: req.user._id,
        purchase_order_no: order.purchase_order_no,
      });
      if (mrExists) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot delete. Materials have already been received against this purchase order.",
        });
      }
    } catch (_) {
      // MR feature not yet loaded — skip check
    }

    await PurchaseOrderItem.deleteMany({ purchase_order_id: order._id });
    await order.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Purchase order deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getOne, create, update, updateStatus, softDelete };
