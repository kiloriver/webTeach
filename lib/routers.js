'use strict';
//const express = require('express');
var logger = require('../lib/logger.js').logger('webTeach-router');
const { readdirSync, statSync } = require('fs');
const { join } = require('path');
const browserify = require('browserify-middleware');
//const {liveRoom} = require('./room/room');
const WebRtcConnectionManager = require('./connects/server/webrtcconnectionmanager');

//
function doSetUp(app){  
  const sDirectory = join(__dirname, '../router');
  const routers = readdirSync(sDirectory).filter(path =>statSync(join(sDirectory, path)).isDirectory());    
  routers.forEach(router => {
      const path = join(sDirectory, router);
      const clientPath = join(path, 'answer.js');
      const serverPath = join(path, 'offer.js');
      logger.debug('doSetUp |router:%s : clientPath %s .. serverPath %s' ,router,clientPath,serverPath);
      
      app.use(`/${router}/index.js`, browserify(clientPath));
      
      app.get(`/${router}/*`, (req, res) => {          
        const lesson = req.query.lesson;
        logger.debug('enter api %s : %s',router,lesson);
        if(lesson === null || lesson === "" || lesson === undefined){
            res.sendStatus(403);
            res.end();
            return;
        }
        
        logger.debug('findRoom before roomMgr:%j',app.roomMgr);
        const room = app.roomMgr.dispatch(lesson);
        logger.debug('api | findroom :%O',room);
        if(room === undefined || room === null){
          res.sendStatus(404);
          res.end();
          return;
        }
        const options = require(serverPath);
        logger.debug('doSetup | router:%s  options %O',router,options);              
        if(router === 'teacher'){
          options.broadcaster = room.getBroadcastor();
          options.broadcaster.lesson = lesson;  
          options.broadcaster.roomid = room.state.id;          
        } 
        if(router === 'student'){
          options.lesson = lesson;
          options.broadcaster = room.getBroadcastor();
        }          
        //
        let connectionManager = WebRtcConnectionManager.create(options);
        connectionManager.state.lesson = lesson;
        connectionManager.state.roomid = room.state.id;
        room.setRtcManager(router,connectionManager);
        
        doMount(app,`/${router}`);            
        
        const filename = 'index_' + room.state.id + '.html';
        res.sendFile(join(__dirname, '../view', filename));
      });
    });
};

function doMount(app, prefix = ''){
    logger.debug('doMount |  enter %s',prefix);
    app.post(`${prefix}/:roomid/join/`, async (req, res) => {
      try {
        logger.debug('doMount | async get %s/join  req.params:%O',prefix,req.params);          
        if(app.roomMgr === undefined || app.roomMgr === null)
        { 
          logger.error("roomMgr is invalidate");
          res.sendStatus(501);
          return;
        }
        const roomid = req.params.roomid;
        if(app.roomMgr.join(roomid,prefix) === false){
          logger.error("room(%s) is invalidate or full",roomid);
          res.sendStatus(502);
          return;
        }
        const connetMgr = app.roomMgr.getRtcManager(prefix,roomid);
        const connection = await connetMgr.createConnection();
        logger.debug('doMount | async get %s/connections -- %s',prefix,connection.id);
        res.send(connection);
      } 
      catch (error) {
        console.error(error);
        res.sendStatus(500);
      }
    });
    
    app.delete(`${prefix}/connections/:id/:roomid`, (req, res) => {
      logger.debug('doMount | delete %s/connections/:id  -- %j',prefix,req.params);
        const { id,roomid } = req.params;
        app.roomMgr.exit(roomid,prefix);
        const connetMgr = app.roomMgr.getRtcManager(prefix,roomid);
        const connection = connetMgr.getConnection(id);
        if (!connection) {
          res.sendStatus(404);
          return;
        }
        connection.close();
        res.send(connection);
      });
  
    app.post(`${prefix}/connections/:id/:roomid/remote-description`, async (req, res) => {
      logger.debug('doMount | post %s/connections/:id/remote-description  -- %j',prefix,req.params);
        const { id,roomid } = req.params;
        const connetMgr = app.roomMgr.getRtcManager(prefix,roomid);
        const connection = connetMgr.getConnection(id);
        if (!connection) {
          res.sendStatus(404);
          return;
        }
        try {
          await connection.applyAnswer(req.body);
          res.send(connection.toJSON().remoteDescription);
        } catch (error) {
          res.sendStatus(400);
        }
      });
};


function doStop(room){
  const roomObj = roomManager.find(room.state.id);
  roomObj.clear();
  roomObj.getRtcManager().forEach(connectionManager => connectionManager.close());
};
module.exports = {doSetUp,doStop};
