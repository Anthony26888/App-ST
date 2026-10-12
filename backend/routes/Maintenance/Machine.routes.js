const express = require("express");
const { requireAuthStrict } = require("../../middleware/auth.js");
const router = express.Router();

module.exports = (io) => {
  const { uploadMachine } = require("../../middleware/upload.js");
  const controller =
    require("../../controllers/Maintenance/Machine.controller.js")(io);

  router.post("/Add-item", uploadMachine.single("image"), controller.addItem);

  router.put(
    "/Edit-item/:id",
    requireAuthStrict,
    uploadMachine.single("image"),
    controller.editItem,
  );

  router.delete("/Delete-item/:id",
    requireAuthStrict, controller.deleteItem);

  return router;
};
