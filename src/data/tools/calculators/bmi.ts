export const BMI_CATEGORIES = [
  { min: 0, max: 18.5, label: "Underweight", color: "text-blue-500", description: "Below 18.5" },
  { min: 18.5, max: 25, label: "Normal weight", color: "text-green-500", description: "18.5 – 24.9" },
  { min: 25, max: 30, label: "Overweight", color: "text-orange-500", description: "25 – 29.9" },
  { min: 30, max: 100, label: "Obese", color: "text-red-500", description: "30 or greater" },
] as const;

export const BMI_CONTENT = {
  title: "BMI Calculator",
  description: "Calculate your Body Mass Index (BMI) and health category",
  about: [
    "The Body Mass Index (BMI) is a simple numerical measure of a person's weight relative to their height. It is widely used as a general indicator of whether a person has a healthy body weight for their height.",
    "Our BMI Calculator supports both Metric and Imperial units, providing instant results along with your weight category classification."
  ],
  features: [
    { title: "Metric & Imperial", description: "Switch between kg/cm and lbs/inches easily." },
    { title: "Instant Classification", description: "Automatically determine your health category." },
    { title: "Accurate Results", description: "Uses the standard WHO-recommended BMI formula." }
  ],
  steps: [
    { step: "1", title: "Select Units", description: "Choose between Metric (kg/cm) or Imperial (lbs/in)." },
    { step: "2", title: "Enter Stats", description: "Provide your current weight and height." },
    { step: "3", title: "See Result", description: "View your BMI score and health category." }
  ]
};
