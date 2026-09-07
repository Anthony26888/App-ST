const express = require("express");
const router = express.Router();

module.exports = (io) => {
  const { uploadPnP } = require("../../middleware/upload.js");
  const { requireActiveLicense } = require("../../middleware/license.js");
  const controller =
    require("../../controllers/Check-PCB/UploadPCB.controller.js")(io);

  router.post(
    "/upload-bom-pcb/:project_id",
    uploadPnP.single("FileBom"),
    requireActiveLicense(),
    controller.uploadBomPCB,
  );
  router.post(
    "/upload-pickplace-pcb/:id",
    uploadPnP.single("FilePnP"),
    requireActiveLicense(),
    controller.uploadPickplacePCB,
  );
  router.post(
    "/upload-bom-highlight/:id",
    uploadPnP.single("FileBomMountType"),
    requireActiveLicense(),
    controller.uploadBomHighlight,
  );
  return router;
};
