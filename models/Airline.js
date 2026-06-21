const mongoose = require("mongoose");

const airlineSchema = new mongoose.Schema({
	name:{
		type: String,
		required: [true, "Airline name is required"],
		unique: true,
		trim: true
	},
	
	iataCode:{
		type: String,
		required: [true, "2-letter IATA code is required"],
		unique: true,
		uppercase: true,
		minlength: 2,
		maxlength: 2
	},

	logoURL:{
		type: String,
		required: true,
	},
	
	isActive: {
		type: Boolean,
		default: true
	}
}, { timestamps: true });

module.exports = mongoose.model("Airline", airlineSchema);