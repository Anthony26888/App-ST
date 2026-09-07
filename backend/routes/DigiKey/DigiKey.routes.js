const express = require("express");

const router = express.Router();

module.exports = (io) => {
  const controller =
    require("../../controllers/DigiKey/DigiKey.controller.js")(io);
  const { requireActiveLicense } = require("../../middleware/license.js");

  router.post("/token", requireActiveLicense(), controller.token);
  router.get("/search/:mpn/productdetails", requireActiveLicense(), controller.search);
  router.get("/image", requireActiveLicense(), controller.image);

  return router;
};