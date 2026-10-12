const express = require("express");
const { requireAuthStrict } = require("../../middleware/auth.js");
const router = express.Router();

module.exports = (io) => {
  const controller =
    require("../../controllers/Check-QC/SettingPCB-QC.controller.js")(io);
  router.post("/Add-item",
    requireAuthStrict, controller.addItem);

  router.put("/Edit-item/:id",
    requireAuthStrict, controller.editItem);

  router.put("/apply-align/:id",
    requireAuthStrict, controller.applyAlign);

  router.put("/Delete-item/:id",
    requireAuthStrict, controller.deleteItem);

  return router;
};
