require("dotenv").config();

const crypto = require("crypto");
const express = require("express");
const path = require("path");
const {
  supabase,
  createAuthenticatedClient,
} = require("./supabaseClient");
const {
  ValidationError,
  normalizeOnboardingPayload,
  calculateMetrics,
  calculateSafeToSave,
  buildRecurringExpenses,
  buildSyntheticIncomeTransactions,
  buildUpcomingBills,
} = require("./databaseHandlers");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const SESSION_COOKIE = "rb_active_user";
const SESSION_SECRET = process.env.SESSION_SECRET;
const MAX_FINANCIAL_VALUE = 1_000_000_000;
const userMutationQueues = new Map();

if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be configured before starting the server.");
}

app.use(express.json({ limit: "256kb" }));
app.use(express.static(path.join(__dirname, "dist")));

app.get("/", (_req, res) => {
  res.json({ name: "ResilientBank API", status: "ok" });
});

function parseCookies(req) {
  return Object.fromEntries(
    String(req.headers.cookie || "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf("=");
        return separator === -1
          ? [part, ""]
          : [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))];
      }),
  );
}

function signActiveUser(userId) {
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(userId)
    .digest("base64url");
  return `${userId}.${signature}`;
}

function verifyActiveUser(value) {
  if (!value || !value.includes(".")) return null;
  const separator = value.lastIndexOf(".");
  const userId = value.slice(0, separator);
  const suppliedSignature = value.slice(separator + 1);
  const expectedSignature = signActiveUser(userId).slice(separator + 1);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);

  if (
    supplied.length !== expected.length ||
    !crypto.timingSafeEqual(supplied, expected)
  ) {
    return null;
  }

  return userId;
}

function setActiveUserCookie(req, res, userId) {
  const secure = req.get("x-forwarded-proto") === "https";
  res.cookie(SESSION_COOKIE, signActiveUser(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: 1000 * 60 * 60 * 24 * 30,
    path: "/",
  });
}

function clearActiveUserCookie(req, res) {
  const secure = req.get("x-forwarded-proto") === "https";
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
  });
}

async function resolveRequestIdentity(req) {
  const cookieUserId = verifyActiveUser(parseCookies(req)[SESSION_COOKIE]);
  if (cookieUserId) {
    return { userId: cookieUserId, db: supabase, source: "session" };
  }

  const authorization = req.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const accessToken = authorization.slice("Bearer ".length).trim();
  if (!accessToken) return null;

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) return null;

  return {
    userId: data.user.id,
    db: createAuthenticatedClient(accessToken),
    source: "bearer",
  };
}

async function requireActiveUser(req, res, next) {
  const identity = await resolveRequestIdentity(req);
  if (!identity) {
    return res.status(401).json({
      error: "No active onboarding session.",
      code: "ONBOARDING_REQUIRED",
    });
  }

  req.activeUserId = identity.userId;
  req.db = identity.db;
  req.identitySource = identity.source;
  return next();
}

function ensureDatabaseResult(result, action) {
  if (result.error) {
    const error = new Error(`${action}: ${result.error.message}`);
    error.cause = result.error;
    throw error;
  }
  return result.data;
}

async function withUserMutationLock(userId, operation) {
  const previous = userMutationQueues.get(userId) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });
  userMutationQueues.set(userId, current);
  await previous.catch(() => undefined);
  try {
    return await operation();
  } finally {
    release();
    if (userMutationQueues.get(userId) === current) {
      userMutationQueues.delete(userId);
    }
  }
}

function getProfileUserType(workType) {
  const normalized = String(workType || "").toLowerCase();
  if (normalized.includes("vendor")) return "vendor";
  if (normalized.includes("freelance")) return "freelancer";
  return "gig_worker";
}

function getWorkTypeLabel(userType) {
  if (userType === "vendor") return "Vendor";
  if (userType === "freelancer") return "Freelancer";
  return "Delivery / Gig Worker";
}

function createBalanceDescription(initialBalance, operations = []) {
  return `RB_BALANCE:${JSON.stringify({
    initial: Math.max(0, Number(initialBalance) || 0),
    operations,
  })}`;
}

function parseBalanceDescription(description, currentBalance) {
  const raw = String(description || "");
  if (!raw.startsWith("RB_BALANCE:")) {
    return {
      initial: Math.max(0, Number(currentBalance) || 0),
      operations: [],
      managed: false,
    };
  }
  try {
    const parsed = JSON.parse(raw.slice("RB_BALANCE:".length));
    return {
      initial: Math.max(
        Number(currentBalance) || 0,
        Number(parsed.initial) || 0,
      ),
      operations: Array.isArray(parsed.operations)
        ? parsed.operations.filter(
            (operation) =>
              typeof operation === "string" && operation.length <= 100,
          )
        : [],
      managed: true,
    };
  } catch {
    return {
      initial: Math.max(0, Number(currentBalance) || 0),
      operations: [],
      managed: false,
    };
  }
}

function deriveDashboardMetrics(profile, expenses, transactions) {
  const amountForExpense = (name) =>
    Number(
      expenses.find(
        (expense) => String(expense.name).toLowerCase() === name.toLowerCase(),
      )?.amount,
    ) || 0;
  const transactionAmount = (category) =>
    transactions
      .filter((transaction) => transaction.category === category)
      .reduce(
        (sum, transaction) => sum + (Number(transaction.amount) || 0),
        0,
      );

  const balanceTransaction = transactions.find(
    (transaction) => transaction.category === "current_balance",
  );
  const storedBalance = Math.max(
    0,
    Number(balanceTransaction?.amount) || 0,
  );
  const balanceState = parseBalanceDescription(
    balanceTransaction?.description,
    storedBalance,
  );
  const transferredSavings = transactionAmount("savings_transfer");
  const currentBalance = Math.max(0, storedBalance - transferredSavings);
  const atomicSavingsTransfers = balanceState.managed
    ? Math.max(0, balanceState.initial - storedBalance)
    : 0;
  const currentSavings =
    transactionAmount("emergency_savings") +
    atomicSavingsTransfers +
    transferredSavings;
  const incomeTransactions = transactions.filter(
    (transaction) => transaction.category === "work_income",
  );
  const expectedIncomeTransaction = transactions.find(
    (transaction) => transaction.category === "expected_daily_income",
  );
  const avgDailyIncome = expectedIncomeTransaction
    ? Math.max(0, Number(expectedIncomeTransaction.amount) || 0)
    : incomeTransactions.length
    ? incomeTransactions.reduce(
        (sum, transaction) => sum + (Number(transaction.amount) || 0),
        0,
      ) / incomeTransactions.length
    : 0;
  const workType = getWorkTypeLabel(profile.user_type);
  const metrics = calculateMetrics({
    rent: amountForExpense("Rent"),
    food: amountForExpense("Food"),
    utilities: amountForExpense("Electricity"),
    transport: amountForExpense("Fuel and transport"),
    debt: amountForExpense("Existing debt"),
    currentBalance,
    avgDailyIncome,
    workType,
  });

  return {
    currentBalance,
    currentSavings,
    avgDailyIncome,
    workType,
    ...metrics,
  };
}

function formatRupees(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function extractMessageAmount(message, keywordPattern) {
  const afterKeyword = message.match(
    new RegExp(
      `(?:${keywordPattern})[^\\d₹]{0,20}(?:₹|rs\\.?|inr)?\\s*([\\d,]+(?:\\.\\d+)?)`,
      "i",
    ),
  );
  const fallback = message.match(/(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)/i);
  const raw = afterKeyword?.[1] || fallback?.[1];
  if (!raw) {
    return { present: false, valid: true, value: 0 };
  }
  const normalized = raw.replace(/,/g, "");
  const value = Number(normalized);
  return {
    present: true,
    valid:
      normalized.length <= 20 &&
      Number.isFinite(value) &&
      value >= 0 &&
      value <= MAX_FINANCIAL_VALUE,
    value: Number.isFinite(value) ? value : 0,
  };
}

function buildGuidanceReply(message, profile, metrics, expenses, upcomingBills) {
  const normalized = message.toLowerCase();
  const firstName = String(profile.full_name || "there").trim().split(/\s+/)[0];
  const nearestBill = upcomingBills[0];

  if (/\b(save|saving|savings)\b/.test(normalized)) {
    const requested = extractMessageAmount(message, "save|saving");
    const statedInflow = extractMessageAmount(
      message,
      "earned|earnt|received|inflow|income",
    );
    if (!requested.valid || !statedInflow.valid) {
      return `${firstName}, that amount is too large or unclear for a safe calculation. Please enter a rupee amount between ₹0 and ${formatRupees(MAX_FINANCIAL_VALUE)}.`;
    }
    const todayInflow = statedInflow.present
      ? statedInflow.value
      : metrics.avgDailyIncome;
    const roomAfterEssentials = Math.max(
      0,
      Math.round(todayInflow - metrics.dailyBurnRate),
    );
    const billNote = nearestBill
      ? ` Your next tagged bill is ${nearestBill.name} for ${formatRupees(nearestBill.amount)} in ${nearestBill.due_in_days} days.`
      : " You have no upcoming tagged bills right now.";

    if (!requested.present) {
      return `${firstName}, using ${formatRupees(todayInflow)} as today’s expected inflow, you have about ${formatRupees(roomAfterEssentials)} left after protecting ${formatRupees(metrics.dailyBurnRate)} for one day of essentials.${billNote} Tell me the amount you want to save for a direct yes-or-no check.`;
    }
    if (requested.value <= roomAfterEssentials) {
      return `Yes—${formatRupees(requested.value)} fits within the ${formatRupees(roomAfterEssentials)} left after protecting today’s essential cost of ${formatRupees(metrics.dailyBurnRate)}.${billNote} Review the bill timing before you tap Save; I have not moved any money.`;
    }
    return `I would pause that transfer. Saving ${formatRupees(requested.value)} is ${formatRupees(requested.value - roomAfterEssentials)} above the room left after today’s essential cost. A safer upper limit is ${formatRupees(roomAfterEssentials)}.${billNote}`;
  }

  if (/\b(loan|borrow|borrowing|credit|afford)\b/.test(normalized)) {
    const requested = extractMessageAmount(
      message,
      "loan|borrow|borrowing|credit|afford",
    );
    if (!requested.valid) {
      return `${firstName}, that loan amount is too large or unclear for a safe comparison. Please enter a rupee amount between ₹0 and ${formatRupees(MAX_FINANCIAL_VALUE)}.`;
    }
    if (!requested.present) {
      return `${firstName}, your current 14-day affordability ceiling is ${formatRupees(metrics.affordabilityCeiling)}. It protects 14 days of essential costs first, then limits borrowing to 40% of the remaining expected cash flow. Tell me a loan amount and I’ll compare it directly.`;
    }
    if (requested.value <= metrics.affordabilityCeiling) {
      return `${formatRupees(requested.value)} is within your current ceiling of ${formatRupees(metrics.affordabilityCeiling)}. That keeps the request inside the plan’s 40% discretionary cash-flow limit. This is guidance, not a loan approval, and no application has been submitted.`;
    }
    return `${formatRupees(requested.value)} is above your current ceiling by ${formatRupees(requested.value - metrics.affordabilityCeiling)}. A safer counter-offer is ${formatRupees(metrics.affordabilityCeiling)} or less so your 14-day essential costs stay protected.`;
  }

  if (/\b(buffer|score|cushion|slow week|improve)\b/.test(normalized)) {
    const largestExpense = [...expenses].sort(
      (left, right) =>
        (Number(right.amount) || 0) - (Number(left.amount) || 0),
    )[0];
    const reduction = largestExpense
      ? Math.round((Number(largestExpense.amount) || 0) * 0.1)
      : 0;
    const extraDays = Math.floor(
      reduction / Math.max(1, metrics.dailyBurnRate),
    );
    const expenseAdvice = largestExpense
      ? ` Your largest tagged monthly cost is ${largestExpense.name} at ${formatRupees(largestExpense.amount)}. Cutting it by 10% would free about ${formatRupees(reduction)}—roughly ${extraDays} extra full buffer day${extraDays === 1 ? "" : "s"} at your current burn rate.`
      : "";
    return `${firstName}, your ${formatRupees(metrics.currentBalance)} available balance currently covers ${metrics.bufferDays} full days at ${formatRupees(metrics.dailyBurnRate)} per day.${expenseAdvice} The most direct improvement is to keep new savings available for essentials or reduce one tagged recurring cost; your score rises as complete buffer days rise.`;
  }

  return `${firstName}, your current plan shows ${metrics.bufferDays} full buffer days, ${formatRupees(metrics.currentBalance)} available, and a credit ceiling of ${formatRupees(metrics.affordabilityCeiling)}. Ask me about a specific saving amount, loan amount, upcoming bill, or how to improve your cushion, and I’ll explain it using these live numbers.`;
}

app.post("/api/users/onboard", async (req, res) => {
  let createdAuthUserId = null;
  try {
    const payload = req.body && typeof req.body === "object" ? req.body : {};
    const answers = normalizeOnboardingPayload({
      ...payload,
      avg_daily_income: Number(payload.avg_daily_income) || 0,
      income_range_min: Number(payload.income_range_min) || 0,
      income_range_max: Number(payload.income_range_max) || 0,
      rent: Number(payload.rent) || 0,
      food: Number(payload.food) || 0,
      utilities: Number(payload.utilities ?? payload.electricity) || 0,
      transport: Number(payload.transport ?? payload.fuel) || 0,
      debt_payment:
        Number(
          payload.debt_payment ??
            payload.existing_debt_payment ??
            payload.existing_debt,
        ) || 0,
      current_balance: Number(payload.current_balance) || 0,
      current_savings: Number(payload.current_savings) || 0,
      emergency_goal: Number(payload.emergency_goal) || 5000,
      work_days_per_week: Number(payload.work_days_per_week) || 0,
      goal_months: Number(payload.goal_months) || 0,
      household_size: Number(payload.household_size) || 0,
      dependents: Number(payload.dependents) || 0,
    });
    const existingIdentity = await resolveRequestIdentity(req);
    let userId = existingIdentity?.userId;
    const db = existingIdentity?.db || supabase;

    if (!userId) {
      const authResult = await supabase.auth.admin.createUser({
        email: `onboarding-${crypto.randomUUID()}@resilientbank.local`,
        password: crypto.randomBytes(32).toString("base64url"),
        email_confirm: true,
        user_metadata: { managed_by: "resilientbank_onboarding" },
      });

      if (authResult.error || !authResult.data.user) {
        throw new Error(
          `Unable to create the active user: ${
            authResult.error?.message || "No user was returned."
          }`,
        );
      }

      userId = authResult.data.user.id;
      createdAuthUserId = userId;
    }

    const metrics = calculateMetrics(answers);

    const profile = ensureDatabaseResult(
      await db
        .from("profiles")
        .upsert(
          {
            id: userId,
            full_name: answers.fullName,
            user_type: getProfileUserType(answers.workType),
          },
          { onConflict: "id" },
        )
        .select("*")
        .single(),
      "Unable to save the profile",
    );

    ensureDatabaseResult(
      await db.from("transactions").delete().eq("user_id", userId),
      "Unable to clear previous transactions",
    );
    ensureDatabaseResult(
      await db.from("recurring_expenses").delete().eq("user_id", userId),
      "Unable to clear previous expenses",
    );
    ensureDatabaseResult(
      await db.from("resilience_scores").delete().eq("user_id", userId),
      "Unable to clear previous resilience scores",
    );

    const expenseRows = buildRecurringExpenses(userId, answers);
    const expenses = ensureDatabaseResult(
      await db.from("recurring_expenses").insert(expenseRows).select("*"),
      "Unable to save recurring expenses",
    );

    const transactions = [
      {
        user_id: userId,
        amount: answers.currentBalance,
        type: "income",
        category: "current_balance",
        description: createBalanceDescription(answers.currentBalance),
        transaction_date: new Date().toISOString().slice(0, 10),
      },
      ...(answers.currentSavings > 0
        ? [
            {
              user_id: userId,
              amount: answers.currentSavings,
              type: "income",
              category: "emergency_savings",
              description: "Emergency savings entered during onboarding",
              transaction_date: new Date().toISOString().slice(0, 10),
            },
          ]
        : []),
      {
        user_id: userId,
        amount: answers.avgDailyIncome,
        type: "income",
        category: "expected_daily_income",
        description: "Expected daily income entered during onboarding",
        transaction_date: new Date().toISOString().slice(0, 10),
      },
      ...buildSyntheticIncomeTransactions(userId, answers),
    ];
    ensureDatabaseResult(
      await db.from("transactions").insert(transactions),
      "Unable to create the income baseline",
    );

    const score = ensureDatabaseResult(
      await db
        .from("resilience_scores")
        .insert({
          user_id: userId,
          score: metrics.resilienceScore,
          buffer_days: Math.round(metrics.bufferDays),
        })
        .select("*")
        .single(),
      "Unable to save the resilience score",
    );

    if (existingIdentity?.source !== "bearer") {
      setActiveUserCookie(req, res, userId);
    }
    return res.status(201).json({
      success: true,
      active_user_id: userId,
      profile: {
        ...profile,
        work_type: answers.workType,
        avg_daily_income: answers.avgDailyIncome,
        emergency_goal: answers.emergencyGoal,
      },
      current_balance: answers.currentBalance,
      current_savings: answers.currentSavings,
      emergency_goal: answers.emergencyGoal,
      monthly_essential_expenses: metrics.monthlyEssentialExpenses,
      daily_burn_rate: metrics.dailyBurnRate,
      buffer_days: metrics.bufferDays,
      resilience_score: metrics.resilienceScore,
      income_stability_score: metrics.incomeStabilityScore,
      volatility_score: metrics.volatilityScore,
      expected_14_day_income: metrics.expected14DayIncome,
      affordability_ceiling: metrics.affordabilityCeiling,
      upcoming_bills: buildUpcomingBills(expenses),
      score,
    });
  } catch (error) {
    if (createdAuthUserId) {
      const cleanupResult = await supabase.auth.admin.deleteUser(
        createdAuthUserId,
      );
      if (cleanupResult.error) {
        console.error("Onboarding cleanup error:", cleanupResult.error);
      }
    }
    const status = error instanceof ValidationError ? error.statusCode : 500;
    if (status === 500) {
      console.error("Onboarding error:", error);
    }
    return res.status(status).json({ error: error.message });
  }
});

app.get("/api/dashboard/active", async (req, res) => {
  try {
    const identity = await resolveRequestIdentity(req);
    if (!identity) {
      return res.json({
        onboarded: false,
        profile: null,
        current_balance: 0,
        current_savings: 0,
        emergency_goal: 0,
        resilience_score: 0,
        buffer_days: 0,
        daily_burn_rate: 0,
        monthly_essential_expenses: 0,
        affordability_ceiling: 0,
        upcoming_bills: [],
      });
    }

    const activeUserId = identity.userId;
    const db = identity.db;
    const [profileResult, scoreResult, expensesResult, transactionsResult] =
      await Promise.all([
      db
        .from("profiles")
        .select("*")
        .eq("id", activeUserId)
        .maybeSingle(),
      db
        .from("resilience_scores")
        .select("*")
        .eq("user_id", activeUserId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      db
        .from("recurring_expenses")
        .select("*")
        .eq("user_id", activeUserId),
      db
        .from("transactions")
        .select("amount, type, category, description")
        .eq("user_id", activeUserId),
      ]);

    const profile = ensureDatabaseResult(
      profileResult,
      "Unable to fetch the profile",
    );
    const score = ensureDatabaseResult(
      scoreResult,
      "Unable to fetch the resilience score",
    );
    const expenses = ensureDatabaseResult(
      expensesResult,
      "Unable to fetch recurring expenses",
    );
    const transactions = ensureDatabaseResult(
      transactionsResult,
      "Unable to fetch transactions",
    );

    if (!profile) {
      clearActiveUserCookie(req, res);
      return res.json({
        onboarded: false,
        profile: null,
        current_balance: 0,
        current_savings: 0,
        emergency_goal: 0,
        resilience_score: 0,
        buffer_days: 0,
        daily_burn_rate: 0,
        monthly_essential_expenses: 0,
        affordability_ceiling: 0,
        upcoming_bills: [],
      });
    }

    const metrics = deriveDashboardMetrics(profile, expenses, transactions);

    return res.json({
      onboarded: true,
      profile: {
        ...profile,
        work_type: metrics.workType,
        avg_daily_income: metrics.avgDailyIncome,
      },
      current_balance: metrics.currentBalance,
      current_savings: metrics.currentSavings,
      resilience_score: metrics.resilienceScore,
      buffer_days: metrics.bufferDays,
      daily_burn_rate: metrics.dailyBurnRate,
      monthly_essential_expenses: metrics.monthlyEssentialExpenses,
      income_stability_score: metrics.incomeStabilityScore,
      volatility_score: metrics.volatilityScore,
      expected_14_day_income: metrics.expected14DayIncome,
      affordability_ceiling: metrics.affordabilityCeiling,
      upcoming_bills: buildUpcomingBills(expenses),
    });
  } catch (error) {
    console.error("Active dashboard failed:", error.message);
    return res.status(500).json({ error: "Unable to fetch the dashboard." });
  }
});

app.post("/api/savings/calculate", requireActiveUser, async (req, res) => {
  try {
    const todayInflow = Number(
      req.body.today_inflow ?? req.body.todayInflow ?? req.body.dailyIncome,
    );
    if (
      !Number.isFinite(todayInflow) ||
      todayInflow < 0 ||
      todayInflow > MAX_FINANCIAL_VALUE
    ) {
      return res.status(400).json({
        error: `today_inflow must be between 0 and ${MAX_FINANCIAL_VALUE}.`,
      });
    }

    const expenses = ensureDatabaseResult(
      await req.db
        .from("recurring_expenses")
        .select("amount")
        .eq("user_id", req.activeUserId)
        ,
      "Unable to fetch recurring expenses",
    );

    if (!expenses.length) {
      return res.status(409).json({
        error: "Complete onboarding before calculating savings.",
        code: "ONBOARDING_REQUIRED",
      });
    }

    const dailyBurnRate = Math.max(
      1,
      expenses.reduce(
        (sum, expense) => sum + (Number(expense.amount) || 0),
        0,
      ) / 30,
    );
    const safeToSave = calculateSafeToSave(todayInflow, dailyBurnRate);

    return res.json({
      today_inflow: todayInflow,
      daily_burn_rate: dailyBurnRate,
      safe_to_save: safeToSave,
      safeToSave,
    });
  } catch (error) {
    console.error("Savings calculation failed:", error.message);
    return res.status(500).json({ error: "Unable to calculate savings." });
  }
});

app.post("/api/savings/commit", requireActiveUser, async (req, res) =>
  withUserMutationLock(req.activeUserId, async () => {
    try {
    const amount = Number(req.body.amount) || 0;
    const operationId = String(
      req.body.operationId || crypto.randomUUID(),
    ).trim();
    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > MAX_FINANCIAL_VALUE
    ) {
      return res.status(400).json({
        error: `amount must be between 1 and ${MAX_FINANCIAL_VALUE}.`,
      });
    }
    if (operationId && !/^[a-zA-Z0-9_-]{8,100}$/.test(operationId)) {
      return res.status(400).json({ error: "operationId is invalid." });
    }

    const [profileResult, expensesResult, transactionsResult] =
      await Promise.all([
        req.db
          .from("profiles")
          .select("*")
          .eq("id", req.activeUserId)
          .single(),
        req.db
          .from("recurring_expenses")
          .select("*")
          .eq("user_id", req.activeUserId),
        req.db
          .from("transactions")
          .select("id, amount, type, category, description")
          .eq("user_id", req.activeUserId),
      ]);
    const profile = ensureDatabaseResult(
      profileResult,
      "Unable to fetch the profile",
    );
    const expenses = ensureDatabaseResult(
      expensesResult,
      "Unable to fetch recurring expenses",
    );
    const transactions = ensureDatabaseResult(
      transactionsResult,
      "Unable to fetch transactions",
    );
    const before = deriveDashboardMetrics(profile, expenses, transactions);
    const balanceTransaction = transactions.find(
      (transaction) => transaction.category === "current_balance",
    );
    if (!balanceTransaction) {
      return res.status(409).json({
        error: "Complete onboarding before saving.",
        code: "ONBOARDING_REQUIRED",
      });
    }
    const balanceState = parseBalanceDescription(
      balanceTransaction.description,
      balanceTransaction.amount,
    );
    if (balanceState.operations.includes(operationId)) {
      return res.json({
        success: true,
        duplicate: true,
        saved_amount: amount,
        current_balance: before.currentBalance,
        current_savings: before.currentSavings,
        buffer_days: before.bufferDays,
        resilience_score: before.resilienceScore,
      });
    }
    const todayInflowValue =
      req.body.todayInflow === undefined
        ? before.avgDailyIncome
        : Number(req.body.todayInflow);
    if (
      !Number.isFinite(todayInflowValue) ||
      todayInflowValue < 0 ||
      todayInflowValue > MAX_FINANCIAL_VALUE
    ) {
      return res.status(400).json({
        error: `todayInflow must be between 0 and ${MAX_FINANCIAL_VALUE}.`,
      });
    }
    const safeToSave = calculateSafeToSave(
      todayInflowValue,
      before.dailyBurnRate,
    );

    if (amount > before.currentBalance) {
      return res.status(400).json({
        error: "The saving amount cannot exceed your available balance.",
      });
    }
    if (amount > safeToSave) {
      return res.status(400).json({
        error: `₹${amount} is above today’s safe-to-save amount of ₹${safeToSave}.`,
      });
    }

    const newBalance =
      Math.max(0, Number(balanceTransaction.amount) || 0) - amount;
    const newDescription = createBalanceDescription(balanceState.initial, [
      ...balanceState.operations,
      operationId,
    ]);
    let updateQuery = req.db
      .from("transactions")
      .update({
        amount: newBalance,
        description: newDescription,
      })
      .eq("id", balanceTransaction.id)
      .eq("amount", Number(balanceTransaction.amount));
    updateQuery =
      balanceTransaction.description === null
        ? updateQuery.is("description", null)
        : updateQuery.eq("description", balanceTransaction.description);
    const updatedBalance = ensureDatabaseResult(
      await updateQuery
        .select("id, amount, type, category, description")
        .maybeSingle(),
      "Unable to save the transfer",
    );
    if (!updatedBalance) {
      const latestBalance = ensureDatabaseResult(
        await req.db
          .from("transactions")
          .select("id, amount, type, category, description")
          .eq("id", balanceTransaction.id)
          .single(),
        "Unable to recheck the balance",
      );
      const latestState = parseBalanceDescription(
        latestBalance.description,
        latestBalance.amount,
      );
      if (latestState.operations.includes(operationId)) {
        const latestMetrics = deriveDashboardMetrics(
          profile,
          expenses,
          transactions.map((transaction) =>
            transaction.id === balanceTransaction.id
              ? latestBalance
              : transaction,
          ),
        );
        return res.json({
          success: true,
          duplicate: true,
          saved_amount: amount,
          current_balance: latestMetrics.currentBalance,
          current_savings: latestMetrics.currentSavings,
          buffer_days: latestMetrics.bufferDays,
          resilience_score: latestMetrics.resilienceScore,
        });
      }
      return res.status(409).json({
        error: "Your balance changed while saving. Please try again.",
        code: "BALANCE_CHANGED",
      });
    }
    const after = deriveDashboardMetrics(
      profile,
      expenses,
      transactions.map((transaction) =>
        transaction.id === balanceTransaction.id
          ? updatedBalance
          : transaction,
      ),
    );

    return res.json({
      success: true,
      saved_amount: amount,
      current_balance: after.currentBalance,
      current_savings: after.currentSavings,
      buffer_days: after.bufferDays,
      resilience_score: after.resilienceScore,
    });
    } catch (error) {
      console.error("Savings transfer failed:", error.message);
      return res.status(500).json({ error: "Unable to save this amount." });
    }
  }),
);

app.post("/api/guidance/chat", requireActiveUser, async (req, res) => {
  try {
    const requestedUserId = String(req.body.userId || "").trim();
    const userMessage = String(req.body.userMessage || "").trim();
    if (requestedUserId && requestedUserId !== req.activeUserId) {
      return res.status(403).json({
        error: "The requested profile does not match the active session.",
      });
    }
    if (!userMessage || userMessage.length > 500) {
      return res.status(400).json({
        error: "userMessage must contain between 1 and 500 characters.",
      });
    }

    const [profileResult, expensesResult, transactionsResult] =
      await Promise.all([
        req.db
          .from("profiles")
          .select("*")
          .eq("id", req.activeUserId)
          .single(),
        req.db
          .from("recurring_expenses")
          .select("*")
          .eq("user_id", req.activeUserId),
        req.db
          .from("transactions")
          .select("amount, type, category, description")
          .eq("user_id", req.activeUserId),
      ]);
    const profile = ensureDatabaseResult(
      profileResult,
      "Unable to fetch the profile",
    );
    const expenses = ensureDatabaseResult(
      expensesResult,
      "Unable to fetch recurring expenses",
    );
    const transactions = ensureDatabaseResult(
      transactionsResult,
      "Unable to fetch transactions",
    );
    const metrics = deriveDashboardMetrics(profile, expenses, transactions);
    const upcomingBills = buildUpcomingBills(expenses);
    const reply = buildGuidanceReply(
      userMessage,
      profile,
      metrics,
      expenses,
      upcomingBills,
    );

    return res.json({
      reply,
      context: {
        current_balance: metrics.currentBalance,
        daily_burn_rate: metrics.dailyBurnRate,
        buffer_days: metrics.bufferDays,
        affordability_ceiling: metrics.affordabilityCeiling,
        upcoming_bills: upcomingBills,
      },
    });
  } catch (error) {
    console.error("Guidance chat failed:", error.message);
    return res.status(500).json({ error: "Unable to prepare guidance right now." });
  }
});

app.post("/api/users/reset", requireActiveUser, async (req, res) => {
  try {
    if (req.identitySource === "session") {
      const authResult = await supabase.auth.admin.deleteUser(req.activeUserId);
      if (authResult.error) {
        throw new Error(
          `Unable to remove the active user: ${authResult.error.message}`,
        );
      }
      clearActiveUserCookie(req, res);
      return res.json({
        success: true,
        reset: true,
        stage: 1,
      });
    }

    for (const table of [
      "transactions",
      "recurring_expenses",
      "resilience_scores",
      "profiles",
    ]) {
      ensureDatabaseResult(
        await req.db.from(table).delete().eq(
          table === "profiles" ? "id" : "user_id",
          req.activeUserId,
        ),
        `Unable to clear ${table}`,
      );
    }

    clearActiveUserCookie(req, res);
    return res.json({
      success: true,
      reset: true,
      stage: 1,
    });
  } catch (error) {
    console.error("User reset failed:", error.message);
    return res.status(500).json({ error: "Unable to reset onboarding." });
  }
});

app.use((req, res, next) => {
  if (req.path.startsWith("/api/") || req.method !== "GET") return next();
  return res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`ResilientBank API listening on port ${PORT}`);
});