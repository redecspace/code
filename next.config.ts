// import withSerwistInit from "@serwist/next";
import withSerwistInit  from "@serwist/next";
import { NextConfig } from "next";

//  if you use "@serwist/next but not for "@serwist/turbopack"
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // allowedDevOrigins: ["ngrok-free.app", "*.ngrok-free.app"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config; 
  },

};

export default withSerwist(nextConfig);
