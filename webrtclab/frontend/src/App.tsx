import React from 'react';
import './App.css';

function App() {
  const [state, setState] = React.useState('');
  return (
    <div className="App">
      <div className="wrap">
        <section id="share-wrap">
          <a href="#" id="unique-token">Share this link</a>
        </section>
        <section id="enter-wrap">
          <div id="create-wrap">
            <p>Would you like to start Video Chat?</p>
            <button id="btn-start">Start</button>
          </div>
          <div id="wait-wrap"></div>
        </section>
        <section id="video-wrap">
          <div className="buttons">
            <button id="btn-camera">Camera Toggle</button>
            <button id="btn-mic">Mic Toggle</button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
