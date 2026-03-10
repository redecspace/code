import { ShieldAlert, Zap, Coffee, Gamepad2, Ghost, Rocket, Users, Sparkles } from "lucide-react";

export const BOND_DATA = [
  {
    type: "Nemesis Protocol",
    scoreRange: [0, 10],
    emoji: "⚔️",
    icon: ShieldAlert,
    color: "text-red-500",
    bg: "bg-red-500/10",
    description: "Yikes! You two might be plotting against each other. Keep one eye open.",
    traits: ["Suspicious", "Competitive", "Chaotic Energy"],
    activities: ["Staring contests", "Passive-aggressive texting"]
  },
  {
    type: "Ships Passing",
    scoreRange: [11, 25],
    emoji: "🚢",
    icon: Ghost,
    color: "text-slate-500",
    bg: "bg-slate-500/10",
    description: "You nod in the hallway, but that's about it. A classic acquaintance dynamic.",
    traits: ["Polite", "Distant", "Low Maintenance"],
    activities: ["Liking Instagram posts", "Saying 'we should catch up' and never doing it"]
  },
  {
    type: "Lunch Buddies",
    scoreRange: [26, 40],
    emoji: "🥗",
    icon: Coffee,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    description: "Great for a quick chat over food, but you probably wouldn't help them move a couch.",
    traits: ["Casual", "Hungry", "Convenient"],
    activities: ["Complaining about work/school", "Splitting the bill"]
  },
  {
    type: "Vibe Match",
    scoreRange: [41, 55],
    emoji: "🎧",
    icon: Zap,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    description: "You share similar tastes in music or memes. A solid, chill friendship.",
    traits: ["Chill", "Harmonious", "Meme-fluent"],
    activities: ["Sending TikToks", "Going to concerts"]
  },
  {
    type: "Co-op Mode",
    scoreRange: [56, 70],
    emoji: "🎮",
    icon: Gamepad2,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    description: "You work well together. Whether it's a project or a game, you've got synergy.",
    traits: ["Cooperative", "Strategic", "Reliable"],
    activities: ["Gaming sessions", "Group projects"]
  },
  {
    type: "Partners in Crime",
    scoreRange: [71, 85],
    emoji: "🕵️‍♂️",
    icon: Rocket,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    description: "Always ready for an adventure. You enable each other's terrible ideas in the best way.",
    traits: ["Mischievous", "Loyal", "Spontaneous"],
    activities: ["Midnight fast food runs", "Questionable decisions"]
  },
  {
    type: "Soul Siblings",
    scoreRange: [86, 95],
    emoji: "✨",
    icon: Users,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    description: "Basically family. You can sit in silence together for hours and it's not weird.",
    traits: ["Deep connection", "Comfortable", "Unconditional"],
    activities: ["Doing absolutely nothing together", "Knowing what the other is thinking"]
  },
  {
    type: "Cosmic Twin",
    scoreRange: [96, 100],
    emoji: "🌌",
    icon: Sparkles,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    description: "An incredibly rare, perfect resonance. You were probably friends in a past life.",
    traits: ["Telepathic", "Inseparable", "Legendary"],
    activities: ["Finishing each other's sentences", "Taking over the world"]
  }
];

export const BOND_TESTER_CONTENT = {
  title: "Bond Tester",
  description: "Analyze the deep, algorithmic nature of your friendship",
  about: [
    "The Bond Tester is a fun, lighthearted tool that goes beyond a simple 'friendship percentage' to provide a detailed breakdown of your relationship dynamic. It uses a custom algorithm to analyze the names provided and categorize your bond into one of several unique types.",
    "From 'Nemesis Protocol' to 'Cosmic Twin,' each result comes with a set of personality traits and suggested activities that perfectly capture the essence of your connection. It's a great way to celebrate your friendship or just have a laugh with a friend."
  ],
  features: [
    { title: "Dynamic Bond Typing", description: "Discover your specific relationship category based on our algorithm." },
    { title: "Trait Analysis", description: "See the key characteristics that define your friendship." },
    { title: "Activity Suggestions", description: "Get fun ideas for things you and your friend should do together." }
  ],
  steps: [
    { step: "1", title: "Enter Names", description: "Type in your name and your friend's name into the input fields." },
    { step: "2", title: "Run Analysis", description: "Click 'Test Our Bond' to let the algorithm analyze your connection." },
    { step: "3", title: "Review Bond", description: "See your bond type, score, and detailed relationship breakdown." }
  ]
};
