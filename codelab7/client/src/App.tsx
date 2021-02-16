import React from 'react';
import { io } from 'socket.io-client';
import adapter from 'webrtc-adapter';

function randomToken() {
  return Math.floor((1 + Math.random()) * 10).toString(4).substring(1);
}

function App() {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const photoRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    let isInitiator = true;
    let socket = io('http://localhost:8080', { withCredentials: true });
    room = window.location.hash = randomToken();
    var room = window.location.hash.substring(1);

    socket.on('ipaddr', (ip: string) => {
      console.log(' SERVER IP = ' + ip);
    });

    socket.on('created', (room: any, clientId: any) => {
      console.log('Created room', room, '- my client ID is', clientId);
      grabWebCamVideo();

    });

    socket.on('joined', (room: any, clientId: any) => {
      console.log('asdfasdf')
      console.log('This peer has joined room', room, 'with client ID', clientId);
      createPeerConnection(false);
      grabWebCamVideo();
    });

    socket.on('ready', () => {
      console.log('Socket is ready');
      createPeerConnection(true);
    });

    socket.on('log', function(array: any) {
      console.log.apply(console, array);
    });

    socket.emit('create or join', room);
    if (window.location.hostname.match(/localhost|127\.0\.0/)) {
      socket.emit('ipaddr');
    }

    socket.on('disconnect', (reason: any) => {
      console.log('Disconnected: ' + reason);
    });



  }, []);

  function grabWebCamVideo() {
    console.log('Getting user media (video) ... ');
    navigator.mediaDevices.getUserMedia({
      audio: false,
      video: true,
    }).then(gotStream);
  }
  function gotStream(stream: any) {
    console.log('getUserMedia video stream URL:', stream);
    // window.stream = stream;
    videoRef.current!.srcObject = stream;
    videoRef.current!.onloadedmetadata = function () {
      photoRef.current!.width = videoRef.current!.videoWidth;
      photoRef.current!.height = videoRef.current!.videoHeight;
    }
  }

  function createPeerConnection(isInitiator: boolean) {
    console.log('Creating Peer connection as initiator?', isInitiator);

    const peerConn = new RTCPeerConnection();
    peerConn.onicecandidate = function (event: any) {
      console.log('icecandidate event:', event);
      if (event.candidate) {
        sendMessage({
          type: 'candidate',
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        });
      } else {
        console.log('End of candidates.');
      }
    };

    if (isInitiator) {
      console.log('Creating Data Channel');
      let dataChannel = peerConn.createDataChannel('photos');
      onDataChannelCreated(dataChannel);

      console.log('Creating an offer');
      peerConn.createOffer().then((offer: any) => {
        return peerConn.setLocalDescription(offer);
      }).then(() => {
        console.log('sending local desc: ', peerConn.localDescription);
        sendMessage(peerConn.localDescription);
      });
    } else {
      peerConn.ondatachannel = function (event: any) {
        console.log('ondatachannel:', event.channel);
        let dataChannel = event.channel;
        onDataChannelCreated(dataChannel);
      }
    }

  }
  function sendMessage(message: any) {
    let socket = io();
    console.log('Client sending message: ', message);
    socket.emit('message', message);
  }
  function onDataChannelCreated(channel: any) {
    console.log('onDataChannelCreated:', channel);

    channel.onopen = function () {
      console.log('channel opened.');
    };
    channel.onclose = function () {
      console.log('channel closed.');
    }

    channel.onmessage = receiveDataChromeFactory();
    function receiveDataChromeFactory() {
      let buf: any, count: any;

      return function onmessage(event: any) {
        if (typeof event.data === 'string') {
          buf = new Uint8ClampedArray(parseInt(event.data));
          count = 0;
          console.log('expecting a total of ' + buf.byteLength + ' bytes');
          return;
        }
        let data = new Uint8ClampedArray(event.data);
        buf.set(data, count);
        count += data.byteLength;
        console.log('count: ' + count);
        if (count === buf.byteLength) {
          // we're done: all data chunks have been received
          console.log('Done. Rendering photo.');
          renderPhoto(buf);
        }
      }
    }
  }

  function renderPhoto(data: any) {
    let canvas = document.createElement('canvas');

  }

  function snapPhoto() {
    console.log(videoRef.current);
    photoRef.current!.getContext('2d')?.drawImage(videoRef.current as any, 0, 0, photoRef.current!.width, photoRef.current!.height);
  }
  return (
    <div className="App">
      <h1>Realtime communication with WebRTC</h1>

      <div id="videoCanvas">
        <video ref={videoRef} id="camera" autoPlay playsInline></video>
        <canvas ref={photoRef} id="photo"></canvas>
      </div>

      <div id="buttons">
        <button onClick={snapPhoto}>Snap</button><span> then </span><button id="send">Send</button>
        <span> or </span>
        <button id="snapAndSend">Snap &amp; Send</button>
      </div>

      <div id="incoming">
        <h2>Incoming photos</h2>
        <div id="trail"></div>
      </div>
    </div>
  );
}

export default App;