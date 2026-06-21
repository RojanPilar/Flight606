const Booking = require("../models/Booking");
const Flight = require("../models/Flight");
const Seat = require("../models/Seat");
const BookingPassenger = require("../models/BookingPassenger");
const { errorHandler } = require("../auth");
const { createNotification } = require("./notification");

// USER LEVEL ACCESS

module.exports.createBookingUser = (req, res) => {
    const { flightId, seatId } = req.body;

    if (!flightId) {
        return res.status(400).send({ message: "Flight ID is required" });
    }
    if (!seatId) {
        return res.status(400).send({ message: "Seat ID is required" });
    }

    return Flight.findById(flightId)
        .then(flight => {
            if (!flight) {
                return res.status(404).send({ message: "Flight not found" });
            }
            if (!flight.isActive) {
                return res.status(400).send({ message: "Cannot book an inactive flight" });
            }

            return Seat.findById(seatId)
                .then(seat => {
                    if (!seat) {
                        return res.status(404).send({ message: "Seat not found" });
                    }
                    if (String(seat.flightId) !== String(flightId)) {
                        return res.status(400).send({ message: "Seat does not belong to this flight" });
                    }
                    if (!seat.isActive) {
                        return res.status(400).send({ message: "Seat is not available" });
                    }
                    if (seat.isOccupied) {
                        return res.status(409).send({ message: "Seat is already occupied" });
                    }

                    const totalAmount = seat.class === "business"
                        ? flight.businessPrice
                        : flight.basePrice;

                    const bookingReference = "F606-" + Date.now();

                    return Booking.findOne({ bookingReference })
                        .then(existingBooking => {
                            if (existingBooking) {
                                return res.status(409).send({ message: "Booking Reference already exists" });
                            }

                            const newBooking = new Booking({
                                userId: req.user.id,
                                guestEmail: null,
                                flightId,
                                bookingReference,
                                status: "pending",
                                totalAmount,
                                isActive: true
                            });

                            return newBooking.save()
                                .then(result => {
                                    return res.status(201).send({
                                        message: "Booking created successfully",
                                        bookingReference: result.bookingReference,
                                        bookingId: result._id,
                                        flight: {
                                            flightNumber: flight.flightNumber,
                                            departureTime: flight.departureTime,
                                            arrivalTime: flight.arrivalTime,
                                            status: flight.status
                                        },
                                        seatClass: seat.class,
                                        totalAmount: result.totalAmount,
                                        status: result.status
                                    });
                                });
                        });
                });
        })
        .catch(err => errorHandler(err, req, res));
};


module.exports.createBookingGuest = (req, res) => {
    const { flightId, seatId, guestEmail } = req.body;

    if (!guestEmail || !guestEmail.includes("@")) {
        return res.status(400).send({ message: "Valid guest email is required" });
    }
    if (!flightId) {
        return res.status(400).send({ message: "Flight ID is required" });
    }
    if (!seatId) {
        return res.status(400).send({ message: "Seat ID is required" });
    }

    return Flight.findById(flightId)
        .then(flight => {
            if (!flight) {
                return res.status(404).send({ message: "Flight not found" });
            }
            if (!flight.isActive) {
                return res.status(400).send({ message: "Cannot book an inactive flight" });
            }

            return Seat.findById(seatId)
                .then(seat => {
                    if (!seat) {
                        return res.status(404).send({ message: "Seat not found" });
                    }
                    if (String(seat.flightId) !== String(flightId)) {
                        return res.status(400).send({ message: "Seat does not belong to this flight" });
                    }
                    if (!seat.isActive) {
                        return res.status(400).send({ message: "Seat is not available" });
                    }
                    if (seat.isOccupied) {
                        return res.status(409).send({ message: "Seat is already occupied" });
                    }

                    const totalAmount = seat.class === "business"
                        ? flight.businessPrice
                        : flight.basePrice;

                    const bookingReference = "F606-" + Date.now();

                    return Booking.findOne({ bookingReference })
                        .then(existingBooking => {
                            if (existingBooking) {
                                return res.status(409).send({ message: "Booking Reference already exists" });
                            }

                            const newBooking = new Booking({
                                userId: null,
                                guestEmail,
                                flightId,
                                bookingReference,
                                status: "pending",
                                totalAmount,
                                isActive: true
                            });

                            return newBooking.save()
                                .then(result => {
                                    return res.status(201).send({
                                        message: "Booking created successfully",
                                        bookingReference: result.bookingReference,
                                        bookingId: result._id,
                                        flight: {
                                            flightNumber: flight.flightNumber,
                                            departureTime: flight.departureTime,
                                            arrivalTime: flight.arrivalTime,
                                            status: flight.status
                                        },
                                        seatClass: seat.class,
                                        totalAmount: result.totalAmount,
                                        status: result.status
                                    });
                                });
                        });
                });
        })
        .catch(err => errorHandler(err, req, res));
};


module.exports.getMyBookingsUser = (req, res) => {
    return Booking.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .populate({
            path: "flightId",
            populate: [
                { path: "originAirportId" },
                { path: "destinationAirportId" },
                { path: "airlineId" }
            ]
        })
        .then(result => {
            if (result.length === 0) {
                return res.status(404).send({ message: "No bookings found" });
            }
            return res.status(200).send({
                message: "Bookings found",
                bookings: result
            });
        })
        .catch(err => errorHandler(err, req, res));
};


module.exports.getMyBookingsGuest = (req, res) => {
    const { guestEmail } = req.body;

    if (!guestEmail || !guestEmail.includes("@")) {
        return res.status(400).send({ message: "Valid guest email is required" });
    }

    return Booking.find({ guestEmail, userId: null })
        .sort({ createdAt: -1 })
        .populate({
            path: "flightId",
            populate: [
                { path: "originAirportId" },
                { path: "destinationAirportId" },
                { path: "airlineId" }
            ]
        })
        .then(result => {
            if (result.length === 0) {
                return res.status(404).send({ message: "No bookings found" });
            }
            return res.status(200).send({
                message: "Bookings found",
                bookings: result
            });
        })
        .catch(err => errorHandler(err, req, res));
};

module.exports.secureGuestLookup = (req, res) => {
    const { guestEmail, bookingReference } = req.body;

    if (!guestEmail || !bookingReference) {
        return res.status(400).send({ message: "Both Email and Booking Reference are required." });
    }

    return Booking.findOne({ 
        guestEmail, 
        bookingReference, 
        userId: null, 
        isActive: true 
    })
    .populate({
        path: "flightId",
        populate: [
            { path: "originAirportId" },
            { path: "destinationAirportId" },
            { path: "airlineId" }
        ]
    })
    .then(booking => {
        if (!booking) {
            return res.status(404).send({ message: "No matching record found. Please check your details." });
        }
        return res.status(200).send({
            message: "Booking retrieved securely",
            booking
        });
    })
    .catch(err => errorHandler(err, req, res));
};


module.exports.getBookingByReference = (req, res) => {
    return Booking.findOne({
        bookingReference: req.params.bookingReference,
        isActive: true
    })
    .populate({
        path: "flightId",
        populate: [
            { path: "originAirportId" },
            { path: "destinationAirportId" },
            { path: "airlineId" }
        ]
    })
    .then(result => {
        if (!result) {
            return res.status(404).send({ message: "No booking found" });
        }
        return res.status(200).send({
            message: "Booking found",
            result
        });
    })
    .catch(err => errorHandler(err, req, res));
};


module.exports.cancelBookingUser = (req, res) => {
    return Booking.findOneAndUpdate(
        {
            bookingReference: req.params.bookingReference,
            userId: req.user.id,
            status: { $in: ["pending", "confirmed"] }
        },
        {
            status: "cancelled",
            isActive: false
        },
        { new: true }
    )
    .then(result => {
        if (!result) {
            return res.status(404).send({ message: "Booking not found" });
        }

        // Free all seats claimed under this booking
        return BookingPassenger.find({ bookingId: result._id, isActive: true })
            .then(bkps => {
                const seatIds = bkps.map(b => b.seatId);
                return BookingPassenger.updateMany(
                    { bookingId: result._id },
                    { isActive: false }
                )
                .then(() => Seat.updateMany(
                    { _id: { $in: seatIds } },
                    { isOccupied: false }
                ))
                .then(() => res.status(200).send({
                    message: "Booking cancelled successfully",
                    result
                }));
            });
    })
    .catch(err => errorHandler(err, req, res));
};


module.exports.cancelBookingGuest = (req, res) => {
    const { guestEmail } = req.body;

    if (!guestEmail || !guestEmail.includes("@")) {
        return res.status(400).send({ message: "Valid guest email is required" });
    }

    return Booking.findOneAndUpdate(
        {
            bookingReference: req.params.bookingReference,
            guestEmail,
            userId: null,
            status: { $in: ["pending", "confirmed"] }
        },
        {
            status: "cancelled",
            isActive: false
        },
        { new: true }
    )
    .then(result => {
        if (!result) {
            return res.status(404).send({ message: "Booking not found" });
        }

        // Free all seats claimed under this booking
        return BookingPassenger.find({ bookingId: result._id, isActive: true })
            .then(bkps => {
                const seatIds = bkps.map(b => b.seatId);
                return BookingPassenger.updateMany(
                    { bookingId: result._id },
                    { isActive: false }
                )
                .then(() => Seat.updateMany(
                    { _id: { $in: seatIds } },
                    { isOccupied: false }
                ))
                .then(() => res.status(200).send({
                    message: "Booking cancelled successfully",
                    result
                }));
            });
    })
    .catch(err => errorHandler(err, req, res));
};


module.exports.checkInBookingUser = (req, res) => {
    return Booking.findOne({
        bookingReference: req.params.bookingReference,
        userId: req.user.id,
        isActive: true
    })
    .then(booking => {
        if (!booking) {
            return res.status(404).send({ message: "Booking not found or you are unauthorized" });
        }
        if (booking.status !== "confirmed") {
            return res.status(400).send({ message: "Only confirmed bookings can be checked in" });
        }
        if (booking.checkedIn) {
            return res.status(400).send({ message: "This booking is already checked in" });
        }

        return Booking.findByIdAndUpdate(
            booking._id,
            { checkedIn: true, checkedInAt: new Date() },
            { new: true }
        )
        .populate({
            path: "flightId",
            populate: [
                { path: "originAirportId" },
                { path: "destinationAirportId" },
                { path: "airlineId" }
            ]
        })
        .then(result => res.status(200).send({
            message: "Checked in successfully",
            result
        }));
    })
    .catch(err => errorHandler(err, req, res));
};


module.exports.checkInBookingGuest = (req, res) => {
    const { guestEmail } = req.body;

    if (!guestEmail || !guestEmail.includes("@")) {
        return res.status(400).send({ message: "Valid guest email is required" });
    }

    return Booking.findOne({
        bookingReference: req.params.bookingReference,
        guestEmail,
        userId: null,
        isActive: true
    })
    .then(booking => {
        if (!booking) {
            return res.status(404).send({ message: "Booking not found. Please check your reference and email." });
        }
        if (booking.status !== "confirmed") {
            return res.status(400).send({ message: "Only confirmed bookings can be checked in" });
        }
        if (booking.checkedIn) {
            return res.status(400).send({ message: "This booking is already checked in" });
        }

        return Booking.findByIdAndUpdate(
            booking._id,
            { checkedIn: true, checkedInAt: new Date() },
            { new: true }
        )
        .populate({
            path: "flightId",
            populate: [
                { path: "originAirportId" },
                { path: "destinationAirportId" },
                { path: "airlineId" }
            ]
        })
        .then(result => res.status(200).send({
            message: "Checked in successfully",
            result
        }));
    })
    .catch(err => errorHandler(err, req, res));
};


// ADMIN LEVEL ACCESS

module.exports.getAllBookings = (req, res) => {
    return Booking.find()
        .then(result => {
            if (result.length === 0) {
                return res.status(404).send({ message: "No bookings found" });
            }
            return res.status(200).send({
                message: "Bookings found",
                result
            });
        })
        .catch(err => errorHandler(err, req, res));
};

module.exports.updateBooking = (req, res) => {
    const { flightId, totalAmount } = req.body;

    if (!flightId && !totalAmount) {
        return res.status(400).send({ message: "At least one field is required to update" });
    }

    if (flightId) {
        return Flight.findById(flightId)
            .then(flight => {
                if (!flight) {
                    return res.status(404).send({ message: "Flight not found" });
                }
                if (!flight.isActive) {
                    return res.status(400).send({ message: "Cannot assign an inactive flight" });
                }

                return Booking.findByIdAndUpdate(
                    req.params.id,
                    { flightId, totalAmount },
                    { new: true }
                )
                .then(result => {
                    if (!result) {
                        return res.status(404).send({ message: "Booking not found" });
                    }
                    return res.status(200).send({
                        message: "Booking updated successfully",
                        result
                    });
                });
            })
            .catch(err => errorHandler(err, req, res));
    }

    return Booking.findByIdAndUpdate(
        req.params.id,
        { totalAmount },
        { new: true }
    )
    .then(result => {
        if (!result) {
            return res.status(404).send({ message: "Booking not found" });
        }
        return res.status(200).send({
            message: "Booking updated successfully",
            result
        });
    })
    .catch(err => errorHandler(err, req, res));
};

module.exports.updateBookingStatus = (req, res) => {
    const { status } = req.body;

    const validStatus = ["pending", "confirmed", "cancelled"];
    if (!status || !validStatus.includes(status)) {
        return res.status(400).send({ message: "Valid status is required: pending, confirmed, cancelled" });
    }

    return Booking.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
    )
   
    .then(result => {
        if (!result) {
            return res.status(404).send({ message: "Booking not found" });
        }

        if (status === "confirmed") {
            createNotification({
                userId: result.userId,
                guestEmail: result.guestEmail,
                type: "booking_confirmed",
                message: `Your booking ${result.bookingReference} has been confirmed.`,
                referenceId: result._id,
                referenceModel: "Booking"
            }).catch(err => console.error("Notification save failed:", err));
        }

        return res.status(200).send({
            message: "Booking status updated successfully",
            result
        });
    })
    .catch(err => errorHandler(err, req, res));
};

module.exports.deactivateBooking = (req, res) => {
    return Booking.findById(req.params.id)
        .then(booking => {
            if (!booking) {
                return res.status(404).send({ message: "Booking not found" });
            }
            if (!booking.isActive) {
                return res.status(400).send({ message: "Booking is already deactivated" });
            }

            return Booking.findByIdAndUpdate(
                req.params.id,
                { isActive: false },
                { new: true }
            )
            .then(result => res.status(200).send({
                message: "Booking deactivated successfully",
                result
            }));
        })
        .catch(err => errorHandler(err, req, res));
};

module.exports.reactivateBooking = (req, res) => {
    return Booking.findById(req.params.id)
        .then(booking => {
            if (!booking) {
                return res.status(404).send({ message: "Booking not found" });
            }
            if (booking.isActive) {
                return res.status(400).send({ message: "Booking is already active" });
            }

            return Booking.findByIdAndUpdate(
                req.params.id,
                { isActive: true },
                { new: true }
            )
            .then(result => res.status(200).send({
                message: "Booking reactivated successfully",
                result
            }));
        })
        .catch(err => errorHandler(err, req, res));
};

module.exports.rescheduleBookingUser = async (req, res) => {
    // We take the booking reference from the URL and the new details from the body
    const { bookingReference } = req.params;
    const { newFlightId, newSeatId } = req.body;

    if (!newFlightId || !newSeatId) {
        return res.status(400).send({ message: "New Flight ID and Seat ID are required" });
    }

    try {
        // 1. Find existing active booking belonging to the user
        const booking = await Booking.findOne({ 
            bookingReference, 
            userId: req.user.id, 
            isActive: true 
        });

        if (!booking) {
            return res.status(404).send({ message: "Booking not found or you are unauthorized" });
        }
        if (booking.status === "cancelled") {
            return res.status(400).send({ message: "Cannot reschedule a cancelled booking" });
        }

        // 2. Validate the new flight
        const newFlight = await Flight.findById(newFlightId);
        if (!newFlight || !newFlight.isActive) {
            return res.status(400).send({ message: "The selected flight is not available" });
        }

        // 3. Validate the new seat
        const newSeat = await Seat.findById(newSeatId);
        if (!newSeat) {
            return res.status(404).send({ message: "New seat not found" });
        }
        if (String(newSeat.flightId) !== String(newFlightId)) {
            return res.status(400).send({ message: "New seat does not belong to the selected flight" });
        }
        if (!newSeat.isActive || newSeat.isOccupied) {
            return res.status(409).send({ message: "New seat is no longer available" });
        }

        // 4. Find the passenger record tied to this booking to get the old seat ID
        // Note: If your system allows multiple passengers per booking, this logic 
        // will need to iterate over an array of passenger/seat updates.
        const bookingPassenger = await BookingPassenger.findOne({ 
            bookingId: booking._id, 
            isActive: true 
        });

        if (!bookingPassenger) {
            return res.status(404).send({ message: "Passenger records for this booking are missing" });
        }

        const oldSeatId = bookingPassenger.seatId;

        // 5. Calculate new fare
        const newTotalAmount = newSeat.class === "business" 
            ? newFlight.businessPrice 
            : newFlight.basePrice;

        // 6. Execute the Swap
        // Free the old seat
        await Seat.findByIdAndUpdate(oldSeatId, { isOccupied: false });
        
        // Occupy the new seat
        await Seat.findByIdAndUpdate(newSeatId, { isOccupied: true });

        // Update the passenger's assigned seat
        bookingPassenger.seatId = newSeatId;
        await bookingPassenger.save();

        // Update the main booking details
        booking.flightId = newFlightId;
        booking.totalAmount = newTotalAmount;
        
        // Optional logic: If they already paid but the new flight is more expensive, 
        // you might want to revert the status to "pending" to require a top-up payment.
        // if (booking.status === "confirmed" && newTotalAmount > booking.totalAmount) {
        //     booking.status = "pending";
        // }

        await booking.save();

        return res.status(200).send({
            message: "Flight rescheduled successfully",
            bookingReference: booking.bookingReference,
            newFlight: {
                flightNumber: newFlight.flightNumber,
                departureTime: newFlight.departureTime,
            },
            newSeatClass: newSeat.class,
            newTotalAmount: booking.totalAmount,
            status: booking.status
        });

    } catch (err) {
        return errorHandler(err, req, res);
    }
};