export type Unit = {
  label: string;
  value: string;
  toBase: (v: number) => number;
  fromBase: (v: number) => number;
};

export type UnitCategory = {
  name: string;
  units: Unit[];
};

export const UNIT_CATEGORIES: UnitCategory[] = [
  {
    name: "Length",
    units: [
      { label: "Meters", value: "m", toBase: (v) => v, fromBase: (v) => v },
      { label: "Kilometers", value: "km", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { label: "Centimeters", value: "cm", toBase: (v) => v / 100, fromBase: (v) => v * 100 },
      { label: "Millimeters", value: "mm", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { label: "Miles", value: "mi", toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
      { label: "Feet", value: "ft", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      { label: "Inches", value: "in", toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
    ],
  },
  {
    name: "Weight",
    units: [
      { label: "Kilograms", value: "kg", toBase: (v) => v, fromBase: (v) => v },
      { label: "Grams", value: "g", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { label: "Milligrams", value: "mg", toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
      { label: "Pounds", value: "lb", toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
      { label: "Ounces", value: "oz", toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
    ],
  },
  {
    name: "Temperature",
    units: [
      { label: "Celsius", value: "c", toBase: (v) => v, fromBase: (v) => v },
      { label: "Fahrenheit", value: "f", toBase: (v) => (v - 32) * 5 / 9, fromBase: (v) => v * 9 / 5 + 32 },
      { label: "Kelvin", value: "k", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    ],
  },
  {
    name: "Speed",
    units: [
      { label: "m/s", value: "ms", toBase: (v) => v, fromBase: (v) => v },
      { label: "km/h", value: "kmh", toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
      { label: "mph", value: "mph", toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
      { label: "knots", value: "kn", toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
    ],
  },
  {
    name: "Volume",
    units: [
      { label: "Liters", value: "l", toBase: (v) => v, fromBase: (v) => v },
      { label: "Milliliters", value: "ml", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { label: "Gallons (US)", value: "gal", toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
      { label: "Cups", value: "cup", toBase: (v) => v * 0.236588, fromBase: (v) => v / 0.236588 },
    ],
  },
];

export const UNIT_CONVERTER_CONTENT = {
  title: "Unit Converter",
  description: "Convert lengths, weights, temperatures and more",
  about: [
    "The Unit Converter is a versatile tool for converting values between different units of measurement. It covers a wide range of categories including length, weight, temperature, speed, and volume.",
    "Whether you're working on a DIY project, studying science, or traveling abroad, this tool provides quick and accurate conversions to help you navigate different measurement systems with ease."
  ],
  features: [
    { title: "Multiple Categories", description: "Convert between units in 5 different measurement categories." },
    { title: "Standard & Imperial", description: "Supports both Metric and Imperial units for all categories." },
    { title: "Instant Conversion", description: "See all conversions within a category simultaneously as you type." }
  ],
  steps: [
    { step: "1", title: "Select Category", description: "Choose the type of measurement you want to convert (e.g., Length)." },
    { step: "2", title: "Input Value", description: "Enter the number you wish to convert into any of the unit fields." },
    { step: "3", title: "View Results", description: "All other units in the category are automatically updated with the converted values." }
  ]
};
