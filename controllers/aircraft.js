const Aircraft = require("../models/Aircraft");
const Airline = require("../models/Airline");
const { errorHandler } = require("../auth");


module.exports.createAircraft = (req, res) => {
    const { airlineId, model, totalSeats } = req.body;

    if (!airlineId || !model || !totalSeats) {
    	return res.status(400).send({ message: "Airline ID, Model and Total Seats are required"});
    } 

    return Airline.findById(airlineId)
    	.then(airline=>{
    		if (!airline) {
    			return res.status(404).send({ message: "Airline not found"});
    		}
    		if (!airline.isActive) {
    			return res.status(400).send({ message: "Cannot assign aircraft to an inactive airline"})
    		}
    	

    return Aircraft.findOne({ model, airlineId})
    	.then((existingAircraft) =>{
    		if (existingAircraft) {
    			return res.status(409).send({ message: "Aircraft already registered"});
    		}

    		const newAircraft = new Aircraft({
    			airlineId,
    			model,
    			totalSeats,
    			isActive: true,
    		});

    		return newAircraft.save()
    		.then((result) => res.status(201).send({ 
    			message: "Aircraft created successfully",
    			result
    		}));    		
    	});
    })	
    	.catch(err => errorHandler(err, req, res));
};


module.exports.getAircraftById = (req, res) => {
	return Aircraft.findById(req.params.id)
	.then(result => {
		if (!result) {
			return res.status(404).send({ message: "No Aircraft found"});
		}
		return res.status(200).send({
			message: "Aircraft found",
			result
		});
	})
	.catch(err=> errorHandler(err, req, res));  
};

module.exports.getAllAircraft = (req, res) => {
	return Aircraft.find()
	.then(result => {
		if (result.length === 0) {
			return res.status(404).send({ message: "No Aircraft found"});
		}
		return res.status(200).send({
			message: "Aircraft found",
			result
		});
	})
	.catch(err=> errorHandler(err, req, res));
};

module.exports.updateAircraft = (req, res) => {
    const { airlineId, model, totalSeats } = req.body;

    if (!airlineId && !model && !totalSeats) {
        return res.status(400).send({ message: "At least one field is required to update" });
    }

    if (airlineId) {
        return Airline.findById(airlineId)
            .then(airline => {
                if (!airline) {
                    return res.status(404).send({ message: "Airline not found" });
                }
                if (!airline.isActive) {
                    return res.status(400).send({ message: "Cannot assign aircraft to an inactive airline" });
                }

                return Aircraft.findByIdAndUpdate(
                    req.params.id,
                    { airlineId, model, totalSeats },
                    { new: true }
                )
                    .then(result => {
                        if (!result) {
                            return res.status(404).send({ message: "Aircraft not found" });
                        }
                        return res.status(200).send({
                            message: "Aircraft updated successfully",
                            result
                        });
                    });
            })
            .catch(err => errorHandler(err, req, res));
    }

    return Aircraft.findByIdAndUpdate(
        req.params.id,
        { airlineId, model, totalSeats },
        { new: true }
    )
        .then(result => {
            if (!result) {
                return res.status(404).send({ message: "Aircraft not found" });
            }
            return res.status(200).send({
                message: "Aircraft updated successfully",
                result
            });
        })
        .catch(err => errorHandler(err, req, res));
};

module.exports.deactivateAircraft = (req, res) => {
    return Aircraft.findById(req.params.id)
        .then((aircraft) => {
            if (!aircraft) {
                return res.status(404).send({ message: "Aircraft not found" });
            } else if (!aircraft.isActive) {
                return res.status(400).send({ message: "Aircraft is already deactivated" });
            }

            return Aircraft.findByIdAndUpdate(
                req.params.id,
                { isActive: false },
                { new: true }
            ).then((result) =>
                res.status(200).send({
                    message: "Aircraft deactivated successfully",
                    result
                })
            );
        })
        .catch(err => errorHandler(err, req, res));
};

module.exports.reactivateAircraft = (req, res) => {
    return Aircraft.findById(req.params.id)
        .then((aircraft) => {
            if (!aircraft) {
                return res.status(404).send({ message: "Aircraft not found" });
            } else if (aircraft.isActive) {
                return res.status(400).send({ message: "Aircraft is already active" });
            }

            return Aircraft.findByIdAndUpdate(
                req.params.id,
                { isActive: true },
                { new: true }
            ).then((result) =>
                res.status(200).send({
                    message: "Aircraft reactivated successfully",
                    result
                })
            );
        })
        .catch(err => errorHandler(err, req, res));
};