class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
  }
}

const MAX_FINANCIAL_VALUE = 1_000_000_000;

function toNumber(payload, keys, fallback = 0) {
  const key = keys.find((candidate) => payload[candidate] !== undefined);
  if (!key) return fallback;
  const value = Number(payload[key]) || 0;
  if (!Number.isFinite(value)) {
    throw new ValidationError(`${key} must be a finite number.`);
  }
  if (value > MAX_FINANCIAL_VALUE) {
    throw new ValidationError(
      `${key} must not exceed ${MAX_FINANCIAL_VALUE}.`,
    );
  }
  if (value < 0) {
    throw new ValidationError(`${key} must be a non-negative number.`);
  }
  return value;
}

function hasValue(payload, keys) {
  return keys.some((key) => {
    const value = payload[key];
    return value !== undefined && value !== null && String(value).trim() !== "";
  });
}

function normalizeOnboardingPayload(payload = {}) {
  const fullName = String(payload.full_name || payload.name || "").trim();
  if (fullName.length < 2) {
    throw new ValidationError("full_name is required.");
  }

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
  const currentSavings = toNumber(payload, ["current_savings"], 0);
  const workDaysPerWeek = toNumber(payload, ["work_days_per_week"], 0);
  const goalMonths = toNumber(payload, ["goal_months"], 6);
  const householdSize = toNumber(payload, ["household_size"], 1);
  const dependents = toNumber(payload, ["dependents"], 0);

  if (avgDailyIncome <= 0) {
    throw new ValidationError("avg_daily_income must be greater than zero.");
  }

  if (!hasValue(payload, ["current_balance", "current_liquid_balance"])) {
    throw new ValidationError("current_balance is required.");
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
    fullName: fullName.slice(0, 120),
    workType,
    avgDailyIncome,
    rent,
    food,
    utilities,
    transport,
    debt,
    currentBalance,
    currentSavings,
    emergencyGoal,
    workDaysPerWeek,
    goalMonths,
    householdSize,
    dependents,
    incomeLow: Math.min(incomeLow, incomeHigh),
    incomeHigh: Math.max(incomeLow, incomeHigh),
  };
}

function getIncomeStabilityScore(workType) {
  const normalized = String(workType || "").toLowerCase();
  if (normalized.includes("daily wage")) return 60;
  if (normalized.includes("vendor")) return 80;
  if (normalized.includes("gig") || normalized.includes("freelance")) return 70;
  return 70;
}

function calculateMetrics(answers) {
  const finiteNumber = (value) => {
    const number = Number(value) || 0;
    return Number.isFinite(number)
      ? Math.min(MAX_FINANCIAL_VALUE, number)
      : 0;
  };
  const rent = Math.max(0, finiteNumber(answers.rent));
  const food = Math.max(0, finiteNumber(answers.food));
  const utilities = Math.max(0, finiteNumber(answers.utilities));
  const transport = Math.max(0, finiteNumber(answers.transport));
  const debt = Math.max(0, finiteNumber(answers.debt));
  const currentBalance = Math.max(0, finiteNumber(answers.currentBalance));
  const avgDailyIncome = Math.max(0, finiteNumber(answers.avgDailyIncome));
  const monthlyEssentialExpenses = rent + food + utilities + transport + debt;
  const dailyBurnRate = Math.max(1, monthlyEssentialExpenses / 30);
  const bufferDays = Math.max(0, Math.floor(currentBalance / dailyBurnRate));
  const incomeStabilityScore = getIncomeStabilityScore(answers.workType);
  const volatilityScore = 75;
  const resilienceScore = Math.min(
    100,
    Math.round(
      Math.min(1, bufferDays / 30) * 50 +
        incomeStabilityScore * 0.3 +
        volatilityScore * 0.2,
    ),
  );
  const expected14DayIncome = avgDailyIncome * 14;
  const affordabilityCeiling = Math.max(
    0,
    Math.round((expected14DayIncome - dailyBurnRate * 14) * 0.4),
  );

  return {
    monthlyEssentialExpenses,
    dailyBurnRate,
    bufferDays,
    incomeStabilityScore,
    volatilityScore,
    resilienceScore,
    expected14DayIncome,
    affordabilityCeiling,
  };
}

function calculateSafeToSave(todayInflow, dailyBurnRate) {
  const parsedInflow = Number(todayInflow) || 0;
  const parsedBurn = Number(dailyBurnRate) || 0;
  const inflow = Number.isFinite(parsedInflow) ? Math.max(0, parsedInflow) : 0;
  const burn = Math.max(1, Number.isFinite(parsedBurn) ? parsedBurn : 0);
  return Math.max(0, Math.round((inflow - burn) * 0.8));
}

function calculateAffordabilityCeiling(expected14DayIncome, dailyBurnRate) {
  const parsedIncome = Number(expected14DayIncome) || 0;
  const parsedBurn = Number(dailyBurnRate) || 0;
  const expectedIncome = Number.isFinite(parsedIncome)
    ? Math.max(0, parsedIncome)
    : 0;
  const burn = Math.max(1, Number.isFinite(parsedBurn) ? parsedBurn : 0);
  return Math.max(0, Math.round((expectedIncome - burn * 14) * 0.4));
}

function buildRecurringExpenses(userId, answers) {
  const definitions = [
    ["Rent", answers.rent, 5],
    ["Food", answers.food, 7],
    ["Electricity", answers.utilities, 3],
    ["Fuel and transport", answers.transport, 4],
    ["Existing debt", answers.debt, 10],
  ];

  return definitions
    .filter(([, amount]) => amount > 0)
    .map(([name, amount, dueInDays]) => {
      const dueDate = new Date();
      dueDate.setUTCDate(dueDate.getUTCDate() + dueInDays);
      return {
        user_id: userId,
        name,
        amount,
        frequency: "monthly",
        due_date: dueDate.toISOString().slice(0, 10),
      };
    });
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
    };
  });
}

function buildUpcomingBills(expenses) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  return expenses
    .filter((expense) => expense.amount > 0)
    .map((expense) => {
      const dueDate = new Date(`${expense.due_date}T00:00:00Z`);
      const dueInDays = Math.max(
        0,
        Math.ceil((dueDate.getTime() - today.getTime()) / 86400000),
      );
      return { ...expense, dueInDays };
    })
    .sort((left, right) => left.dueInDays - right.dueInDays)
    .map((expense) => ({
      id: expense.id || `${expense.name}-${expense.due_date}`,
      name: expense.name,
      category: expense.name.toLowerCase().replace(/\s+/g, "_"),
      amount: Number(expense.amount),
      due_date: expense.due_date,
      due_in_days: expense.dueInDays,
      frequency: expense.frequency,
    }));
}

module.exports = {
  ValidationError,
  normalizeOnboardingPayload,
  calculateMetrics,
  calculateSafeToSave,
  calculateAffordabilityCeiling,
  buildRecurringExpenses,
  buildSyntheticIncomeTransactions,
  buildUpcomingBills,
};