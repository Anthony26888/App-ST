const express = require("express");
const { requireAuthStrict } = require("../../middleware/auth.js");
const router = express.Router();

module.exports = (io) => {
  const controller =
    require("../../controllers/Check-QC/Pickplace-BomQC.controller.js")(io);

  router.put("/Edit-item-status/:id",
    requireAuthStrict, controller.editItemStatus);

  router.put("/Cancel-item-status/:id",
    requireAuthStrict, controller.cancelItemStatus);

  router.put("/Change-all-status/:id",
    requireAuthStrict, controller.changeAllStatus);

  router.put("/Edit-offset/:id",
    requireAuthStrict, controller.editOffset);

  router.delete("/Delete-item-pickplace/:id",
    requireAuthStrict, controller.deleteItemPickplace);

  router.delete("/Delete-item-bom/:id",
    requireAuthStrict, controller.deleteItemBom);

  return router;
};
