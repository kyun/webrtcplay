import { io } from "socket.io-client";
import MediaHandler from './MediaHandler';
import PeerHandler from './PeerHandler';

const socket = io();
const mediaHandler = MediaHandler();
let roomId: any;
let userId: any;
const peerHandler = PeerHandler({
  send: (data: any) => {
    console.log('send', data);
    data.roomId = roomId;
    data.sender = userId;
    socket.send(data);
  },
});

const animationTime = 500;
const mediaOption = {
  audio: true,
  video: {
    mandatory: {
      maxWidth: 1920,
      maxHeight: 1080,
      maxFrameRate: 30,
    },
    optional: [
      { googNoiseReduction: true }, // Likely removes the noise in the captured video stream at the expense of computational effort.
      { facingMode: 'user' }, // Select the front/user facing camera or the rear/environment facing camera if available (on Phone)
    ],
  },
};
