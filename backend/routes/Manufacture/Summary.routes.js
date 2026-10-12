const express = require("express");
const { requireAuthStrict } = require("../../middleware/auth.js");
const router = express.Router();

module.exports = (io) => {
  const controller =
    require("../../controllers/Manufacture/Summary.controller.js")(io);

  router.post("/Add-item",
    requireAuthStrict, controller.addItem);

  router.put("/Edit-item/:id",
    requireAuthStrict, controller.editItem);

  router.delete("/Delete-item/:id",
    requireAuthStrict, controller.deleteItem);

  return router;
};
