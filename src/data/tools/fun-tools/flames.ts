export const FLAMES_MAP = {
  F: { label: "Friends", color: "text-blue-500", icon: "🤝" },
  L: { label: "Lovers", color: "text-red-500", icon: "❤️" },
  A: { label: "Affection", color: "text-pink-500", icon: "🥰" },
  M: { label: "Marriage", color: "text-purple-500", icon: "💍" },
  E: { label: "Enemies", color: "text-orange-500", icon: "😈" },
  S: { label: "Siblings", color: "text-green-500", icon: "👫" },
} as const;

export type FlamesResult = keyof typeof FLAMES_MAP;

export const FLAMES_CONTENT = {
  title: "FLAMES",
  description: "Discover your relationship status with the classic FLAMES game",
  about: [
    "FLAMES is a popular childhood game used to predict the relationship between two people. The acronym FLAMES stands for Friends, Lovers, Affection, Marriage, Enemies, and Siblings.",
    "The game works by canceling out common letters in both names and using the remaining count to cycle through the FLAMES acronym. While entirely for entertainment, it remains a nostalgic and fun way to 'test' your compatibility with someone special."
  ],
  features: [
    { title: "Nostalgic Gameplay", description: "Experience the classic FLAMES game in a digital format." },
    { title: "Instant Results", description: "Get your relationship prediction in seconds." },
    { title: "Fun Interpretation", description: "Each result comes with a dedicated emoji and color." }
  ],
  steps: [
    { step: "1", title: "Enter Names", description: "Enter your name and the name of your crush or friend." },
    { step: "2", title: "Calculate", description: "Click 'Check Status' to perform the FLAMES calculation." },
    { step: "3", title: "See Destiny", description: "Discover which relationship category the stars (and letters) have chosen for you." }
  ]
};
