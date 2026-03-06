/** Example P&L data for the landing page preview. */
export const EXAMPLE_MONTHS = [
  {
    month: "January",
    income: [
      { day: "1st", label: "Salary", amount: 2100 },
      { day: "15th", label: "Salary", amount: 2100 },
      { day: "22nd", label: "Freelance", amount: 350 },
    ],
    expenses: [
      { day: "1st", label: "Rent", amount: 1850 },
      { day: "5th", label: "Utilities", amount: 120 },
      { day: "15th", label: "Groceries", amount: 420 },
      { day: "1st", label: "Subscriptions", amount: 45 },
      { day: "8th", label: "Dining out", amount: 95 },
      { day: "22nd", label: "Transportation", amount: 180 },
      { day: "18th", label: "Auto maintenance", amount: 320 },
    ],
  },
  {
    month: "February",
    income: [
      { day: "1st", label: "Salary", amount: 2100 },
      { day: "15th", label: "Salary", amount: 2100 },
    ],
    expenses: [
      { day: "1st", label: "Rent", amount: 1850 },
      { day: "5th", label: "Utilities", amount: 135 },
      { day: "14th", label: "Insurance", amount: 220 },
      { day: "1st", label: "Subscriptions", amount: 45 },
      { day: "12th", label: "Groceries", amount: 390 },
      { day: "18th", label: "Personal care", amount: 65 },
      { day: "6th", label: "Doctor visit", amount: 45 },
    ],
  },
  {
    month: "March",
    income: [
      { day: "1st", label: "Salary", amount: 2100 },
      { day: "15th", label: "Salary", amount: 2100 },
      { day: "20th", label: "Bonus", amount: 500 },
    ],
    expenses: [
      { day: "1st", label: "Rent", amount: 1850 },
      { day: "5th", label: "Utilities", amount: 118 },
      { day: "12th", label: "Groceries", amount: 380 },
      { day: "1st", label: "Subscriptions", amount: 45 },
      { day: "15th", label: "Entertainment", amount: 120 },
      { day: "25th", label: "Dining out", amount: 78 },
      { day: "10th", label: "Beach trip", amount: 420 },
    ],
  },
] as const;

export type ExampleMonth = (typeof EXAMPLE_MONTHS)[number];
