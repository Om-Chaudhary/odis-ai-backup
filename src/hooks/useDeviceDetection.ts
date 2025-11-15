"use client";

import { useState, useEffect } from "react";

interface DeviceInfo {
  device_type: "mobile" | "tablet" | "desktop";
  viewport_width: number;
  viewport_height: number;
}

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    device_type: "desktop",
    viewport_width: 1024,
    viewport_height: 768,
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      let device_type: "mobile" | "tablet" | "desktop";
      if (width < 768) {
        device_type = "mobile";
      } else if (width >= 768 && width <= 1024) {
        device_type = "tablet";
      } else {
        device_type = "desktop";
      }

      setDeviceInfo({
        device_type,
        viewport_width: width,
        viewport_height: height,
      });
    };

    // Set initial values
    updateDeviceInfo();

    // Listen for resize events
    window.addEventListener("resize", updateDeviceInfo);

    return () => {
      window.removeEventListener("resize", updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
}
