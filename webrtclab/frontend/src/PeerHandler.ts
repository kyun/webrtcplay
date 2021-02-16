import { createModifiersFromModifierFlags } from 'typescript';

export default function PeerHandler(options: any) {
  console.log('Loaded PeerHandler');

  navigator.getUserMedia = navigator.getUserMedia || navigator.mediaDevices.getUserMedia;

  const RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;
  const RTCSessionDescription = window.RTCSessionDescription;
  const RTCIceCandidate = window.RTCIceCandidate
  // const browserVersion = DetectRTC.browser.version;
  const isH264 = location.href.match('h264');

  const that = this;
  const { send } = options;

  const iceServers = {
    iceServers: [
      {
        urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
      }, {
        urls: ['turn:107.150.19.220:3478'],
        credential: 'turnserver',
        username: 'subrosa',
      }
    ]
  };

  let localStream: MediaStream | null = null;
  let peer: any = null;
  let peerConnectionOptions = {
    optional: [
      { DtlsSrtpKeyAgreement: 'true' }
    ]
  };
  let mediaConstraints = {
    mandatory: {
      OfferToreceiveAudio: true,
      OfferToreceiveVideo: true,
    }
  };

  function getUserMedia(mediaOption: any, callback: any, isOffer: boolean) {
    console.log('getUserMedia');
    navigator.mediaDevices.getUserMedia(mediaOption).then(function (stream: any) {
      localStream = stream;
      callback?.(localStream);
      if (isOffer) {
        createPeerConnection();
        createOffer();
      }
    })
  }
  function editSDP(SDP: any) {
    console.log('editSDP', SDP);

    // H.264 for chrome >= 73
    if (true) {
      SDP.sdp = SDP.sdp.replace('96 97 98 99 100 101 102', '102 101 100 96 97 98 99');
    } else {
      SDP.sdp = SDP.sdp.replace('96 98 100', '100 96 98'); // for chrome 57 <
      SDP.sdp = SDP.sdp.replace('96 97 98 99 100 101 102', '100 101 102 96 97 98 99'); // for chrome 65 <
    }

    console.log('return editSDP', SDP);
    return SDP;
  }
  function createOffer() {
    console.log('createOffer', arguments);

    if (localStream) {
      // addStream 제외시 recvonly로 SDP 생성됨
      // peer.addStream(localStream); // TODO 스펙 삭제됨
      addTrack(peer, localStream);
    }

    peer.createOffer(
      function(SDP: any) {
        if (isH264) {
          SDP = editSDP(SDP);
        }

        peer.setLocalDescription(SDP);
        console.log('Sending offer description', SDP);
        send({
          to: 'all',
          sdp: SDP,
        });
      },
      onSdpError,
      mediaConstraints
    );
  }

  function createAnswer(msg: any) {
    console.log('createAnswer', arguments);
    if (localStream) {
      // peer.addStream(localStream); // TODO 스펙 삭제됨
      addTrack(peer, localStream);
    }
    peer
      .setRemoteDescription(new RTCSessionDescription(msg.sdp))
      .then(function() {
        peer
          .createAnswer()
          .then(function(SDP: any) {
            if (isH264) {
              SDP = editSDP(SDP);
            }
            peer.setLocalDescription(SDP);
            console.log('Sending answer to peer.', SDP);

            send({
              to: 'all',
              sdp: SDP,
            });
          })
          .catch(onSdpError);
      })
      .catch(function(error: any) {
        console.error('Error setRemoteDescription', error);
      });
  }

  function createPeerConnection() {
    console.log('createPeerConnection');

    peer = new RTCPeerConnection(iceServers);

    console.log('new Peer', peer);
    peer.onicecandidate = function (event: any) {
      if (event.candidate) {
        send({
          to: 'all',
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate,
        });
      } else {
        console.info('Candidate denied', event.candidate);
      }
    }
    if (peer.ontrack) {
      peer.ontrack = function(event: any) {
        console.log('ontrack', event);
        var stream = event.streams[0];
        that.emit('addRemoteStream', stream);
      };

      peer.onremovetrack = function(event: any) {
        console.log('onremovetrack', event);
        var stream = event.streams[0];
        that.emit('removeRemoteStream', stream);
      };
      // 삼성 모바일에서 필요
    } else {
      peer.onaddstream = function(event: any) {
        console.log('onaddstream', event);
        that.emit('addRemoteStream', event.stream);
      };

      peer.onremovestream = function(event: any) {
        console.log('onremovestream', event);
        that.emit('removeRemoteStream', event.stream);
      };
    }

    peer.onnegotiationneeded = function(event: any) {
      console.log('onnegotiationneeded', event);
    };

    peer.onsignalingstatechange = function(event: any) {
      console.log('onsignalingstatechange', event);
    };

    peer.oniceconnectionstatechange = function(event: any) {
      console.log(
        'oniceconnectionstatechange',
        'iceGatheringState: ' + peer.iceGatheringState,
        '/ iceConnectionState: ' + peer.iceConnectionState
      );

      that.emit('iceconnectionStateChange', event);
    };
  }

   function onSdpError() {
    console.log('onSdpError', arguments);
  }
  function addTrack(peer: any, stream: MediaStream) {
    if (peer.addTrack) {
      stream.getTracks().forEach(function(track) {
        console.log('확인 addTrack', peer, track, stream);
        peer.addTrack(track, stream);
      });
    } else {
      peer.addStream(stream);
    }
  }

  function removeTrack(peer: any, stream: MediaStream) {
    if (peer.removeTrack) {
      stream.getTracks().forEach(function(track) {
        var sender = peer.getSenders().find(function(s: any) {
          return s.track === track;
        });

        if (sender) {
          peer.removeTrack(sender);
        }
      });
    } else {
      peer.removeStream(stream);
    }
  }

  function signaling(data: any) {
    console.log('onmessage', data);

    const msg = data;
    const sdp = msg.sdp || null;

    // 접속자가 보내온 offer처리
    if (sdp) {
      if (sdp.type === 'offer') {
        createPeerConnection();
        createAnswer(msg);

        // offer에 대한 응답 처리
      } else if (sdp.type === 'answer') {
        peer.setRemoteDescription(new RTCSessionDescription(msg.sdp));
      }

      // offer or answer cadidate처리
    } else if (msg.candidate) {
      const candidate = new RTCIceCandidate({
        sdpMid: msg.id,
        sdpMLineIndex: msg.label,
        candidate: msg.candidate,
      });

      peer.addIceCandidate(candidate);
    } else {
      //console.log()
    }
  }
  this.getUserMedia = getUserMedia;
  this.signaling = signaling;
}