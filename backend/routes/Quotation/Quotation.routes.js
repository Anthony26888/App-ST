const express = require("express");
const multer = require("multer");
const { requireAuthStrict } = require("../../middleware/auth.js");
const { requireSession } = require("../../middleware/license.js");

const router = express.Router();
const uploadComponentPrice = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = (io) => {
  const controller =
    require("../../controllers/Quotation/Quotation.controller.js")(io);
  const componentPriceController =
    require("../../controllers/Quotation/QuotationComponentPrice.controller.js")(io);

  // ---------- Customers ----------
  router.get("/Customers", requireAuthStrict, requireSession(), controller.customers);

  // ---------- Price books ----------
  router.get("/PriceBook/List", requireAuthStrict, requireSession(), controller.listPriceBooks);
  router.get("/PriceBook/:id", requireAuthStrict, requireSession(), controller.getPriceBook);
  router.post("/PriceBook/Add", requireAuthStrict, requireSession(), controller.createPriceBook);
  router.put("/PriceBook/Edit/:id", requireAuthStrict, requireSession(), controller.updatePriceBook);
  router.delete("/PriceBook/Delete/:id", requireAuthStrict, requireSession(), controller.deletePriceBook);
  router.put("/PriceBook/:id/PadRates", requireAuthStrict, requireSession(), controller.upsertPadRates);

  router.post("/PriceBook/:id/Group", requireAuthStrict, requireSession(), controller.createGroup);
  router.put("/PriceBook/Group/:groupId", requireAuthStrict, requireSession(), controller.updateGroup);
  router.delete("/PriceBook/Group/:groupId", requireAuthStrict, requireSession(), controller.deleteGroup);

  router.post("/PriceBook/:id/Override", requireAuthStrict, requireSession(), controller.createOverride);
  router.delete("/PriceBook/Override/:overrideId", requireAuthStrict, requireSession(), controller.deleteOverride);

  // ---------- BOM resolver ----------
  router.post("/ResolveBom", requireAuthStrict, requireSession(), controller.resolveBom);

  // ---------- Quotations ----------
  router.get("/Quotes", requireAuthStrict, requireSession(), controller.listQuotes);
  router.post("/Quotes", requireAuthStrict, requireSession(), controller.createQuote);
  router.get("/Quotes/:id", requireAuthStrict, requireSession(), controller.getQuote);
  router.put("/Quotes/:id", requireAuthStrict, requireSession(), controller.updateQuote);
  router.delete("/Quotes/:id", requireAuthStrict, requireSession(), controller.deleteQuote);
  router.post("/Quotes/:id/Clone", requireAuthStrict, requireSession(), controller.cloneQuote);
  router.put("/Quotes/:id/Status", requireAuthStrict, requireSession(), controller.updateStatus);
  router.get("/Quotes/:id/Audit", requireAuthStrict, requireSession(), controller.getAudit);
  router.get("/Quotes/:id/Export", requireAuthStrict, requireSession(), controller.exportQuote);
  router.get(
    "/Quotes/:id/UnmappedExport",
    requireAuthStrict,
    requireSession(),
    controller.exportUnmapped,
  );

  // ---------- Giá linh kiện DigiKey ----------
  router.get(
    "/Quotes/:id/ComponentPrices",
    requireAuthStrict,
    requireSession(),
    componentPriceController.get,
  );
  router.post(
    "/Quotes/:id/ComponentPrices/FetchDigiKey",
    requireAuthStrict,
    requireSession(),
    componentPriceController.fetchDigiKey,
  );
  router.post(
    "/Quotes/:id/ComponentPrices/Import",
    requireAuthStrict,
    requireSession(),
    uploadComponentPrice.single("file"),
    componentPriceController.importManual,
  );
  router.put(
    "/Quotes/:id/ComponentPrices/ExchangeRate",
    requireAuthStrict,
    requireSession(),
    componentPriceController.updateExchangeRate,
  );
  router.delete(
    "/Quotes/:id/ComponentPrices",
    requireAuthStrict,
    requireSession(),
    componentPriceController.remove,
  );
  router.get(
    "/Quotes/:id/ComponentPrices/Export",
    requireAuthStrict,
    requireSession(),
    componentPriceController.export,
  );

  return router;
};
