const express = require("express");
const { requireAuthStrict } = require("../../middleware/auth.js");
const router = express.Router();

module.exports = (io) => {
  const { uploadImageQC, uploadPnP } = require("../../middleware/upload.js");
  const controller =
    require("../../controllers/Check-QC/UploadQC.controller.js")(io);

  router.post(
    "/upload-bom-qc/:id",
    requireAuthStrict,
    uploadPnP.single("FileBom"),
    controller.uploadBomQc,
  );
  router.post(
    "/upload-pickplace-qc/:id",
    requireAuthStrict,
    uploadPnP.single("FilePnP"),
    controller.uploadPickplaceQc,
  );

  router.put(
    "/Upload-file-top/:id",
    requireAuthStrict,
    uploadImageQC.single("fileTop"),
    controller.uploadFileTop,
  );

  router.put(
    "/Upload-file-bottom/:id",
    requireAuthStrict,
    uploadImageQC.single("fileBottom"),
    controller.uploadFileBottom,
  );

  router.put(
    "/Upload-image-sample-top/:id",
    requireAuthStrict,
    uploadImageQC.single("imageSampleTop"),
    controller.uploadImageSampleTop,
  );

  router.put(
    "/Upload-image-sample-bottom/:id",
    requireAuthStrict,
    uploadImageQC.single("imageSampleBottom"),
    controller.uploadImageSampleBottom,
  );

  return router;
};
