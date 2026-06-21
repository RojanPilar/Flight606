const express = require("express");
const bookingController = require("../controllers/booking");
const { verify, verifyAdmin } = require("../auth");
const router = express.Router();


// USER LEVEL ACCESS
router.post("/user/create-booking", verify, bookingController.createBookingUser);

router.post("/guest/create-booking", bookingController.createBookingGuest);

router.get("/user/my-bookings", verify, bookingController.getMyBookingsUser);

router.post("/guest/my-bookings", bookingController.getMyBookingsGuest);

router.post("/guest/secure-lookup", bookingController.secureGuestLookup);

router.get("/get-booking/:bookingReference", bookingController.getBookingByReference);

router.patch("/user/cancel-booking/:bookingReference", verify, bookingController.cancelBookingUser);

router.patch("/guest/cancel-booking/:bookingReference", bookingController.cancelBookingGuest);

router.patch("/user/update-booking/:bookingReference", verify, bookingController.rescheduleBookingUser);

router.patch("/user/check-in/:bookingReference", verify, bookingController.checkInBookingUser);

router.patch("/guest/check-in/:bookingReference", bookingController.checkInBookingGuest);

// ADMIN LEVEL ACCESS
router.get("/get-all-bookings", verify, verifyAdmin, bookingController.getAllBookings);

router.patch("/update-booking/:id", verify, verifyAdmin, bookingController.updateBooking);

router.patch("/update-booking-status/:id", verify, verifyAdmin, bookingController.updateBookingStatus);

router.patch("/deactivate-booking/:id", verify, verifyAdmin, bookingController.deactivateBooking);

router.patch("/reactivate-booking/:id", verify, verifyAdmin, bookingController.reactivateBooking);


module.exports = router;