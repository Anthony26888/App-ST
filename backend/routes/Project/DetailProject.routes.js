const express = require("express");
const { requireAuthStrict } = require("../../middleware/auth.js");
const router = express.Router();

module.exports = (io) => {
  const controller =
    require("../../controllers/Project/DetailProject.controller.js")(io);

  router.post("/Add-item",
    requireAuthStrict, controller.addItem);

  router.put("/Edit-item/:id",
    requireAuthStrict, controller.editItem);

  router.delete("/Delete-item/:id",
    requireAuthStrict, controller.deleteItem);

  router.post(
    "/Add-item-schedule-delivery",
    requireAuthStrict,
    controller.addItemScheduleDelivery,
  );

  router.put(
    "/Edit-item-schedule-delivery/:id",
    requireAuthStrict,
    controller.editItemScheduleDelivery,
  );

  router.delete(
    "/Delete-item-schedule-delivery/:id",
    requireAuthStrict,
    controller.deleteItemScheduleDelivery,
  );

  router.put("/Confirm-item/:id",
    requireAuthStrict, controller.confirmItem);

  router.put("/Unconfirm-item/:id",
    requireAuthStrict, controller.unconfirmItem);

  return router;
};
