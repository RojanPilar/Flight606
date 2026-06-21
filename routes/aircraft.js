const express = require("express");
const aircraftController = require("../controllers/aircraft");
const { verify, verifyAdmin } = require("../auth");
const router = express.Router();

// ADMIN ONLY ACCESS

router.post("/create-aircraft", verify, verifyAdmin, aircraftController.createAircraft);

router.get("/get-aircraft/:id", verify, verifyAdmin, aircraftController.getAircraftById);

router.get("/get-all-aircraft", verify, verifyAdmin, aircraftController.getAllAircraft);

router.patch("/update-aircraft/:id", verify, verifyAdmin, aircraftController.updateAircraft);

router.patch("/deactivate-aircraft/:id", verify, verifyAdmin, aircraftController.deactivateAircraft);

router.patch("/reactivate-aircraft/:id", verify, verifyAdmin, aircraftController.reactivateAircraft);


module.exports = router;