// Launcher: bundles the TypeScript evaluation scripts with esbuild, then runs them with the keys from .env.local.
import { spawnSync } from "node:child_process";
import { build } from "esbuild";

const [command, ...rest] = process.argv.slice(2);
const entries = { run: "eval/run.ts", score: "eval/score.ts" };
if (!entries[command]) {
  console.error("Usage: node scripts/eval.mjs <run|score> [options]");
  process.exit(1);
}

const outfile = `.eval-build/${command}.cjs`;
await build({ entryPoints: [entries[command]], bundle: true, platform: "node", format: "cjs", outfile, alias: { "@": "./src" }, logLevel: "error" });

const nodeArgs = command === "run" ? ["--env-file=.env.local"] : [];
const { status } = spawnSync(process.execPath, [...nodeArgs, outfile, ...rest], { stdio: "inherit" });
process.exit(status ?? 1);
