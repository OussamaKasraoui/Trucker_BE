const EventEmitter = require('events');
const EmailService = require('../helpers/emails.helper'); // Assuming the email logic is in emailService.js
const NotificationService = require('../helpers/notifications.helper'); // Assuming notification logic is here

class EventManager extends EventEmitter {
    constructor() {
        super();
        this.registerEvents();
    }

    // Register all event listeners
    registerEvents() {
        this.on('sendEmail', this.handleSendEmail);
        this.on('sendNotification', this.handleSendNotification);
    }

    // Handle sendEmail event
    async handleSendEmail(emailData) {
        try {
            const response = await EmailService.create(emailData);
            console.log('Email Event Handled:', response);
        } catch (error) {
            console.error('Error in email event:', error.message);
        }
    }

    // Handle sendNotification event
    async handleSendNotification({ creator, type, title, message, target }) {
        try {
            const response = await NotificationService.Notify(
                creator,
                type,
                title,
                message,
                target
            );
            console.log('Notification Event Handled:', response);
        } catch (error) {
            console.error('Error in notification event:', error.message);
        }
    }

    // Emit event helper
    triggerEvent(eventName, data) {
        this.emit(eventName, data);
    }
}

// Export a singleton instance of EventManager
module.exports = new EventManager();
