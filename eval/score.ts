// Joins the graded sheet with the key and prints the average grades per AI configuration.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { aggregateScores, GRADE_COLUMNS, parseCsv, type KeyRow } from "./lib";

const [gradedPath, keyPath] = process.argv.slice(2);
if (!gradedPath || !keyPath) {
  console.error("Usage: npm run eval:score -- <graded.csv> <key.json>");
  process.exit(1);
}

const graded = parseCsv(readFileSync(gradedPath, "utf8"));
const key = JSON.parse(readFileSync(keyPath, "utf8")) as KeyRow[];
const scores = aggregateScores(graded, key);
if (scores.length === 0) {
  console.error("No graded row found: fill the grade columns (1 to 5) in the sheet.");
  process.exit(1);
}

const lines = ["| config | graded | " + GRADE_COLUMNS.join(" | ") + " |", "|---|---|" + GRADE_COLUMNS.map(() => "---").join("|") + "|"];
for (const s of scores) lines.push(`| ${s.config} | ${s.graded} | ${GRADE_COLUMNS.map((c) => s.means[c] ?? "-").join(" | ")} |`);
console.log("\n" + lines.join("\n") + "\n");
writeFileSync(path.join(path.dirname(gradedPath), "score.md"), lines.join("\n") + "\n");
console.log(`Written: ${path.join(path.dirname(gradedPath), "score.md")}`);
