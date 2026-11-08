# Labelled test set (T2)

One folder per Scan. Each holds the Scan's photos (`.jpg`, `.jpeg`, `.png` or `.webp`, sent in filename order) and a `truth.json` listing the Ingredients actually present:

```
fixtures/
  01-top-shelf/
    1.jpg
    2.jpg
    truth.json
```

```json
{ "ingredients": ["leek", "greek yogurt", "butter", "oat milk"] }
```

- Use names from the ingredient list (`shared/src/fixtureIngredients.ts` until T8 lands); `npm run eval` warns about any that aren't on it.
- List every Ingredient a careful person could identify from the photos, including partly hidden ones. Leave out things nobody could name (an opaque tupperware): the model should report those as Unidentified Items, which is scored as acceptable.
- Cover the hard cases: leek and spring onion, parsley and coriander, Greek yogurt, a labelled jar, a tupperware of leftovers, butter, plant milk. Shoot about 5 Scans of 2–3 photos under real fridge lighting, with clutter and items hiding each other.
- Keep photos under about 4 MB (phone default JPEG is fine).

Run `npm run eval --workspace server` (needs `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` or `GEMINI_API_KEY` in `server/.env`).
