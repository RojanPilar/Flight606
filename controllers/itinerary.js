const mongoose = require("mongoose");
const Itinerary = require("../models/Itinerary");
const Booking = require("../models/Booking");
const { createNotification } = require("./notification");
const { errorHandler } = require("../auth");


// USER LEVEL ACCESS

module.exports.createItineraryUser = async (req, res) => {
    try {
        const { bookings } = req.body;
        
        // Ensure bookings exist
        if (!bookings || bookings.length === 0) {
            return res.status(400).send({ message: "At least one booking is required." });
        }

        // Validate each booking before creating the itinerary
        for (const segment of bookings) {
            const booking = await Booking.findOne({
                _id: segment.bookingId,
                userId: req.user.id,
                isActive: true
            });

            if (!booking) throw new Error(`Booking ${segment.bookingId} not found.`);
            if (booking.status !== "confirmed") {
                throw new Error(`Booking ${segment.bookingId} is not confirmed yet.`);
            }
        }

        // Create the itinerary
        const newItinerary = new Itinerary({
            userId: req.user.id,
            bookings: bookings,
            isActive: true
        });

        const result = await newItinerary.save();
        return res.status(201).send({ message: "Itinerary created!", result });

    } catch (err) {
        console.error("Itinerary Error:", err);
        return res.status(500).send({ message: err.message });
    }
};

module.exports.createItineraryGuest = (req, res) => {
    const { bookings, guestEmail } = req.body;

    if (!guestEmail || !guestEmail.includes("@")) {
        return res.status(400).send({ message: "Valid guest email is required" });
    }
    if (!bookings || bookings.length === 0) {
        return res.status(400).send({ message: "At least one booking is required" });
    }

    const bookingChecks = bookings.map(segment => {
        return Booking.findOne({
            _id: segment.bookingId,
            guestEmail,
            userId: null,
            isActive: true
        })
        .then(booking => {
            if (!booking) {
                throw { status: 404, message: `Booking ${segment.bookingId} not found` };
            }
            if (booking.status !== "confirmed") {
                throw { status: 400, message: `Booking ${segment.bookingId} is not yet confirmed` };
            }
            return booking;
        });
    });

    return Promise.all(bookingChecks)
        .then(() => {
            const newItinerary = new Itinerary({
                userId: null,
                guestEmail,
                bookings,
                isActive: true
            });

            return newItinerary.save()
                .then(result => res.status(201).send({
                    message: "Itinerary created successfully",
                    result
                }));
        })
        .catch(err => errorHandler(err, req, res));
};


module.exports.getMyItinerariesUser = (req, res) => {
    return Itinerary.find({ userId: req.user.id, isActive: true })
        .populate({
            path: "bookings.bookingId",
            populate: {
                path: "flightId",
                populate: [
                    { path: "originAirportId" },
                    { path: "destinationAirportId" },
                    { path: "airlineId" }
                ]
            }
        })
        .then(result => {
            if (result.length === 0) {
                return res.status(404).send({ message: "No itineraries found" });
            }
            return res.status(200).send({
                message: "Itineraries found",
                result
            });
        })
        .catch(err => errorHandler(err, req, res));
};


module.exports.getMyItinerariesGuest = (req, res) => {
    const { guestEmail } = req.body;

    if (!guestEmail || !guestEmail.includes("@")) {
        return res.status(400).send({ message: "Valid guest email is required" });
    }

    return Itinerary.find({ guestEmail, userId: null, isActive: true })
        .populate({
            path: "bookings.bookingId",
            populate: {
                path: "flightId",
                populate: [
                    { path: "originAirportId" },
                    { path: "destinationAirportId" },
                    { path: "airlineId" }
                ]
            }
        })
        .then(result => {
            if (result.length === 0) {
                return res.status(404).send({ message: "No itineraries found" });
            }
            return res.status(200).send({
                message: "Itineraries found",
                result
            });
        })
        .catch(err => errorHandler(err, req, res));
};


module.exports.getItineraryById = (req, res) => {
    return Itinerary.findById(req.params.id)
        .populate({
            path: "bookings.bookingId",
            populate: {
                path: "flightId",
                populate: [
                    { path: "originAirportId" },
                    { path: "destinationAirportId" },
                    { path: "airlineId" }
                ]
            }
        })
        .then(result => {
            if (!result) {
                return res.status(404).send({ message: "Itinerary not found" });
            }
            if (!result.isActive) {
                return res.status(400).send({ message: "Itinerary is inactive" });
            }

            const isOwner = result.userId && String(result.userId) === req.user.id;
            const isGuest = result.guestEmail && result.guestEmail === req.user.email;

            if (!isOwner && !isGuest && !req.user.isAdmin) {
                return res.status(403).send({ message: "Unauthorized to view this itinerary" });
            }

            return res.status(200).send({
                message: "Itinerary found",
                result
            });
        })
        .catch(err => errorHandler(err, req, res));
};


module.exports.addBookingToItinerary = (req, res) => {
    const { bookingId, type, gate } = req.body;

    if (!bookingId) {
        return res.status(400).send({ message: "Booking ID is required" });
    }
    if (!type) {
        return res.status(400).send({ message: "Flight type is required" });
    }

    return Itinerary.findById(req.params.id)
        .then(itinerary => {
            if (!itinerary) {
                return res.status(404).send({ message: "Itinerary not found" });
            }
            if (!itinerary.isActive) {
                return res.status(400).send({ message: "Itinerary is inactive" });
            }
            if (String(itinerary.userId) !== req.user.id) {
                return res.status(403).send({ message: "Unauthorized to update this itinerary" });
            }

            const alreadyAdded = itinerary.bookings.some(
                segment => String(segment.bookingId) === bookingId
            );
            if (alreadyAdded) {
                return res.status(409).send({ message: "Booking already added to this itinerary" });
            }

            return Booking.findOne({
                _id: bookingId,
                userId: req.user.id,
                isActive: true
            })
            .then(booking => {
                if (!booking) {
                    return res.status(404).send({ message: "Booking not found" });
                }
                if (booking.status !== "confirmed") {
                    return res.status(400).send({ message: "Booking is not yet confirmed" });
                }

                return Itinerary.findByIdAndUpdate(
                    req.params.id,
                    {
                        $push: {
                            bookings: { bookingId, type, gate: gate || null }
                        }
                    },
                    { new: true }
                )
                .then(result => res.status(200).send({
                    message: "Booking added to itinerary successfully",
                    result
                }));
            });
        })
        .catch(err => errorHandler(err, req, res));
};


module.exports.removeBookingFromItinerary = (req, res) => {
    const { bookingId } = req.body;

    if (!bookingId) {
        return res.status(400).send({ message: "Booking ID is required" });
    }

    let bookingObjectId;
    try {
        bookingObjectId = new mongoose.Types.ObjectId(bookingId);
    } catch (e) {
        return res.status(400).send({ message: "Invalid Booking ID format" });
    }

    return Itinerary.findById(req.params.id)
        .then(itinerary => {
            if (!itinerary) {
                return res.status(404).send({ message: "Itinerary not found" });
            }
            if (!itinerary.isActive) {
                return res.status(400).send({ message: "Itinerary is inactive" });
            }
            if (String(itinerary.userId) !== req.user.id) {
                return res.status(403).send({ message: "Unauthorized to update this itinerary" });
            }

            const exists = itinerary.bookings.some(
                segment => String(segment.bookingId) === bookingId
            );
            if (!exists) {
                return res.status(404).send({ message: "Booking not found in this itinerary" });
            }

            if (itinerary.bookings.length === 1) {
                return res.status(400).send({ message: "Cannot remove the only booking in an itinerary. Deactivate the itinerary instead." });
            }

            return Itinerary.findByIdAndUpdate(
                req.params.id,
                {
                    $pull: {
                        bookings: { bookingId: bookingObjectId }
                    }
                },
                { new: true }
            )
            .then(result => res.status(200).send({
                message: "Booking removed from itinerary successfully",
                result
            }));
        })
        .catch(err => errorHandler(err, req, res));
};


// ADMIN LEVEL ACCESS

module.exports.getAllItineraries = (req, res) => {
    return Itinerary.find()
        .populate({
            path: "bookings.bookingId",
            populate: {
                path: "flightId",
                populate: [
                    { path: "originAirportId" },
                    { path: "destinationAirportId" },
                    { path: "airlineId" }
                ]
            }
        })
        .then(result => {
            if (result.length === 0) {
                return res.status(404).send({ message: "No itineraries found" });
            }
            return res.status(200).send({
                message: "Itineraries found",
                result
            });
        })
        .catch(err => errorHandler(err, req, res));
};


module.exports.deactivateItinerary = (req, res) => {
    return Itinerary.findById(req.params.id)
        .then(itinerary => {
            if (!itinerary) {
                return res.status(404).send({ message: "Itinerary not found" });
            }
            if (!itinerary.isActive) {
                return res.status(400).send({ message: "Itinerary is already deactivated" });
            }

            return Itinerary.findByIdAndUpdate(
                req.params.id,
                { isActive: false },
                { new: true }
            )
            .then(result => res.status(200).send({
                message: "Itinerary deactivated successfully",
                result
            }));
        })
        .catch(err => errorHandler(err, req, res));
};


module.exports.reactivateItinerary = (req, res) => {
    return Itinerary.findById(req.params.id)
        .then(itinerary => {
            if (!itinerary) {
                return res.status(404).send({ message: "Itinerary not found" });
            }
            if (itinerary.isActive) {
                return res.status(400).send({ message: "Itinerary is already active" });
            }

            return Itinerary.findByIdAndUpdate(
                req.params.id,
                { isActive: true },
                { new: true }
            )
            .then(result => res.status(200).send({
                message: "Itinerary reactivated successfully",
                result
            }));
        })
        .catch(err => errorHandler(err, req, res));
};