import type { NextPage } from "next";
import React from "react";
import useLocalDevices from "../src/hooks/useLocalDevice";
import { getLocalDevices } from "../src/utils/broadcast";

const WebRTC: NextPage = () => {
  const wsRef = React.useRef<WebSocket>();

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const offerRef = React.useRef<HTMLTextAreaElement>(null);
  const pc = React.useRef<RTCPeerConnection>(
    new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    })
  );
  const localStream = React.useRef<MediaStream[]>([]);
  const [selectedDeviceIndex, setSelectedDeviceIndex] = React.useState({
    audioinput: -1,
    videoinput: -1,
  });
  const { devices } = useLocalDevices();

  const createOffer = async () => {
    const offer = await pc.current.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await pc.current.setLocalDescription(offer);
    console.log(offer);
    if (!offerRef.current) return;
    offerRef.current.value = offer.sdp || "";
  };

  const connectWs = () => {
    wsRef.current = new WebSocket("ws://localhost:8080/ws");
    wsRef.current.onopen = () => {
      wsRef.current!.send(
        JSON.stringify({
          type: "init",
          id: "test",
        })
      );
    };
    wsRef.current.onmessage = (event) => {
      console.log(event.data);
    };
  };

  React.useEffect(() => {
    if (devices.audioinput?.length === 0) return;
    setSelectedDeviceIndex({
      ...selectedDeviceIndex,
      audioinput: 0,
      videoinput: 0,
    });
  }, [devices]);

  React.useEffect(() => {
    if (!videoRef.current) return;
    if (devices.audioinput?.length === 0) return;
    if (selectedDeviceIndex.audioinput === -1) return;
    const video = videoRef.current;
    const constraints = {
      audio: {
        deviceId: devices.audioinput?.[selectedDeviceIndex.audioinput].deviceId,
      },
      video: {
        width: 720,
        height: 480,
        deviceId: devices.videoinput?.[selectedDeviceIndex.videoinput].deviceId,
      },
    };
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        localStream.current[selectedDeviceIndex.videoinput] = stream;
        video.srcObject = stream;
      })
      .catch((err) => {
        console.log(err);
      });
  }, [devices, selectedDeviceIndex]);

  return (
    <div>
      <main style={{ display: "flex" }}>
        <section>
          <button onClick={connectWs}>Connect Socket</button>
          <div>
            <video
              ref={videoRef}
              autoPlay
              muted
              style={{ border: "1px solid red" }}
            />
          </div>
          <div>
            <p>
              <label>
                <span>ID: </span>
                <input type="text" />
              </label>
              <button style={{ marginLeft: 8 }} onClick={createOffer}>
                Create Offer
              </button>
            </p>
            <p>
              <label>
                <span>Audio Device: </span>
                <select
                  onChange={(e) => {
                    setSelectedDeviceIndex({
                      ...selectedDeviceIndex,
                      audioinput: e.target.selectedIndex,
                    });
                  }}
                >
                  {devices.audioinput?.map((device, index) => (
                    <option value={index} key={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
              </label>
            </p>
            <p>
              <label>
                <span>Video Device: </span>
                <select
                  onChange={(e) => {
                    setSelectedDeviceIndex({
                      ...selectedDeviceIndex,
                      videoinput: e.target.selectedIndex,
                    });
                  }}
                >
                  {devices.videoinput?.map((device, index) => (
                    <option value={index} key={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
              </label>
            </p>
          </div>
          <div>
            <textarea ref={offerRef} />
          </div>
        </section>
        <section>
          <div>
            <video
              ref={videoRef}
              autoPlay
              muted
              style={{ border: "1px solid red" }}
            />
          </div>
        </section>
      </main>
    </div>
  );
};

export default WebRTC;
