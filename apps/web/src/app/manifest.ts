import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OdisAI - AI Voice Agents for Veterinary Clinics",
    short_name: "OdisAI",
    description:
      "Never miss another call. OdisAI handles your clinic's inbound and outbound calls with AI voice agents that sound natural, book appointments, and follow up with pet parents 24/7.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/icon-128.png",
        sizes: "128x128",
        type: "image/png",
      },
      {
        src: "/icon-128.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/icon-128.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        src: "/icon-128.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-128.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
