# Pre-built recipe collection instead of live web or recipe-API search

Recipes come from a collection we build ahead of time: a few thousand everyday recipes taken from the Kaggle Food.com dataset. Each one is run through Gemini once to add standard ingredient names, required Equipment, cuisine and a protein flag. Ranking (Equipment as a hard filter, then fewest Missing Ingredients) runs in code over this collection on the server.

## Considered Options

- **Live search of Google, YouTube descriptions or Substack:** rejected. Ranking by fewest Missing Ingredients needs clean ingredient lists for hundreds of candidates at once, and the Equipment filter needs equipment data. Free-text descriptions provide neither reliably. Parsing them at search time is slow (10–30 s). YouTube search quota allows only about 100 searches a day, and scraping Google results breaks its terms. YouTube remains an add-on: a "watch it made" link on a single Recipe.
- **Spoonacular:** the only API with equipment, cuisine and missing-ingredient ranking together, but its free tier is 50 points a day and the hackathon plan can take 72 h to approve.
- **Fully AI-generated recipes:** rejected as a source because of invented steps. Gemini is only used to adapt a real Recipe (Substitutions), never to invent one.

## Consequences

- Use a Food.com export that includes ingredient quantities and servings (for example irkaal's "Food.com – Recipes and Reviews"), not one with ingredient names only. Recipe pages need amounts, and the later "scale to N servings" shopping list depends on them.
- The dataset's license is unverified; check it before any real release.
- More sources (YouTube, Substack) can be added later through the same one-off Gemini clean-up step without changing ranking.
