const express = require("express");
const { requireAuthStrict } = require("../../middleware/auth.js");
const router = express.Router();

module.exports = (io) => {
  const controller =
    require("../../controllers/Manufacture/ManufactureCounting.controller.js")(
      io,
    );

  router.post("/Add-item",
    requireAuthStrict, controller.addItem);

  router.delete("/Delete-item-history/:id",
    requireAuthStrict, controller.deleteItemHistory);

  return router;
};
