'use strict';

const fetch = require('node-fetch');
const DefaultRTCPeerConnection = require('wrtc').RTCPeerConnection;
const { RTCSessionDescription } = require('wrtc');

const TIME_TO_HOST_CANDIDATES = 3000;  // NOTE(mroberts): Too long.
//
class ConnectionClient {
  constructor(options = {}) {
    options = {
      RTCPeerConnection: DefaultRTCPeerConnection,
      clearTimeout,
      host: '',
      prefix: '.',
      setTimeout,
      timeToHostCandidates: TIME_TO_HOST_CANDIDATES,
      ...options
    };

    const {
      RTCPeerConnection,
      prefix,
      host
    } = options;
    console.debug('ClientConnect | %s,%s',host,prefix);
    this.createConnection = async (options = {}) => {
      console.debug('client | ConnectionClient  createConnection enter h:%s p:%s r:%d',host,prefix,roomid);
      options = {
        beforeAnswer() {},
        stereo: false,
        ...options
      };

      const {
        beforeAnswer,
        stereo
      } = options;
      
      console.debug('ConnectionClient | begin fetch join %s',roomid);
      const response = await fetch(`${host}${prefix}/${roomid}/join`, {
        method: 'POST'
      });
      console.debug('ConnectionClient | fetch join response %o',response.status);
      if(response.status !== 200) return null;
      const remotePeerConnection = await response.json();      
      const { id } = remotePeerConnection;
      const localPeerConnection = new RTCPeerConnection({
        sdpSemantics: 'unified-plan'
      });

      console.debug('fetch join response %O',remotePeerConnection.localDescription);

      // NOTE(mroberts): This is a hack so that we can get a callback when the
      // RTCPeerConnection is closed. In the future, we can subscribe to
      // "connectionstatechange" events.
      localPeerConnection.close = function() {
        fetch(`${host}${prefix}/connections/${id}/${roomid}`, { method: 'delete' }).catch(() => {});
        console.debug('ConnectionClient | -----close fetch %s/%s/connections/%s',host,prefix,id);
        return RTCPeerConnection.prototype.close.apply(this, arguments);
      };

      try {
        await localPeerConnection.setRemoteDescription(remotePeerConnection.localDescription);
        await beforeAnswer(localPeerConnection);
        const originalAnswer = await localPeerConnection.createAnswer();
        const updatedAnswer = new RTCSessionDescription({
          type: 'answer',
          sdp: stereo ? enableStereoOpus(originalAnswer.sdp) : originalAnswer.sdp
        });
        await localPeerConnection.setLocalDescription(updatedAnswer);
        await fetch(`${host}${prefix}/connections/${id}/${roomid}/remote-description`, {
          method: 'POST',
          body: JSON.stringify(localPeerConnection.localDescription),
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.debug('ConnectionClient | createConnection fetch %s/%s/connections/%s/remote-description ',host,prefix ,id);
        return localPeerConnection;
      } catch (error) {
        localPeerConnection.close();
        throw error;
      }
    };
  }
}

function enableStereoOpus(sdp) {
  logger.debug('ConnectionClient | enableStereoOpus sdp enter '+JSON.stringify(sdp));
  return sdp.replace(/a=fmtp:111/, 'a=fmtp:111 stereo=1\r\na=fmtp:111');
}

module.exports = ConnectionClient;
