require("dotenv").config();

const cors = require("cors");
const express = require("express");
const path = require("path");
const {
  supabase,
  createAuthenticatedClient,
} = require("./supabaseClient");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "dist")));

app.get("/", (_req, res) => {
  res.json({ name: "ResilientBank API", status: "ok" });
});

async function requireAuthentication(req, res, next) {
  const authorization = req.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "A bearer token is required." });
  }

  const accessToken = authorization.slice("Bearer ".length).trim();

  if (!accessToken) {
    return res.status(401).json({ error: "A bearer token is required." });
  }

  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    return res.status(401).json({ error: "The bearer token is invalid." });
  }

  req.user = data.user;
  req.supabase = createAuthenticatedClient(accessToken);
  return next();
}

async function requireAdmin(req, res, next) {
  const { data: profile, error } = await req.supabase
    .from("profiles")
    .select("user_type")
    .eq("id", req.user.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to verify admin access:", error.message);
    return res.status(500).json({ error: "Unable to verify access." });
  }

  if (profile?.user_type !== "admin") {
    return res.status(403).json({ error: "Admin access is required." });
  }

  return next();
}

app.get(
  "/api/users",
  requireAuthentication,
  requireAdmin,
  async (req, res) => {
    const { data, error } = await req.supabase
    .from("profiles")
    .select("id, full_name, user_type");

    if (error) {
      console.error("Failed to fetch users:", error.message);
      return res.status(500).json({ error: "Unable to fetch users." });
    }

    return res.json(data);
  },
);

app.get(
  "/api/dashboard/:userId",
  requireAuthentication,
  async (req, res) => {
    if (req.params.userId !== req.user.id) {
      return res.status(403).json({
        error: "You can only access your own dashboard.",
      });
    }

    const userId = req.user.id;

    const [profileResult, scoreResult, offersResult, transactionsResult] =
      await Promise.all([
        req.supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle(),
        req.supabase
          .from("resilience_scores")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        req.supabase
          .from("credit_offers")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        req.supabase
          .from("transactions")
          .select("amount")
          .eq("user_id", userId),
      ]);

    const failedQuery = [
      profileResult,
      scoreResult,
      offersResult,
      transactionsResult,
    ].find((result) => result.error);

    if (failedQuery) {
      console.error(
        "Failed to fetch dashboard data:",
        failedQuery.error.message,
      );
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
  },
);

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

app.use((req, res, next) => {
  if (req.path.startsWith("/api/") || req.method !== "GET") return next();
  return res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`ResilientBank API listening on port ${PORT}`);
});