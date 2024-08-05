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

module.exports.hellow = async(req,res) => {
  console.log('GET / 200 OK')
    return res.json('hellow'); 
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
  try {
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

  // el pago es exitoso
 async function handlePaymentSucceeded(paymentIntent) {
    console.log(paymentIntent);
    const paymentMethodId = paymentIntent.payment_method; // Obtener el ID del método de pago utilizado

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

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
            price: paymentIntent.amount / 100, // Convertir el monto a la divisa correspondiente si es necesario
            currency: paymentIntent.currency.toUpperCase()
        }
    };

    // Aquí puedes enviar el correo electrónico con la información recopilada
    // console.log(`PaymentIntent was successful! ${paymentIntent.id}`);
    // console.log('Payment method:', context.payment.method);
    // console.log('Amount:', context.payment.price, context.payment.currency);

    const email = getEmail(paymentIntent);

    console.log(email,'PaymentSucceeded',paymentIntent,context);

    // sendEmail(email,'PaymentSucceeded',context)
    console.log(`PaymentIntent was successful! ${paymentIntent.id}`);
}

async function getEmail(paymentIntent){
    const customerId = paymentIntent.customer;
    const customer = await stripe.customers.retrieve(customerId);
    return customer.email;
}

// el pago falla
function handlePaymentFailed(paymentIntent) {
    console.log(`PaymentIntent failed: ${paymentIntent.last_payment_error.message}`);
}

// se crea una suscripción
function handleSubscriptionCreated(subscription) {
    console.log(`Subscription created: ${subscription.id}`);

    // enviar correo

}

// se cancela una suscripción
function handleSubscriptionDeleted(subscription) {
    console.log(`Subscription canceled: ${subscription.id}`);
}

// falla el pago de una factura
function handleInvoicePaymentFailed(invoice) {
    const subscriptionId = invoice.subscription;
    console.log(`Payment failed for invoice ${invoice.id}, subscription ${subscriptionId}`);
    // Incrementar contador de intentos fallidos en la base de datos
    incrementFailedAttempts(subscriptionId);
}

// el pago de una factura es exitoso
function handleInvoicePaymentSucceeded(invoice) {
    const subscriptionId = invoice.subscription;
    console.log(`Payment succeeded for invoice ${invoice.id}, subscription ${subscriptionId}`);
    // Reiniciar el contador de intentos fallidos en la base de datos
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


async function sendEmail(email,type,data){
    transporter.use('compile', hbs(handlebarOptions));

    // PaymentSucceeded
    // SubscriptionCreated
    // SubscriptionDeleted

    // InvoicePaymentFailed
    // InvoicePaymentSucceeded

    let subject, template, context;

    switch (type) {
        case "PaymentSucceeded":
            subject = "Compra en Radi";
            template = 'handlebars_emails/PaymentSucceeded';
            context = data;
            break;
    
        case "SubscriptionCreated":
            subject = "Suscripción en Radi";
            template = 'handlebars_emails/SubscriptionCreated';
            context = {
                id: data.id,
                title: 'Gracias por unirte a la suscripción más perrona',
                message: 'Este es el resumen de tu suscripción'
            };
            break;
    
        case "SubscriptionDeleted":
            subject = "Desuscripción en Radi";
            template = 'handlebars_emails/SubscriptionDeleted';
            context = {
                id: data.id,
                title: 'Lamentamos tu desuscripción',
                message: 'Esperamos pronto te vuelvas a unir!'
            };
            break;
    
        case "InvoicePaymentFailed":
            subject = "Pago fallido en suscripción en Radi";
            template = 'handlebars_emails/InvoicePaymentFailed';
            context = {
                id: data.id,
                title: 'Queremos informarte que el pago de tu suscripción ha fallado',
                message: 'Tu suscripción no ha recibido pago'
            };
            break;
    
        case "InvoicePaymentSucceeded":
            subject = "Tu suscripción en Radi";
            template = 'handlebars_emails/InvoicePaymentSucceeded';
            context = {
                id: data.id,
                title: 'Nuevo pago de la suscripción',
                message: 'Tu suscripción se ha renovado'
            };
            break;
    
        default:
            console.error('Tipo de evento no reconocido:', type);
            break;
    }
   

    const mailOptions = {
        from: 'Radi Payments<payments@radi.pet>',
        to: email,
        subject: subject,
        template: template,
        context: context
    };


    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
        } else {
            console.log('Email enviado:', info.response);
        }
    });
    return true;

}


