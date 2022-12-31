import React from "react";
import { getLocalDevices, InputMediaDeviceInfos } from "../utils/broadcast";

const useLocalDevices = () => {
  const [devices, setDevices] = React.useState<InputMediaDeviceInfos>({
    audioinput: [],
    videoinput: [],
  });

  React.useEffect(() => {
    const getDevices = async () => {
      const devices = await getLocalDevices();
      setDevices(devices);
    };
    getDevices();
  }, []);

  return {
    devices,
  };
};
export default useLocalDevices;
