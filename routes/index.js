const express = require('express');
const router = express.Router();
const IndexController = require('../controller/IndexController');

module.exports = function(){
    // router.get('/',IndexController.hellow);
    //ºrouter.post('/webhook', IndexController.index);
    return router;
}