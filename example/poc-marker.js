// Harmless POC marker — prints context only.
// Reads no secret values (presence check only), makes no network calls, writes nothing.
console.log("=== AF_SAFE_POC_MARKER_START ===");
console.log("AF_SAFE_PR_CODE_EXECUTED_BY_FORK_PR");
console.log("repo    = " + (process.env.GITHUB_REPOSITORY || "?"));
console.log("run_id  = " + (process.env.GITHUB_RUN_ID || "?"));
console.log("job     = " + (process.env.GITHUB_JOB || "?"));
console.log("GITHUB_TOKEN present: " + (process.env.GITHUB_TOKEN ? "yes (value NOT read)" : "no"));
console.log("=== AF_SAFE_POC_MARKER_END ===");
