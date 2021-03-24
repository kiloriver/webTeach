'use strict';
const express = require('express');
const {doSetUp,doStop} = require("./routers");
const bodyParser = require('body-parser');
const fs = require('fs');
const roomManager = require('./room/roomMgr');
const logger = require('./logger').logger('webTeach-server');

async function createServer(isHttps) {
    logger.debug('createServer enter ');
    var app = express();
    app.use(bodyParser.json());
 //   app.use('/',api);
    app.get('/', (req, res) => res.redirect('teacher/index.html'));

    app.roomMgr = new roomManager();
    app.roomMgr.load();
    logger.debug('room load');
    
    doSetUp(app);    
    logger.debug('doSetup');
           
    const privateKey  = fs.readFileSync('./pem/private.pem', 'utf8');
    const certificate = fs.readFileSync('./pem/file.crt', 'utf8');
    const credentials = {key: privateKey, cert: certificate};
    const httpServ = require(isHttps?"https":"http");
    return isHttps? httpServ.createServer(credentials,app): httpServ.createServer(app);
};
function stopServer() {
    roomMgr.forEach(room=>{
        doStop(room);
    });
};

module.exports = {createServer,stopServer};