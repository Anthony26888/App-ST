const express = require("express");
const router = express.Router();

module.exports = (io) => {
  const { uploadImageMPN } = require("../../middleware/upload.js");
  const { requireActiveLicense } = require("../../middleware/license.js");
  const controller =
    require("../../controllers/Check-PCB/Pickplace-BomPCB.controller.js")(io);

  router.put("/Edit-item-pickplace/:id",
    requireActiveLicense(),
    controller.editItemPickplace,
  );

  router.put("/Edit-item-bomhighlight/:id",
    requireActiveLicense(),
    uploadImageMPN.array("image", 10),
    controller.editItemBomHighlight,
  );

  router.put("/Edit-item-offset/:id",
    requireActiveLicense(),
    controller.editItemOffset,
  );

  router.post("/Add-item-mpntype",
    uploadImageMPN.array("image", 10),
    requireActiveLicense(),
    controller.addItemMpnType,
  );

  router.delete("/Delete-item-pickplace/:id",
    requireActiveLicense(),
    controller.deleteItemPickplace,
  );

  router.delete("/Delete-item-bomhighlight/:id",
    requireActiveLicense(),
    controller.deleteItemBomHighlight,
  );

  router.delete("/Delete-item-bom/:id",
    requireActiveLicense(),
    controller.deleteItemBom,
  );

  router.delete("/Delete-item-mpntype-image/:mpn*",
    requireActiveLicense(),
    controller.deleteMpnTypeImage,
  );

  router.delete("/Delete-item-mpntype/:mpn*",
    requireActiveLicense(),
    controller.deleteMpnType,
  );

  router.delete("/Delete-item-gerber/:id",
    requireActiveLicense(),
    controller.deleteGerberData,
  );

  return router;
};
