const express = require("express");
const router = express.Router();

module.exports = (io) => {
  const controller =
    require("../../controllers/Project/DetailProject.controller.js")(io);

  router.post("/Add-item", controller.addItem);

  router.put("/Edit-item/:id", controller.editItem);

  router.delete("/Delete-item/:id", controller.deleteItem);

  router.post(
    "/Add-item-schedule-delivery",
    controller.addItemScheduleDelivery,
  );

  router.put(
    "/Edit-item-schedule-delivery/:id",
    controller.editItemScheduleDelivery,
  );

  router.delete(
    "/Delete-item-schedule-delivery/:id",
    controller.deleteItemScheduleDelivery,
  );

  router.put("/Confirm-item/:id", controller.confirmItem);

  return router;
};
