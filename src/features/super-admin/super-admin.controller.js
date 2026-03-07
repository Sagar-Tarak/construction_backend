const jwt = require("jsonwebtoken");
const SuperAdmin = require("./super-admin.model");
const User = require("../auth/models/user.model");

// POST /api/super-admin/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const superAdmin = await SuperAdmin.findOne({ email }).select("+password");

    if (!superAdmin || !superAdmin.active) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const match = await superAdmin.comparePassword(password);
    if (!match) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign(
      { id: superAdmin._id, type: "superadmin" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    );

    res.json({
      success: true,
      data: {
        token,
        superAdmin: {
          _id: superAdmin._id,
          name: superAdmin.name,
        },
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/super-admin/me
const getMe = async (req, res) => {
  res.json({ success: true, data: { superAdmin: req.superAdmin } });
};

// GET /api/super-admin/companies
const getCompanies = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.registration_status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [companies, total] = await Promise.all([
      User.find(filter)
        .select(
          "company_name user_email phone business_address state gst_no pan_no registration_status rejection_reason approved_at created_at",
        )
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        companies,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/super-admin/companies/:id
const getCompany = async (req, res) => {
  try {
    const company = await User.findById(req.params.id).select(
      "company_name user_email phone business_address state gst_no pan_no registration_status rejection_reason approved_at created_at",
    );

    if (!company)
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });

    res.json({ success: true, data: { company } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/super-admin/companies/:id/approve
const approveCompany = async (req, res) => {
  try {
    const company = await User.findById(req.params.id);
    if (!company)
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });

    if (company.registration_status === "approved") {
      return res
        .status(400)
        .json({ success: false, message: "Company is already approved" });
    }

    company.registration_status = "approved";
    company.approved_at = new Date();
    company.approved_by = req.superAdmin._id;
    company.rejection_reason = undefined;
    await company.save();

    res.json({
      success: true,
      message: "Company approved successfully",
      data: { company },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/super-admin/companies/:id/reject
const rejectCompany = async (req, res) => {
  try {
    const company = await User.findById(req.params.id);
    if (!company)
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });

    if (company.registration_status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Cannot reject an approved company. Suspend instead.",
      });
    }

    const rejectionReason = (req.body.rejection_reason || "").trim();
    if (!rejectionReason.length) {
      return res.status(400).json({
        success: false,
        message: "rejection_reason is required and cannot be empty",
      });
    }

    company.rejection_reason = rejectionReason;
    company.registration_status = "rejected";
    await company.save();

    res.json({
      success: true,
      message: "Company registration rejected",
      data: { company },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/super-admin/companies/:id/suspend
const suspendCompany = async (req, res) => {
  try {
    const company = await User.findById(req.params.id);
    if (!company)
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });

    if (company.registration_status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Only approved companies can be suspended",
      });
    }

    company.registration_status = "suspended";
    company.rejection_reason = req.body.reason || undefined;
    await company.save();

    res.json({
      success: true,
      message: "Company suspended",
      data: { company },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/super-admin/companies/:id/reactivate
const reactivateCompany = async (req, res) => {
  try {
    const company = await User.findById(req.params.id);
    if (!company)
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });

    if (company.registration_status !== "suspended") {
      return res.status(400).json({
        success: false,
        message: "Only suspended companies can be reactivated",
      });
    }

    company.registration_status = "approved";
    company.rejection_reason = undefined;
    await company.save();

    res.json({
      success: true,
      message: "Company reactivated",
      data: { company },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  login,
  getMe,
  getCompanies,
  getCompany,
  approveCompany,
  rejectCompany,
  suspendCompany,
  reactivateCompany,
};
