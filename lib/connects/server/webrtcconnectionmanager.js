'use strict';

const ConnectionManager = require('./connectionmanager');
const WebRtcConnection = require('./webrtcconnection');
const logger = require('../../logger').logger('webRTC-manager');
class WebRtcConnectionManager {
  constructor(options = {}) {
    options = {
      Connection: WebRtcConnection,
      ...options
    };
    this.state = {
      lesson:'broadcast'
    };
    this.connectionManager = new ConnectionManager(options);

    this.createConnection = async () => {
      const connection = this.connectionManager.createConnection();
      await connection.doOffer();
      return connection;
    };

    this.getConnection = id => {
      return this.connectionManager.getConnection(id);
    };

    this.getConnections = () => {
      return this.connectionManager.getConnections();
    };
  };
  updateLesson = function(ls){
    this.state.lesson = ls;
    this.connectionManager.lesson = ls;
  };
  toJSON() {
    return this.getConnections().map(connection => connection.toJSON());
  }
}

WebRtcConnectionManager.create = function create(options) {
  logger.debug('WebRtcConnectionManager enter ' + JSON.stringify(options)); 
  return new WebRtcConnectionManager({
    Connection: function(id) {     
      return new WebRtcConnection(id, options);
    }
  });
};

module.exports = WebRtcConnectionManager;
