require("dotenv").config();

const cors = require("cors");
const express = require("express");
const supabase = require("./supabaseClient");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ name: "ResilientBank API", status: "ok" });
});

app.get("/api/users", async (_req, res) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, user_type");

  if (error) {
    console.error("Failed to fetch users:", error.message);
    return res.status(500).json({ error: "Unable to fetch users." });
  }

  return res.json(data);
});

app.get("/api/dashboard/:userId", async (req, res) => {
  const { userId } = req.params;

  const [profileResult, scoreResult, offersResult, transactionsResult] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("resilience_scores")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("credit_offers")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase.from("transactions").select("amount").eq("user_id", userId),
    ]);

  const failedQuery = [
    profileResult,
    scoreResult,
    offersResult,
    transactionsResult,
  ].find((result) => result.error);

  if (failedQuery) {
    console.error("Failed to fetch dashboard data:", failedQuery.error.message);
    return res.status(500).json({ error: "Unable to fetch dashboard data." });
  }

  if (!profileResult.data) {
    return res.status(404).json({ error: "User profile not found." });
  }

  const netBalance = transactionsResult.data.reduce(
    (total, transaction) => total + (Number(transaction.amount) || 0),
    0,
  );

  return res.json({
    profile: profileResult.data,
    resilienceScore: scoreResult.data,
    creditOffers: offersResult.data,
    netBalance,
  });
});

app.post("/api/savings/calculate", (req, res) => {
  const { dailyIncome, dailyExpenses } = req.body;

  if (
    typeof dailyIncome !== "number" ||
    !Number.isFinite(dailyIncome) ||
    typeof dailyExpenses !== "number" ||
    !Number.isFinite(dailyExpenses)
  ) {
    return res.status(400).json({
      error: "dailyIncome and dailyExpenses must be finite numbers.",
    });
  }

  const safeToSave = Math.max(0, (dailyIncome - dailyExpenses) * 0.8);

  return res.json({
    dailyIncome,
    dailyExpenses,
    safeToSave,
  });
});

app.listen(PORT, () => {
  console.log(`ResilientBank API listening on port ${PORT}`);
});