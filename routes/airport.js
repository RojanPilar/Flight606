const express = require("express");
const airportController = require("../controllers/airport");
const { verify, verifyAdmin } = require("../auth");
const router = express.Router();

// USER LEVEL ACCESS

router.get("/get-airport/:id", airportController.getAirportById);

router.get("/get-all-airports", airportController.getAllAirports);


// ADMIN LEVEL ACCESS

router.post("/create-airport", verify, verifyAdmin, airportController.createAirport);

router.patch("/deactivate-airport/:id", verify, verifyAdmin, airportController.deactivateAirport);

router.patch("/reactivate-airport/:id", verify, verifyAdmin, airportController.reactivateAirport);


module.exports = router;