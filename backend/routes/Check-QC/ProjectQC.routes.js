const express = require("express");
const { requireAuthStrict } = require("../../middleware/auth.js");

const router = express.Router();

module.exports = (io) => {
  const ProjectQCController =
    require("../../controllers/Check-QC/ProjectQC.controller")(io);

  router.post("/Add-item",
    requireAuthStrict, ProjectQCController.addItem);

  router.put("/Edit-item/:id",
    requireAuthStrict, ProjectQCController.editItem);

  router.delete("/Delete-item/:id",
    requireAuthStrict, ProjectQCController.deleteItem);

  return router;
};
