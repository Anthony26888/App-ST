const express = require("express");

const router = express.Router();

module.exports = (io) => {
  const controller =
    require("../../controllers/License/License.controller.js")(io);

  router.post("/Request", controller.request);
  router.post("/Generate-By-Code", controller.generateByCode);
  router.post("/Activate", controller.activate);
  router.get("/List", controller.list);
  router.get("/Info/:username", controller.getInfo);

  return router;
};