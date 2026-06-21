const mongoose = require("mongoose");

const aircraftSchema = new mongoose.Schema({
	airlineId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Airline",
		required: true
	},

	model: {
		type: String,
		required: [true, "Input aircraft model"],
		trim: true
	},

	totalSeats: {
		type: Number,
		required: [true, "Input total seat number"],
		min: [150, "Aircraft must have at least 150 seats"],
		max: [300, "Aircraft must have at most 300 seats"]
	},

	isActive: {
		type: Boolean,
		default: true
	}
	
}, { timestamps: true });



module.exports = mongoose.model("Aircraft", aircraftSchema);