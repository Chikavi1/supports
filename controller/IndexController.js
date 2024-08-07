const Stripe = require("stripe");
require('dotenv').config();
const stripe = new Stripe(process.env.STRIPE);
const emailHelper = require('../helpers/email');
const notificationsHelper = require('../helpers/notifications');

module.exports.hellow = async (_,res) => {

    const context = {
        id: '122312',
        date: new Date(),
        payment: {
            method: `mastecard 4242`,
            price: 10000, 
            currency: 'MXN'
        }
    };

    const email = "l.rojas@sonetasot.com.mx";
   // case "PaymentSucceeded":
   // case "SubscriptionCreated":
    //case "SubscriptionDeleted":
   //case "InvoicePaymentFailed":
   // case "InvoicePaymentSucceeded":
    const template = "InvoicePaymentFailed";
    sendNotification()
    // await emailHelper.sendEmail(email,template,context);

    return res.json('Correo Enviado: '+template);
}

module.exports.test = async(req,res) => {  
    return res.json('success');
}

module.exports.index = async (req, res) => {
  const endpointSecret =  process.env.ENDPOINT_SECRET; // Reemplaza con tu secreto del webhook
  const sig = req.headers['stripe-signature'];
  let event;

  try{
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("Received event:", event)

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
    const email = await emailHelper.getEmail(paymentIntent);

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
    await emailHelper.sendEmail(email,'PaymentSucceeded',context)
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


function sendNotification(){
    const externalId = '214904';
    const message = 'Hola Luis, gracias por comprar con nosotros!';
    const title = 'Compra exitosa!';
    notificationsHelper.sendNotification(externalId, title, message);
}


function handlerNotifyUser(response) {
    console.log(response);
    if(response.customer){
        emailHelper.sendEmail(response.customer.email, 'PaymentSucceeded', response);
    }
    if(response.metadata){
        handlerMetadata(response);
    }
}

function handlerMetadata(event) {
    // aqui puedes hacer otras cosas
    if(event.notification.externalId){
        sendNotification(event.notification.externalId, event.notification.title, event.notification.message);
    }
 

}