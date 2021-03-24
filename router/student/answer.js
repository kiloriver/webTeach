'use strict';

const clientView = require('../../lib/connects/client/clientView');
const description = 'View a broadcast.';
const remoteVideo = document.createElement('video');
remoteVideo.autoplay = true;

async function beforeAnswer(peerConnection) {
  console.debug('viewer client | beforeAnswer : begin receive stream');
  const remoteStream = new MediaStream(peerConnection.getReceivers().map(receiver => receiver.track));
  remoteVideo.srcObject = remoteStream;

  // NOTE(mroberts): This is a hack so that we can get a callback when the
  // RTCPeerConnection is closed. In the future, we can subscribe to
  // "connectionstatechange" events.
  const { close } = peerConnection;
  peerConnection.close = function() {
    console.debug('viewer client | beforeAnswer : peerConnection.close');
    remoteVideo.srcObject = null;
    return close.apply(this, arguments);
  };
}

const videos = document.createElement('div');
videos.className = 'grid';
videos.appendChild(remoteVideo);
document.body.appendChild(videos);

clientView('student', description, { beforeAnswer });