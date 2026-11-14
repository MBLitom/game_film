/**
 * Read-only provider authentication check.
 * NEVER logs API keys, headers, provider response bodies or private prompts.
 * No generation, no model downloads, no recurring server work.
 */
export async function checkProviders({geminiKey, tripoKey, fetchImpl = fetch} = {}) {
  if (!geminiKey || !tripoKey) {
    throw new Error("Missing GEMINI_API_KEY or TRIPO_API_KEY in repository secrets. No network requests sent.");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);
  try {
    const googleResponse = await fetchImpl(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite",
      { method: "GET", headers: {"x-goog-api-key": geminiKey}, signal: controller.signal }
    );
    if (!googleResponse.ok) throw new Error("Gemini key verification failed (HTTP " + googleResponse.status + ").");

    const tripoResponse = await fetchImpl(
      "https://openapi.tripo3d.ai/v3/account/balance",
      { method: "GET", headers: {Authorization: "Bearer " + tripoKey}, signal: controller.signal }
    );
    if (!tripoResponse.ok) throw new Error("Tripo key verification failed (HTTP " + tripoResponse.status + ").");

    const balance = await tripoResponse.json();
    if (balance.code !== 0 || !Number.isFinite(balance.data?.balance)) {
      throw new Error("Tripo account balance could not be verified.");
    }
    return {
      google: "API key accepted for read-only model lookup",
      tripo: "API key accepted for read-only account balance",
      tripo_available_credits: balance.data.balance,
      tripo_free_trial_confirmed: false,
      note: "Credit balance DOES NOT prove the credits are free. Confirm trial origin in the Tripo dashboard."
    };
  } finally {
    clearTimeout(timeout);
  }
}

if (process.argv[1] && import.meta.url === new URL("file://" + process.argv[1]).href) {
  try {
    const result = await checkProviders({
      geminiKey: process.env.GEMINI_API_KEY,
      tripoKey: process.env.TRIPO_API_KEY
    });
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("GAME FILM provider verification:", err.message);
    process.exitCode = 1;
  }
}
