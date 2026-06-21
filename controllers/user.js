const bcrypt = require("bcryptjs"); // swap to require("bcrypt") if that's what you already have installed
const User = require("../models/User");
const { createAccessToken, errorHandler } = require("../auth");


// PUBLIC

module.exports.registerUser = (req, res) => {
	const { email, password, firstName, lastName } = req.body;

	if (!email || !password || !firstName) {
		return res.status(400).send({ message: "Email, password, and first name are required" });
	}

	return User.findOne({ email })
		.then(existingUser => {
			if (existingUser) {
				return res.status(409).send({ message: "An account with that email already exists" });
			}

			const newUser = new User({
				email,
				password: bcrypt.hashSync(password, 10),
				firstName,
				lastName: lastName || null
			});

			return newUser.save()
				.then(() => {
					return res.status(201).send({ message: "Registered successfully" });
				});
		})
		.catch(err => errorHandler(err, req, res));
};

module.exports.loginUser = (req, res) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).send({ message: "Email and password are required" });
	}

	return User.findOne({ email: email.toLowerCase().trim() })
		.then(user => {
			if (!user) {
				return res.status(404).send({ message: "No account found with that email" });
			}
			if (!user.isActive) {
				return res.status(403).send({ message: "This account has been deactivated" });
			}

			const isMatch = bcrypt.compareSync(password, user.password);
			if (!isMatch) {
				return res.status(401).send({ message: "Incorrect email or password" });
			}

			// Key is "access" on purpose — LoginPage.vue already reads res.access
			const access = createAccessToken(user);

			return res.status(200).send({
				message: "Login successful",
				access
			});
		})
		.catch(err => errorHandler(err, req, res));
};


// AUTHENTICATED

module.exports.getProfile = (req, res) => {
	return User.findById(req.user.id)
		.select("-password")
		.then(user => {
			if (!user) {
				return res.status(404).send({ message: "User not found" });
			}
			// Sent directly, no {message, result} wrapper — stores/global.js
			// getUserDetails() reads res.email / res.firstName / res.isAdmin
			// straight off the top level. Don't wrap this one.
			return res.status(200).send(user);
		})
		.catch(err => errorHandler(err, req, res));
};

module.exports.updateProfile = (req, res) => {
	const { firstName, lastName } = req.body;

	const updates = {};
	if (firstName !== undefined) updates.firstName = firstName;
	if (lastName !== undefined)  updates.lastName  = lastName;

	if (Object.keys(updates).length === 0) {
		return res.status(400).send({ message: "At least one field is required to update" });
	}

	return User.findByIdAndUpdate(req.user.id, updates, { new: true })
		.select("-password")
		.then(result => {
			return res.status(200).send({ message: "Profile updated successfully", result });
		})
		.catch(err => errorHandler(err, req, res));
};

module.exports.updateEmail = (req, res) => {
	const { email } = req.body;
	if (!email) {
		return res.status(400).send({ message: "Email is required" });
	}

	return User.findOne({ email: email.toLowerCase().trim() })
		.then(existingUser => {
			if (existingUser) {
				return res.status(409).send({ message: "That email is already in use" });
			}

			return User.findByIdAndUpdate(req.user.id, { email: email.toLowerCase().trim() }, { new: true })
				.select("-password")
				.then(result => {
					return res.status(200).send({ message: "Email updated successfully", result });
				});
		})
		.catch(err => errorHandler(err, req, res));
};

module.exports.updatePassword = (req, res) => {
	const { currentPassword, newPassword } = req.body;
	if (!currentPassword || !newPassword) {
		return res.status(400).send({ message: "Current and new password are required" });
	}

	return User.findById(req.user.id)
		.then(user => {
			const isMatch = bcrypt.compareSync(currentPassword, user.password);
			if (!isMatch) {
				return res.status(401).send({ message: "Current password is incorrect" });
			}

			user.password = bcrypt.hashSync(newPassword, 10);
			return user.save()
				.then(() => {
					return res.status(200).send({ message: "Password updated successfully" });
				});
		})
		.catch(err => errorHandler(err, req, res));
};


// ADMIN

module.exports.getAllUsers = (req, res) => {
	return User.find()
		.select("-password")
		.then(result => {
			return res.status(200).send({ message: "Users found", result });
		})
		.catch(err => errorHandler(err, req, res));
};

module.exports.getUserById = (req, res) => {
	return User.findById(req.params.id)
		.select("-password")
		.then(result => {
			if (!result) {
				return res.status(404).send({ message: "User not found" });
			}
			return res.status(200).send({ message: "User found", result });
		})
		.catch(err => errorHandler(err, req, res));
};

module.exports.updateUserAsAdmin = (req, res) => {
	const { firstName, lastName, isAdmin } = req.body;

	const updates = {};
	if (firstName !== undefined) updates.firstName = firstName;
	if (lastName !== undefined)  updates.lastName  = lastName;
	if (isAdmin !== undefined)   updates.isAdmin   = isAdmin;

	return User.findByIdAndUpdate(req.params.id, updates, { new: true })
		.select("-password")
		.then(result => {
			if (!result) {
				return res.status(404).send({ message: "User not found" });
			}
			return res.status(200).send({ message: "User updated successfully", result });
		})
		.catch(err => errorHandler(err, req, res));
};

module.exports.deactivateUser = (req, res) => {
	return User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true })
		.select("-password")
		.then(result => {
			if (!result) {
				return res.status(404).send({ message: "User not found" });
			}
			return res.status(200).send({ message: "User deactivated successfully", result });
		})
		.catch(err => errorHandler(err, req, res));
};

module.exports.reactivateUser = (req, res) => {
	return User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true })
		.select("-password")
		.then(result => {
			if (!result) {
				return res.status(404).send({ message: "User not found" });
			}
			return res.status(200).send({ message: "User reactivated successfully", result });
		})
		.catch(err => errorHandler(err, req, res));
};
