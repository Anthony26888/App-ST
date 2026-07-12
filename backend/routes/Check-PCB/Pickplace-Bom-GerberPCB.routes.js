const express = require("express");
const router = express.Router();

module.exports = (io) => {
  const { uploadImageMPN } = require("../../middleware/upload.js");
  const controller =
    require("../../controllers/Check-PCB/Pickplace-BomPCB.controller.js")(io);

  router.put("/Edit-item-pickplace/:id", controller.editItemPickplace);

  router.put(
    "/Edit-item-bomhighlight/:id",
    uploadImageMPN.array("image", 10),
    controller.editItemBomHighlight,
  );

  router.put("/Edit-item-offset/:id", controller.editItemOffset);

  router.post(
    "/Add-item-mpntype",
    uploadImageMPN.array("image", 10),
    controller.addItemMpnType,
  );

  router.delete("/Delete-item-pickplace/:id", controller.deleteItemPickplace);

  router.delete(
    "/Delete-item-bomhighlight/:id",
    controller.deleteItemBomHighlight,
  );

  router.delete("/Delete-item-bom/:id", controller.deleteItemBom);

  router.delete(
    "/Delete-item-mpntype-image/:mpn*",
    controller.deleteMpnTypeImage,
  );

  router.delete("/Delete-item-mpntype/:mpn*", controller.deleteMpnType);

  router.delete("/Delete-item-gerber/:id", controller.deleteGerberData);

  return router;
};
