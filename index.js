const serverless = require("serverless-http");
const express = require("express");
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const IndexController = require('./controller/IndexController');

app.use('/webhook', bodyParser.raw({ type: 'application/json' }));
app.post('/webhook', IndexController.index);

app.get('/',IndexController.hellow);
app.get('/test',IndexController.test);

app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true }));

// const routes = require('./routes');
// app.use('/', routes());

// Borrar al subir
app.listen('8082','0.0.0.0',() => {
    console.log('Servido iniciado.');
});


module.exports.handler = serverless(app);
