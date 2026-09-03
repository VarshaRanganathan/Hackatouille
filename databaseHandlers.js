class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
  }
}

function toNumber(payload, keys, fallback = 0) {
  const key = keys.find((candidate) => payload[candidate] !== undefined);
  if (!key) return fallback;
  const value = Number(payload[key]) || 0;
  if (value < 0) {
    throw new ValidationError(`${key} must be a non-negative number.`);
  }
  return value;
}

function normalizeOnboardingPayload(payload = {}) {
  const workType =
    String(payload.work_type || payload.occupation || "Gig / Freelance")
      .trim() || "Gig / Freelance";
  const avgDailyIncome = toNumber(payload, ["avg_daily_income", "daily_income"]);
  const rent = toNumber(payload, ["rent", "monthly_rent"]);
  const food = toNumber(payload, ["food", "monthly_food"]);
  const utilities = toNumber(payload, [
    "utilities",
    "electricity",
    "monthly_utilities",
  ]);
  const transport = toNumber(payload, [
    "transport",
    "fuel",
    "monthly_transport",
  ]);
  const debt = toNumber(payload, [
    "debt_payment",
    "existing_debt_payment",
    "existing_debt",
    "debt",
  ]);
  const currentBalance = toNumber(payload, [
    "current_balance",
    "current_liquid_balance",
  ]);
  const emergencyGoal = toNumber(payload, ["emergency_goal"], 5000);

  if (avgDailyIncome <= 0) {
    throw new ValidationError("avg_daily_income must be greater than zero.");
  }

  const monthlyEssentialExpenses =
    rent + food + utilities + transport + debt;

  if (monthlyEssentialExpenses <= 0) {
    throw new ValidationError(
      "At least one monthly essential expense is required.",
    );
  }

  const incomeLow = toNumber(
    payload,
    ["income_range_min", "daily_income_min"],
    avgDailyIncome * 0.7,
  );
  const incomeHigh = toNumber(
    payload,
    ["income_range_max", "daily_income_max"],
    avgDailyIncome * 1.3,
  );

  return {
    fullName:
      String(payload.full_name || payload.name || "ResilientBank User")
        .trim()
        .slice(0, 120) || "ResilientBank User",
    workType,
    avgDailyIncome,
    rent,
    food,
    utilities,
    transport,
    debt,
    currentBalance,
    emergencyGoal,
    incomeLow: Math.min(incomeLow, incomeHigh),
    incomeHigh: Math.max(incomeLow, incomeHigh),
  };
}

function getIncomeStabilityScore(workType) {
  const normalized = workType.toLowerCase();
  if (normalized.includes("daily wage")) return 60;
  if (normalized.includes("vendor")) return 80;
  if (normalized.includes("gig") || normalized.includes("freelance")) return 70;
  return 70;
}

function calculateMetrics(answers) {
  const monthlyEssentialExpenses =
    answers.rent +
    answers.food +
    answers.utilities +
    answers.transport +
    answers.debt;
  const dailyBurnRate = monthlyEssentialExpenses / 30;
  const bufferDays = answers.currentBalance / dailyBurnRate;
  const bufferScore = Math.min(100, (bufferDays / 30) * 100);
  const incomeStabilityScore = getIncomeStabilityScore(answers.workType);
  const volatilityScore = 75;
  const resilienceScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        bufferScore * 0.5 +
          incomeStabilityScore * 0.3 +
          volatilityScore * 0.2,
      ),
    ),
  );

  return {
    monthlyEssentialExpenses,
    dailyBurnRate,
    bufferDays,
    bufferScore,
    incomeStabilityScore,
    volatilityScore,
    resilienceScore,
  };
}

function buildRecurringExpenses(userId, answers) {
  const definitions = [
    ["rent", "Rent", answers.rent, 5],
    ["food", "Food", answers.food, 7],
    ["electricity", "Electricity", answers.utilities, 3],
    ["fuel", "Fuel and transport", answers.transport, 4],
    ["debt", "Existing debt", answers.debt, 10],
  ];

  return definitions
    .filter(([, , amount]) => amount > 0)
    .map(([category, name, amount, dueInDays]) => ({
      user_id: userId,
      category,
      name,
      amount,
      frequency: "monthly",
      is_essential: true,
      due_in_days: dueInDays,
    }));
}

function buildSyntheticIncomeTransactions(userId, answers) {
  const range = answers.incomeHigh - answers.incomeLow;
  const factors = [0.18, 0.62, 0.94, 0.43, 0.78, 0.3, 0.86, 0.55];
  const today = new Date();

  return Array.from({ length: 30 }, (_, index) => {
    const transactionDate = new Date(today);
    transactionDate.setUTCDate(today.getUTCDate() - (29 - index));
    const factor = factors[index % factors.length];
    const amount = Math.round(answers.incomeLow + range * factor);

    return {
      user_id: userId,
      amount,
      type: "income",
      category: "work_income",
      description: "Synthetic onboarding income baseline",
      transaction_date: transactionDate.toISOString().slice(0, 10),
      is_synthetic: true,
    };
  });
}

function buildUpcomingBills(expenses) {
  return expenses
    .filter((expense) => expense.amount > 0)
    .sort((left, right) => left.due_in_days - right.due_in_days)
    .map((expense) => ({
      id: expense.id || `${expense.category}-${expense.due_in_days}`,
      name: expense.name,
      category: expense.category,
      amount: Number(expense.amount),
      due_in_days: expense.due_in_days,
      frequency: expense.frequency,
    }));
}

module.exports = {
  ValidationError,
  normalizeOnboardingPayload,
  calculateMetrics,
  buildRecurringExpenses,
  buildSyntheticIncomeTransactions,
  buildUpcomingBills,
};