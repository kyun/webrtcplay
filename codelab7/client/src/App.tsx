import React from 'react';

function App() {
  return (
    <div className="App">
      <h1>Realtime communication with WebRTC</h1>

      <div id="videoCanvas">
        <video id="camera" autoPlay playsInline></video>
        <canvas id="photo"></canvas>
      </div>

      <div id="buttons">
        <button id="snap">Snap</button><span> then </span><button id="send">Send</button>
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
