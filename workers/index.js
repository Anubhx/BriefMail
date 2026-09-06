console.log("BriefMail Batch Worker starting...");
console.log("Environment check: SUPABASE_URL configured:", Boolean(process.env.SUPABASE_URL));
console.log("Environment check: REDIS_URL:", process.env.REDIS_URL || "not set");

setInterval(() => {
  console.log(`[${new Date().toISOString()}] Batch worker active and listening for queued tasks...`);
}, 30000);
