const express = require("express");
const router = express.Router();

module.exports = (io) => {
  const { uploadImageQC, uploadPnP } = require("../../middleware/upload.js");
  const controller =
    require("../../controllers/Check-QC/UploadQC.controller.js")(io);

  router.post(
    "/upload-bom-qc/:id",
    uploadPnP.single("FileBom"),
    controller.uploadBomQc,
  );
  router.post(
    "/upload-pickplace-qc/:id",
    uploadPnP.single("FilePnP"),
    controller.uploadPickplaceQc,
  );

  router.put(
    "/Upload-file-top/:id",
    uploadImageQC.single("fileTop"),
    controller.uploadFileTop,
  );

  router.put(
    "/Upload-file-bottom/:id",
    uploadImageQC.single("fileBottom"),
    controller.uploadFileBottom,
  );

  router.put(
    "/Upload-image-sample-top/:id",
    uploadImageQC.single("imageSampleTop"),
    controller.uploadImageSampleTop,
  );

  router.put(
    "/Upload-image-sample-bottom/:id",
    uploadImageQC.single("imageSampleBottom"),
    controller.uploadImageSampleBottom,
  );

  return router;
};
