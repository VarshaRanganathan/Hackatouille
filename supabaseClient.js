const { createClient } = require("@supabase/supabase-js");

function normalizeSupabaseUrl(value) {
  const raw = String(value || "")
    .trim()
    .replace(/^SUPABASE_URL\s*=\s*/i, "")
    .replace(/^['"]|['"]$/g, "")
    .replace(/\/+$/, "");

  if (/^https?:\/\/[a-z0-9-]+\.supabase\.co$/i.test(raw)) {
    return raw;
  }
  if (/^[a-z0-9-]+\.supabase\.co$/i.test(raw)) {
    return `https://${raw}`;
  }
  if (/^[a-z0-9]{15,30}$/i.test(raw)) {
    return `https://${raw}.supabase.co`;
  }

  throw new Error(
    "SUPABASE_URL must be a Supabase Project URL, project hostname, or project reference.",
  );
}

const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL);
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_KEY must be configured before starting the server.",
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

function createAuthenticatedClient(accessToken) {
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

module.exports = {
  supabase,
  createAuthenticatedClient,
};