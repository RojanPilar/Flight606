const Seat = require("../models/Seat");
const Flight = require("../models/Flight");
const { errorHandler } = require("../auth");


// USER LEVEL ACCESS

module.exports.getSeatsByFlight = (req, res) => {
	return Flight.findOne({ _id: req.params.flightId, isActive: true })
		.then(flight => {
			if (!flight) {
				return res.status(404).send({ message: "Flight not found" });
			}

			return Seat.find({
				flightId: req.params.flightId,
				isActive: true
			})
			.sort({ seatNumber: 1 })
			.then(result => {
				if (result.length === 0) {
					return res.status(404).send({ message: "No seats found for this flight" });
				}

				// Summary counts — useful for the frontend to display
				// "X of Y seats available" without counting client-side.
				const total    = result.length;
				const occupied = result.filter(s => s.isOccupied).length;
				const available = total - occupied;

				return res.status(200).send({
					message: "Seats found",
					summary: { total, occupied, available },
					seats: result
				});
			});
		})
		.catch(err => errorHandler(err, req, res));
};


module.exports.getSeatById = (req, res) => {
	return Seat.findOne({
		_id: req.params.id,
		isActive: true
	})
	.then(result => {
		if (!result) {
			return res.status(404).send({ message: "Seat not found" });
		}
		return res.status(200).send({
			message: "Seat found",
			result
		});
	})
	.catch(err => errorHandler(err, req, res));
};


// ADMIN LEVEL ACCESS

module.exports.getAllSeats = (req, res) => {
	return Seat.find()
		.sort({ flightId: 1, seatNumber: 1 })
		.then(result => {
			if (result.length === 0) {
				return res.status(404).send({ message: "No seats found" });
			}
			return res.status(200).send({
				message: "Seats found",
				result
			});
		})
		.catch(err => errorHandler(err, req, res));
};

module.exports.updateSeatStatus = (req, res) => {
	const { isOccupied } = req.body;

	if (typeof isOccupied !== "boolean") {
		return res.status(400).send({ message: "isOccupied must be a boolean (true or false)" });
	}

	return Seat.findById(req.params.id)
		.then(seat => {
			if (!seat) {
				return res.status(404).send({ message: "Seat not found" });
			}
			if (!seat.isActive) {
				return res.status(400).send({ message: "Cannot update an inactive seat" });
			}
			if (seat.isOccupied === isOccupied) {
				return res.status(400).send({
					message: `Seat is already marked as ${isOccupied ? "occupied" : "unoccupied"}`
				});
			}

			return Seat.findByIdAndUpdate(
				req.params.id,
				{ isOccupied },
				{ new: true }
			)
			.then(result => res.status(200).send({
				message: `Seat marked as ${isOccupied ? "occupied" : "available"}`,
				result
			}));
		})
		.catch(err => errorHandler(err, req, res));
};

module.exports.deactivateSeat = (req, res) => {
	return Seat.findById(req.params.id)
		.then(seat => {
			if (!seat) {
				return res.status(404).send({ message: "Seat not found" });
			}
			if (!seat.isActive) {
				return res.status(400).send({ message: "Seat is already deactivated" });
			}
			if (seat.isOccupied) {
				return res.status(400).send({
					message: "Cannot deactivate an occupied seat. Free the seat first via updateSeatStatus."
				});
			}

			return Seat.findByIdAndUpdate(
				req.params.id,
				{ isActive: false },
				{ new: true }
			)
			.then(result => res.status(200).send({
				message: "Seat deactivated successfully",
				result
			}));
		})
		.catch(err => errorHandler(err, req, res));
};


module.exports.reactivateSeat = (req, res) => {
	return Seat.findById(req.params.id)
		.then(seat => {
			if (!seat) {
				return res.status(404).send({ message: "Seat not found" });
			}
			if (seat.isActive) {
				return res.status(400).send({ message: "Seat is already active" });
			}

			return Seat.findByIdAndUpdate(
				req.params.id,
				{ isActive: true },
				{ new: true }
			)
			.then(result => res.status(200).send({
				message: "Seat reactivated successfully",
				result
			}));
		})
		.catch(err => errorHandler(err, req, res));
};