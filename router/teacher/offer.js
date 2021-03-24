'use strict';

const { EventEmitter } = require('events');
const logger = require('../../lib/logger').logger('teacher-offer');
let broadcaster = null;//new EventEmitter();
function beforeOffer(peerConnection,lesson='broadcast') {
  logger.debug('broadcaster server | beforeOffer enter ');
  broadcaster = peerConnection.bc;
  const audioTrack = broadcaster.audioTrack = peerConnection.addTransceiver('audio').receiver.track;
  const videoTrack = broadcaster.videoTrack = peerConnection.addTransceiver('video').receiver.track;
  logger.debug('broadcaster server | beforeOffer :broadcaster.emit %s',lesson);
  broadcaster.emit('lesson', {
    audioTrack,
    videoTrack
  });

  const { close } = peerConnection;
  peerConnection.close = function() {
    logger.debug('broadcaster server | beforeOffer : peerConnection.close');
    audioTrack.stop();
    videoTrack.stop();
    return close.apply(this, arguments);
  };
}

module.exports = {
  beforeOffer,
  broadcaster
};
