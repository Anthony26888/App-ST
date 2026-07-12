const express = require("express");
const router = express.Router();

module.exports = (io) => {
  const controller =
    require("../../controllers/Manufacture/PlanManufacture.controller.js")(io);

  router.post("/Add-item", controller.addItem);

  router.put("/Edit-item/:id", controller.editItem);

  router.put("/Edit-item-line/:id", controller.editItemLine);

  router.delete("/Delete-item/:id", controller.deleteItem);

  return router;
};
