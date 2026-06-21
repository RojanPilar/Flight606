const mongoose = require("mongoose");

// NOTE: this is a minimal reference covering only the fields I can already
// confirm your codebase depends on:
//   - email, isAdmin  → read in auth.js createAccessToken()
//   - email, firstName, isAdmin → read in stores/global.js getUserDetails()
// If you already have a User model with more fields (lastName, mobileNo,
// etc.), keep those — just make sure these four are present and named
// exactly this way, since other files already depend on the exact names.

const userSchema = new mongoose.Schema({
	email: {
		type: String,
		required: [true, "Email is required"],
		unique: true,
		lowercase: true,
		trim: true
	},

	password: {
		type: String,
		required: [true, "Password is required"]
	},

	firstName: {
		type: String,
		required: [true, "First name is required"]
	},

	lastName: {
		type: String,
		default: null
	},

	isAdmin: {
		type: Boolean,
		default: false
	},

	isActive: {
		type: Boolean,
		default: true
	}

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
