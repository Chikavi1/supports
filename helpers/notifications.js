const axios = require('axios');
require('dotenv').config();
const ONE_SIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONE_SIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;

async function sendNotification(externalId, title, message) {
    console.log('externalId',externalId)
    try {
        const response = await axios.post('https://onesignal.com/api/v1/notifications', {
            app_id: ONE_SIGNAL_APP_ID,
            headings: { "en": title },
            contents: { "en": message },
            include_external_user_ids: [ ""+externalId+""],
            content_available: true
        }, {
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `Basic ${ONE_SIGNAL_API_KEY}`
            }
        });

        console.log('Notification sent successfully:', response.data);
    } catch (error) {
        console.error('Error sending notification:', error.response ? error.response.data : error.message);
    }
}



module.exports = {
    sendNotification
};