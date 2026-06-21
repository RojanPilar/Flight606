const express = require("express");
const notificationController = require("../controllers/notification");
const { verify, verifyAdmin } = require("../auth");
const router = express.Router();

// USER LEVEL ACCESS
router.get("/my-notifications", verify, notificationController.getMyNotificationsUser);

router.post("/my-notifications-guest", notificationController.getMyNotificationsGuest);

router.patch("/mark-as-read/:id", verify, notificationController.markAsRead);

router.patch("/mark-all-as-read", verify, notificationController.markAllAsReadUser);

// ADMIN LEVEL ACCESS
router.get("/get-all-notifications", verify, verifyAdmin, notificationController.getAllNotifications);

router.patch("/deactivate-notification/:id", verify, verifyAdmin, notificationController.deactivateNotification);

module.exports = router;