const mongoose = require("mongoose");

const bookingPassengerSchema = new mongoose.Schema({
	bookingId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Booking",
		required: [true, "Booking ID is required"]
	},

	passengerId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Passenger",
		required: [true, "Passenger ID is required"]
	},

	seatId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Seat",
		required: [true, "Seat ID is required"]
	},

	ticketNumber: {
		type: String,
		unique: true,
		required: [true, "Ticket Number is required"]
	},

	isActive: {
		type: Boolean,
		default: true
	}
}, { timestamps: true });


module.exports = mongoose.model("BookingPassenger", bookingPassengerSchema);