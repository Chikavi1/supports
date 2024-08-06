const { sequelize, Support } = require('../models/sequelize');
const Stripe = require("stripe");
const stripe = new Stripe("sk_test_51KsA9rBp6uwr6por8pB7dv2xDCj4KAWdSCf5FTP3QkXnDpRzQJg9Q6G5TxWJ91Xbf8dwd9b6hbvmScYElAgGRUES00zPLNkIbD");
var nodemailer = require('nodemailer');
var hbs = require('nodemailer-express-handlebars');
const path = require('path');


var transporter = nodemailer.createTransport({
    service: 'SendinBlue',
    auth: {
        user: "luisrojas@radi.pet",
        pass: "O5pPUXCtd84ZznWI" 
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

module.exports.hellow = async (_,res) => {

    const context = {
        id: 'dasdas-122312',
        date: new Date(),
        payment: {
            method: `mastecar 4242`,
            price: 10000, 
            currency: 'MXN'
        }
    };

    const email = "l.rojas@sonetasot.com.mx";
    const template = "InvoicePaymentFailed";
    await sendEmail(email,template,context);

    return res.json('Correo Enviado: '+template);
}

module.exports.test = async(req,res) => {

    email = "chikavi10@gmail.com";
    context = {

    };
    sendEmail(email,"PaymentSucceeded",context);

    return res.json('success');
}

module.exports.index = async (req, res) => {
  const endpointSecret = 'whsec_q07ifLzU0FUVLjyvNTJgT2pfE8eopzMe'; // Reemplaza con tu secreto del webhook
  const sig = req.headers['stripe-signature'];
  let event;

  try{
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
      case 'payment_intent.succeeded':
          handlePaymentSucceeded(event.data.object);
          break;
      case 'payment_intent.payment_failed':
          handlePaymentFailed(event.data.object);
          break;
      case 'customer.subscription.created':
          handleSubscriptionCreated(event.data.object);
          break;
      case 'customer.subscription.deleted':
          handleSubscriptionDeleted(event.data.object);
          break;
      case 'invoice.payment_failed':
          handleInvoicePaymentFailed(event.data.object);
          break;
      case 'invoice.payment_succeeded':
          handleInvoicePaymentSucceeded(event.data.object);
          break;
      default:
          console.log(`Unhandled event type ${event.type}`);
  }
  res.status(200).json({ received: true });
};

 async function handlePaymentSucceeded(paymentIntent) {

    const paymentMethodId = paymentIntent.payment_method; 
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    const email = getEmail(paymentIntent);

    let paymentMethodType = '';
    let last4 = '';
    if (paymentMethod.type === 'card') {
        paymentMethodType = paymentMethod.card.brand;
        last4 = paymentMethod.card.last4;
    }

    const context = {
        id: paymentIntent.id,
        date: new Date(),
        payment: {
            method: `${paymentMethodType} ${last4}`,
            price: paymentIntent.amount / 100,  
            currency: paymentIntent.currency.toUpperCase()
        }
    };  
    sendEmail(email,'PaymentSucceeded',context)
}

function handlePaymentFailed(paymentIntent){
    console.log(`PaymentIntent failed: ${paymentIntent.last_payment_error.message}`);


}

 function handleSubscriptionCreated(subscription){

    console.log(`Subscription created: ${subscription.id}`);

    // enviar correo

}

// se cancela una suscripción
function handleSubscriptionDeleted(subscription){
    console.log(`Subscription canceled: ${subscription.id}`);
}

// falla el pago de una factura
function handleInvoicePaymentFailed(invoice) {
    const subscriptionId = invoice.subscription;
    console.log(`Payment failed for invoice ${invoice.id}, subscription ${subscriptionId}`);
    incrementFailedAttempts(subscriptionId);
}

// el pago de una factura es exitoso
function handleInvoicePaymentSucceeded(invoice) {
    const subscriptionId = invoice.subscription;
    console.log(`Payment succeeded for invoice ${invoice.id}, subscription ${subscriptionId}`);
    resetFailedAttempts(subscriptionId);
}


async function cancelSubscription(subscriptionId) {
    try {
        await stripe.subscriptions.del(subscriptionId);
        console.log(`Subscription ${subscriptionId} canceled due to failed payment attempts.`);
    } catch (err) {
        console.error(`Failed to cancel subscription ${subscriptionId}:`, err);
    }
}





// email functions sendEmail

async function sendEmail(email,type,data){
    const mailOptions = {
        from: 'Radi Payments<payments@radi.pet>',
        to: email,
        subject: getSubject(type),
        template: getTemplate(type),
        context: getContext(type,data)
    };
    try{    
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(error);
            } else {
                console.log('Email enviado:', info.response);
            }
        });
    }catch(err){
        console.error(err);
    }
    return true;

}

function getSubject(type){
    switch (type) {
        case "PaymentSucceeded":
            return "Compra en Radi";
        case "SubscriptionCreated":
            return "Suscripción en Radi";
        case "SubscriptionDeleted":
            return "Desuscripción en Radi";
        case "InvoicePaymentFailed":
            return "Pago fallido en suscripción en Radi";
        case "InvoicePaymentSucceeded":
            return "Tu suscripción en Radi";
        default:
            console.error('Tipo de evento no reconocido:', type);
            return '';
    }
}

function getTemplate(type){
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

function getContext(type,data){
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

async function getEmail(paymentIntent){
    const customerId = paymentIntent.customer;
    const customer = await stripe.customers.retrieve(customerId);
    return customer.email;
}