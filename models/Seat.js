const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema({

	flightId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Flight",
		required: [true, "Flight ID is required"]
	},

	seatNumber: {
		type: String,
		required: [true, "Seat number is required"],
		trim: true,
		uppercase: true
	},

	class: {
		type: String,
		enum: ["business", "economy"],
		required: [true, "Seat class is required"]
	},

	isOccupied: {
		type: Boolean,
		default: false
	},

	isActive: {
		type: Boolean,
		default: true
	}

}, { timestamps: true });

seatSchema.index({ flightId: 1, seatNumber: 1 }, { unique: true });


module.exports = mongoose.model("Seat", seatSchema);