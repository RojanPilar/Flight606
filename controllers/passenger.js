const Passenger = require("../models/Passenger");
const { errorHandler } = require("../auth");


// USER LEVEL ACCESS

module.exports.createPassengerUser = (req, res) => {
    const { firstName, lastName, dateOfBirth, nationality, passportNumber, passportExpiry, phone, gender } = req.body;

    if (!firstName || firstName.trim() === "") {
        return res.status(400).send({ message: "First name is required" });
    }
    if (!lastName || lastName.trim() === "") {
        return res.status(400).send({ message: "Last name is required" });
    }
    if (!gender) {
        return res.status(400).send({ message: "Gender is required" });
    }
    if (!dateOfBirth) {
        return res.status(400).send({ message: "Date of Birth is required" });
    }
    if (!nationality || nationality.trim() === "") {
        return res.status(400).send({ message: "Nationality is required" });
    }
    if (!passportNumber || passportNumber.trim() === "") {
        return res.status(400).send({ message: "Passport Number is required" });
    }
    if (!passportExpiry) {
        return res.status(400).send({ message: "Passport Expiry is required" });
    }
    if (!phone || phone.length !== 11) {
        return res.status(400).send({ message: "Phone number must be 11 digits" });
    }

    return Passenger.findOne({ passportNumber })
        .then(existingPassenger => {
            if (existingPassenger) {
                return res.status(409).send({ message: "Passport number already registered" });
            }

            const newPassenger = new Passenger({
                userId: req.user.id,
                firstName,
                lastName,
                gender,
                dateOfBirth,
                email: req.user.email,
                nationality,
                passportNumber,
                passportExpiry,
                phone,
                isProfileSaved: true
            });

            return newPassenger.save()
                .then(result => res.status(201).send({
                    message: "Passenger created successfully",
                    result
                }));
        })
        .catch(err => errorHandler(err, req, res));
};


module.exports.createPassengerGuest = (req, res) => {
    const { firstName, lastName, dateOfBirth, email, nationality, passportNumber, passportExpiry, phone, gender } = req.body;

    if (!firstName || firstName.trim() === "") {
        return res.status(400).send({ message: "First name is required" });
    }
    if (!lastName || lastName.trim() === "") {
        return res.status(400).send({ message: "Last name is required" });
    }
    if (!gender) {
        return res.status(400).send({ message: "Gender is required" });
    }
    if (!dateOfBirth) {
        return res.status(400).send({ message: "Date of Birth is required" });
    }
    if (!email || !email.includes("@")) {
        return res.status(400).send({ message: "Valid email is required" });
    }
    if (!nationality || nationality.trim() === "") {
        return res.status(400).send({ message: "Nationality is required" });
    }
    if (!passportNumber || passportNumber.trim() === "") {
        return res.status(400).send({ message: "Passport Number is required" });
    }
    if (!passportExpiry) {
        return res.status(400).send({ message: "Passport Expiry is required" });
    }
    if (!phone || phone.length !== 11) {
        return res.status(400).send({ message: "Phone number must be 11 digits" });
    }

    return Passenger.findOne({ passportNumber })
        .then(existingPassenger => {
            if (existingPassenger) {
                return res.status(409).send({ message: "Passport number already registered" });
            }

            const newPassenger = new Passenger({
                userId: null,
                firstName,
                lastName,
                gender,
                dateOfBirth,
                email,
                nationality,
                passportNumber,
                passportExpiry,
                phone,
                isProfileSaved: false
            });

            return newPassenger.save()
                .then(result => res.status(201).send({
                    message: "Passenger created successfully",
                    result
                }));
        })
        .catch(err => errorHandler(err, req, res));
};


module.exports.getMyPassengers = (req, res) => {
    return Passenger.find({
        userId: req.user.id,
        isProfileSaved: true
    })
    .then(result => {
        if (result.length === 0) {
            return res.status(404).send({ message: "No saved passenger profiles found" });
        }
        return res.status(200).send({
            message: "Passenger profiles found",
            passengers: result
        });
    })
    .catch(err => errorHandler(err, req, res));
};


module.exports.getPassengerForGuest = (req, res) => {
    const { passportNumber } = req.body;

    if (!passportNumber || passportNumber.trim() === "") {
        return res.status(400).send({ message: "Passport number is required for lookup" });
    }

    return Passenger.findOne({ passportNumber, userId: null })
        .then(passenger => {
            if (!passenger) {
                return res.status(404).send({ message: "No passenger found with this passport number" });
            }
            return res.status(200).send({
                message: "Passenger record retrieved successfully",
                passenger
            });
        })
        .catch(err => errorHandler(err, req, res));
};


module.exports.updatePassenger = (req, res) => {
    const { firstName, lastName, gender, email, nationality, passportNumber, passportExpiry, phone } = req.body;

    return Passenger.findById(req.params.id)
        .then(passenger => {
            if (!passenger) {
                return res.status(404).send({ message: "Passenger not found" });
            }
            if (String(passenger.userId) !== req.user.id) {
                return res.status(403).send({ message: "Unauthorized to update this passenger" });
            }

            return Passenger.findByIdAndUpdate(
                req.params.id,
                { firstName, lastName, email, nationality, passportNumber, passportExpiry, phone, gender },
                { new: true }
            )
            .then(result => res.status(200).send({
                message: "Passenger profile updated successfully",
                result
            }));
        })
        .catch(err => errorHandler(err, req, res));
};


module.exports.updatePassengerAsGuest = (req, res) => {
    const { passportNumber, firstName, lastName, email, nationality, passportExpiry, phone, gender } = req.body;

    if (!passportNumber || passportNumber.trim() === "") {
        return res.status(400).send({ message: "Passport number is required to identify the guest profile" });
    }

    return Passenger.findOneAndUpdate(
        {
            passportNumber,
            userId: null
        },
        { firstName, lastName, email, nationality, passportExpiry, phone, gender },
        { new: true }
    )
    .then(result => {
        if (!result) {
            return res.status(404).send({
                message: "Guest profile not found. Note: Profiles linked to registered accounts cannot be updated here."
            });
        }
        return res.status(200).send({
            message: "Guest passenger updated successfully",
            result
        });
    })
    .catch(err => errorHandler(err, req, res));
};


// ADMIN LEVEL ACCESS

module.exports.getAllPassengers = (req, res) => {
    return Passenger.find()
        .then(result => {
            if (result.length === 0) {
                return res.status(404).send({ message: "No passengers found" });
            }
            return res.status(200).send({
                message: "Passengers found",
                result
            });
        })
        .catch(err => errorHandler(err, req, res));
};

module.exports.getPassengerById = (req, res) => {
    return Passenger.findById(req.params.id)
        .then(result => {
            if (!result) {
                return res.status(404).send({ message: "No passenger found" });
            }
            return res.status(200).send({
                message: "Passenger found",
                result
            });
        })
        .catch(err => errorHandler(err, req, res));
};

module.exports.adminUpdatePassenger = (req, res) => {
    const { firstName, lastName, gender, email, nationality, passportNumber, passportExpiry, phone } = req.body;

    return Passenger.findByIdAndUpdate(
        req.params.id,
        { firstName, lastName, gender, email, nationality, passportNumber, passportExpiry, phone },
        { new: true }
    )
    .then(result => {
        if (!result) {
            return res.status(404).send({ message: "Passenger not found" });
        }
        return res.status(200).send({
            message: "Passenger profile updated successfully (Admin Action)",
            result
        });
    })
    .catch(err => errorHandler(err, req, res));
};

module.exports.activatePassenger = (req, res) => {
    return Passenger.findById(req.params.id)
        .then(passenger => {
            if (!passenger) {
                return res.status(404).send({ message: "Passenger not found" });
            }
            if (passenger.isActive) {
                return res.status(400).send({ message: "Passenger profile is already active" });
            }

            return Passenger.findByIdAndUpdate(
                req.params.id,
                { isActive: true },
                { new: true }
            )
            .then(result => res.status(200).send({
                message: "Passenger profile reactivated",
                result
            }));
        })
        .catch(err => errorHandler(err, req, res));
};

module.exports.deactivatePassenger = (req, res) => {
    return Passenger.findById(req.params.id)
        .then(passenger => {
            if (!passenger) {
                return res.status(404).send({ message: "Passenger not found" });
            }
            if (!passenger.isActive) {
                return res.status(400).send({ message: "Passenger profile is already inactive" });
            }

            return Passenger.findByIdAndUpdate(
                req.params.id,
                { isActive: false },
                { new: true }
            )
            .then(result => res.status(200).send({
                message: "Passenger profile deactivated",
                result
            }));
        })
        .catch(err => errorHandler(err, req, res));
};