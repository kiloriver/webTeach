'use strict';

//const { broadcaster } = require('../teacher/offer')
var broadcaster = null;
const logger = require('../../lib/logger').logger('student-offer');
function beforeOffer(peerConnection,lesson='broadcast') {
  logger.debug('viewer server | beforeOffer enter ');
  broadcaster = peerConnection.bc;

  const audioTransceiver = peerConnection.addTransceiver('audio');
  const videoTransceiver = peerConnection.addTransceiver('video');
  
  function onNewBroadcast({ audioTrack, videoTrack }) {
    logger.debug('onNewBroadcast enter broadcaster.lesson:%s lesson:%s',broadcaster.lesson,lesson);
    if(broadcaster.lesson !== lesson) return;
    
    audioTransceiver.sender.replaceTrack(audioTrack),
    videoTransceiver.sender.replaceTrack(videoTrack) 
  }
  logger.debug('viewer server | beforeOffer : begin on %s  %o',lesson,broadcaster);
  broadcaster.on(lesson, onNewBroadcast);

  if (broadcaster.audioTrack && broadcaster.videoTrack) {
    logger.debug('viewer server | beforeOffer : begin onNewBroadcast');
    onNewBroadcast(broadcaster);
  }

  const { close } = peerConnection;
  peerConnection.close = function() {
    logger.debug('viewer client | beforeOffer : begin removeListener');
    broadcaster.removeListener('newBroadcast', onNewBroadcast);
    return close.apply(this, arguments);
  }
}

module.exports = { beforeOffer };
