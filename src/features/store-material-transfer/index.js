const router = require("./store-material-transfer.routes");
const StoreMaterialTransfer = require("./store-material-transfer.model");
const StoreMaterialTransferItem = require("./store-material-transfer-item.model");

module.exports = {
  storeMaterialTransferRoutes: router,
  StoreMaterialTransfer,
  StoreMaterialTransferItem,
};
