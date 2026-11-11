const express = require("express");
const { requireAuthStrict } = require("../../middleware/auth.js");

const router = express.Router();

module.exports = () => {
  const controller = require("../../controllers/Purchase/Purchase.controller.js")();

  router.get("/Projects", requireAuthStrict, controller.listProjects);
  router.post("/Projects", requireAuthStrict, controller.createProject);
  router.get("/Projects/:id", requireAuthStrict, controller.getProject);
  router.put("/Projects/:id", requireAuthStrict, controller.updateProject);
  router.delete("/Projects/:id", requireAuthStrict, controller.deleteProject);
  router.get("/Projects/:id/Export", requireAuthStrict, controller.exportProject);
  router.post(
    "/Projects/:id/FetchDigiKey",
    requireAuthStrict,
    controller.fetchDigiKey,
  );

  router.post(
    "/Bom/FetchDigiKeyPreview",
    requireAuthStrict,
    controller.previewFetchDigiKey,
  );
  router.post("/Bom/Consolidate", requireAuthStrict, controller.consolidateBom);
  router.post(
    "/Quotes/Consolidate",
    requireAuthStrict,
    controller.consolidateQuotes,
  );
  router.get(
    "/FetchDigiKey/:jobId",
    requireAuthStrict,
    controller.fetchDigiKeyJob,
  );

  return router;
};
