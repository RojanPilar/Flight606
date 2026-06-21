const BookingPassenger = require("../models/BookingPassenger");
const Booking = require("../models/Booking");
const Passenger = require("../models/Passenger");
const Seat = require("../models/Seat");
const { errorHandler } = require("../auth");

// USER LEVEL ACCESS

module.exports.createBookingPassenger = (req, res) => {
    const { bookingId, passengerId, seatId } = req.body;

    if (!bookingId || !passengerId) {
        return res.status(400).send({ message: "Booking ID and Passenger ID are required" });
    }
    if (!seatId) {
        return res.status(400).send({ message: "Seat ID is required" });
    }

    return Booking.findById(bookingId)
        .then(booking => {
            if (!booking) {
                return res.status(404).send({ message: "Booking not found" });
            }
            if (!booking.isActive) {
                return res.status(400).send({ message: "Cannot add passenger to an inactive booking" });
            }
            if (booking.userId && String(booking.userId) !== req.user.id) {
                return res.status(403).send({ message: "Unauthorized to add passengers to this booking" });
            }

            return Passenger.findById(passengerId)
                .then(passenger => {
                    if (!passenger) {
                        return res.status(404).send({ message: "Passenger not found" });
                    }
                    if (!passenger.isActive) {
                        return res.status(400).send({ message: "Cannot add an inactive passenger to a booking" });
                    }

                    return Seat.findById(seatId)
                        .then(seat => {
                            if (!seat) {
                                return res.status(404).send({ message: "Seat not found" });
                            }
                            if (!seat.isActive) {
                                return res.status(400).send({ message: "Seat is not available" });
                            }

                            // Verify the seat belongs to the same flight as the booking.
                            // Prevents a passenger from claiming a seat on a different flight.
                            if (String(seat.flightId) !== String(booking.flightId)) {
                                return res.status(400).send({ message: "Seat does not belong to this booking's flight" });
                            }

                            if (seat.isOccupied) {
                                return res.status(409).send({ message: "Seat is already occupied" });
                            }

                            const ticketNumber = "TKT-" + Date.now();

                            return BookingPassenger.findOne({ ticketNumber })
                                .then(existingTicketNumber => {
                                    if (existingTicketNumber) {
                                        return res.status(409).send({ message: "Ticket number already exists" });
                                    }

                                    const newBookingPassenger = new BookingPassenger({
                                        bookingId,
                                        passengerId,
                                        seatId,
                                        ticketNumber,
                                        isActive: true
                                    });

                                    return newBookingPassenger.save()
                                        .then(result => {
                                            return Seat.findByIdAndUpdate(
                                                seatId,
                                                { isOccupied: true },
                                                { new: true }
                                            )
                                            .then(() => {
                                                return res.status(201).send({
                                                    message: "Booking passenger created successfully",
                                                    result
                                                });
                                            });
                                        });
                                });
                        });
                });
        })
        .catch(err => errorHandler(err, req, res));
};


module.exports.createBookingPassengerGuest = (req, res) => {
    const { bookingId, passengerId, seatId, guestEmail } = req.body;
 
    if (!bookingId || !passengerId) {
        return res.status(400).send({ message: "Booking ID and Passenger ID are required" });
    }
    if (!seatId) {
        return res.status(400).send({ message: "Seat ID is required" });
    }
    if (!guestEmail || !guestEmail.includes("@")) {
        return res.status(400).send({ message: "Valid guest email is required" });
    }
 
    return Booking.findById(bookingId)
        .then(booking => {
            if (!booking) {
                return res.status(404).send({ message: "Booking not found" });
            }
            if (!booking.isActive) {
                return res.status(400).send({ message: "Cannot add passenger to an inactive booking" });
            }
            // Guest bookings must have userId: null and must match the provided email
            if (booking.userId !== null) {
                return res.status(403).send({ message: "This booking belongs to a registered user" });
            }
            if (booking.guestEmail !== guestEmail) {
                return res.status(403).send({ message: "Email does not match this booking" });
            }
 
            return Passenger.findById(passengerId)
                .then(passenger => {
                    if (!passenger) {
                        return res.status(404).send({ message: "Passenger not found" });
                    }
                    if (!passenger.isActive) {
                        return res.status(400).send({ message: "Cannot add an inactive passenger" });
                    }
 
                    return Seat.findById(seatId)
                        .then(seat => {
                            if (!seat) {
                                return res.status(404).send({ message: "Seat not found" });
                            }
                            if (!seat.isActive) {
                                return res.status(400).send({ message: "Seat is not available" });
                            }
                            if (String(seat.flightId) !== String(booking.flightId)) {
                                return res.status(400).send({ message: "Seat does not belong to this booking's flight" });
                            }
                            if (seat.isOccupied) {
                                return res.status(409).send({ message: "Seat is already occupied" });
                            }
 
                            const ticketNumber = "TKT-" + Date.now();
 
                            return BookingPassenger.findOne({ ticketNumber })
                                .then(existing => {
                                    if (existing) {
                                        return res.status(409).send({ message: "Ticket number already exists" });
                                    }
 
                                    const newBKP = new BookingPassenger({
                                        bookingId,
                                        passengerId,
                                        seatId,
                                        ticketNumber,
                                        isActive: true
                                    });
 
                                    return newBKP.save()
                                        .then(result => {
                                            return Seat.findByIdAndUpdate(
                                                seatId,
                                                { isOccupied: true },
                                                { new: true }
                                            )
                                            .then(() => res.status(201).send({
                                                message: "Booking passenger created successfully",
                                                result
                                            }));
                                        });
                                });
                        });
                });
        })
        .catch(err => errorHandler(err, req, res));
};

module.exports.getBookingPassengerByBooking = (req, res) => {
    return BookingPassenger.find({ bookingId: req.params.bookingId })
    .then(result => {
        if (result.length === 0) {
            return res.status(404).send({ message: "No passengers found for this booking" });
        }
        return res.status(200).send({
            message: "Booking Passengers found",
            result
        });
    })
    .catch(err => errorHandler(err, req, res));
};

// ADMIN LEVEL ACCESS

module.exports.getAllBookingPassengers = (req, res) => {
    return BookingPassenger.find()
    .then(result => {
        if (result.length === 0) {
            return res.status(404).send({ message: "No Booking Passengers found" });
        }
        return res.status(200).send({
            message: "Booking Passengers found",
            result
        });
    })
    .catch(err => errorHandler(err, req, res));
};

module.exports.deactivateBookingPassenger = (req, res) => {
    return BookingPassenger.findById(req.params.id)
        .then(bookingPassenger => {
            if (!bookingPassenger) {
                return res.status(404).send({ message: "Booking passenger not found" });
            }
            if (!bookingPassenger.isActive) {
                return res.status(400).send({ message: "Booking passenger is already deactivated" });
            }

            return BookingPassenger.findByIdAndUpdate(
                req.params.id,
                { isActive: false },
                { new: true }
            )
            .then(result => {
               return Seat.findByIdAndUpdate(
                    bookingPassenger.seatId,
                    { isOccupied: false },
                    { new: true }
                )
                .then(() => {
                    return res.status(200).send({
                        message: "Booking passenger deactivated successfully",
                        result
                    });
                });
            });
        })
        .catch(err => errorHandler(err, req, res));
};

module.exports.reactivateBookingPassenger = (req, res) => {
    return BookingPassenger.findById(req.params.id)
        .then(bookingPassenger => {
            if (!bookingPassenger) {
                return res.status(404).send({ message: "Booking passenger not found" });
            }
            if (bookingPassenger.isActive) {
                return res.status(400).send({ message: "Booking passenger is already active" });
            }

            return Seat.findById(bookingPassenger.seatId)
                .then(seat => {
                    if (!seat) {
                        return res.status(404).send({ message: "Associated seat not found" });
                    }
                    if (seat.isOccupied) {
                        return res.status(409).send({ message: "Cannot reactivate — seat has been taken by another passenger" });
                    }

                    return BookingPassenger.findByIdAndUpdate(
                        req.params.id,
                        { isActive: true },
                        { new: true }
                    )
                    .then(result => {
                        return Seat.findByIdAndUpdate(
                            bookingPassenger.seatId,
                            { isOccupied: true },
                            { new: true }
                        )
                        .then(() => {
                            return res.status(200).send({
                                message: "Booking passenger reactivated successfully",
                                result
                            });
                        });
                    });
                });
        })
        .catch(err => errorHandler(err, req, res));
};