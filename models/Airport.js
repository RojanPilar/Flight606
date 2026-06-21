const mongoose = require("mongoose");

const airportSchema = new mongoose.Schema({
	name:{
		type: String,
		required: [true, "Airport name is required"],
		unique: true,
		trim: true
	},

	iataCode:{
		type: String,
		required: [true, "3-letter IATA code is required"],
		unique: true,
		uppercase: true,
		minlength: 3,
		maxlength: 3
	},
	
	city:{
		type: String,
		required: [true, "City is required"],
		trim: true
	},
	
	country:{
		type: String,
		required: [true, "Country is required"],
		trim: true
	},

	isActive:{
		type: Boolean,
		default: true
	}
	
}, { timestamps: true });


module.exports = mongoose.model("Airport", airportSchema);