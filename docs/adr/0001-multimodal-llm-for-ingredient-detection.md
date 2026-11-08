# Multimodal LLM for ingredient detection (Claude Haiku by default), with barcode override

Ingredient identification is the product's top priority, so we detect ingredients by sending Scan photos to a multimodal LLM with a strict JSON schema (name, confidence, bounding box, visible label text). When an item has a barcode, the Open Food Facts lookup replaces the model's guess. Every Scan goes through a user Review step, because no detector handles opaque containers or look-alikes (leek vs spring onion) reliably.

## Considered Options

- **Dedicated food-recognition APIs (LogMeal, Passio, Clarifai, Calorie Mama):** rejected. They are built for plated meals and calorie logging, not raw fridge contents, and have tiny free tiers (LogMeal: 20 images/day) or paid-only SDKs (Passio: from $99/month). None publishes fridge accuracy.
- **Self-trained YOLO on Roboflow fridge datasets:** rejected. Public datasets are about 500 images and 30 classes, and the model fails on anything outside its fixed classes. Not achievable in a 24h hackathon.
- **Other multimodal LLMs (Claude, GPT):** viable, but they have no free tier and weaker bounding boxes. A 2026 benchmark on meal photos ranked Gemini Flash models best for ingredient identification. The detector sits behind a single interface so we can run the same test photos through Claude or GPT and compare.

## Consequences

- A small server is needed so the API key never ships inside the app.
- Accuracy is measured against a fixed, labelled test set of demo groceries, not judged by eye. The bar is measured before Review:
  - At least 90% of items found, each either named correctly or offered as an "is this X or Y?" choice with the right answer among the options.
  - No made-up items, because a phantom item is worse than a missed one.
  - Unidentified Items count as acceptable, not as failures.
- Accuracy beats speed: photos are sent at high resolution and in parallel, within a budget of about 10 s for a 3-photo Scan.
- A second model is tried on uncertain items only if the bar is not met.

## Update: Claude Haiku is the default provider

The detector sits behind `PhotoModel` with three providers: Anthropic, OpenAI and Gemini (`server/src/detection/`). The first provider with an API key is used, in that order, or `DETECTION_PROVIDER` forces one. Anthropic's `claude-haiku-5-5` is the default because:

- On the nine-Scan test set it found 93.3% of items (the first four Scans: 93.9%, the same as Gemini).
- A Scan photo takes 3-7 s, against 10-12 s on Gemini, and a real 3-photo `/scan` took 8.9 s, inside the 10 s budget.
- Gemini's free tier allows 20 requests per day per model (every photo is one request), which would stop a live demo. Both Gemini and OpenAI also had outages or empty accounts during testing.
- It costs a fraction of a cent per photo.

Gemini stays available as a fallback. Results and the open accuracy gap are in [docs/eval-results.md](../eval-results.md).
