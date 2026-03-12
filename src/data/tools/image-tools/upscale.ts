// @/data/tools/image-tools/upscale.ts

export const IMAGE_UPSCALE_CONTENT = {
  title: "Image Upscale",
  description: "Enhance and enlarge your images using high-quality local processing",
  about: [
    "Our Image Upscale tool allows you to increase the resolution of your photos without the typical blurriness of standard resizing.",
    "Using advanced browser-side interpolation techniques, we maintain edge sharpness and detail while enlarging your images up to 4x their original size.",
    "Everything happens directly in your browser. Your images never leave your device, ensuring complete privacy and fast processing."
  ],
  features: [
    { title: "2x & 4x Scaling", description: "Choose between doubling or quadrupling your image resolution with ease." },
    { title: "Edge Preservation", description: "Maintains sharp outlines and prevents pixelation during the enlargement process." },
    { title: "Privacy First", description: "Local processing means your sensitive images are never uploaded to any server." },
    { title: "High-Res Export", description: "Download your enhanced images in PNG, JPEG, or WebP formats." }
  ],
  steps: [
    { step: "1", title: "Upload", description: "Select the image you want to enlarge from your device." },
    { step: "2", title: "Select Scale", description: "Choose your desired upscaling factor (2x or 4x)." },
    { step: "3", title: "Process", description: "Wait a few moments while the image is enhanced locally." },
    { step: "4", title: "Download", description: "Preview the result and save your high-resolution image." }
  ]
};
