'use strict';

const { rsvgVersion } = require('canvas');
const createStartStopButton = require('./buttons');
const ConnectionClient = require('./connect');
//
function createClient(name, description, options) {
  const connectionClient = new ConnectionClient();
  console.log('createClient | enter %s',JSON.stringify(connectionClient));
  let peerConnection = null;
  createStartStopButton(async () => {
    console.debug('createClient | onStart enter %s : connectionClient.createConnection',roomid);
    peerConnection = await connectionClient.createConnection(options);
    window.peerConnection = peerConnection;
    console.debug('createStartStopButton | onStart end %s',JSON.stringify(peerConnection));    
  }, () => {
    console.debug('createClient | onstop enter');
    peerConnection.close();    
  });
}

module.exports = createClient;
