const Notification = require("../models/Notification");
const { errorHandler } = require("../auth");


// HELPER FUNCTION 
const simulateEmailSend = (recipient, message) => {
    console.log("─────────────────────────────────────────");
    console.log("📧 SIMULATED EMAIL SENT");
    console.log(`TO: ${recipient}`);
    console.log(`MESSAGE: ${message}`);
    console.log("─────────────────────────────────────────");
    return true;
};


//  NOTIFICATION FACTORY 
module.exports.createNotification = ({ userId, guestEmail, type, message, referenceId, referenceModel }) => {
    const recipient = guestEmail || `[User ID: ${userId}]`;

    const newNotification = new Notification({
        userId: userId || null,
        guestEmail: guestEmail || null,
        type,
        message,
        referenceId: referenceId || null,
        referenceModel: referenceModel || null,
        isRead: false,
        emailSent: true,
        emailSentAt: new Date(),
        isActive: true
    });

    simulateEmailSend(recipient, message);

    return newNotification.save();
};


//  USER LEVEL ACCESS 
module.exports.getMyNotificationsUser = (req, res) => {
    return Notification.find({ userId: req.user.id, isActive: true })
        .sort({ createdAt: -1 })
        .then(result => {
            if (result.length === 0) {
                return res.status(404).send({ message: "No notifications found" });
            }
            return res.status(200).send({
                message: "Notifications found",
                result
            });
        })
        .catch(err => errorHandler(err, req, res));
};


module.exports.getMyNotificationsGuest = (req, res) => {
    const { guestEmail } = req.body;

    if (!guestEmail || !guestEmail.includes("@")) {
        return res.status(400).send({ message: "Valid guest email is required" });
    }

    return Notification.find({ guestEmail, userId: null, isActive: true })
        .sort({ createdAt: -1 })
        .then(result => {
            if (result.length === 0) {
                return res.status(404).send({ message: "No notifications found" });
            }
            return res.status(200).send({
                message: "Notifications found",
                result
            });
        })
        .catch(err => errorHandler(err, req, res));
};


module.exports.markAsRead = (req, res) => {
    return Notification.findById(req.params.id)
        .then(notification => {
            if (!notification) {
                return res.status(404).send({ message: "Notification not found" });
            }

            const isOwner = notification.userId && String(notification.userId) === req.user.id;
            const isBroadcast = !notification.userId;
            if (!isOwner && !isBroadcast) {
                return res.status(403).send({ message: "Unauthorized to update this notification" });
            }

            if (notification.isRead) {
                return res.status(400).send({ message: "Notification is already marked as read" });
            }

            return Notification.findByIdAndUpdate(
                req.params.id,
                { isRead: true },
                { new: true }
            )
            .then(result => res.status(200).send({
                message: "Notification marked as read",
                result
            }));
        })
        .catch(err => errorHandler(err, req, res));
};


module.exports.markAllAsReadUser = (req, res) => {
    return Notification.updateMany(
        { userId: req.user.id, isRead: false },
        { isRead: true }
    )
    .then(result => res.status(200).send({
        message: "All notifications marked as read",
        result
    }))
    .catch(err => errorHandler(err, req, res));
};


// ADMIN LEVEL ACCESS 

module.exports.getAllNotifications = (req, res) => {
    return Notification.find()
        .sort({ createdAt: -1 })
        .then(result => {
            if (result.length === 0) {
                return res.status(404).send({ message: "No notifications found" });
            }
            return res.status(200).send({
                message: "Notifications found",
                result
            });
        })
        .catch(err => errorHandler(err, req, res));
};


module.exports.deactivateNotification = (req, res) => {
    return Notification.findById(req.params.id)
        .then(notification => {
            if (!notification) {
                return res.status(404).send({ message: "Notification not found" });
            }
            if (!notification.isActive) {
                return res.status(400).send({ message: "Notification is already deactivated" });
            }

            return Notification.findByIdAndUpdate(
                req.params.id,
                { isActive: false },
                { new: true }
            )
            .then(result => res.status(200).send({
                message: "Notification deactivated successfully",
                result
            }));
        })
        .catch(err => errorHandler(err, req, res));
};