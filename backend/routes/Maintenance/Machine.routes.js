const express = require("express");
const router = express.Router();

module.exports = (io) => {
  const { uploadMachine } = require("../../middleware/upload.js");
  const controller =
    require("../../controllers/Maintenance/Machine.controller.js")(io);

  router.post("/Add-item", uploadMachine.single("image"), controller.addItem);

  router.put(
    "/Edit-item/:id",
    uploadMachine.single("image"),
    controller.editItem,
  );

  router.delete("/Delete-item/:id", controller.deleteItem);

  return router;
};
