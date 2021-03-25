'use strict';

const DefaultRTCPeerConnection = require('wrtc').RTCPeerConnection;
const Connection = require('./connection');
const logger = require('../../logger').logger('webRTC-connect');

const TIME_TO_CONNECTED = 10000;
const TIME_TO_HOST_CANDIDATES = 3000;  // NOTE(mroberts): Too long.
const TIME_TO_RECONNECTED = 10000;

class WebRtcConnection extends Connection {
  constructor(id, options = {}) {    
    super(id);
    logger.debug('WebRtcConnection constructor enter %s',options.lesson);
    options = {
      RTCPeerConnection: DefaultRTCPeerConnection,
      beforeOffer() {},
      clearTimeout,
      setTimeout,
      timeToConnected: TIME_TO_CONNECTED,
      timeToHostCandidates: TIME_TO_HOST_CANDIDATES,
      timeToReconnected: TIME_TO_RECONNECTED,
      ...options
    };

    const {
      RTCPeerConnection,
      beforeOffer,
      lesson,
      timeToConnected,
      timeToReconnected
    } = options;

    const peerConnection = new RTCPeerConnection({
      sdpSemantics: 'unified-plan'
    });
   // peerConnection.broadcastor = options.broadcastor;
    logger.debug('new RTCPeerConnection :%o',peerConnection);

    beforeOffer(peerConnection,options);
    
    let connectionTimer = options.setTimeout(() => {
      if (peerConnection.iceConnectionState !== 'connected'
        && peerConnection.iceConnectionState !== 'completed') {
        this.close();
      }
    }, timeToConnected);

    let reconnectionTimer = null;

    const onIceConnectionStateChange = () => {
   //   console.debug('onIceConnectionStateChange enter ');
      if (peerConnection.iceConnectionState === 'connected'
        || peerConnection.iceConnectionState === 'completed') {
        if (connectionTimer) {
          options.clearTimeout(connectionTimer);
        //  console.debug('onIceConnectionStateChange | options.clearTimeout 1');
          connectionTimer = null;
        }
        options.clearTimeout(reconnectionTimer);
     //   console.debug('onIceConnectionStateChange | options.clearTimeout 2');
        reconnectionTimer = null;
      } else if (peerConnection.iceConnectionState === 'disconnected'
        || peerConnection.iceConnectionState === 'failed') {
        if (!connectionTimer && !reconnectionTimer) {
          const self = this;
      //    console.debug('onIceConnectionStateChange | self.close() begin');
          reconnectionTimer = options.setTimeout(() => {
            self.close();
      //      console.debug('onIceConnectionStateChange | self.close() end');
          }, timeToReconnected);
        }
      }
    };

    peerConnection.addEventListener('iceconnectionstatechange', onIceConnectionStateChange);

    this.doOffer = async () => {
      logger.debug('doOffer enter');
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      try {
        await waitUntilIceGatheringStateComplete(peerConnection, options);
        logger.debug('doOffer | waitUntilIceGatheringStateComplete end');
      } catch (error) {
        this.close();
        throw error;
      }
    };

    this.applyAnswer = async answer => {
      logger.debug('applyAnswer enter');
      // logger.debug('applyAnswer enter answer:%o offer:%o',answer,peerConnection.localDescription);
      await peerConnection.setRemoteDescription(answer);
    };

    this.close = () => {
      logger.debug(' webrtcconnection close enter');
      peerConnection.removeEventListener('iceconnectionstatechange', onIceConnectionStateChange);
      if (connectionTimer) {
        options.clearTimeout(connectionTimer);
        connectionTimer = null;
      }
      if (reconnectionTimer) {
        options.clearTimeout(reconnectionTimer);
        reconnectionTimer = null;
      }
      peerConnection.close();
      super.close();
    };

    this.toJSON = () => {
      return {
        ...super.toJSON(),
        iceConnectionState: this.iceConnectionState,
        localDescription: this.localDescription,
        remoteDescription: this.remoteDescription,
        signalingState: this.signalingState
      };
    };

    Object.defineProperties(this, {
      iceConnectionState: {
        get() {
          return peerConnection.iceConnectionState;
        }
      },
      localDescription: {
        get() {
          return descriptionToJSON(peerConnection.localDescription, true);
        }
      },
      remoteDescription: {
        get() {
          return descriptionToJSON(peerConnection.remoteDescription);
        }
      },
      signalingState: {
        get() {
          return peerConnection.signalingState;
        }
      }
    });
  }
}

function descriptionToJSON(description, shouldDisableTrickleIce) {
  return !description ? {} : {
    type: description.type,
    sdp: shouldDisableTrickleIce ? disableTrickleIce(description.sdp) : description.sdp
  };
}

function disableTrickleIce(sdp) {
  return sdp.replace(/\r\na=ice-options:trickle/g, '');
}

async function waitUntilIceGatheringStateComplete(peerConnection, options) {
  logger.debug('waitUntilIceGatheringStateComplete enter');
  if (peerConnection.iceGatheringState === 'complete') {
    return;
  }

  const { timeToHostCandidates } = options;

  const deferred = {};
  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });

  const timeout = options.setTimeout(() => {
    peerConnection.removeEventListener('icecandidate', onIceCandidate);
    deferred.reject(new Error('Timed out waiting for host candidates'));
  }, timeToHostCandidates);

  function onIceCandidate({ candidate }) {
    if (!candidate) {
   //   console.debug('onIceCandidate | begin options.clearTimeout(timeout) ' + timeout);
      options.clearTimeout(timeout);
      peerConnection.removeEventListener('icecandidate', onIceCandidate);
      deferred.resolve();
    }
  }

  peerConnection.addEventListener('icecandidate', onIceCandidate);

  await deferred.promise;
}

module.exports = WebRtcConnection;
