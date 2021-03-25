'use strict';

//const { broadcaster } = require('../teacher/offer')
//var broadcaster = null;
const logger = require('../../lib/logger').logger('student-offer');

function beforeOffer(peerConnection,options) {
  logger.debug('viewer server | beforeOffer enter');
  const broadcaster = options.broadcaster;
  const lesson = options.lesson;
  logger.debug('beforeOffer | lesson:%s and broadcast:%o',lesson,broadcaster);
  const audioTransceiver = peerConnection.addTransceiver('audio');
  const videoTransceiver = peerConnection.addTransceiver('video');
  
  function onNewBroadcast({ audioTrack, videoTrack }) {
    logger.debug('onNewBroadcast enter broadcaster.lesson:%s lesson:%s',broadcaster.lesson,lesson);
    //if(broadcaster.lesson !== lesson) return;
    
    audioTransceiver.sender.replaceTrack(audioTrack),
    videoTransceiver.sender.replaceTrack(videoTrack) 
  }
  logger.debug('beforeOffer on | %s  %s',lesson,broadcaster.lesson);
  broadcaster.on("lesson", onNewBroadcast);

  if (broadcaster.audioTrack && broadcaster.videoTrack) {
    logger.debug('beforeOffer onNewBroadcast');
    onNewBroadcast(broadcaster);
  }

  const { close } = peerConnection;
  peerConnection.close = function() {
    logger.debug('viewer client | beforeOffer : begin removeListener');
    broadcaster.removeListener("lesson", onNewBroadcast);
    return close.apply(this, arguments);
  }
}

module.exports = { beforeOffer };
