function assertAssessmentSeedTarget(uri) {
  if (!uri) throw new Error("MONGODB_URI is required");
  let parsed;
  try { parsed = new URL(uri); }
  catch { throw new Error("Invalid MONGODB_URI"); }
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  if (parsed.hostname.toLowerCase() === "eqplus-dev.en53czr.mongodb.net" && database === "eqplus") {
    throw new Error("Assessment seed scripts cannot write to the production Atlas database");
  }
}

module.exports = { assertAssessmentSeedTarget };
