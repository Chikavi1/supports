
// emailHelper.js
const Stripe = require("stripe");
require('dotenv').config();
const stripe = new Stripe(process.env.STRIPE);

var hbs = require('nodemailer-express-handlebars');

const nodemailer = require('nodemailer');
const path = require('path');


var transporter = nodemailer.createTransport({
    service: process.env.SERVICE_EMAIL,
    auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.PASSWORD_EMAIL 
    }
});

const handlebarOptions = {
    viewEngine: {
        extName:".handlebars",
        partialsDir: path.resolve('./views'),
        defaultLayout:false
    },
    viewPath:path.resolve('./views'),
    extName:".handlebars"
    }



async function getEmail(paymentIntent) {
    const customerId = paymentIntent.customer; 
    console.log('customerId',customerId)

    const customer = await stripe.customers.retrieve(customerId);
    console.log('customer',customer)
    return customer.email;
}

function getTemplate(type) {
    switch (type) {
        case "PaymentSucceeded":
            return 'handlebars_emails/PaymentSucceeded';
        case "SubscriptionCreated":
            return 'handlebars_emails/SubscriptionCreated';
        case "SubscriptionDeleted":
            return 'handlebars_emails/SubscriptionDeleted';
        case "InvoicePaymentFailed":
            return 'handlebars_emails/InvoicePaymentFailed';
        case "InvoicePaymentSucceeded":
            return 'handlebars_emails/InvoicePaymentSucceeded';
        default:
            console.error('Tipo de evento no reconocido:', type);
            return '';
    }
}

function getContext(type, data) {
    switch (type) {
        case "PaymentSucceeded":
            return data;
        case "SubscriptionCreated":
            return {
                id: data.id,
                title: 'Gracias por unirte a la suscripción más perrona',
                message: 'Este es el resumen de tu suscripción'
            };
        case "SubscriptionDeleted":
            return {
                id: data.id,
                title: 'Lamentamos tu desuscripción',
                message: 'Esperamos pronto te vuelvas a unir!'
            };
        case "InvoicePaymentFailed":
            return {
                id: data.id,
                title: 'Queremos informarte que el pago de tu suscripción ha fallado',
                message: 'Tu suscripción no ha recibido pago'
            };
        case "InvoicePaymentSucceeded":
            return {
                id: data.id,
                title: 'Nuevo pago de la suscripción',
                message: 'Tu suscripción se ha renovado'
            };
        default:
            console.error('Tipo de evento no reconocido:', type);
            return {};
    }
}

const emailSubjects = {
  "PaymentSucceeded": "Compra en Radi",
  "SubscriptionCreated": "Suscripción en Radi",
  "SubscriptionDeleted": "Desuscripción en Radi",
  "InvoicePaymentFailed": "Pago fallido en suscripción en Radi",
  "InvoicePaymentSucceeded": "Tu suscripción en Radi"
};

function getSubject(type) {
    return emailSubjects[type] || (console.error('Tipo de evento no reconocido:', type), '');
}

async function sendEmail(email, type, data) {

    transporter.use('compile', hbs(handlebarOptions));

    const mailOptions = {
        from: 'Radi Payments <payments@radi.pet>',
        to: email,
        subject: getSubject(type),
        template: getTemplate(type),
        context: getContext(type, data)
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        if (!info.rejected.length) {
            console.log('Email enviado:', info.response);
        }
    } catch (error) {
        console.error('Error al enviar el email:', error);
    }
    return true;
}

module.exports = {
    getEmail,
    sendEmail
};