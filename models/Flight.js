const mongoose = require("mongoose");

const flightSchema = new mongoose.Schema({
	airlineId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Airline",
		required: [true, "Airline ID is required"]
	},

	aircraftId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Aircraft",
		required: [true, "Aircraft ID is required"]
	},

	originAirportId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Airport",
		required: [true, "Airport ID is required"]
	},

	destinationAirportId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Airport",
		required: [true, "Destination Airport ID is required"]
	},

	flightNumber: {
		type: String,
		required: [true, "Flight Number is required"]
	},

	departureTime: {
		type: Date,
		required: [true, "Departure time is required"]
	},

	arrivalTime: {
		type: Date,
		default: null
	},

	status: {
		type: String,
		enum: ["scheduled", "delayed", "on-time", "cancelled", "departed", "arrived"],
		default: "scheduled"
	},

	basePrice: {
		type: Number,
		required: [true, "Economy price is required"],
		min: [0, "Price must not be negative"]
	},

	businessPrice: {
		type: Number,
		required: [true, "Business class price is required"],
		min: [0, "Price must not be negative"]
	},

	originTerminal: {
		type: String,
		default: null
	},

	destinationTerminal: {
		type: String,
		default: null
	},

	isActive: {
		type: Boolean,
		default: true
	}

}, { timestamps: true });

module.exports = mongoose.model("Flight", flightSchema);