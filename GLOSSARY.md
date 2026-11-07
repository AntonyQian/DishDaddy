# Fridge-to-Recipe

A mobile app that identifies the ingredients a person has by photographing them, then finds recipes they can cook with those ingredients and the equipment they own.

## Language

### Scanning

**Scan**:
One session of one or more photos (shelves, door, drawers, cupboard) that produces a single de-duplicated list of Detections.
_Avoid_: Photo, capture, upload

**Detection**:
An Ingredient the app believes is visible in a Scan, with a confidence and a location in the photo.
_Avoid_: Prediction, result, item

**Unidentified Item**:
An object in a Scan the app cannot confidently name; the user is asked what it is rather than given a forced guess.
_Avoid_: Unknown, misc

**Review**:
The step after a Scan where the user confirms, corrects, names or adds Ingredients before any recipe search.
_Avoid_: Edit, verification

### Ingredients

**Ingredient**:
A generic culinary item as a recipe would name it (milk, ketchup, cheddar cheese, spring onion).
_Avoid_: Product, food, item

**Product**:
A specific branded packaged good (e.g. "Heinz Tomato Ketchup 570g"). A Product always resolves to an Ingredient; recipes never match on Products.
_Avoid_: Item, SKU

**Staple**:
An Ingredient the user always keeps on hand (salt, oil, spices) and records once, so it counts as available without being scanned.
_Avoid_: Spice rack, basics

**Pantry**:
A remembered inventory of every Ingredient the user has confirmed across Scans, kept up to date over time. Distinct from Staples, which the user declares directly. (Planned; not yet part of the product.)
_Avoid_: Inventory, fridge, stock

**Equipment**:
A cooking appliance or tool the user owns (oven, air fryer, blender). Recipes needing Equipment the user lacks are never suggested.
_Avoid_: Appliance, tools, gear

### Recipes

**Recipe**:
A dish in the app's own recipe collection, with its Ingredients, required Equipment, cuisine and steps.
_Avoid_: Dish, meal, result

**Recipe Match**:
A Recipe ranked against the user's confirmed Ingredients and Staples, carrying its Missing Ingredients and possible Substitutions.
_Avoid_: Suggestion, recommendation, hit

**Preference**:
A request the user adds to shape Recipe Matches, such as "high protein" or "Italian".
_Avoid_: Suggestion, filter, request

**Missing Ingredient**:
An Ingredient a recipe requires that is neither confirmed in the latest Scan nor a Staple.
_Avoid_: Shortfall, gap

**Substitution**:
A proposed swap of a Missing Ingredient for one the user has; it only applies once the user accepts it.
_Avoid_: Replacement, alternative

**Saved Recipe**:
A recipe the user has kept on their device to return to later.
_Avoid_: Favourite, bookmark
