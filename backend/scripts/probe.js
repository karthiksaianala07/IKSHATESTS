const { createClient } = require("@supabase/supabase-js");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
async function main() {
  const title = "PROBE_SCHED_" + Date.now();
  const { data, error } = await supabase.from("tests").insert({
    title,
    category: "jee-full",
    duration_minutes: 60,
    scheduled_at: "2026-07-27T10:00:00.000Z"
  }).select().single();
  if (error) { console.log("Insert error:", JSON.stringify(error)); return; }
  console.log("Inserted:", JSON.stringify(data));
  // cleanup
  await supabase.from("tests").delete().eq("id", data.id);
}
main().catch(console.error);
