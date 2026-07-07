const express = require("express");
const router = express.Router();

module.exports = (io) => {
  const controller =
    require("../../controllers/Check-QC/SettingPCB-QC.controller.js")(io);
  router.post("/Add-item", controller.addItem);

  router.put("/Edit-item/:id", controller.editItem);

  router.put("/apply-align/:id", controller.applyAlign);

  router.put("/Delete-item/:id", controller.deleteItem);

  return router;
};
