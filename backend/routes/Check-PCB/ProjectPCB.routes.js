const express = require("express");

const router = express.Router();

module.exports = (io) => {
  const controller =
    require("../../controllers/Check-PCB/ProjectPCB.controller")(io);
  const { requireSession } = require("../../middleware/license.js");

  router.post("/Add-item", requireSession(), controller.addItem);

  router.put("/Edit-item/:id", requireSession(), controller.editItem);

  router.delete("/Delete-item/:id", requireSession(), controller.deleteItem);

  return router;
};
