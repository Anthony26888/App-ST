const express = require("express");
const router = express.Router();

module.exports = (io) => {
  const { upload } = require("../../middleware/upload.js");
  const controller =
    require("../../controllers/Project/Customer.controller.js")(io);

  router.post("/Add-item", controller.addItem);

  router.put("/Edit-item/:id", controller.editItem);

  router.delete("/Delete-item/:id", controller.deleteItem);

  router.get("/Upload-file", upload.single("file"), controller.upload);

  return router;
};
