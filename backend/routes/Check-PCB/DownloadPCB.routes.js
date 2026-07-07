const express = require("express");

const router = express.Router();

module.exports = (io) => {
  const controller =
    require("../../controllers/Check-PCB/DownloadPCB.controller.js")(io);

  router.get("/download-pickplace-all/:id", controller.downloadPickplaceAll);

  router.get("/download-pickplace-top/:id", controller.downloadPickplaceTop);

  router.get(
    "/download-pickplace-bottom/:id",
    controller.downloadPickplaceBottom,
  );

  router.get("/download-bom-highlight/:id", controller.downloadBomHighlight);

  return router;
};
