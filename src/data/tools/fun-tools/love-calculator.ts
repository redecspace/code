export const LOVE_MESSAGES = [
  { min: 0, max: 20, message: "Maybe just friends? The spark is a bit quiet here.", emoji: "🧊" },
  { min: 21, max: 40, message: "A flickering flame. Needs some work but there's potential!", emoji: "🌱" },
  { min: 41, max: 60, message: "A solid connection! There's definitely something special here.", emoji: "🤝" },
  { min: 61, max: 80, message: "Strong chemistry! You two make a great pair.", emoji: "✨" },
  { min: 81, max: 95, message: "Incredible match! This could be the real deal.", emoji: "🔥" },
  { min: 96, max: 100, message: "Pure Soulmates! A match made in heaven.", emoji: "💘" },
] as const;

export const LOVE_CALCULATOR_CONTENT = {
  title: "Love Calculator",
  description: "Test the romantic compatibility between two names",
  about: [
    "The Love Calculator is a classic fun tool that calculates the romantic compatibility between two individuals based on their names. While love is complex and can't be reduced to a number, this tool provides a playful way to see how 'aligned' your names are.",
    "Our calculation analyzes the letters and names provided to generate a compatibility percentage. Each result comes with a unique message and emoji that captures the essence of your predicted connection."
  ],
  features: [
    { title: "Compatibility Score", description: "Get a percentage score from 0% to 100%." },
    { title: "Dynamic Messages", description: "Receive custom advice based on your score." },
    { title: "Instant Analysis", description: "Find out your compatibility in just one click." }
  ],
  steps: [
    { step: "1", title: "Enter Names", description: "Type in your name and the name of your partner or crush." },
    { step: "2", title: "Calculate", description: "Click 'Calculate Love' to run the compatibility analysis." },
    { step: "3", title: "See Results", description: "Review your score and the unique message about your connection." }
  ]
};
