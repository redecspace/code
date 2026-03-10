export const GRADE_VALUES: Record<string, number> = {
  "A+": 4.0, "A": 4.0, "A-": 3.7,
  "B+": 3.3, "B": 3.0, "B-": 2.7,
  "C+": 2.3, "C": 2.0, "C-": 1.7,
  "D+": 1.3, "D": 1.0, "F": 0.0
};

export const GPA_CONTENT = {
  title: "GPA Calculator",
  description: "Calculate your semester and cumulative GPA",
  about: [
    "The GPA Calculator is a vital tool for students at all levels to monitor their academic performance. By calculating both semester and cumulative Grade Point Averages, you can better understand your progress and set academic goals.",
    "This tool supports various grading scales and weights, allowing you to accurately reflect your school's specific evaluation system."
  ],
  features: [
    { title: "Semester & Cumulative", description: "Calculate GPA for a single term or your entire history." },
    { title: "Standard & Weighted", description: "Supports both standard and weighted GPA calculations." },
    { title: "Grading Scale Support", description: "Standard A-F grading with +/- modifiers." }
  ],
  steps: [
    { step: "1", title: "Add Courses", description: "Enter your course names (optional) and credit hours." },
    { step: "2", title: "Select Grades", description: "Choose the letter grade you received for each course." },
    { step: "3", title: "Review Results", description: "Instantly see your GPA and total credit hours earned." }
  ]
};
