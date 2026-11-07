# Tasks

Build plan for the 24h hackathon. Terms follow [GLOSSARY.md](../GLOSSARY.md); decisions are recorded in [docs/adr](./adr).

**Priority:** the camera path (T2–T7) comes first. Everything else is secondary.
**Unblocking:** T0 and T1 come first, and every task after them can start against mocks or fixtures that use the T1 types.

## Branches

Each of the four lanes works on its own branch and merges into `main` only when a task's **Done when** is met. The full rules are in [AGENTS.md](../AGENTS.md).

- T0 and T1 go straight to `main` in hour 1. Every lane then merges `main` into its branch.
- `detection`: Gemini detection, test set, accuracy eval (T2–T4)
- `scan-review`: capture screen, Review screen, barcode override (T5–T7)
- `recipes`: recipe collection build, search endpoints (T8–T9)
- `app-features`: recipe screens, Substitutions, Equipment, Staples, Saved Recipes, demo (T10–T14)

| # | Task | Depends on | Branch |
|---|------|-----------|-------|
| T0 | Repo scaffold | – | `main` |
| T1 | Shared contracts | – | `main` |
| T2 | Labelled test set | – | `detection` |
| T3 | `/scan` detection endpoint | T0, T1 | `detection` |
| T4 | Accuracy eval script | T2, T3 | `detection` |
| T5 | Scan capture screen | T0, T1 | `scan-review` |
| T6 | Review screen | T1 (T9 for real vocabulary) | `scan-review` |
| T7 | Barcode override | T6 | `scan-review` |
| T8 | Recipe collection build | T0 | `recipes` |
| T9 | Recipe search + vocabulary endpoints | T1 (T8 for real data) | `recipes` |
| T10 | Recipe Match list + Recipe detail screens | T1 | `app-features` |
| T11 | Substitutions | T9, T10 | `app-features` |
| T12 | Equipment + Staples screens | T0 | `app-features` |
| T13 | Saved Recipes | T10 | `app-features` |
| T14 | Demo + submission | everything | `app-features` |

---

## T0 – Repo scaffold
- `app/`: Expo (SDK 56) with Expo Router, running in Expo Go on both iOS and Android.
- `server/`: a TypeScript server using Hono, with the Gemini key in `.env`, and `.env.example` committed.
- `shared/`: TypeScript types imported by both.
- The server is deployed to a free Node host so phones at the demo can reach it, and the app reads the server URL from config.
- **Done when** a phone in Expo Go calls a `/health` endpoint on the deployed server.

## T1 – Shared contracts *(agree in hour 1)*
- `Detection`: `{ ingredient | null, label, confidence, box: [ymin,xmin,ymax,xmax], photoIndex, alternatives: string[], visibleText? }`. An `ingredient` of `null` marks an Unidentified Item.
- `ScanResult`: `{ detections: Detection[] }`, de-duplicated across the Scan's photos.
- `RecipeSearchRequest`: `{ ingredients: string[], staples: string[], equipment: string[] }`.
- `RecipeMatch`: `{ recipeId, name, imageUrl?, missing: string[], usedCount, cuisine, minutes }`.
- `Recipe`: ingredients with quantities, servings, equipment, cuisine, steps, protein flag.
- **Done when** these are merged in `shared/` and every other task builds against them.

## T2 – Labelled test set
- Assemble about 15 demo groceries, including the hard cases: leek and spring onion, parsley and coriander, Greek yogurt, a labelled jar, a tupperware of leftovers, butter, and plant milk.
- Shoot about 5 Scans of 2–3 photos each under real fridge lighting, including clutter and items hiding each other.
- Write ground truth as JSON next to the photos: the Ingredients present in each Scan.
- **Done when** the photos and ground truth are in `server/eval/fixtures/`.

## T3 – `/scan` detection endpoint *(ADR 0001)*
- `POST /scan` takes 1–N photos and sends them to Gemini Flash **in parallel** at high `media_resolution`.
- Use a strict JSON schema. The prompt says to list only clearly visible items, return `null` rather than guess, and give alternatives when unsure.
- Merge Detections across photos and de-duplicate the same Ingredient.
- Normalise names to the recipe collection's ingredient list, using a fixture list until T8 lands.
- Keep the Gemini call behind one `detectIngredients(photos)` interface, so Claude or GPT can be swapped in to compare.
- **Done when** a 3-photo Scan returns a `ScanResult` in about 10 s or less.

## T4 – Accuracy eval script
- `npm run eval` runs the T2 fixtures through the T3 pipeline. It reports, per Scan and overall:
  - percentage of items found (correct, or correct answer among the alternatives)
  - count of made-up items
  - count of Unidentified Items
  - time taken
- **Bar:** at least 90% found and zero made-up items, measured before Review.
- Give prompt tuning a fixed time slot. Only if the bar isn't met by then, try a second-model vote on low-confidence Detections.
- **Done when** the bar is met, or the gap is written down along with what was tried.

## T5 – Scan capture screen
- Use `expo-camera` to take several photos, with prompts for shelf, door and drawer and thumbnails of what's been taken.
- A "Scan" button sends the photos to `/scan`, and a progress screen shows "Checking photo 2 of 3…".
- Handle errors with a retry button. The app never loses the photos the user already took.
- **Done when** the screen returns a `ScanResult` from mock and real servers.

## T6 – Review screen
- Draw a box over each Detection on its photo, and show a list where each item can be confirmed or removed.
- Low-confidence Detections become one-tap "Is this X or Y?" chips.
- Unidentified Items show their cropped image with "What is this?" and an autocomplete input.
- "+ Add ingredient" opens a picker for things the camera missed.
- Autocomplete and the picker use the ingredient list (`GET /ingredients`). A name that doesn't match the list gets the message "we can't match recipes on this yet".
- Persist the confirmed list as the latest Scan on the device.
- **Done when** a user can get from a `ScanResult` to a confirmed Ingredient list.

## T7 – Barcode override
- In Review, "Scan barcode" uses the `expo-camera` barcode scanner and looks the code up in Open Food Facts.
- Map the Product to an Ingredient, which replaces the Detection's guess or adds a new item.
- When the barcode isn't found, fall back to the manual picker.
- **Done when** scanning a ketchup bottle's barcode yields the Ingredient "ketchup".

## T8 – Recipe collection build *(ADR 0002)*
- Download irkaal's "Food.com – Recipes and Reviews", the version that has `RecipeIngredientQuantities` and `RecipeServings`. **Check its license** on the Kaggle page.
- Filter to a few thousand everyday recipes: reasonable ingredient count, has an image, well rated.
- A one-off Gemini enrichment adds standard ingredient names, required Equipment, cuisine and a protein flag. Batch about 20 recipes per call to stay within free-tier limits.
- Output `server/data/recipes.json` and the ingredient list.
- **Done when** the JSON loads on the server and a spot check of 20 recipes looks right.

## T9 – Recipe search + vocabulary endpoints
- `POST /recipes/search`:
  1. Hard filter: remove recipes needing Equipment the user lacks.
  2. Treat Staples as available.
  3. Rank by fewest Missing Ingredients, then by most of the user's Ingredients used.
  4. Return the top N `RecipeMatch`.
- `GET /recipes/:id` returns the full Recipe, and `GET /ingredients` returns the ingredient list.
- The collection is held in memory, so there's no database.
- **Done when** the ranking unit tests pass on a small fixture collection.

## T10 – Recipe Match list + Recipe detail screens
- The list shows each Recipe Match with "N missing", time and cuisine.
- The detail page shows ingredients with amounts (missing ones highlighted), equipment and steps.
- **Done when** the screens work from a confirmed Review to a Recipe detail.

## T11 – Substitutions
- `POST /recipes/:id/substitutions` asks Gemini for swaps for **this Recipe's** Missing Ingredients only, given the user's Ingredients and Staples.
- The detail screen highlights proposed swaps with Accept and Reject. Accepted swaps update that Recipe's missing list only and aren't remembered.
- **Done when** a buttermilk recipe offers "milk + lemon" and accepting it clears that missing item.

## T12 – Equipment + Staples screens
- Both are stored on the device, using AsyncStorage or similar.
- Equipment is a checklist: oven, hob, microwave, air fryer, blender, slow cooker and so on.
- Staples come pre-filled (salt, pepper, oil, flour, common spices) and are editable, using the ingredient list.
- Both feed `RecipeSearchRequest`.
- **Done when** removing "oven" removes oven recipes from the matches.

## T13 – Saved Recipes
- A save/unsave toggle on Recipe detail, and a Saved Recipes screen, all stored on the device.
- **Done when** saved Recipes are still there after restarting the app.

## T14 – Demo + submission
- Demo script: scan the T2 groceries live on a phone, review, pick a Recipe Match, accept a substitution, save it.
- Record a backup video of the full flow.
- Devpost write-up covering:
  - the accuracy numbers from T4
  - how the Gemini API is used (detection, enrichment, substitutions), for the **MLH Gemini** track
  - how Freebuff helped build it, for the **Freebuff** track; keep notes throughout the build
- Optional, at no cost to the product: a GoDaddy Registry domain for a landing page, and hosting the repo on Entire.

---

## Later
- **Pantry:** an inventory that remembers what you have across Scans.
- **Preferences:** "high protein", cuisine, as filters or ranking boosts.
- **Scale to N servings:** a shopping list of Missing Ingredients with amounts scaled from `RecipeServings`.
- **"Watch it made":** a YouTube link on Recipe detail.
- **Sign-in:** Auth0 needs a dev build and won't work in Expo Go.
