const Notification = require('./../models/notifications.model')

async function Count(Model, condition, limit, whoIsDemanding = 'USER') {
    try {
        return Model.Count(condition, limit, whoIsDemanding);
    } catch (err) {
        return err;
    }
}

async function UpdateById(Model, id, update, options) {
    try {
        return Model.UpdateById(id, update, options);
    } catch (err) {
        return err;
    }
}

async function Notify(notificationCreator, notificationType, notificationTitle, notificationMessage, notificationTarget) {
    try {
        // add new notification
        return Notification.create({
            notificationCreator: notificationCreator,
            notificationTitle: notificationTitle,
            notificationType: notificationType,
            notificationText: notificationMessage,

            // notificationCentext: ,

            notificationTarget: notificationTarget.map((element) => {
                return {
                    targetUser: element,
    
                    targetFetched:    false,
                    targetSeen:       false,
                    targetRead:       false,
                }
            })
        })


    } catch (err) {
        return err;
    }
}

async function findNotifications(id, limit, skip){
    try{
        return Notification.FindNotifications(id, limit, skip)
    } catch(err){
        return err
    }
}

async function markNotifications(id, update, callback){
    try{
        return Notification.FindAndTrace(id, update, callback)
    } catch(err){
        return err
    }
}

module.exports = { Count, UpdateById, Notify, findNotifications, markNotifications };
