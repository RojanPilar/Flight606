const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const { errorHandler } = require("../auth");
const { createNotification } = require("./notification");

// USER LEVEL ACCESS

module.exports.createPaymentUser = (req, res) => {
    const { bookingId, paymentMethod, amount } = req.body;

    if (!bookingId) {
        return res.status(400).send({ message: "Booking ID is required" });
    }
    if (!paymentMethod) {
        return res.status(400).send({ message: "Please choose your preferred payment method" });
    }
    if (amount === undefined || amount === null) {
        return res.status(400).send({ message: "Amount input is required" });
    }

    return Booking.findOne({ _id: bookingId, userId: req.user.id })
        .then(booking => {
            if (!booking) {
                return res.status(404).send({ message: "Booking not found" });
            }
            if (!booking.isActive) {
                return res.status(400).send({ message: "Cannot pay for an inactive booking" });
            }
            if (booking.status === "cancelled") {
                return res.status(400).send({ message: "Cannot pay for a cancelled booking" });
            }

            return Payment.findOne({ bookingId })
                .then(existingPayment => {
                    if (existingPayment) {
                        return res.status(409).send({ message: "Payment already exists for this booking" });
                    }

                    const newPayment = new Payment({
                        userId: req.user.id,
                        bookingId,
                        paymentMethod,
                        amount,
                        status: "paid",
                        transactionId: "TXN-" + Date.now(),
                        paidAt: new Date()
                    });

                    return newPayment.save()
                        .then(result => {
                            return Booking.findByIdAndUpdate(
                                bookingId,
                                { status: "confirmed" },
                                { new: true }
                            )
                            .then(updatedBooking => {
                                if (updatedBooking) {
                                    createNotification({
                                        userId: updatedBooking.userId,
                                        guestEmail: updatedBooking.guestEmail,
                                        type: "booking_confirmed",
                                        message: `Your booking ${updatedBooking.bookingReference} has been confirmed.`,
                                        referenceId: updatedBooking._id,
                                        referenceModel: "Booking"
                                    }).catch(err => console.error("Notification save failed:", err));
                                }
                                return res.status(201).send({
                                    message: "Payment created and booking confirmed successfully",
                                    transactionId: result.transactionId,
                                    status: result.status,
                                    bookingStatus: updatedBooking ? updatedBooking.status : null
                                });
                            });
                        });
                });
        })
        .catch(err => errorHandler(err, req, res));
};


module.exports.createPaymentGuest = (req, res) => {
    const { bookingId, paymentMethod, amount, guestEmail } = req.body;

    if (!bookingId) {
        return res.status(400).send({ message: "Booking ID is required" });
    }
    if (!paymentMethod) {
        return res.status(400).send({ message: "Please choose your preferred payment method" });
    }
    if (amount === undefined || amount === null) {
        return res.status(400).send({ message: "Amount input is required" });
    }
    if (!guestEmail || !guestEmail.includes("@")) {
        return res.status(400).send({ message: "Valid guest email is required" });
    }

    return Booking.findOne({ _id: bookingId, guestEmail, userId: null })
        .then(booking => {
            if (!booking) {
                return res.status(404).send({ message: "Booking not found" });
            }
            if (!booking.isActive) {
                return res.status(400).send({ message: "Cannot pay for an inactive booking" });
            }
            if (booking.status === "cancelled") {
                return res.status(400).send({ message: "Cannot pay for a cancelled booking" });
            }

            return Payment.findOne({ bookingId })
                .then(existingPayment => {
                    if (existingPayment) {
                        return res.status(409).send({ message: "Payment already exists for this booking" });
                    }

                    const newPayment = new Payment({
                        userId: null,
                        bookingId,
                        paymentMethod,
                        amount,
                        status: "paid",
                        transactionId: "TXN-" + Date.now(),
                        paidAt: new Date()
                    });

                    return newPayment.save()
                        .then(result => {
                            return Booking.findByIdAndUpdate(
                                bookingId,
                                { status: "confirmed" },
                                { new: true }
                            )
                            .then(updatedBooking => {
                                if (updatedBooking) {
                                    createNotification({
                                        userId: updatedBooking.userId,
                                        guestEmail: updatedBooking.guestEmail,
                                        type: "booking_confirmed",
                                        message: `Your booking ${updatedBooking.bookingReference} has been confirmed.`,
                                        referenceId: updatedBooking._id,
                                        referenceModel: "Booking"
                                    }).catch(err => console.error("Notification save failed:", err));
                                }
                                return res.status(201).send({
                                    message: "Payment created and booking confirmed successfully",
                                    transactionId: result.transactionId,
                                    status: result.status,
                                    bookingStatus: updatedBooking ? updatedBooking.status : null
                                });
                            });
                        });
                });
        })
        .catch(err => errorHandler(err, req, res));
};


module.exports.getMyPaymentsUser = (req, res) => {
    return Payment.find({ userId: req.user.id })
        .then(result => {
            if (result.length === 0) {
                return res.status(404).send({ message: "No payments found" });
            }
            return res.status(200).send({
                message: "Payments found",
                payments: result
            });
        })
        .catch(err => errorHandler(err, req, res));
};


module.exports.getMyPaymentsGuest = (req, res) => {
    const { bookingId, guestEmail } = req.body;

    if (!bookingId) {
        return res.status(400).send({ message: "Booking ID is required" });
    }
    if (!guestEmail || !guestEmail.includes("@")) {
        return res.status(400).send({ message: "Valid guest email is required" });
    }

    // Cross-check: verify the booking actually belongs to this guest
    return Booking.findOne({ _id: bookingId, guestEmail, userId: null })
        .then(booking => {
            if (!booking) {
                return res.status(404).send({ message: "Booking not found" });
            }

            return Payment.find({ bookingId })
                .then(result => {
                    if (result.length === 0) {
                        return res.status(404).send({ message: "No payments found" });
                    }
                    return res.status(200).send({
                        message: "Payments found",
                        payments: result
                    });
                });
        })
        .catch(err => errorHandler(err, req, res));
};


// ADMIN LEVEL ACCESS

module.exports.getAllPayments = (req, res) => {
    return Payment.find()
        .then(result => {
            if (result.length === 0) {
                return res.status(404).send({ message: "No payments found" });
            }
            return res.status(200).send({
                message: "Payments found",
                payments: result
            });
        })
        .catch(err => errorHandler(err, req, res));
};

module.exports.getPaymentById = (req, res) => {
    return Payment.findById(req.params.id)
        .then(result => {
            if (!result) {
                return res.status(404).send({ message: "No payment found" });
            }
            return res.status(200).send({
                message: "Payment found",
                result
            });
        })
        .catch(err => errorHandler(err, req, res));
};

module.exports.updatePaymentStatus = (req, res) => {
    const { status } = req.body;

    const validStatuses = ["pending", "paid", "failed", "refunded"];
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).send({ message: `Status must be one of: ${validStatuses.join(", ")}` });
    }

    return Payment.findById(req.params.id)
        .then(payment => {
            if (!payment) {
                return res.status(404).send({ message: "Payment not found" });
            }
            if (payment.status === status) {
                return res.status(400).send({ message: `Payment is already marked as ${status}` });
            }

            return Payment.findByIdAndUpdate(
                req.params.id,
                {
                    status,
                    paidAt: status === "paid" ? Date.now() : null
                },
                { new: true }
            )
            .then(result => {
                if (status === "paid") {
                    return Booking.findByIdAndUpdate(
                        result.bookingId,
                        { status: "confirmed" },
                        { new: true }
                    )
                    .then(updatedBooking => {
                        if (updatedBooking) {
                            createNotification({
                                userId: updatedBooking.userId,
                                guestEmail: updatedBooking.guestEmail,
                                type: "booking_confirmed",
                                message: `Your booking ${updatedBooking.bookingReference} has been confirmed.`,
                                referenceId: updatedBooking._id,
                                referenceModel: "Booking"
                            }).catch(err => console.error("Notification save failed:", err));
                        }
                        return res.status(200).send({
                            message: "Payment marked as paid and booking confirmed",
                            result
                        });
                    });
                }

                return res.status(200).send({
                    message: "Status updated successfully",
                    result
                });
            });
        })
        .catch(err => errorHandler(err, req, res));
};