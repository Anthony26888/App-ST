const express = require("express");
const router = express.Router();

module.exports = (io) => {
  const controller =
    require("../../controllers/Check-QC/Pickplace-BomQC.controller.js")(io);

  router.put("/Edit-item-status/:id", controller.editItemStatus);

  router.put("/Cancel-item-status/:id", controller.cancelItemStatus);

  router.put("/Change-all-status/:id", controller.changeAllStatus);

  router.put("/Edit-offset/:id", controller.editOffset);

  router.delete("/Delete-item-pickplace/:id", controller.deleteItemPickplace);

  router.delete("/Delete-item-bom/:id", controller.deleteItemBom);

  return router;
};
