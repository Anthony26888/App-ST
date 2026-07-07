const express = require("express");

const router = express.Router();

module.exports = (io) => {
  const ProjectQCController =
    require("../../controllers/Check-QC/ProjectQC.controller")(io);

  router.post("/Add-item", ProjectQCController.addItem);

  router.put("/Edit-item/:id", ProjectQCController.editItem);

  router.delete("/Delete-item/:id", ProjectQCController.deleteItem);

  return router;
};
