'use strict';
const clientView = require('../../lib/connects/client/clientView');

const description = 'Start a broadcast.';

const localVideo = document.createElement('video');
localVideo.autoplay = true;
localVideo.muted = true;

async function beforeAnswer(peerConnection) {
  console.debug('broadcaster client | beforeAnswer enter %d',roomid);
  const localStream = await window.navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
  });

  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
  console.debug('broadcaster client | beforeAnswer :peerConnection.addTrack ');
  localVideo.srcObject = localStream;

  // NOTE(mroberts): This is a hack so that we can get a callback when the
  // RTCPeerConnection is closed. In the future, we can subscribe to
  // "connectionstatechange" events.
  const { close } = peerConnection;
  peerConnection.close = function() {
    localVideo.srcObject = null;
    console.debug('broadcaster client | beforeAnswer :peerConnection.close ');
    localStream.getTracks().forEach(track => track.stop());

    return close.apply(this, arguments);
  };
}

const videos = document.createElement('div');
videos.className = 'grid';
videos.appendChild(localVideo);
document.body.appendChild(videos);

clientView('teacher', description, { beforeAnswer });


