const express = require("express");
const router = express.Router();
const seatController = require("../controllers/seat");
const { verify, verifyAdmin } = require("../auth");


// USER LEVEL ACCESS

router.get("/get-seats-by-flight/:flightId", seatController.getSeatsByFlight);

router.get("/get-seat/:id", verify, seatController.getSeatById);


// ADMIN LEVEL ACCESS

router.get("/get-all-seats", verify, verifyAdmin, seatController.getAllSeats);

router.patch("/update-seat-status/:id", verify, verifyAdmin, seatController.updateSeatStatus);

router.patch("/deactivate-seat/:id", verify, verifyAdmin, seatController.deactivateSeat);

router.patch("/reactivate-seat/:id", verify, verifyAdmin, seatController.reactivateSeat);


module.exports = router;