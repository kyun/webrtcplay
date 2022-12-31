export type InputMediaDeviceInfos = {
  [key in MediaDeviceKind]?: Array<MediaDeviceInfo>;
};
export async function getLocalDevices(): Promise<InputMediaDeviceInfos> {
  const infos = await navigator?.mediaDevices?.enumerateDevices();
  return infos.reduce<InputMediaDeviceInfos>((prevInfos, currentInfo) => {
    switch (currentInfo.kind) {
      case "audioinput":
      case "videoinput": {
        const prevInfoList = prevInfos[currentInfo.kind] || [];
        return {
          ...prevInfos,
          [currentInfo.kind]: [...prevInfoList, currentInfo],
        };
      }
      default:
    }
    return prevInfos;
  }, {});
}
export async function getScreenStream() {
  try {
    const stream = await (navigator.mediaDevices as any).getDisplayMedia({
      audio: false,
      video: { cursor: "always" },
    });
    return stream;
    // const video = document.createElement('video');
    // video.srcObject = stream;
    // document.body.append(video);
  } catch (e) {
    console.log(e);
    return null;
    // alert(e);
  }
}

export async function getLocalMediaStream(
  {
    audioinput,
    videoinput,
  }: {
    audioinput: number;
    videoinput: number;
  },
  cameraOn: boolean
): Promise<MediaStream | null> {
  try {
    const mediaDevices = await getLocalDevices();
    console.log(mediaDevices);
    if (!mediaDevices) throw new Error("no media device");

    const constraint = cameraOn
      ? {
          audio: {
            deviceId: mediaDevices?.audioinput?.[audioinput].deviceId,
          },
          video: {
            height: { ideal: 640 },
            width: { ideal: 1440 },
            deviceId: mediaDevices?.videoinput?.[videoinput].deviceId,
          },
        }
      : {
          audio: {
            deviceId: mediaDevices?.audioinput?.[audioinput].deviceId,
          },
        };
    const stream = await navigator.mediaDevices.getUserMedia(constraint);
    // if (!cameraOn) {
    //   const videoTrack = stream.getVideoTracks();
    //   videoTrack.forEach(t => t.enabled = false);
    // }

    return stream;
  } catch (e: any) {
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#exceptions
    switch (e.name) {
      case "NotAllowedError": {
        console.log("no permission");
        break;
      }
      case "AbortError":
      case "NotFoundError":
      case "NotReadableError":
      case "OverconstrainedError":
      case "SecurityError":
      case "TypeError":
      default:
    }

    return null;
  }
}
