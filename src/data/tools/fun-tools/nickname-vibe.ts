import { Zap, Anchor, Shield, Wand2, Ghost } from "lucide-react";

export const VIBES = [
  { id: "cool", label: "Cool", emoji: "🕶️", icon: Zap, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "pirate", label: "Pirate", emoji: "🏴‍☠️", icon: Anchor, color: "text-amber-700", bg: "bg-amber-700/10" },
  { id: "hero", label: "Hero", emoji: "🦸", icon: Shield, color: "text-red-600", bg: "bg-red-600/10" },
  { id: "wizard", label: "Wizard", emoji: "🧙", icon: Wand2, color: "text-purple-600", bg: "bg-purple-600/10" },
  { id: "ghostly", label: "Ghostly", emoji: "👻", icon: Ghost, color: "text-slate-400", bg: "bg-slate-400/10" },
  { id: "cute", label: "Cute", emoji: "✨", icon: Wand2, color: "text-pink-500", bg: "bg-pink-500/10" },
];

export const NICKNAME_TEMPLATES: Record<string, string[]> = {
  cool: ["[N]-inator", "The [N] Master", "Cool [N]", "Shadow [N]", "[N] Prime", "Agent [N]", "[N] Byte"],
  pirate: ["Captain [N]", "[N] the Ruthless", "Salty [N]", "Iron Hook [N]", "[N] One-Eye", "Privateer [N]"],
  hero: ["Super [N]", "[N] Justice", "The Amazing [N]", "Captain [N]", "[N] Guard", "Iron [N]"],
  wizard: ["[N] the Wise", "Archmage [N]", "Mystic [N]", "[N] Shadow-weaver", "[N] of the North", "Elder [N]"],
  ghostly: ["Phantom [N]", "[N] the Hollow", "Specter [N]", "Whispering [N]", "Ethereal [N]", "Pale [N]"],
  cute: ["[N]-pie", "Little [N]", "[N]-kins", "Sweet [N]", "[N]-bear", "Tiny [N]", "[N]-puff"],
};

export const NICKNAME_VIBE_CONTENT = {
  title: "Vibe Nickname",
  description: "Create unique and fun nicknames based on your vibe",
  about: [
    "The Vibe Nickname generator is a fun tool that helps you create a new persona based on your name and a chosen 'vibe'. Whether you want to be a legendary hero, a mysterious ghost, or a salty pirate, our tool provides a variety of creative templates.",
    "Each vibe comes with its own set of unique naming patterns and icons, making it easy to find a nickname that matches your personality or just provides a good laugh for your social profiles or gaming accounts."
  ],
  features: [
    { title: "Multiple Vibes", description: "Choose from 6 different character vibes including Wizard, Pirate, and Hero." },
    { title: "Personalized Results", description: "All nicknames are dynamically generated using your provided name." },
    { title: "Creative Templates", description: "Each vibe features several unique naming patterns for variety." }
  ],
  steps: [
    { step: "1", title: "Enter Name", description: "Provide your name or a friend's name to use as a base." },
    { step: "2", title: "Choose Vibe", description: "Select the character vibe that matches your mood or preference." },
    { step: "3", title: "Generate & Select", description: "Click 'Generate Nickname' to see your new personas and pick your favorite." }
  ]
};
