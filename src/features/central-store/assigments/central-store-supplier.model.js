const mongoose = require("mongoose");

const centralStoreSupplierSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    store_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CentralStore",
      required: true,
    },
    supplier_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
  },
  { timestamps: true },
);

centralStoreSupplierSchema.index(
  { store_id: 1, supplier_id: 1 },
  { unique: true },
);
centralStoreSupplierSchema.index({ user_id: 1 });
centralStoreSupplierSchema.index({ store_id: 1 });
centralStoreSupplierSchema.index({ supplier_id: 1 }); // used by supplier softDelete ref check

module.exports = mongoose.model(
  "CentralStoreSupplier",
  centralStoreSupplierSchema,
);
