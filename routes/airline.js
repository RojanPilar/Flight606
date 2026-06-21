const express = require("express");
const airlineController = require("../controllers/airline");
const { verify, verifyAdmin } = require("../auth");
const router = express.Router();

// ADMIN ONLY ACCESS

router.post("/create-airline", verify, verifyAdmin, airlineController.createAirline);

router.get("/get-airline/:id", verify, verifyAdmin, airlineController.getAirlineById);

router.get("/get-all-airlines", verify, verifyAdmin, airlineController.getAllAirlines);

router.patch("/update-airline/:id", verify, verifyAdmin, airlineController.updateAirline);

router.patch("/deactivate-airline/:id", verify, verifyAdmin, airlineController.deactivateAirline);

router.patch("/reactivate-airline/:id", verify, verifyAdmin, airlineController.reactivateAirline);


module.exports = router;