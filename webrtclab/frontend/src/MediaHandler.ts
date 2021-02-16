
export default function MediaHandler() {
  console.log('Loaded MediaHandler');

  let localStream: MediaStream;

  function setVideoStream(data: any) {
    const { type, el, stream } = data;
    el.srcObject = stream;

    if (type === 'local') {
      localStream = stream;
    } 
  }

  function pause(callback: any) {
    console.log('pauseVideo');
    localStream.getVideoTracks()[0].enabled = false;
    callback?.();
  }

  function resume(callback: any) {
    console.log('resumeVideo');
    localStream.getVideoTracks()[0].enabled = true;
    callback?.();
  }

  function mute(callback: any) {
    console.log('muteAudio');
    localStream.getAudioTracks()[0].enabled = false;
    callback?.();
  }

  function unmute(callback: any) {
    console.log('unmuteAudio');
    localStream.getAudioTracks()[0].enabled = true;
    callback?.();
  }
  
  function playForIOS(videoEl: HTMLVideoElement) {
    videoEl.setAttribute('playsinline', 'true');
    videoEl.setAttribute('controls', 'true');
    setTimeout(function () {
      videoEl.removeAttribute('controls');
    }, 1);
  }
  this.setVideoStream = setVideoStream;
  this.pause = pause;
  this.resume = resume;
  this.mute = mute;
  this.unmute = unmute;
  this.playForIOS = playForIOS;
}