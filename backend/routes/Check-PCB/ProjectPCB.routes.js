const express = require("express");
const { requireAuthStrict } = require("../../middleware/auth.js");

const router = express.Router();

module.exports = (io) => {
  const controller =
    require("../../controllers/Check-PCB/ProjectPCB.controller")(io);
  const { requireSession } = require("../../middleware/license.js");

  router.post("/Add-item",
    requireAuthStrict, requireSession(), controller.addItem);

  router.put("/Edit-item/:id",
    requireAuthStrict, requireSession(), controller.editItem);

  router.delete("/Delete-item/:id",
    requireAuthStrict, requireSession(), controller.deleteItem);

  return router;
};
