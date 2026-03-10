export const COMMON_RATIOS = [
  { label: "1:1", width: 1, height: 1, description: "Square (Instagram)" },
  { label: "4:3", width: 4, height: 3, description: "Standard TV" },
  { label: "16:9", width: 16, height: 9, description: "Widescreen (HD)" },
  { label: "21:9", width: 21, height: 9, description: "Ultrawide" },
  { label: "9:16", width: 9, height: 16, description: "Story (TikTok/Reels)" },
  { label: "3:2", width: 3, height: 2, description: "Photography" },
  { label: "2:3", width: 2, height: 3, description: "Portrait Photography" },
] as const;

export const ASPECT_RATIO_CONTENT = {
  title: "Aspect Ratio",
  description: "Calculate screen dimensions and aspect ratios",
  about: [
    "The Aspect Ratio tool is perfect for designers, photographers, and video editors to find the exact dimensions they need. By providing one dimension and a ratio, it instantly calculates the corresponding value.",
    "This tool also includes a library of common aspect ratios used in social media, television, and film, making it easy to create content that fits your specific target platform."
  ],
  features: [
    { title: "Dynamic Calculation", description: "Instantly calculate width or height based on any ratio." },
    { title: "Standard Ratios", description: "Quickly select from 16:9, 4:3, 1:1, and more." },
    { title: "Custom Ratios", description: "Enter any unique aspect ratio for your specific needs." }
  ],
  steps: [
    { step: "1", title: "Select Ratio", description: "Choose a standard ratio or enter a custom one." },
    { step: "2", title: "Enter Dimension", description: "Provide either the width or the height you're working with." },
    { step: "3", title: "Get Dimension", description: "The missing dimension is calculated and displayed instantly." }
  ]
};
