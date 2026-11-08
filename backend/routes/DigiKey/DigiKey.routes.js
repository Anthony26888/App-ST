const express = require("express");
const { requireAuthStrict } = require("../../middleware/auth.js");

const router = express.Router();

module.exports = (io) => {
  const controller =
    require("../../controllers/DigiKey/DigiKey.controller.js")(io);
  const oauthController =
    require("../../controllers/DigiKey/DigiKeyOAuth.controller.js")();
  const { requireActiveLicense } = require("../../middleware/license.js");

  router.post("/token",
    requireAuthStrict, requireActiveLicense(), controller.token);
  router.get("/search/:mpn/productdetails", requireActiveLicense(), controller.search);
  router.get("/image", requireActiveLicense(), controller.image);

  // OAuth 3-legged cho MyLists
  router.get("/OAuth/Start", requireAuthStrict, oauthController.start);
  router.get("/OAuth/Callback", oauthController.callback);
  router.get("/OAuth/Status", requireAuthStrict, oauthController.status);
  router.post("/OAuth/Disconnect", requireAuthStrict, oauthController.disconnect);

  return router;
};