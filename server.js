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
    return { userId: cookieUserId, db: supabase };
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

app.post("/api/users/onboard", async (req, res) => {
  try {
    const answers = normalizeOnboardingPayload(req.body);
    const existingIdentity = await resolveRequestIdentity(req);
    const userId = existingIdentity?.userId || crypto.randomUUID();
    const db = existingIdentity?.db || supabase;
    const metrics = calculateMetrics(answers);

    const profile = ensureDatabaseResult(
      await db
        .from("profiles")
        .upsert(
          {
            id: userId,
            full_name: answers.fullName,
            user_type: "member",
            work_type: answers.workType,
            avg_daily_income: answers.avgDailyIncome,
            current_balance: answers.currentBalance,
            emergency_goal: answers.emergencyGoal,
            onboarding_complete: true,
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

    const transactions = buildSyntheticIncomeTransactions(userId, answers);
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
          buffer_days: metrics.bufferDays,
          buffer_score: metrics.bufferScore,
          income_stability_score: metrics.incomeStabilityScore,
          volatility_score: metrics.volatilityScore,
          daily_burn_rate: metrics.dailyBurnRate,
          monthly_essential_expenses: metrics.monthlyEssentialExpenses,
        })
        .select("*")
        .single(),
      "Unable to save the resilience score",
    );

    setActiveUserCookie(req, res, userId);
    return res.status(201).json({
      success: true,
      active_user_id: userId,
      profile,
      current_balance: answers.currentBalance,
      monthly_essential_expenses: metrics.monthlyEssentialExpenses,
      daily_burn_rate: metrics.dailyBurnRate,
      buffer_days: metrics.bufferDays,
      resilience_score: metrics.resilienceScore,
      income_stability_score: metrics.incomeStabilityScore,
      volatility_score: metrics.volatilityScore,
      upcoming_bills: buildUpcomingBills(expenses),
      score,
    });
  } catch (error) {
    const status = error instanceof ValidationError ? error.statusCode : 500;
    if (status === 500) console.error("Onboarding failed:", error.message);
    return res.status(status).json({
      error: status === 500 ? "Unable to complete onboarding." : error.message,
    });
  }
});

app.get("/api/dashboard/active", requireActiveUser, async (req, res) => {
  try {
    const [profileResult, scoreResult, expensesResult] = await Promise.all([
      req.db
        .from("profiles")
        .select("*")
        .eq("id", req.activeUserId)
        .maybeSingle(),
      req.db
        .from("resilience_scores")
        .select("*")
        .eq("user_id", req.activeUserId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      req.db
        .from("recurring_expenses")
        .select("*")
        .eq("user_id", req.activeUserId),
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

    if (!profile) {
      clearActiveUserCookie(req, res);
      return res.status(404).json({
        error: "No onboarded user was found.",
        code: "ONBOARDING_REQUIRED",
      });
    }

    return res.json({
      profile,
      current_balance: Number(profile.current_balance) || 0,
      resilience_score: Number(score?.score) || 0,
      buffer_days: Number(score?.buffer_days) || 0,
      daily_burn_rate: Number(score?.daily_burn_rate) || 0,
      monthly_essential_expenses:
        Number(score?.monthly_essential_expenses) || 0,
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

    const score = ensureDatabaseResult(
      await req.db
        .from("resilience_scores")
        .select("daily_burn_rate")
        .eq("user_id", req.activeUserId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      "Unable to fetch the daily burn rate",
    );

    if (!score) {
      return res.status(409).json({
        error: "Complete onboarding before calculating savings.",
        code: "ONBOARDING_REQUIRED",
      });
    }

    const dailyBurnRate = Number(score.daily_burn_rate) || 0;
    const safeToSave = Math.max(0, (todayInflow - dailyBurnRate) * 0.8);

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