const express = require("express");
const router = express.Router();

module.exports = (io) => {
  const controller =
    require("../../controllers/Manufacture/ManufactureCounting.controller.js")(
      io,
    );

  router.post("/Add-item", controller.addItem);

  router.delete("/Delete-item-history/:id", controller.deleteItemHistory);

  return router;
};
