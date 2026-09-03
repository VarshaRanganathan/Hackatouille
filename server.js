require("dotenv").config();

const crypto = require("crypto");
const cors = require("cors");
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

if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be configured before starting the server.");
}

app.use(cors({ origin: true, credentials: true }));
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

  const baseBalance = transactionAmount("current_balance");
  const transferredSavings = transactionAmount("savings_transfer");
  const currentBalance = Math.max(0, baseBalance - transferredSavings);
  const currentSavings =
    transactionAmount("emergency_savings") + transferredSavings;
  const incomeTransactions = transactions.filter(
    (transaction) => transaction.category === "work_income",
  );
  const avgDailyIncome = incomeTransactions.length
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
        description: "Balance entered during onboarding",
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

    setActiveUserCookie(req, res, userId);
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
    console.error("Onboarding error:", error);
    const status = error instanceof ValidationError ? error.statusCode : 500;
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
        .select("amount, type, category")
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
    if (!Number.isFinite(todayInflow) || todayInflow < 0) {
      return res.status(400).json({
        error: "today_inflow must be a non-negative number.",
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

app.post("/api/savings/commit", requireActiveUser, async (req, res) => {
  try {
    const amount = Number(req.body.amount) || 0;
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        error: "amount must be greater than zero.",
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
          .select("amount, type, category")
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

    if (amount > before.currentBalance) {
      return res.status(400).json({
        error: "The saving amount cannot exceed your available balance.",
      });
    }

    const transfer = {
      user_id: req.activeUserId,
      amount,
      type: "expense",
      category: "savings_transfer",
      description: "Moved from available balance to emergency savings",
      transaction_date: new Date().toISOString().slice(0, 10),
    };
    ensureDatabaseResult(
      await req.db.from("transactions").insert(transfer),
      "Unable to save the transfer",
    );
    const after = deriveDashboardMetrics(profile, expenses, [
      ...transactions,
      transfer,
    ]);

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
});

app.post("/api/users/reset", requireActiveUser, async (req, res) => {
  try {
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

    if (req.identitySource === "session") {
      const authResult = await supabase.auth.admin.deleteUser(req.activeUserId);
      if (authResult.error) {
        throw new Error(
          `Unable to remove the active user: ${authResult.error.message}`,
        );
      }
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