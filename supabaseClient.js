const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
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