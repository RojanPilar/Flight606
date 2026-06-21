const express = require("express");
const itineraryController = require("../controllers/itinerary");
const { verify, verifyAdmin } = require("../auth");
const router = express.Router();

// USER LEVEL ACCESS
router.post("/create-itinerary", verify, itineraryController.createItineraryUser);

router.post("/create-itinerary-guest", itineraryController.createItineraryGuest);

router.get("/my-itineraries", verify, itineraryController.getMyItinerariesUser);

router.post("/my-itineraries-guest", itineraryController.getMyItinerariesGuest);

router.get("/get-itinerary/:id", verify, itineraryController.getItineraryById);

router.patch("/add-booking/:id", verify, itineraryController.addBookingToItinerary);

router.patch("/remove-booking/:id", verify, itineraryController.removeBookingFromItinerary);

// ADMIN LEVEL ACCESS
router.get("/get-all-itineraries", verify, verifyAdmin, itineraryController.getAllItineraries);

router.patch("/deactivate-itinerary/:id", verify, verifyAdmin, itineraryController.deactivateItinerary);

router.patch("/reactivate-itinerary/:id", verify, verifyAdmin, itineraryController.reactivateItinerary);

module.exports = router;