const express = require("express");
const router = express.Router();

module.exports = (io) => {
  const controller =
    require("../../controllers/Maintenance/Maintenance.controller.js")(io);

  router.post("/Add-item", controller.addItem);

  router.put("/Edit-item/:id", controller.editItem);

  router.delete("/Delete-item/:id", controller.deleteItem);

  return router;
};
