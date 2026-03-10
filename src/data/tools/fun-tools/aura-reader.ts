export const AURA_COLORS = [
  { 
    name: "Red", 
    color: "bg-red-500", 
    textColor: "text-red-500",
    description: "Your aura is Red! This signifies energy, passion, and a strong-willed nature. You are grounded and full of life force today.",
    traits: ["Energetic", "Grounded", "Passionate"]
  },
  { 
    name: "Orange", 
    color: "bg-orange-500", 
    textColor: "text-orange-500",
    description: "Your aura is Orange! This represents creativity, vitality, and emotional strength. You are in a phase of growth and social connection.",
    traits: ["Creative", "Social", "Vital"]
  },
  { 
    name: "Yellow", 
    color: "bg-yellow-400", 
    textColor: "text-yellow-500",
    description: "Your aura is Yellow! This reflects optimism, intelligence, and enlightenment. You are radiating joy and mental clarity right now.",
    traits: ["Optimistic", "Intelligent", "Joyful"]
  },
  { 
    name: "Green", 
    color: "bg-green-500", 
    textColor: "text-green-500",
    description: "Your aura is Green! This symbolizes healing, balance, and peace. You have a nurturing spirit and are in harmony with your surroundings.",
    traits: ["Healer", "Balanced", "Peaceful"]
  },
  { 
    name: "Blue", 
    color: "bg-blue-500", 
    textColor: "text-blue-500",
    description: "Your aura is Blue! This indicates calmness, intuition, and clear communication. You are deeply connected to your inner truth.",
    traits: ["Calm", "Intuitive", "Communicative"]
  },
  { 
    name: "Indigo", 
    color: "bg-indigo-600", 
    textColor: "text-indigo-600",
    description: "Your aura is Indigo! This represents deep wisdom, spiritual awakening, and mystery. You possess a strong sense of knowing.",
    traits: ["Wise", "Spiritual", "Mysterious"]
  },
  { 
    name: "Violet", 
    color: "bg-purple-500", 
    textColor: "text-purple-500",
    description: "Your aura is Violet! This is the color of vision, imagination, and high spiritual energy. You are a dreamer with great potential.",
    traits: ["Visionary", "Imaginative", "Spiritual"]
  },
  { 
    name: "Gold", 
    color: "bg-yellow-600", 
    textColor: "text-yellow-700",
    description: "Your aura is Gold! This signifies divine protection, enlightenment, and wisdom. You are reaching a peak of spiritual and personal power.",
    traits: ["Protected", "Enlightened", "Powerful"]
  },
  { 
    name: "Pink", 
    color: "bg-pink-400", 
    textColor: "text-pink-500",
    description: "Your aura is Pink! This reflects love, compassion, and a gentle heart. You are radiating kindness and emotional warmth.",
    traits: ["Loving", "Gentle", "Kind"]
  },
  { 
    name: "Turquoise", 
    color: "bg-cyan-400", 
    textColor: "text-cyan-600",
    description: "Your aura is Turquoise! This represents harmony, dynamic energy, and deep compassion. You are a natural multitasker and a sensitive soul.",
    traits: ["Harmonious", "Sensitive", "Compassionate"]
  },
  { 
    name: "White", 
    color: "bg-slate-100", 
    textColor: "text-slate-500",
    description: "Your aura is White! This is the rarest color, signifying purity, transcendence, and a connection to the divine. You are starting a fresh spiritual chapter.",
    traits: ["Pure", "Transcendent", "Enlightened"]
  },
  { 
    name: "Silver", 
    color: "bg-slate-300", 
    textColor: "text-slate-500",
    description: "Your aura is Silver! This reflects high intuition, mystery, and cosmic connection. You are receiving deep insights from your subconscious right now.",
    traits: ["Insightful", "Mystical", "Abundant"]
  },
  { 
    name: "Magenta", 
    color: "bg-fuchsia-500", 
    textColor: "text-fuchsia-600",
    description: "Your aura is Magenta! This combines the energy of Red and the spirituality of Violet. You are a unique thinker who marches to the beat of your own drum.",
    traits: ["Original", "Non-conformist", "Creative"]
  },
  { 
    name: "Gray", 
    color: "bg-gray-400", 
    textColor: "text-gray-600",
    description: "Your aura is Gray! This represents a period of transition, deep contemplation, and quiet strength. You are currently processing and refining your energy.",
    traits: ["Contemplative", "Quiet", "Transitioning"]
  },
];

export const MOODS = [
  { emoji: "😊", label: "Happy", value: 1 },
  { emoji: "😌", label: "Calm", value: 2 },
  { emoji: "🚀", label: "Energetic", value: 3 },
  { emoji: "🤔", label: "Thoughtful", value: 4 },
  { emoji: "😴", label: "Tired", value: 5 },
  { emoji: "🤩", label: "Inspired", value: 6 },
  { emoji: "😔", label: "Sad", value: 7 },
  { emoji: "😤", label: "Frustrated", value: 8 },
  { emoji: "😰", label: "Anxious", value: 9 },
  { emoji: "🧘", label: "Zen", value: 10 },
  { emoji: "🎨", label: "Creative", value: 11 },
  { emoji: "💖", label: "Loving", value: 12 },
];

export const AURA_READER_CONTENT = {
  title: "Aura Reader",
  description: "Discover the color of your energy based on your name and mood",
  about: [
    "The Aura Reader is a fun, spiritual-inspired tool that analyzes your current energy through a combination of your name and your current mood. Auras are often described as the subtle, luminous field of radiation surrounding a person.",
    "Our tool assigns a color to your aura and provides insights into your personality traits and current state of mind. It's a fun way to reflect on your feelings and discover the vibrant energy you're putting out into the world today."
  ],
  features: [
    { title: "Energy Analysis", description: "Get a personalized aura color based on your inputs." },
    { title: "Mood Tracking", description: "Incorporate your current emotional state into your reading." },
    { title: "Trait Breakdown", description: "Discover the specific personality traits associated with your aura color." }
  ],
  steps: [
    { step: "1", title: "Enter Your Name", description: "Provide your name to personalize the energy calculation." },
    { step: "2", title: "Select Your Mood", description: "Choose the emoji that best reflects how you're feeling right now." },
    { step: "3", title: "Discover Your Aura", description: "Click 'Read My Aura' to see your color and detailed description." }
  ]
};
