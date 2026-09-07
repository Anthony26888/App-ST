const express = require("express");

const router = express.Router();

module.exports = (io) => {
  const controller = require("../../controllers/LCSC/LCSC.controller.js")(io);
  const { requireActiveLicense } = require("../../middleware/license.js");

  router.get(
    "/search/:mpn",
    requireActiveLicense(),
    controller.search,
  );

  return router;
};