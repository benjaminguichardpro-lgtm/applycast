# Evaluation set (phase 6)

Runs N videos × 5 fictional profiles × each enabled AI configuration, then exports a **shuffled sheet without config names** for blind grading.

## 1. Prepare
- `eval/videos.json`: your 30 videos, `[{ "url": "...", "tag": "pricing" }]` (see `videos.example.json`). Suggested mix: ~10 pricing, ~8 acquisition, ~4 retention, ~4 hiring/ops, ~4 off-topic, and 1 video without captions.
- `eval/profiles.json`: the 5 fictional profiles (one per stage). Edit freely.
- `eval/configs.json`: the AI configurations to compare. Set `"enabled": true` on the ones you want. The `anthropic` entry needs `ANTHROPIC_API_KEY` in `.env.local`.

## 2. Check the cost before spending anything
```
npm run eval -- --dry
```
Prints the number of Supadata credits (1 per new video, transcripts are cached in `eval/cache`) and AI calls. Nothing is called.

## 3. Smoke test, then the full run
```
npm run eval -- --videos 2 --profiles 2      # a few calls, to check everything works
npm run eval                                  # the full set
```
Options: `--no-adapt` (skip adaptations, cheaper), `--concurrency 3`, `--run <name>` (re-run with the same name to resume: finished items are skipped).

## 4. Grade blind
Open `eval/out/<run>/blind.csv` in Sheets or Excel. Each row is one result. Fill the four columns with 1 to 5:
- `relevance`: do the points matter for this profile and goal?
- `faithfulness`: does each point say what the video says at that time? (click the links)
- `goal_coherence`: does nothing contradict the profile's active goal?
- `usefulness`: would the founder act on the adaptations?

Do **not** open `key.json` or `report.md` before you finish. Save the graded file as CSV.

## 5. Score
```
npm run eval:score -- eval/out/<run>/graded.csv eval/out/<run>/key.json
```
Prints the average grade per configuration and writes `score.md`. `report.md` adds automatic figures (latency, verdict mix per profile, adaptations removed by the coherence check, errors).
