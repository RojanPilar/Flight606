const express = require("express");
const passengerController = require("../controllers/passenger");
const { verify, verifyAdmin } = require("../auth");
const router = express.Router();


// USER LEVEL ACCESS
router.post("/user/create-passenger", verify, passengerController.createPassengerUser);

router.post("/guest/create-passenger", passengerController.createPassengerGuest);

router.get("/user/my-passengers", verify, passengerController.getMyPassengers);

router.post("/guest/get-passenger", passengerController.getPassengerForGuest);

router.patch("/user/update-passenger/:id", verify, passengerController.updatePassenger);

router.patch("/guest/update-passenger", passengerController.updatePassengerAsGuest);


// ADMIN LEVEL ACCESS
router.get("/get-all-passengers", verify, verifyAdmin, passengerController.getAllPassengers);

router.get("/get-passenger/:id", verify, verifyAdmin, passengerController.getPassengerById);

router.put("/admin-update-passenger/:id", verify, verifyAdmin, passengerController.adminUpdatePassenger);

router.patch("/activate-passenger/:id", verify, verifyAdmin, passengerController.activatePassenger);

router.patch("/deactivate-passenger/:id", verify, verifyAdmin, passengerController.deactivatePassenger);


module.exports = router;