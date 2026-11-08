# Detection accuracy results (T4)

Run with `npm run eval --workspace server`. Bar (ADR 0001): at least 90% found and zero made-up items, measured before Review.

## Test set

Nine Scans of one photo each, in `server/eval/fixtures/`: four stock photos from the team and five Wikimedia Commons photos (sources and licences in `SOURCES.md`). Two are pantry shelves. Ground truth lists only common produce and everyday groceries that are clearly visible. Pantry-style items (sauces, spreads, butter) are expected to be Staples, so detecting one does not count as made up (`STAPLE_LIKE` in `server/eval/score.ts`). This is a rough set for a hackathon demo, not a rigorous benchmark.

## Results (Claude Haiku, `claude-haiku-5-5`)

| Scan | Found | Made up |
|---|---|---|
| 01 packed door | 11/12 | strawberries |
| 02 UK fridge | 3/3 | orange, apple, chickpeas |
| 03 US fridge | 9/9 | none |
| 04 French door | 8/9 | cheddar cheese, salmon |
| 05 mushrooms | 1/1 | orange |
| 06 Italian fridge | 1/1 | none |
| 07 big US fridge | 1/2 | chilli, egg, lemon |
| 08 pantry shelf | 4/4 | chilli |
| 09 pantry above fridge | 4/4 | chocolate, peanut butter |
| **Overall** | **42/45 = 93.3%** | **13** |

Slowest Scan: 6.8 s for one photo. A real 3-photo `/scan` took 8.9 s.

Gemini (first four Scans, `gemini-3.5-flash`): 31/33 = 93.9% found, 8 made up, 10-12 s per photo. A full Gemini run was not possible after the free-tier daily limit (20 requests) was used up.

## Gap against the bar

- **Found:** met (93.3% against 90%).
- **Made up:** not met (13 against 0). Many of these are likely real items missing from the ground truth, which lists only what a careful person can name with confidence (for example the chilli in Scan 08 may be the hot sauce bottle, and the chocolate and peanut butter in Scan 09 may be the Nutella and nut spread jars). Some are real mistakes, such as `salmon` and `cheddar cheese` in Scan 04 and `chickpeas` in Scan 02.

## What was tried

- Strict JSON schema, high-detail images and a prompt that says to list only clearly visible items, return null rather than guess, and give alternatives when unsure.
- Provider comparison (Gemini, Anthropic; OpenAI could not be run, the account had no credit).
- Retry with backoff on Gemini overload errors.

Not tried: a second-model vote on low-confidence Detections, and prompt tuning against the made-up items. Review lets the user remove a phantom item before it reaches recipe matching, so the gap is accepted for the demo.
